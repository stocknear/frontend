import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const selectedDate = data?.selectedDate;
  const { apiURL, apiKey, user } = locals;
  let output;

  if (user?.tier === "Pro") {
    try {
      const postData = { date: selectedDate };
      const response = await fetch(apiURL + "/options-historical-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();
    } catch (e) {
      console.error(e);
      output = [];
    }
  } else {
    output = [];
  }

  return new Response(JSON.stringify(output));
};
