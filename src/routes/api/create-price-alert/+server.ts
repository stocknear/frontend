import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;
  const data = await request.json();

  if (user?.id) {

  
  // If the user is not Pro, check the current number of active price alerts.
  if (!["Pro","Plus"]?.includes(user?.tier)) {
    const totalAlerts = await pb.collection("priceAlert").getFullList({
      // Ensure the filter checks for a boolean false.
      filter: `user="${user?.id}" && triggered=false`
    });

    // If the user already has 3 or more active alerts, return an error.
    if (totalAlerts?.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Price alert limit reached for non-Pro users" }),
        { status: 403 }
      );
    }
  }

  // Prepare the new alert data.
  const newAlert = {
    user: user?.id,
    symbol: data['symbol']?.toUpperCase(),
    name: data['name'],
    assetType: data['assetType']?.toLowerCase(),
    targetPrice: Number(data['targetPrice']),
    condition: data['condition']?.toLowerCase(),
    priceWhenCreated: Number(data['priceWhenCreated']),
    triggered: false,
  };

  let output;
  try {
    output = await pb.collection("priceAlert").create(newAlert);
  } catch (err) {
    // Return an error response if the alert could not be created.
    return new Response(
      JSON.stringify({ error: "Error creating price alert" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify(output));

  }
  else {

      return new Response(
      JSON.stringify({ error: "Error creating price alert" }),
      { status: 500 }
    );

  }
};
