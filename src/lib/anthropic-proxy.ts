import { NextRequest, NextResponse } from 'next/server';
import {
  anthropicHelloWorldResponse,
  anthropicApikeyInvalidResponse,
  anthropicApikey401Response,
  anthropicApiLimitExceedResponse,
  anthropicUserLimitExceedResponse,
  anthropicUserSubscriptionInvalidResponse,
} from '@/lib/server/utils'
import { extractApiKeyFromHeaders } from '@/lib/utils'
import type { ApiDetail } from '@/types/db'
import { addTokensToUsageService, updateApiKeyTokenUsage } from '@/lib/services/token_usage_service'
import { UserDetail } from '@/types';

export interface ProxyOptions {
  endpointName: string;
  requiresMessagesValidation?: boolean;
}

function getDiscount(userData: UserDetail) {
  // 获取 userData 中的 membershipLevel
  const membershipLevel = userData.membershipLevel;

  // 根据 membershipLevel 返回不同的折扣
  switch (membershipLevel) {
    case 'Lite':
      return 1.0;  // Lite 会员不折扣
    case 'Pro':
      return 0.9;  // Pro 会员享受 10% 折扣
    case 'Team':
      return 0.85; // Team 会员享受 15% 折扣
    default:
      return 1.0;  // 默认返回 1.0，即没有折扣
  }
}

function calculateTotalTokens(responseText: string, discount: number = 1.0): number {
  try {
    const lines = responseText.split('\n');
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;

    // Find all lines that start with 'data:' and may contain usage information
    const dataLines = lines.filter(line => line.startsWith('data:'));

    if (dataLines.length === 0) {
      return 0;
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

    // If no valid usage information was found, return 0
    if (totalInputTokens === 0 && totalOutputTokens === 0 && totalCacheReadTokens === 0) {
      return 0;
    }

    const totalValidTokens = totalInputTokens + totalOutputTokens - totalCacheReadTokens;
    const totalTokens = Math.floor((totalValidTokens + totalCacheReadTokens * 0.1) * discount);

    console.log(`Token calculation: input=${totalInputTokens}, output=${totalOutputTokens}, cache_read=${totalCacheReadTokens}, discount=${discount}, total=${totalTokens}`);

    return totalTokens;
  } catch (error) {
    console.error('Error in calculateTotalTokens:', error);
    return 0;
  }
}

// async function apiTokenUsageUpdate(
//   res: string,
//   discount: number,
//   apiData: ApiDetail,
//   userData: UserDetail,
//   apiKey: string,
//   userId: string
// ) {
//   const totalTokens = calculateTotalTokens(res, discount);
//   await addTokensToUsageService(apiKey, apiData, userId, currentDate(), currentMonth(), userData, totalTokens);
// }

export async function createAnthropicProxy(
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

    // console.log("=====request headers=====", headers);

    const apiKey = extractApiKeyFromHeaders(headers);

    // console.log("=====api key=====", apiKey);

    // if (!apiKey || apiKey === process.env.LOCAL_ANTHROPIC_API_TEST!) {
    return await anthropicHelloWorldResponse();
    // }

    // if (!await validateApiKey(apiKey)) {
    //   return await anthropicApikeyInvalidResponse();
    // }

    // const apiData = await getApiKeyUsageByApiKeyWithCache(apiKey);

    // if (!apiData) {
    //   return await anthropicApikey401Response();
    // }

    // if (apiData.requestLimit && apiData.apiMonthlyUsed > apiData.requestLimit) {
    //   return await anthropicApiLimitExceedResponse();
    // }

    // const userId = apiData.userId;

    // const userData = await getUserDetailByIdWithCache(userId!);

    // if (!userData) {
    //   return await anthropicApikey401Response();
    // }

    // if (!userData.active) {
    //   return await anthropicUserSubscriptionInvalidResponse();
    // }

    // if (userData.tokenMonthlyUsed! > userData.requestLimit) {
    //   return await anthropicUserLimitExceedResponse();
    // }

    const authToken = process.env.ANTHROPIC_AUTH_TOKEN!;
    const baseUrl = process.env.ANTHROPIC_BASE_URL!;
    const model = process.env.ANTHROPIC_MODEL!;

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
      model: model,
    };

    const targetUrl = originalUrl.replace(
      process.env.LOCAL_ANTHROPIC_API!,
      baseUrl
    );

    const finalBody = { ...requestBody };
    // headers.set("authorization", `Bearer ${authToken}`);
    headers.set("authorization", `Bearer test`);

    console.log(targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(finalBody),
    });

    const responseText = await response.text();

    console.log(responseText);

    // calculateTotalTokens(responseText);

    // const discount = getDiscount(userData);

    // await apiTokenUsageUpdate(responseText, 1.0, apiData, userData, apiKey, userId!);

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
      const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
      const baseUrl = process.env.ANTHROPIC_BASE_URL;
      const model = process.env.ANTHROPIC_MODEL;

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