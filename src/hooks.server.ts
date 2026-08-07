import type { HandleServerError, RequestEvent } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import PocketBase from "pocketbase";
import { serializeNonPOJOs } from "$lib/utils";
import { paraglideMiddleware } from "$lib/paraglide/server.js";
import {
  type Locale,
  cookieMaxAge,
  cookieName,
} from "$lib/paraglide/runtime.js";
import { canonicalizeLocale } from "$lib/i18n/locales";
import { STOCKNEAR_API_KEY as BUILT_IN_API_KEY } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { getRouteLocaleAssets } from "$lib/i18n/delivery/generated/manifest.js";
import {
  localizeInternalRedirect,
  resolveLocaleRequest,
  type LocaleRedirect,
} from "$lib/server/locale-routing";

// $env/static/private is inlined at build time, so editing .env and reloading pm2 changes
// nothing - the running build keeps the value it was compiled with. That split-brain between a
// frozen frontend and the backend's runtime os.getenv is what silently broke push delivery.
// Prefer the runtime value so rotation is a restart, and fall back to the compiled-in one so
// hosts that do not export the variable behave exactly as before.
const STOCKNEAR_API_KEY = env.STOCKNEAR_API_KEY || BUILT_IN_API_KEY;

// Note: /alerts is deliberately absent — it is a public feature page with its own
// SEO copy and is listed in sitemap-static.xml. Adding it here would noindex a page
// we actively submit for indexing.
const PRIVATE_INDEX_PATHS = [
  "/chat",
  "/login",
  "/notifications",
  "/portfolio",
  "/profile",
  "/register",
  "/reset-password",
  "/update-password",
  "/watchlist",
  "/welcome",
  "/workspace",
] as const;

