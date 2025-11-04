import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // 取出 authorization 头
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  if (!authHeader) return null;

  // 格式必须是 "Bearer <token>"
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  // 返回 token 部分
  return match[1].trim();
}

export function currentMonth() {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);
  return currentMonth;
}

export function currentDate() {
  const currentDate = new Date();
  return currentDate.toISOString().slice(0, 10)
}

export function formatDate(dateString: string | null) {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTokens(tokens: number | null | undefined) {
  if (tokens === null || tokens === undefined) {
    return '0';
  }
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

type OpenAIErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'insufficient_quota'
  | 'not_found_error'
  | 'rate_limit_error'
  | 'server_error';

interface OpenAIErrorBody {
  error: {
    message: string;
    // type: OpenAIErrorType;
    // param: string | null;
    // code: string | null;
  };
}

function mapStatusToOpenAIError(status: number): { type: OpenAIErrorType; code: string | null } {
  switch (status) {
    case 400:
      return { type: 'invalid_request_error', code: 'invalid_request' };
    case 401:
      return { type: 'authentication_error', code: 'invalid_api_key' };
    case 403:
      return { type: 'insufficient_quota', code: 'insufficient_quota' };
    case 404:
      return { type: 'not_found_error', code: 'not_found' };
    case 429:
      return { type: 'rate_limit_error', code: 'rate_limit_exceeded' };
    case 500:
      return { type: 'server_error', code: null };
    case 503:
      return { type: 'server_error', code: 'service_unavailable' };
    default:
      return { type: 'server_error', code: null };
  }
}

export async function anthropicTemplateResponse(text: string, status: number = 200, opts?: ErrorOptions) {
  const mapped = mapStatusToOpenAIError(status);
  const body: OpenAIErrorBody = {
    error: {
      message: text,                          // 前端直接展示这一段
      // type: mapped.type,   // 错误类型
      // param: null,             // 可指明哪个参数出错
      // code: mapped.code,        // 更细的错误码
    },
  };


  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
  });
}

export async function anthropicHelloWorldResponse() {
  return await anthropicTemplateResponse("", 403);
}

export async function anthropicApikeyInvalidResponse() {
  return await anthropicTemplateResponse("Invalid key! Your api-key is invalid or expired");
}

export async function anthropicApikey401Response() {
  return await anthropicTemplateResponse("Unexpected error, pls contact us by email: cfjwlchangji@gmail.com");
}

export async function anthropicApiLimitExceedResponse() {
  return await anthropicTemplateResponse("reach the limit of api-key's quota, consider enlarge the quota or upgrade: https://claudeide.net/dashboard/api-keys");
}

export async function anthropicUserLimitExceedResponse() {
  return await anthropicTemplateResponse("reach the limit of user's quota, consider upgrade your plan: https://claudeide.net/dashboard");
}

export async function anthropicUserSubscriptionInvalidResponse() {
  return await anthropicTemplateResponse("subscription is invalid, consider update your plan: https://claudeide.net/dashboard");
}

export async function anthropicWrongBaseUrl() {
  return await anthropicTemplateResponse("wrong parameter! pls check value of your ANTHROPIC_BASE_URL");
}

