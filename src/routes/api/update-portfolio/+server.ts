import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;

  // Security: Check authentication
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  const data = await request.json();

  // `tickerInput` can be a string (single ticker) or an array (list of ticker objects)
  const tickerInput = data?.ticker || [];
  // Support both portfolioId and listId for backwards compatibility
  const portfolioId = data?.portfolioId || data?.listId;
  let output;


  const isSubscribed = user?.tier === "Pro" || user?.tier === "Plus";
  const tickerLimit = user?.tier === "Pro" ? 300 : user?.tier === 'Plus' ? 100 : 5;

  try {
    const portfolio = await pb.collection("portfolio").getOne(portfolioId);

    // Security: Verify user owns this watchlist (authorization check)
    if (portfolio?.user !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403 }
      );
    }

    // Ensure current tickers are in an array of objects with {symbol, shares, avgPrice}
    let currentTickers = portfolio?.ticker || [];
    if (typeof currentTickers === "string") {
      try {
        currentTickers = JSON.parse(currentTickers);
      } catch (err) {
        currentTickers = [];
      }
    }
    currentTickers = currentTickers || [];

    if (Array.isArray(tickerInput)) {
      // When replacing the entire ticker list (delete mode or bulk update):
      if(data?.mode === 'delete') {
         output = await pb.collection("portfolio").update(portfolioId, {
        ticker: tickerInput,
      });

      } else if (data?.mode === 'update') {
        // Update mode: Update the entire ticker array with new shares/avgPrice values
        output = await pb.collection("portfolio").update(portfolioId, {
          ticker: tickerInput,
        });
      } else {
        // Regular mode: Validate ticker limit
        if (tickerInput.length > tickerLimit) {
          return new Response(
            JSON.stringify({
              error: isSubscribed
                ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
                : `Upgrade your account to add more stocks!`,
            }),
            { status: 403 }
          );
        }

        output = await pb.collection("portfolio").update(portfolioId, {
          ticker: tickerInput,
        });
      }

    } else {
      // Single ticker update (add new ticker).
      const symbolExists = currentTickers?.some((item) => item?.symbol === tickerInput);

      if (symbolExists) {
        // Ticker already exists, don't add duplicate
        return new Response(
          JSON.stringify({
            error: "This symbol is already in your portfolio",
          }),
          { status: 400 }
        );
      } else {
        // Add the ticker as a new object with symbol, shares: null, avgPrice: null
        const newTickerList = [...currentTickers, { symbol: tickerInput, shares: null, avgPrice: null }];
        if (newTickerList.length > tickerLimit) {
          return new Response(
            JSON.stringify({
              error: isSubscribed
                ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
                : `Upgrade your account to add more stocks!`,
            }),
            { status: 403 }
          );
        }
        output = await pb.collection("portfolio").update(portfolioId, { ticker: newTickerList });
      }
    }
  } catch (e) {
    // If the portfolio doesn't exist, create a new one.
    const tickersArray = Array.isArray(tickerInput)
      ? tickerInput
      : [{ symbol: tickerInput, shares: null, avgPrice: null }];

    if (tickersArray.length > tickerLimit) {
      return new Response(
        JSON.stringify({
          error: isSubscribed
            ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
            : `Upgrade your account to add more stocks!`,
        }),
        { status: 403 }
      );
    }
    output = await pb.collection("portfolio").create(
      serialize({
        user: user?.id,
        ticker: JSON.stringify(tickersArray),
        title: "Holdings",
      })
    );
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
