import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;

  if (user?.tier !== "Pro") {
    return new Response(
      JSON.stringify({
        error: "This feature is available exclusively for Pro members.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const costOfCredit = 2;

  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. Your prompt would cost ${costOfCredit} credits. Credits are reset at the start of each month.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await request.json();
  const postData = { optionsData: data?.optionsData };

  try {
    const response = await fetch(apiURL + "/options-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      console.error("Upstream error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to analyze options flow. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();

    // Check for error in response
    if (result.error) {
      return new Response(JSON.stringify(result), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Deduct credits on successful response
    await pb?.collection("users")?.update(user?.id, {
      credits: user?.credits - costOfCredit,
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to get options insight" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
