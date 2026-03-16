import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isValidLocale } from "@/i18n/config";

/** Accept-Languageヘッダーからロケールを検出 */
function detectLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "ja,en-US;q=0.9,en;q=0.8,es;q=0.7")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, quality] = lang.trim().split(";q=");
      return {
        code: code.trim().split("-")[0].toLowerCase(), // "en-US" → "en"
        quality: quality ? Number.parseFloat(quality) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  // Skip API routes, _next internals, and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return undefined;
  }

  // Check if pathname already has a valid locale prefix
  const segments = pathname.split("/");
  const firstSegment = segments[1]; // e.g., "ja", "en", "es"
  if (firstSegment && isValidLocale(firstSegment)) {
    return undefined;
  }

  // Detect locale and redirect
  const locale = detectLocale(request);
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Match all paths except _next, api, and static files
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