function isPrivateIndexPath(pathname: string): boolean {
  const segments = pathname?.split("/")?.filter(Boolean) ?? [];
  const hasLocalePrefix = canonicalizeLocale(segments?.[0]) !== null;
  const normalizedPath = `/${(hasLocalePrefix ? segments?.slice(1) : segments)?.join("/")}`;

  return PRIVATE_INDEX_PATHS?.some(
    (path) => normalizedPath === path || normalizedPath?.startsWith(`${path}/`),
  );
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

function setLocaleCookie(event: RequestEvent, locale: Locale): string {
  const forwardedProto = getForwardedHeader(
    event.request,
    "x-forwarded-proto",
  )?.toLowerCase();
  const options = {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: event.url.protocol === "https:" || forwardedProto === "https",
    maxAge: cookieMaxAge,
  } as const;

  event.cookies.set(cookieName, locale, options);
  return event.cookies.serialize(cookieName, locale, options);
}

function localeRedirectResponse(redirect: LocaleRedirect): Response {
  const headers = new Headers({ location: redirect.location });
  // Canonical redirects also synchronize an explicit URL choice into a
  // cookie. Prevent a browser/CDN-cached 308 from skipping that side effect.
  headers.set("cache-control", "private, no-store");
  if (redirect.variesByVisitor) {
    headers.set("vary", "Cookie, CF-IPCountry");
  } else {
    headers.set("vary", "Cookie");
  }

  return new Response(null, { status: redirect.status, headers });
}

/**
 * `use:enhance` form actions answer with a 200 JSON body — {type:"redirect",location} — instead
 * of a Location header, so the header-based localization below never sees them. The client then
 * navigates to a bare path, +layout.svelte's beforeNavigate cancels it to add the locale prefix,
 * and a cancelled navigation loses the `invalidateAll` that applyAction relies on to refresh
 * auth and subscription state.
 */
async function localizeActionRedirect(
  response: Response,
  locale: Locale,
  event: RequestEvent,
): Promise<Response> {
  // Gate before cloning — every other response on this path is a streamed HTML document.
  if (event.request.headers.get("x-sveltekit-action") !== "true") return response;

  let payload: { type?: string; location?: string } | null = null;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }
  if (payload?.type !== "redirect" || typeof payload.location !== "string") {
    return response;
  }

  payload.location = localizeInternalRedirect(payload.location, locale);

  const body = JSON.stringify(payload);
  const headers = new Headers(response.headers);
  headers.set("content-length", String(new TextEncoder().encode(body).byteLength));

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("vary");
  if (!current) {
    headers.set("vary", value);
  } else if (!current.toLowerCase().includes(value.toLowerCase())) {
    headers.set("vary", `${current}, ${value}`);
  }
}

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
  const localeRouting = resolveLocaleRequest({
    url: event.url,
    cookieLocale: event.cookies.get(cookieName),
    countryCode: event.request.headers.get("CF-IPCountry"),
    method: event.request.method,
  });

  const localeCookie = localeRouting.persistLocale
    ? setLocaleCookie(event, localeRouting.locale)
    : null;

  if (localeRouting.redirect) {
    const response = localeRedirectResponse(localeRouting.redirect);
    if (localeCookie) response.headers.append("set-cookie", localeCookie);
    return response;
  }

  // Skip paraglideMiddleware for API routes to prevent "Body already read" errors
  // API routes don't need locale handling and the middleware consumes the request body
  const isApiRoute =
    event.url.pathname === "/api" || event.url.pathname.startsWith("/api/");

  if (isApiRoute) {
    // Handle API routes without paraglideMiddleware
    const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    const apiURL = import.meta.env.VITE_USEAST_API_URL;
    const wsURL = getPublicWsBaseUrl(event);

    // Must match the page branch below, or an API request and a page request
    // disagree about the theme for the same visitor.
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
      wsURL,
      apiKey: STOCKNEAR_API_KEY,
      themeMode,
      clientIp,
      cookieConsent,
      locale: localeRouting.locale,
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

    // API routes answer JSON, but an error here still renders app.html — so the
    // placeholder has to be substituted on this path too or it leaks as text.
    const response = await resolve(event, {
      transformPageChunk: ({ html }) =>
        html?.replace(
          /%stocknear\.themeColor%/g,
          themeMode === "light" ? "#f7f7f9" : "#09090b",
        ),
    });

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
    // Non-localized endpoints (notably the fixed OAuth callback) have no URL
    // locale, so retain the saved locale selected by the request resolver.
    const resolvedLocale = localeRouting.excluded
      ? localeRouting.locale
      : (locale as Locale);

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
      locale: resolvedLocale,
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

    let response = await resolve(
      { ...event, request: isSafeMethod ? request : event.request },
      {
        transformPageChunk: ({ html }) =>
          html
            ?.replace('data-theme=""', `data-theme="${themeMode}"`)
            // Must track --surface-page in app.css.
            ?.replace(
              /%stocknear\.themeColor%/g,
              themeMode === "light" ? "#f7f7f9" : "#09090b",
            )
            ?.replace(
              "%stocknear.i18n%",
              getRouteLocaleAssets(event?.route?.id ?? "/", resolvedLocale)
                ?.map((src) => `<script src="${src}"></script>`)
                ?.join("") ?? "",
            )
            ?.replace("%lang%", resolvedLocale),
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
    if (redirectLocation) {
      response.headers.set(
        "location",
        localizeInternalRedirect(redirectLocation, resolvedLocale),
      );
    } else {
      response = await localizeActionRedirect(response, resolvedLocale, event);
    }

    const isOAuthCallback =
      event.url.pathname === "/oauth" ||
      event.url.pathname.startsWith("/oauth/");
    if (!localeRouting.excluded && localeRouting.source !== "url") {
      // A bare English response is still selected using Cookie/Country. Do
      // not let a shared cache bypass that decision for the next visitor.
      response.headers.set("cache-control", "private, no-store");
      appendVary(response.headers, "Cookie");
      appendVary(response.headers, "CF-IPCountry");
    } else if (localeCookie || isOAuthCallback) {
      // Explicit URL cookie synchronization and OAuth callback destinations
      // are user-specific side effects even when their content is not.
      response.headers.set("cache-control", "private, no-store");
      appendVary(response.headers, "Cookie");
    }

    if (isPrivateIndexPath(event?.url?.pathname)) {
      response.headers.set("x-robots-tag", "noindex, nofollow");
    }

    return response;
  });
});

/**
 * Log every server-side error with enough context to tell an outage from a dead link.
 *
 * Nothing logged errors before this, which is why a backend hiccup rendering as
 * "Page not found" went undiagnosed: 5xx responses were indistinguishable from
 * genuine 404s in both the UI and the logs.
 */
export const handleError: HandleServerError = ({
  error,
  event,
  status,
  message,
}) => {
  const path = event?.url?.pathname ?? "unknown";
  const cause = error instanceof Error ? error?.stack || error?.message : error;

  // 404s are routine (crawlers, stale links) — one line. 5xx means something broke.
  if (status >= 500) {
    console.error(
      `[${status}] ${event?.request?.method ?? "GET"} ${path} — ${message}`,
      cause,
    );
  } else {
    console.warn(`[${status}] ${path} — ${message}`);
  }

  return { message };
};
