import { sequence } from "@sveltejs/kit/hooks";
import PocketBase from "pocketbase";
import { serializeNonPOJOs } from "$lib/utils";
import { paraglideMiddleware } from "$lib/paraglide/server.js";
import { type Locale, locales, baseLocale, cookieName, cookieMaxAge } from "$lib/paraglide/runtime.js";
import { STOCKNEAR_API_KEY } from "$env/static/private";

// Locale detection constants
const GERMAN_COUNTRY_CODE = "DE";

/**
 * Detects and injects locale cookie for first-time visitors based on Cloudflare IP geolocation.
 * Returns the locale and whether a new cookie needs to be set on the response.
 */
function detectLocaleFromRequest(request: Request): { locale: Locale; needsToSetCookie: boolean; cookieHeader: string } {
  const existingCookieHeader = request.headers.get("cookie") || "";

  // Check for existing valid locale cookie
  const existingLocale = existingCookieHeader
    ?.split("; ")
    ?.find((c) => c.startsWith(cookieName + "="))
    ?.split("=")[1];

  // If valid cookie exists, use it
  if (existingLocale && (locales as readonly string[])?.includes(existingLocale)) {
    return {
      locale: existingLocale as Locale,
      needsToSetCookie: false,
      cookieHeader: existingCookieHeader
    };
  }

  // No valid cookie - detect from Cloudflare IP country
  const country = request.headers.get("CF-IPCountry");
  const detectedLocale: Locale = country === GERMAN_COUNTRY_CODE ? "de" : baseLocale;

  // Inject cookie into header for paraglideMiddleware to pick up
  const newCookie = `${cookieName}=${detectedLocale}`;
  const updatedCookieHeader = existingCookieHeader
    ? `${existingCookieHeader}; ${newCookie}`
    : newCookie;

  return {
    locale: detectedLocale,
    needsToSetCookie: true,
    cookieHeader: updatedCookieHeader
  };
}

/**
 * Creates a request with modified cookie header for locale detection.
 * Handles body cloning carefully to avoid "body already read" errors.
 */
function createRequestWithCookie(originalRequest: Request, cookieHeader: string, isSafeMethod: boolean): Request {
  const newHeaders = new Headers(originalRequest.headers);
  newHeaders.set("cookie", cookieHeader);

  if (isSafeMethod) {
    // Safe methods (GET/HEAD) - can clone with body
    return new Request(originalRequest.url, {
      method: originalRequest.method,
      headers: newHeaders,
      body: originalRequest.body,
      // @ts-ignore - duplex is needed for streaming bodies
      duplex: "half",
    });
  } else {
    // Unsafe methods - create without body to avoid streaming issues
    return new Request(originalRequest.url, {
      method: originalRequest.method,
      headers: newHeaders,
    });
  }
}

const getClientIp = (event) => {
  const cfIp = event.request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = event.request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0]?.trim();
  }

  const realIp = event.request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  try {
    if (typeof event.getClientAddress === "function") {
      const addr = event.getClientAddress();
      if (addr && addr.trim().length > 0) {
        return addr.trim();
      }
    }
  } catch {
    // getClientAddress can throw in dev when the address is unavailable
  }

  return undefined;
};

// Auth refresh cache — avoids hitting PocketBase on every request
const AUTH_CACHE_TTL = 5_000; // 10 seconds
const AUTH_CACHE_MAX = 500;
const authCache = new Map<string, { user: any; timestamp: number }>();

async function resolveUser(pb: any): Promise<any> {
  const token = pb.authStore?.token;
  if (!token) return undefined;

  const cached = authCache.get(token);
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
    return cached.user;
  }

  await pb.collection("users").authRefresh();
  const user = serializeNonPOJOs(pb.authStore.model);

  // Evict oldest if at capacity
  if (authCache.size >= AUTH_CACHE_MAX) {
    const oldest = authCache.keys().next().value;
    authCache.delete(oldest);
  }
  authCache.set(token, { user, timestamp: Date.now() });
  return user;
}

