import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

function localeOf(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return locales.includes(segment as Locale) ? (segment as Locale) : defaultLocale;
}

function pathAfterLocale(pathname: string, locale: Locale): string {
  const rest = pathname.startsWith(`/${locale}`) ? pathname.slice(locale.length + 1) : pathname;
  return rest || "/";
}

/**
 * An optimistic gate: it only reads the signed cookie, never the database, because
 * it runs on every request including prefetches. Each server action and page still
 * checks permissions itself — this just keeps signed-out people off app screens.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  const locale = localeOf(pathname);

  // A path with no locale prefix gets one, keeping any query string intact.
  if (!pathname.startsWith(`/${locale}`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const inner = pathAfterLocale(pathname, locale);
  const isLogin = inner === "/login";
  const isChangePassword = inner === "/change-password";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (isLogin) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = pathname === `/${locale}` ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = session.mustChangePassword
      ? `/${locale}/change-password`
      : `/${locale}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Someone still on an administrator-issued password cannot use the rest of the app.
  if (session.mustChangePassword && !isChangePassword) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/change-password`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw\\.js|offline\\.html|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
