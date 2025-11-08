import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function currentSubscription(startDate: Date) {
  const today = new Date();
  const diffMs = today.getTime() - startDate.getTime();
  const oneDayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffMs / oneDayMs);
  const cycles = Math.floor(diffDays / 30) + 1;
  const startMonth = startDate.toISOString().slice(0, 7);
  return `${startMonth}-${cycles}`
}

export function currentCycle() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-1`;
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
