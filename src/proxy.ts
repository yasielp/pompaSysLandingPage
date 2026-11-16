import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale, negotiateLocale, locales } from "@/lib/i18n";

// Sends "/" (or any path without a locale prefix) to /es or /en, based on the
// visitor's saved choice first and their browser language (Accept-Language) second.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasPrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasPrefix) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    saved && hasLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  // The redirect depends on these headers, so caches must not reuse it across visitors.
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|assets|.*\\..*).*)"],
};
