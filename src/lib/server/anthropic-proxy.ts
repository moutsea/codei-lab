import { NextRequest, NextResponse } from 'next/server';
import {
  codexHelloWorldResponse,
  codexApikeyInvalidResponse,
  codexApikey401Response,
  codexApiLimitExceedResponse,
  codexUserLimitExceedResponse,
  codexUserSubscriptionInvalidResponse,
} from '@/lib/server/utils'
import { currentDate, currentMonth, currentSubscription, extractApiKeyFromHeaders } from '@/lib/utils'
import type { ApiDetail } from '@/types/db'
import { addTokensToUsageService } from '@/lib/services/token_usage_service'
import { UserDetail } from '@/types';
import { getApiKeyUsageByApiKeyWithCache, validateApiKey } from '../services/api_key_service';
import { getUserDetailByIdWithCache } from '../services/user_service';

export interface ProxyOptions {
  endpointName: string;
  requiresMessagesValidation?: boolean;
}

function calculateTotalTokens(responseText: string): {
  totalInputTokens: number;
  totalCacheReadTokens: number;
  totalOutputTokens: number;
  quota: number;
} {
  try {
    const lines = responseText.split('\n');
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;

    // Find all lines that start with 'data:' and may contain usage information
    const dataLines = lines.filter(line => line.startsWith('data:'));

    if (dataLines.length === 0) {
      return {
        totalInputTokens: 0,
        totalCacheReadTokens: 0,
        totalOutputTokens: 0,
        quota: 0
      };
    }

    for (const dataLine of dataLines) {
      try {
        // 去掉 "data:" 前缀
        const jsonString = dataLine.slice(6).trim();

        // Skip empty lines or [DONE] markers
        if (!jsonString || jsonString === '[DONE]') {
          continue;
        }

        // 解析 JSON 字符串
        const responseBody = JSON.parse(jsonString);

        if (responseBody && (responseBody.response && responseBody.response.usage)) {
          const usage = responseBody.response.usage;

          totalInputTokens += usage.input_tokens || 0;
          totalOutputTokens += usage.output_tokens || 0;
          totalCacheReadTokens += usage.input_tokens_details.cached_tokens || 0;
        }
      } catch (parseError) {
        // Skip lines that can't be parsed but continue processing other lines
        console.warn('Skipping malformed data line:', dataLine, parseError);
        continue;
      }
    }

    totalInputTokens -= totalCacheReadTokens;
    const inputPrice = parseFloat(process.env.CODEX_INPUT_PRICE!);
    const outputPrice = parseFloat(process.env.CODEX_OUTPUT_PRICE!);
    const quota = inputPrice * totalInputTokens / 1000000.0 + inputPrice * totalCacheReadTokens / 10000000.0 + outputPrice * totalOutputTokens / 1000000.0;
    console.log(`Token calculation: input=${totalInputTokens}, output=${totalOutputTokens}, cache_read=${totalCacheReadTokens}, quota=${quota.toFixed(4)}`);

    return {
      totalInputTokens,
      totalCacheReadTokens,
      totalOutputTokens,
      quota
    };
  } catch (error) {
    console.error('Error in calculateTotalTokens:', error);
    return {
      totalInputTokens: 0,
      totalCacheReadTokens: 0,
      totalOutputTokens: 0,
      quota: 0
    };
  }
}

async function apiTokenUsageUpdate(
  res: string,
  apiData: ApiDetail,
  userData: UserDetail,
  apiKey: string,
  userId: string
) {
  const totalTokens = calculateTotalTokens(res);
  await addTokensToUsageService(apiKey, apiData, userId, currentDate(), currentSubscription(new Date(userData.startDate!)), userData, totalTokens.totalInputTokens, totalTokens.totalCacheReadTokens, totalTokens.totalOutputTokens, totalTokens.quota);
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

    if (!userData) {
      return await codexApikey401Response();
    }

    if (!userData.active) {
      return await codexUserSubscriptionInvalidResponse();
    }

    if (userData.quotaMonthlyUsed! > userData.quota) {
      return await codexUserLimitExceedResponse();
    }

    const authToken = process.env.CODEX_AUTH_TOKEN!;
    const baseUrl = process.env.CODEX_BASE_URL!;
    // const model = process.env.codex_MODEL!;

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
    };

    const targetUrl = originalUrl.replace(
      process.env.LOCAL_CODEX_API!,
      baseUrl
    );

    const finalBody = { ...requestBody };
    headers.set("authorization", `Bearer ${authToken}`);

    console.log(targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(finalBody),
    });

    const responseText = await response.text();

    await apiTokenUsageUpdate(responseText, apiData, userData, apiKey, userId!);

    if (!response.ok) {
      try {
        const errorPayload = JSON.parse(responseText); // 关键：将 JSON 字符串解析成 JS 对象
        return NextResponse.json(errorPayload, { status: response.status }); // 现在传入的是对象，行为正确
      } catch (e) {
        // 如果上游返回的错误不是一个有效的 JSON，则直接返回文本
        return new NextResponse(responseText, { status: response.status });
      }
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
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