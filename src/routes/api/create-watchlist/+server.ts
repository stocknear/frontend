import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;
  const data = await request.json();
  let output;

  // For non-Pro users, ensure they can only have 1 watchlist.
  if (!['Pro','Plus']?.includes(user?.tier)) {
    // Get the current watchlists for the user.
    const existingWatchlists = await pb.collection("watchlist").getFullList({
      filter: `user="${user.id}"`
    });

    // If the user already has a watchlist, return an error response.
    if (existingWatchlists.length >= 1) {
      return new Response(
        JSON.stringify({ error: "Upgrade your account to unlock unlimited watchlists." }),
        { status: 403 }
      );
    }
  }

  // If the user is Pro or doesn't have a watchlist yet, attempt to create one.
  try {
    output = await pb.collection("watchlist").create(data);
  } catch (err) {
    // Optionally, log the error or adjust the error message as needed.
    output = { error: "Failed to create watchlist" };
  }

  return new Response(JSON.stringify(output));
};
