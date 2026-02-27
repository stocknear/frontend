import type { RequestHandler } from "./$types";

// Server-side credit costs - DO NOT trust client-provided values
const BULK_DOWNLOAD_CREDIT_COSTS: Record<string, number> = {
  "Stock Price": 1,
  "Dividends": 1,
  "Options": 1,
  "Dark Pool": 1,
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  const data = await request.json();
  const tickers = data?.tickers;
  const bulkData = data?.bulkData;

  // Validate inputs
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return new Response(JSON.stringify({ error: "No tickers provided" }), { status: 400 });
  }

  if (!Array.isArray(bulkData) || bulkData.length === 0) {
    return new Response(JSON.stringify({ error: "No bulk data items provided" }), { status: 400 });
  }


  let selectedCredits = 0;
  for (const item of bulkData) {
    if (item?.selected === true) {
      const itemName = item?.name;
      const serverCreditCost = BULK_DOWNLOAD_CREDIT_COSTS[itemName];

      // Reject unknown item names to prevent manipulation
      if (serverCreditCost === undefined) {
        return new Response(
          JSON.stringify({ error: `Unknown bulk download item: ${itemName}` }),
          { status: 400 }
        );
      }

      selectedCredits += serverCreditCost;
    }
  }

  const totalCreditCost = tickers.length * selectedCredits;

  // Check if user has enough credits
  if (user?.credits < totalCreditCost) {
    return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 400 });
  }

  const postData = { tickers, bulkData };
  const response = await fetch(apiURL + "/bulk-download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  // Deduct credits after a successful request
  await pb.collection('users').update(user?.id, {
    'credits': user?.credits - totalCreditCost
  });

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/zip")) {
    // If the backend returned a zip file, forward the binary response
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=bulk_data.zip"
      }
    });
  } else {
    // Otherwise, assume a JSON response
    const json = await response.json();
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
