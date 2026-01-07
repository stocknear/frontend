import type { RequestHandler } from "./$types";
import { calculateIntradayExportCredits } from "$lib/utils";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user, pb } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startDate = data?.startDate;
  const endDate = data?.endDate;

  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ error: "Missing date range." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const creditCost = calculateIntradayExportCredits(startDate, endDate);
  if (user?.credits < creditCost) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This export costs ${creditCost} credits.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const postData = {
    ticker: data?.ticker,
    startDate,
    endDate,
    interval: data?.interval ?? "15min",
  };

  const response = await fetch(apiURL + "/historical-price-interval-export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
      },
    });
  }

  const contentDisposition =
    response.headers.get("Content-Disposition") ?? "";
  const contentType = response.headers.get("Content-Type") ?? "text/csv";
  const payload = await response.arrayBuffer();

  try {
    await pb?.collection("users")?.update(user?.id, {
      credits: user?.credits - creditCost,
    });
  } catch (error) {
    console.error("Failed to deduct credits:", error);
  }

  return new Response(payload, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
};
