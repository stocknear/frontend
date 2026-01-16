import type { RequestHandler } from "./$types";

// Helper function to filter premium fields from hedge fund items
function filterPremiumFields(items: any[]): any[] {
  return items?.map((item) => ({
    ...item,
    winRate: null,
    performancePercentage3Year: null,
  })) ?? [];
}

export const GET: RequestHandler = async ({ locals, fetch }) => {
  const { apiURL, apiKey, user } = locals;
  const isPremium = ["Plus", "Pro"].includes(user?.tier);

  const response = await fetch(`${apiURL}/all-hedge-funds`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load hedge fund data." }),
      { status: response.status }
    );
  }

  let output = await response.json();

  // Filter premium data for non-Plus/Pro users
  if (!isPremium && Array.isArray(output)) {
    output = filterPremiumFields(output);
  }

  return new Response(JSON.stringify(output));
};
