import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { apiKey, apiURL, wsURL } = locals;
  const ticker = params.slug?.toUpperCase();

  if (!ticker) {
    throw error(404, "Ticker not found");
  }

  const payload = JSON.stringify({ ticker });
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  const [historicalRes, intradayRes] = await Promise.all([
    fetch(apiURL + "/historical-adj-price", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/one-day-price", {
      method: "POST",
      headers,
      body: payload,
    }),
  ]);

  let historical = [];
  if (historicalRes.ok) {
    try {
      historical = await historicalRes.json();
    } catch {
      historical = [];
    }
  }

  let intraday = [];
  if (intradayRes.ok) {
    try {
      intraday = await intradayRes.json();
    } catch {
      intraday = [];
    }
  }

  return {
    ticker,
    historical,
    intraday,
    wsURL,
  };
};
