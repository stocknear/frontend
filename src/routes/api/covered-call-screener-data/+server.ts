import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  const subscriber = user?.tier === "Pro" ? "Pro" : "Free";
  const postData = { selectedDates: data?.selectedDates, subscriber };

  const response = await fetch(apiURL + "/covered-call-screener-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const output = await response?.json();

  return new Response(JSON.stringify(output));
};
