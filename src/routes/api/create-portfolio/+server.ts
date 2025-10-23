import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;
  const data = await request.json();
  let output;

  // For non-Pro users, ensure they can only have 1 portfolio.
  if (!['Pro', 'Plus']?.includes(user?.tier)) {
    // Get the current portfolios for the user.
    const existingPortfolios = await pb.collection("portfolio").getFullList({
      filter: `user="${user.id}"`
    });

    // If the user already has a portfolio, return an error response.
    if (existingPortfolios.length >= 1) {
      return new Response(
        JSON.stringify({ error: "Upgrade your account to unlock unlimited portfolios." }),
        { status: 403 }
      );
    }
  }

  // Ensure ticker is properly formatted as an array
  if (data.ticker) {
    if (typeof data.ticker === 'string') {
      try {
        data.ticker = JSON.parse(data.ticker);
      } catch (e) {
        data.ticker = [];
      }
    }
    // Ensure it's an array, default to empty array if not
    if (!Array.isArray(data.ticker)) {
      data.ticker = [];
    }
  } else {
    data.ticker = [];
  }

  // If the user is Pro/Plus or doesn't have a portfolio yet, attempt to create one.
  try {
    output = await pb.collection("portfolio").create(data);
  } catch (err) {
    console.error("Failed to create portfolio:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create portfolio" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify(output));
};
