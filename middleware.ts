import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const reqUrl = request.nextUrl.pathname;
  const cookies = request.cookies.get("jwt");

  console.log("req url", reqUrl);

  if (reqUrl === "/" && cookies) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (reqUrl.startsWith("/dashboard") && !cookies) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // return NextResponse.next();
}
