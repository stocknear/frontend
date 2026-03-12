import type { RequestHandler } from "./$types";
import { issueWsToken } from "$lib/server/ws-token";
import { RATE_LIMITS, checkRateLimit } from "$lib/server/rateLimit";

export const POST: RequestHandler = async ({ locals, request }) => {
  const privateScopes = new Set([
    "options-flow",
    "unusual-order",
    "/options-flow",
    "/unusual-order",
  ]);
  let body: { scope?: string } | null = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const scope = String(body?.scope || "").trim();
  if (!scope) {
    return new Response(JSON.stringify({ error: "Scope is required" }), {
      status: 400,
    });
  }

  const rateLimit = checkRateLimit(locals.clientIp, "wsToken", RATE_LIMITS.wsToken);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
    });
  }

  const token = await issueWsToken({
    locals,
    scope,
    requirePro: privateScopes.has(scope),
  });

  if (!token) {
    return new Response(JSON.stringify({ error: "Unable to issue token" }), {
      status: 403,
    });
  }

  return new Response(JSON.stringify({ token }));
};
