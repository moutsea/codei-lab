import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";
import { routing } from "./i18n/routing";

// next-intl middleware
const intlMiddleware = createMiddleware(routing);
// const protectedRoutes = ["/auth"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // API路由跳过所有中间件处理
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 1. 先处理语言
  const intlResponse = intlMiddleware(req);

  // 如果 intl 要 redirect（比如补上 /zh/），直接返回
  if (intlResponse && intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2. 针对需要保护的路径，跑 auth0
  // const needsAuth = protectedRoutes.some((prefix) => path.startsWith(prefix));

  // if (needsAuth) {
  //   const authResponse = await auth0.middleware(req);
  //   if (authResponse) return authResponse;
  // }

  // 3. 默认继续
  return intlResponse ?? NextResponse.next();
}

// 配置 matcher：避免对 API 路由和静态资源应用中间件
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|txt|xml|mp4|webm|avi|mov)).*)"
  ]
};



