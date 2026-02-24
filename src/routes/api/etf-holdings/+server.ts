import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;

export const POST: RequestHandler = async ({ request, locals }) => {
  const { clientIp } = locals;
  const rateLimit = checkRateLimit(clientIp, "etfHoldings", RATE_LIMITS.etfHoldings);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429 },
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const rawTicker = typeof data?.ticker === "string" ? data.ticker.trim().toUpperCase() : "";
  if (!rawTicker || !TICKER_REGEX.test(rawTicker)) {
    return new Response(JSON.stringify({ error: "Invalid ticker format" }), { status: 400 });
  }

  const output = await postAPI(locals, "/etf-holdings", { ticker: rawTicker });
  return new Response(JSON.stringify(output));
};
