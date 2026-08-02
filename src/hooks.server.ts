import type { RequestEvent } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import PocketBase from "pocketbase";
import { serializeNonPOJOs } from "$lib/utils";
import { paraglideMiddleware } from "$lib/paraglide/server.js";
import {
  type Locale,
  baseLocale,
  cookieMaxAge,
  cookieName,
} from "$lib/paraglide/runtime.js";
import { STOCKNEAR_API_KEY as BUILT_IN_API_KEY } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { isLocalizableHref, hrefForLocale } from "$lib/i18n/navigation";
import {
  canonicalizeLocale,
  getLocaleDefinition,
} from "$lib/i18n/locales";
import { getRouteLocaleAssets } from "$lib/i18n/delivery/generated/manifest.js";

// $env/static/private is inlined at build time, so editing .env and reloading pm2 changes
// nothing - the running build keeps the value it was compiled with. That split-brain between a
// frozen frontend and the backend's runtime os.getenv is what silently broke push delivery.
// Prefer the runtime value so rotation is a restart, and fall back to the compiled-in one so
// hosts that do not export the variable behave exactly as before.
const STOCKNEAR_API_KEY = env.STOCKNEAR_API_KEY || BUILT_IN_API_KEY;

function canonicalLocaleRedirect(url: URL): Response | null {
  const firstSegment = url.pathname.split("/")?.[1];
  if (!firstSegment) return null;

  const locale = canonicalizeLocale(firstSegment);
  if (!locale) return null;

  const canonicalSlug = getLocaleDefinition(locale).slug;
  if (canonicalSlug && firstSegment === canonicalSlug) return null;

  // Collapse leading slash/backslash runs in the suffix so a locale redirect
  // can never produce a protocol-relative Location header.
  const suffix = url.pathname
    .slice(firstSegment.length + 1)
    .replace(/^[\\/]+/, "");
  const localizedRoot = canonicalSlug ? `/${canonicalSlug}` : "";
  const pathname = suffix
    ? `${localizedRoot}/${suffix}`
    : `${localizedRoot}/`;
  const location = `${pathname}${url.search}`;
  return new Response(null, { status: 308, headers: { location } });
}

function canonicalizeLocaleCookie(event: RequestEvent): void {
  const rawLocale = event.cookies.get(cookieName);
  const locale = canonicalizeLocale(rawLocale);
  if (!rawLocale || !locale || rawLocale === locale) return;

  event.cookies.set(cookieName, locale, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: event.url.protocol === "https:",
    maxAge: cookieMaxAge,
  });
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

const getForwardedHeader = (request: Request, headerName: string) => {
  const value = request.headers.get(headerName);
  if (!value) {
    return undefined;
  }

  const firstValue = value.split(",")[0]?.trim();
  return firstValue && firstValue.length > 0 ? firstValue : undefined;
};

const getPublicWsBaseUrl = (event) => {
  const forwardedProto = getForwardedHeader(
    event.request,
    "x-forwarded-proto",
  );
  const forwardedHost = getForwardedHeader(event.request, "x-forwarded-host");
  const host = forwardedHost || event.request.headers.get("host") || event.url.host;

  if (!host) {
    return undefined;
  }

  const protocol = (forwardedProto || event.url.protocol.replace(":", "") || "http")
    .toLowerCase();
  const wsProtocol = protocol === "https" ? "wss" : "ws";

  return `${wsProtocol}://${host}/ws`;
};

export const handle = sequence(async ({ event, resolve }) => {
  const localeRedirect = canonicalLocaleRedirect(event.url);
  if (localeRedirect) return localeRedirect;

  canonicalizeLocaleCookie(event);

  // Skip paraglideMiddleware for API routes to prevent "Body already read" errors
  // API routes don't need locale handling and the middleware consumes the request body
  const isApiRoute =
    event.url.pathname === "/api" || event.url.pathname.startsWith("/api/");

  if (isApiRoute) {
    // Handle API routes without paraglideMiddleware
    const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    const apiURL = import.meta.env.VITE_USEAST_API_URL;
    const wsURL = getPublicWsBaseUrl(event);

    const rawThemeMode = event?.cookies?.get("theme-mode") || "light";
    const VALID_THEMES = ["dark", "light"];
    const themeMode = VALID_THEMES?.includes(rawThemeMode) ? rawThemeMode : "light";

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
      wsURL,
      apiKey: STOCKNEAR_API_KEY,
      themeMode,
      clientIp,
      cookieConsent,
      locale: canonicalizeLocale(event.cookies.get(cookieName)) ?? baseLocale,
    };

    const authCookie = event?.request?.headers?.get("cookie") || "";
    event.locals.pb.authStore?.loadFromCookie(authCookie);

    if (event?.locals?.pb?.authStore?.isValid) {
      try {
        await event?.locals?.pb?.collection("users")?.authRefresh();
        event.locals.user = serializeNonPOJOs(event?.locals?.pb?.authStore?.model);
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

  // Use Paraglide middleware for proper SSR locale handling with AsyncLocalStorage
  return paraglideMiddleware(event.request, async ({ request, locale }) => {
    // Use a ternary operator instead of the logical OR for better compatibility
    const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    const apiURL = import.meta.env.VITE_USEAST_API_URL;
    const wsURL = getPublicWsBaseUrl(event);

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
        await event?.locals?.pb?.collection("users")?.authRefresh();
        event.locals.user = serializeNonPOJOs(event?.locals?.pb?.authStore?.model);
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
          .replace(
            "%stocknear.i18n%",
            getRouteLocaleAssets(event.route.id ?? "/", locale as Locale)
              .map((src) => `<script src="${src}"></script>`)
              .join(""),
          )
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

    const redirectLocation = response.headers.get("location");
    if (redirectLocation?.startsWith("/") && isLocalizableHref(redirectLocation)) {
      response.headers.set("location", hrefForLocale(redirectLocation, locale as Locale));
    }

    return response;
  });
});
