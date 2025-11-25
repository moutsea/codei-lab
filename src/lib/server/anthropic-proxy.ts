import { NextRequest, NextResponse } from 'next/server';
import {
  codexHelloWorldResponse,
  codexApikeyInvalidResponse,
  codexApikey401Response,
  codexApiLimitExceedResponse,
  codexUserLimitExceedResponse,
  codexUserSubscriptionInvalidResponse,
} from '@/lib/server/utils'
import { currentDate, currentSubscription, extractApiKeyFromHeaders } from '@/lib/utils'
import { addTokensToUsageService } from '@/lib/services/token_usage_service'
import { getApiKeyUsageByApiKeyWithCache, validateApiKey } from '../services/api_key_service';
import { getUserDetailByIdWithCache } from '../services/user_service';

type Usage = {
  input_tokens: number;
  input_tokens_details?: {
    cached_tokens?: number;  // Anthropic 重要字段
    [key: string]: any;      // 允许未来扩展
  };

  output_tokens: number;
  output_tokens_details?: {
    reasoning_tokens?: number; // Claude 3.6/3.7 的 reasoning tokens
    [key: string]: any;
  };

  total_tokens?: number;       // Anthropic 已经给了这个字段
};


export interface ProxyOptions {
  endpointName: string;
  requiresMessagesValidation?: boolean;
}


function calculateTotalTokens(
  usage: Usage,
  discount: number = 1.0,
  modelName = process.env.ANTHROPIC_MODEL ?? ''
): {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  quota: number;
} {
  try {
    let totalInputTokens = usage.input_tokens || 0;
    let totalOutputTokens = usage.output_tokens || 0;
    let totalCacheReadTokens = usage.input_tokens_details?.cached_tokens || 0;

    if (
      totalInputTokens === 0 &&
      totalOutputTokens === 0 &&
      totalCacheReadTokens === 0
    ) {
      return {
        totalInputTokens: 0,
        totalCacheReadTokens: 0,
        totalOutputTokens: 0,
        quota: 0
      };
    }

    totalInputTokens -= totalCacheReadTokens;
    const inputPrice = parseFloat(process.env.CODEX_INPUT_PRICE!);
    const outputPrice = parseFloat(process.env.CODEX_OUTPUT_PRICE!);
    const quota = inputPrice * totalInputTokens / 1000000.0 + inputPrice * totalCacheReadTokens / 10000000.0 + outputPrice * totalOutputTokens / 1000000.0;

    // test stage consume * 20
    // discount = 20;

    console.log(
      `Token calculation: model=${modelName}, input=${totalInputTokens}, output=${totalOutputTokens}, cache_read=${totalCacheReadTokens}, discount=${discount}, quota=${quota}`
    );

    return {
      totalInputTokens: totalInputTokens * discount,
      totalCacheReadTokens: totalCacheReadTokens * discount,
      totalOutputTokens: totalOutputTokens * discount,
      quota: quota * discount
    };
  } catch (error) {
    // console.error('Error in calculateTokensFromUsage:', error);
    return {
      totalInputTokens: 0,
      totalCacheReadTokens: 0,
      totalOutputTokens: 0,
      quota: 0
    };
  }
}

