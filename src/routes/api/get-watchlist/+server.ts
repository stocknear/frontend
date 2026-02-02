import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb, apiURL, apiKey } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 }
    );
  }

  const watchListId = data?.watchListId;

  try {
    const watchlist = await pb.collection("watchlist").getOne(watchListId);
    if (watchlist.user !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403 }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Watchlist not found" }),
      { status: 404 }
    );
  }

  const postData = { watchListId, ruleOfList: data?.ruleOfList };
  const response = await fetch(apiURL + "/get-watchlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const output = await response.json();

  return new Response(JSON.stringify(output));
};
