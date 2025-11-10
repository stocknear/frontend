import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;
  

  const data = await request.json();
  const tickers = data?.tickers; // tickers assumed to be an array
  let bulkData = data?.bulkData;
    const totalCreditCost =
      tickers?.length *
      bulkData?.reduce((sum, item) => {
        return item.selected ? sum + item.credit : sum;
      }, 0);

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
