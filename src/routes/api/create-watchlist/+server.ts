import type { RequestHandler } from "./$types";

// Security: Validate title to prevent XSS and limit size
const MAX_TITLE_LENGTH = 100;
const sanitizeTitle = (title: unknown): string => {
  if (typeof title !== "string") return "Watchlist";
  return title.slice(0, MAX_TITLE_LENGTH).trim() || "Watchlist";
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;

  // Security: Check authentication
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
    // Security: Only allow specific fields, use server-side user ID
    const createData = {
      title: sanitizeTitle(data?.title),
      ticker: [] as Array<{ symbol: string; note: string; addedPrice: null }>,
      user: user.id, // Security: Always use authenticated user ID from server, never trust client
    };

    // Ensure ticker is in new object format if provided
    if (data?.ticker && Array.isArray(data.ticker)) {
      // Convert string array to object array if needed
      if (data.ticker.length > 0 && typeof data.ticker[0] === "string") {
        createData.ticker = data.ticker.map((symbol: string) => ({
          symbol: String(symbol).slice(0, 20), // Limit symbol length
          note: "",
          addedPrice: null,
        }));
      }
    }

    output = await pb.collection("watchlist").create(createData);
  } catch (err) {
    // Optionally, log the error or adjust the error message as needed.
    output = { error: "Failed to create watchlist" };
  }

  return new Response(JSON.stringify(output));
};
