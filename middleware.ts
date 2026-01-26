import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "dishlens_access_token";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Protect restaurant/staff dashboard routes.
  const isDashboard = pathname.startsWith("/r");
  const isLogin = pathname === "/r/login";

  if (!isDashboard || isLogin) {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/r/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/r/:path*"],
};
