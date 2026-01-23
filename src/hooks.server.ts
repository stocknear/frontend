import { sequence } from "@sveltejs/kit/hooks";
import PocketBase from "pocketbase";
import { serializeNonPOJOs } from "$lib/utils";
import { paraglideMiddleware } from "$lib/paraglide/server.js";
import { type Locale } from "$lib/paraglide/runtime.js";
import { preloadLocaleMessages } from "$lib/paraglide/messages.js";
import { STOCKNEAR_API_KEY } from "$env/static/private";

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
      maxAge: 60 * 60 * 24 * 365,
    });

    response.headers.append("set-cookie", cookieString);
    return response;
  }

  const isSafeMethod = event.request.method === "GET" || event.request.method === "HEAD";
  let middlewareRequest = event.request;

  if (!isSafeMethod) {
    try {
      middlewareRequest = new Request(event.request.url, {
        method: event.request.method,
        headers: event.request.headers,
      });
    } catch {
      middlewareRequest = event.request;
    }
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
        await event?.locals?.pb?.collection("users")?.authRefresh();
        event.locals.user = serializeNonPOJOs(event?.locals?.pb?.authStore?.model);
      } catch (e) {
        event.locals.pb.authStore.clear();
        event.locals.user = undefined;
        console.log(e);
      }
    }

    await preloadLocaleMessages(locale);

    const response = await resolve(
      { ...event, request: isSafeMethod ? request : event.request },
      {
      transformPageChunk: ({ html }) =>
        html
          .replace('data-theme=""', `data-theme="${themeMode}"`)
          .replace('lang="en"', `lang="${locale}"`),
      },
    );

    // Use a more compatible way to set the cookie
    const cookieString = event?.locals?.pb?.authStore?.exportToCookie({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
    });

    response.headers.append("set-cookie", cookieString);

    return response;
  });
});
