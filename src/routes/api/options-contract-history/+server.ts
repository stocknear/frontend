import type { RequestHandler } from "./$types";

// Parse option symbol to extract components (server-side version)
// The \^? allows for optional "^" prefix for index tickers like ^SPX
function parseOptionSymbol(optionSymbol: string) {
  const match = optionSymbol.match(/^(\^?[A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) return null;

  const [, ticker, datePart, optionTypeChar, strikeStr] = match;

  // Parse and format the expiration date
  const year = (parseInt(datePart.slice(0, 2), 10) + 2000).toString();
  const month = datePart.slice(2, 4);
  const day = datePart.slice(4, 6);
  const dateExpiration = `${year}-${month}-${day}`;

  const optionType = optionTypeChar === "C" ? "Call" : "Put";
  const strikePrice = parseInt(strikeStr, 10) / 1000;

  return { ticker, dateExpiration, optionType, strikePrice };
}

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  const ticker = data?.ticker;
  const contract = data?.contract;

  if (!ticker || !contract) {
    return new Response(
      JSON.stringify({ error: "Missing ticker or contract parameter." }),
      { status: 400 }
    );
  }

  // Pro users get full access
  if (user?.tier === "Pro") {
    const postData = { ticker, contract };
    const response = await fetch(apiURL + "/options-contract-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();
    return new Response(JSON.stringify(output));
  }

  // For non-Pro users, validate that this is the first expiration date contract
  const parsed = parseOptionSymbol(contract);
  if (!parsed) {
    return new Response(
      JSON.stringify({ error: "Invalid contract format." }),
      { status: 400 }
    );
  }

  // Fetch the option chain summary to determine first expiration date
  const summaryResponse = await fetch(apiURL + "/contract-lookup-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ ticker }),
  });

  if (!summaryResponse.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to validate contract access." }),
      { status: 500 }
    );
  }

  const optionChain = await summaryResponse.json();
  const optionTypeData = optionChain?.[parsed.optionType];

  if (!optionTypeData || typeof optionTypeData !== "object") {
    return new Response(
      JSON.stringify({ error: "Option data not available." }),
      { status: 400 }
    );
  }

  // Get the first expiration date for this option type
  const expirationDates = Object.keys(optionTypeData);
  const firstExpirationDate = expirationDates[0];

  // Check if the requested contract uses the first expiration date
  if (parsed.dateExpiration !== firstExpirationDate) {
    return new Response(
      JSON.stringify({
        error: "Access denied. Please upgrade to Pro tier to access additional expiration dates.",
      }),
      { status: 403 }
    );
  }

  // First expiration date is allowed for all users
  const postData = { ticker, contract };
  const response = await fetch(apiURL + "/options-contract-history", {
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
