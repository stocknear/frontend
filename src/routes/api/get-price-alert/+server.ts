import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const { apiURL, apiKey, user } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ data: [], news: [], earnings: [] }),
    );
  }

  const postData = { userId: user?.id };
  const response = await fetch(apiURL + "/get-price-alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  let output = await response.json();

  output.data = (output?.data || [])
    ?.map((item) => ({
      ...item,
      hasNote: Boolean(item?.note && String(item.note)?.trim()?.length > 0),
    }))
    ?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));

  return new Response(JSON.stringify(output));
};
