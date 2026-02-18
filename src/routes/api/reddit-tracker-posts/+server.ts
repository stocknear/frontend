import type { RequestHandler } from "./$types";

const SUBREDDIT_REGEX = /^[a-zA-Z0-9_]{1,30}$/;
const TICKER_REGEX = /^[A-Z0-9.^-]{1,20}$/;
const VALID_PERIODS = ["oneDay", "oneWeek", "oneMonth", "threeMonths"];

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey } = locals;

  const subreddit = url.searchParams.get("subreddit") || "wallstreetbets";
  const ticker = (url.searchParams.get("ticker") || "").toUpperCase();
  const period = url.searchParams.get("period") || "oneWeek";

  if (!SUBREDDIT_REGEX.test(subreddit)) {
    return new Response(JSON.stringify([]), { status: 400 });
  }
  if (!ticker || !TICKER_REGEX.test(ticker)) {
    return new Response(JSON.stringify([]), { status: 400 });
  }
  const safePeriod = VALID_PERIODS.includes(period) ? period : "oneWeek";

  const response = await fetch(
    `${apiURL}/reddit-tracker-posts?subreddit=${encodeURIComponent(subreddit)}&ticker=${encodeURIComponent(ticker)}&period=${safePeriod}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    },
  );

  if (!response.ok) {
    return new Response(JSON.stringify([]), { status: response.status });
  }

  try {
    const output = await response.json();
    return new Response(JSON.stringify(output));
  } catch {
    return new Response(JSON.stringify([]), { status: 500 });
  }
};