export const handle = sequence(async ({ event, resolve }) => {
  // Skip paraglideMiddleware for API routes to prevent "Body already read" errors
  // API routes don't need locale handling and the middleware consumes the request body
  const isApiRoute = event.url.pathname.startsWith('/api/');

  if (isApiRoute) {
    // Handle API routes without paraglideMiddleware
    const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    const apiURL = import.meta.env.VITE_USEAST_API_URL;
    const fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    const wsURL = import.meta.env.VITE_USEAST_WS_URL;

    const rawThemeMode = event?.cookies?.get("theme-mode") || "dark";
    const VALID_THEMES = ["dark", "light"];
    const themeMode = VALID_THEMES?.includes(rawThemeMode) ? rawThemeMode : "dark";

    let cookieConsent: { necessary: boolean; analytics: boolean; marketing: boolean } | null = null;
    const cookieConsentRaw = event?.cookies?.get("cookie-consent");
    if (cookieConsentRaw) {
      try {
        cookieConsent = JSON.parse(cookieConsentRaw);
      } catch {
        cookieConsent = null;
      }
    }

    const clientIp = getClientIp(event);

    event.locals = {
      pb: new PocketBase(pbURL),
      apiURL,
      fastifyURL,
      wsURL,
      apiKey: STOCKNEAR_API_KEY,
      themeMode,
      clientIp,
      cookieConsent,
      locale: "en" as Locale,
    };

    const authCookie = event?.request?.headers?.get("cookie") || "";
    event.locals.pb.authStore?.loadFromCookie(authCookie);

    if (event?.locals?.pb?.authStore?.isValid) {
      try {
        event.locals.user = await resolveUser(event.locals.pb);
      } catch (e) {
        event.locals.pb.authStore.clear();
        event.locals.user = undefined;
        console.log(e);
      }
    }

    const response = await resolve(event);

    const cookieString = event?.locals?.pb?.authStore?.exportToCookie({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 90,
    });

    response.headers.append("set-cookie", cookieString);
    return response;
  }

  const isSafeMethod = event.request.method === "GET" || event.request.method === "HEAD";

  // Detect locale from cookie or Cloudflare IP geolocation
  const { locale: detectedLocale, needsToSetCookie, cookieHeader } = detectLocaleFromRequest(event.request);

  // Create request with injected cookie for paraglideMiddleware
  let middlewareRequest: Request;
  try {
    middlewareRequest = needsToSetCookie
      ? createRequestWithCookie(event.request, cookieHeader, isSafeMethod)
      : (isSafeMethod ? event.request : new Request(event.request.url, {
          method: event.request.method,
          headers: event.request.headers,
        }));
  } catch {
    middlewareRequest = event.request;
  }

  // Use Paraglide middleware for proper SSR locale handling with AsyncLocalStorage
  return paraglideMiddleware(middlewareRequest, async ({ request, locale }) => {
    // Use a ternary operator instead of the logical OR for better compatibility
    const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    const apiURL = import.meta.env.VITE_USEAST_API_URL;
    const fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    const wsURL = import.meta.env.VITE_USEAST_WS_URL;

    // Sanitize theme-mode to prevent XSS injection - only allow valid theme values
    const rawThemeMode = event?.cookies?.get("theme-mode") || "dark";
    const VALID_THEMES = ["dark", "light"];
    const themeMode = VALID_THEMES?.includes(rawThemeMode) ? rawThemeMode : "dark";

    // Parse cookie consent
    let cookieConsent: { necessary: boolean; analytics: boolean; marketing: boolean } | null = null;
    const cookieConsentRaw = event?.cookies?.get("cookie-consent");
    if (cookieConsentRaw) {
      try {
        cookieConsent = JSON.parse(cookieConsentRaw);
      } catch {
        cookieConsent = null;
      }
    }

    const clientIp = getClientIp(event);

    event.locals = {
      pb: new PocketBase(pbURL),
      apiURL,
      fastifyURL,
      wsURL,
      apiKey: STOCKNEAR_API_KEY,
      themeMode,
      clientIp,
      cookieConsent,
      locale: locale as Locale,
    };

    const authCookie = event?.request?.headers?.get("cookie") || "";

    event.locals.pb.authStore?.loadFromCookie(authCookie);

    if (event?.locals?.pb?.authStore?.isValid) {
      try {
        event.locals.user = await resolveUser(event.locals.pb);
      } catch (e) {
        event.locals.pb.authStore.clear();
        event.locals.user = undefined;
        console.log(e);
      }
    }

    const response = await resolve(
      { ...event, request: isSafeMethod ? request : event.request },
      {
      transformPageChunk: ({ html }) =>
        html
          .replace('data-theme=""', `data-theme="${themeMode}"`)
          .replace('%lang%', locale),
      },
    );

    // Use a more compatible way to set the cookie
    const cookieString = event?.locals?.pb?.authStore?.exportToCookie({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 90,
    });

    response.headers.append("set-cookie", cookieString);

    // Set locale cookie for first-time visitors (persists the IP-detected locale)
    if (needsToSetCookie) {
      const isSecure = event.url.protocol === "https:";
      const localeCookie = `${cookieName}=${detectedLocale}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
      response.headers.append("set-cookie", localeCookie);
    }

    return response;
  });
});
