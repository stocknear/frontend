import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;

  if (!["Plus", "Pro"]?.includes(user?.tier)) {
    return new Response(
      JSON.stringify({
        error:
          "This feature is available exclusively for Subscribers. Please upgrade your plan to access financial summaries.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const costOfCredit = 4;

  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This summary would cost ${costOfCredit} credits. Credits are reset at the start of each month.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = await request.json();
  const postData = {
    ticker: data?.ticker,
  };

  try {
    const response = await fetch(apiURL + "/financial-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Upstream error:", errText);
      return new Response(errText, { status: response.status });
    }

    const result = await response.json();

    // Deduct credits after successful response
    await pb?.collection("users")?.update(user?.id, {
      credits: user?.credits - costOfCredit,
    });

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate summary" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
