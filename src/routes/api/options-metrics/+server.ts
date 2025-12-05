import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey } = locals;

  const data = await request.json();
  const postData = { optionsData: data?.optionsData };

  try {
    const response = await fetch(apiURL + "/options-metrics", {
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
        JSON.stringify({ error: "Failed to calculate metrics." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();

    if (result.error) {
      return new Response(JSON.stringify(result), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to calculate metrics." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