export async function createCodexProxy(
  request: NextRequest,
  options: ProxyOptions = { endpointName: 'messages', requiresMessagesValidation: true }
) {
  // Currently options are not used, but keeping the parameter for future extensibility
  void options;
  try {
    const originalUrl = request.url;

    const headers = new Headers(request.headers);
    const blockedHeaders = [
      "host",
      "connection",
      "x-forwarded-for",
      "x-forwarded-host",
      "x-forwarded-proto",
      "x-forwarded-port",
      "content-length",
      "accept-encoding",
      "sec-fetch-mode",
      "sec-fetch-site",
      "sec-fetch-dest",
      "x-stainless-retry-count",
      "x-stainless-timeout",
      "x-stainless-lang",
      "x-stainless-os",
      "x-stainless-arch",
      "x-stainless-runtime",
      "x-stainless-runtime-version",
    ];
    blockedHeaders.forEach((h) => headers.delete(h));

    const apiKey = extractApiKeyFromHeaders(headers);

    if (!apiKey || apiKey === process.env.LOCAL_CODEX_API_TEST!) {
      return await codexHelloWorldResponse();
    }

    if (!await validateApiKey(apiKey)) {
      return await codexApikeyInvalidResponse();
    }

    const apiData = await getApiKeyUsageByApiKeyWithCache(apiKey);

    if (!apiData) {
      return await codexApikey401Response();
    }

    if (apiData.quota && parseFloat(apiData.quotaUsed) > parseFloat(apiData.quota)) {
      return await codexApiLimitExceedResponse();
    }

    const userId = apiData.userId;

    const userData = await getUserDetailByIdWithCache(userId!);

    // console.log(userData);

    if (!userData) {
      return await codexApikey401Response();
    }

    if (!userData.active) {
      return await codexUserSubscriptionInvalidResponse();
    }

    if (parseFloat(userData.quotaMonthlyUsed!) > parseFloat(userData.quota)) {
      return await codexUserLimitExceedResponse();
    }
    // return await codexTestStageResponse();

    const authToken = process.env.CODEX_AUTH_TOKEN!;
    const baseUrl = process.env.CODEX_BASE_URL!;
    // const model = process.env.CODEX_MODEL!;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const requestBody = {
      ...body,
      text: { verbosity: 'medium' }
    };

    const targetUrl = originalUrl.replace(
      process.env.LOCAL_CODEX_API!,
      baseUrl
    );

    const finalBody = { ...requestBody };
    headers.set("authorization", `Bearer ${authToken}`);

    const ac = new AbortController();
    const upstreamTimeout = setTimeout(() => ac.abort(), 55_000);

    let upstreamRes: Response;

    try {
      upstreamRes = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(finalBody),
        signal: ac.signal,
      });
    } catch (err: any) {
      clearTimeout(upstreamTimeout);

      if (err.name === 'AbortError') {
        return new NextResponse(
          JSON.stringify({ error: 'Upstream timeout' }),
          { status: 504, headers: { 'content-type': 'application/json' } }
        );
      }
      console.error('Upstream error:', err);
      return new NextResponse(
        JSON.stringify({ error: 'Upstream fetch failed' }),
        { status: 502, headers: { 'content-type': 'application/json' } }
      );
    }

    clearTimeout(upstreamTimeout);

    const contentType =
      upstreamRes.headers.get('content-type') ?? 'application/json';

    const upstreamBody = upstreamRes.body;

    if (!upstreamBody) {
      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: { 'content-type': contentType },
      });
    }

    // 单流 + 边转发边解析 usage
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamBody.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        let buffer = '';
        let latestUsage: Usage | null = null;
        let controllerClosed = false;

        const safeClose = () => {
          if (controllerClosed) return;
          controllerClosed = true;
          try {
            controller.close();
          } catch (e) {
            // ignore
          }
        };

        const safeError = (err: unknown) => {
          if (controllerClosed) return;
          controllerClosed = true;
          try {
            controller.error(err);
          } catch (e) {
            // ignore
          }
        };

        const safeEnqueue = (chunk: Uint8Array | string) => {
          if (controllerClosed) return false;
          try {
            if (typeof chunk === 'string') {
              controller.enqueue(encoder.encode(chunk));
            } else {
              controller.enqueue(chunk);
            }
            return true;
          } catch (e) {
            // 关键：这里就是你现在遇到的 Invalid state 场景
            // console.warn('enqueue after close, stop streaming:', e);
            controllerClosed = true;
            return false;
          }
        };

        const HEARTBEAT_INTERVAL = 15_000;
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

        const startHeartbeat = () => {
          if (heartbeatTimer || controllerClosed) return;
          heartbeatTimer = setInterval(() => {
            // 心跳失败也说明流结束了，直接停
            if (!safeEnqueue('\n')) {
              stopHeartbeat();
            }
          }, HEARTBEAT_INTERVAL);
        };

        const stopHeartbeat = () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        };

        const looksLikeStream =
          contentType.includes('text/event-stream') ||
          contentType.includes('stream+json');

        if (!looksLikeStream) {
          startHeartbeat();
        }

        const parseSSELines = (text: string) => {
          buffer += text;
          let newlineIdx: number;

          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            const rawLine = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;

            const jsonString = line.slice(5).trimStart();
            if (!jsonString || jsonString === '[DONE]') continue;


            // console.log(jsonString);

            try {
              const obj = JSON.parse(jsonString);
              const usage =
                obj.usage || (obj.response && obj.response.usage) || null;
              if (usage) {
                latestUsage = usage;
              }
            } catch (e) {
              console.warn('Skipping malformed data line:', line, e);
            }
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            // 1. 先转发给客户端 —— 用 safeEnqueue 包一下
            if (!safeEnqueue(value)) {
              // 流已经被取消/关闭了，没必要再继续读上游
              await reader.cancel();
              break;
            }

            // 2. 再做文本解析
            const textChunk = decoder.decode(value, { stream: true });

            if (looksLikeStream) {
              parseSSELines(textChunk);
            } else {
              buffer += textChunk;
            }
          }

          const rest = decoder.decode();
          if (rest) {
            if (looksLikeStream) {
              parseSSELines(rest);
            } else {
              buffer += rest;
            }
          }

          if (!looksLikeStream && buffer) {
            try {
              const obj = JSON.parse(buffer);
              const usage =
                obj.usage || (obj.message && obj.message.usage) || null;
              if (usage) {
                latestUsage = usage;
              }
            } catch (e) {
              console.error('Failed to parse non-stream JSON for usage:', e);
            }
          }

          if (latestUsage) {

            // console.log(latestUsage);

            const totalTokens = calculateTotalTokens(latestUsage);
            await addTokensToUsageService(apiKey, apiData, userData.userId, currentDate(), currentSubscription(new Date(userData.startDate!)), userData, totalTokens.totalInputTokens, totalTokens.totalCacheReadTokens, totalTokens.totalOutputTokens, totalTokens.quota);
          }

          stopHeartbeat();
          safeClose();
        } catch (err) {
          console.error('Error while streaming upstream body:', err);
          stopHeartbeat();
          safeError(err);
        }
      },
    });

    return new NextResponse(stream, {
      status: upstreamRes.status,
      headers: {
        'content-type': contentType,
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export function createHealthCheck(endpointName: string) {
  return async function GET() {
    try {
      const authToken = process.env.codex_AUTH_TOKEN;
      const baseUrl = process.env.codex_BASE_URL;
      const model = process.env.codex_MODEL;

      return NextResponse.json({
        status: 'ok',
        message: `Codex v1/${endpointName} API is running`,
        config: {
          baseUrl: baseUrl?.replace(/\/\/.*@/, '//***@') || 'configured',
          model: model,
          hasToken: !!authToken,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: error instanceof Error ? error.message : 'Configuration error',
        },
        { status: 500 }
      );
    }
  };
}