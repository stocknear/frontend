import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;

  if (!["Plus", "Pro"]?.includes(user?.tier)) {
    return new Response(
      JSON.stringify({
        error:
          "This feature is available exclusively for Subscribers. Please upgrade your plan to access portfolio analysis.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const costOfCredit = 3;

  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This analysis costs ${costOfCredit} credits. Credits are reset at the start of each month.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = await request.json();
  const { portfolioId, holdings } = data;

  if (!portfolioId) {
    return new Response(
      JSON.stringify({ error: "Portfolio ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!holdings || !Array.isArray(holdings) || holdings?.length === 0) {
    return new Response(
      JSON.stringify({ error: "Holdings are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const postData = {
    portfolioId,
    holdings,
  };

  try {
    const response = await fetch(apiURL + "/portfolio-summary", {
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

    // Check if result contains an error
    if (result?.error) {
      return new Response(JSON.stringify(result), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save result to PocketBase portfolio record
    try {
      const summaryData = {
        ...result,
        date: new Date().toISOString(),
      };
      await pb?.collection("portfolio")?.update(portfolioId, {
        bullBear: JSON.stringify(summaryData),
      });
    } catch (saveErr) {
      console.error("Failed to save summary to PocketBase:", saveErr);
      // Continue even if save fails - user still gets the result
    }

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
      JSON.stringify({ error: "Failed to generate portfolio analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
