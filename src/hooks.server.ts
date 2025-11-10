import { sequence } from "@sveltejs/kit/hooks";
import PocketBase from "pocketbase";
import { serializeNonPOJOs } from "$lib/utils";

export const handle = sequence(async ({ event, resolve }) => {

  // Use a ternary operator instead of the logical OR for better compatibility
  const pbURL = import.meta.env.VITE_USEAST_POCKETBASE_URL; 
  const apiURL = import.meta.env.VITE_USEAST_API_URL; 
  const fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
  const wsURL = import.meta.env.VITE_USEAST_WS_URL;
  
  const themeMode = event?.cookies?.get("theme-mode") || "dark";
  
  
  let clientIp: string | undefined;
  const cfIp = event.request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    clientIp = cfIp.trim();
  } else if (typeof event.getClientAddress === "function") {
    const addr = event.getClientAddress();
    if (addr && addr.trim().length > 0) {
      clientIp = addr.trim();
    }
  }

  event.locals = {
    pb: new PocketBase(pbURL),
    apiURL,
    fastifyURL,
    wsURL,
    apiKey: import.meta.env.VITE_STOCKNEAR_API_KEY,
    themeMode,
    clientIp,
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
      console.log(e)
    }
  }

  const response = await resolve(event, {
    transformPageChunk: ({html}) => html.replace('data-theme=""', `data-theme="${themeMode}"`)
  });

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
