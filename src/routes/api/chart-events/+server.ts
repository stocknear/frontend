import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user } = locals;

  // Only Pro users can access chart events
  if (user?.tier !== "Pro") {
    return new Response(JSON.stringify({ error: "Pro subscription required" }), {
      status: 403,
    });
  }

  const data = await request.json();
  const ticker = data?.ticker;
  const types: string[] = data?.types ?? [];

  if (!ticker || !types.length) {
    return new Response(JSON.stringify({ error: "Missing ticker or types" }), {
      status: 400,
    });
  }

  const payload = JSON.stringify({ ticker });
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  const result: {
    earnings?: any[];
    nextEarnings?: any;
    dividends?: any[];
    news?: any[];
  } = {};

  // Build fetch promises based on requested types
  const fetchPromises: Promise<void>[] = [];

  if (types.includes("earnings")) {
    fetchPromises.push(
      (async () => {
        try {
          const [earningsRes, nextEarningsRes] = await Promise.all([
            fetch(apiURL + "/earnings-statistics", {
              method: "POST",
              headers,
              body: payload,
            }),
            fetch(apiURL + "/next-earnings", {
              method: "POST",
              headers,
              body: payload,
            }),
          ]);

          if (earningsRes.ok) {
            const earningsPayload = await earningsRes.json();
            result.earnings = earningsPayload?.historicalEarnings ?? [];
          }

          if (nextEarningsRes.ok) {
            result.nextEarnings = await nextEarningsRes.json();
          }
        } catch {
          result.earnings = [];
          result.nextEarnings = null;
        }
      })()
    );
  }

  if (types.includes("dividends")) {
    fetchPromises.push(
      (async () => {
        try {
          const dividendRes = await fetch(apiURL + "/stock-dividend", {
            method: "POST",
            headers,
            body: payload,
          });

          if (dividendRes.ok) {
            const dividendPayload = await dividendRes.json();
            result.dividends = dividendPayload?.history ?? [];
          }
        } catch {
          result.dividends = [];
        }
      })()
    );
  }

  if (types.includes("news")) {
    fetchPromises.push(
      (async () => {
        try {
          const wiimRes = await fetch(apiURL + "/wiim-full-history", {
            method: "POST",
            headers,
            body: payload,
          });

          if (wiimRes.ok) {
            result.news = await wiimRes.json();
          }
        } catch {
          result.news = [];
        }
      })()
    );
  }

  // Execute all fetches in parallel
  await Promise.all(fetchPromises);

  return new Response(JSON.stringify(result));
};
