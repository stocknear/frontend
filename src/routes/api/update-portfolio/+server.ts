import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;
  const data = await request.json();

  // `tickerInput` can be a string (single ticker) or an array (list of tickers)
  const tickerInput = data?.ticker || [];
  const listId = data?.listId;
  let output;


  const isSubscribed = user?.tier === "Pro" || user?.tier === "Plus";
  const tickerLimit = user?.tier === "Pro" ? 300 : user?.tier === 'Plus' ? 100 : 5;

  try {
    const portfolio = await pb.collection("portfolio").getOne(listId);
    // Ensure current tickers are in an array.
    let currentTickers = portfolio?.map(item => item?.symbol) || [];
    if (typeof currentTickers === "string") {
      try {
        currentTickers = JSON.parse(currentTickers);
      } catch (err) {
        currentTickers = [];
      }
    }
    currentTickers = currentTickers || [];

    if (Array.isArray(tickerInput)) {
      // When replacing the entire ticker list:
      if(data?.mode === 'delete') {
         output = await pb.collection("portfolio").update(listId, {
        ticker: tickerInput,
      });

      } else {

         if (tickerInput.length > tickerLimit) {
        return new Response(
          JSON.stringify({
            error: isSubscribed
              ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
              : `Want to add more stocks? Go Plus or Pro!`,
          }),
          { status: 403 }
        );
      }
      
      output = await pb.collection("portfolio").update(listId, {
        ticker: tickerInput,
      });

      
      }
     
    } else {
      // Single ticker update.
      if (currentTickers?.includes(tickerInput)) {
        // Remove the ticker if it's already present.
        const newTickerList = currentTickers?.filter((item) => item !== tickerInput);
        output = await pb.collection("portfolio").update(listId, { ticker: newTickerList });
      } else {
        // Add the ticker if not already present.
        const newTickerList = [...currentTickers, tickerInput];
        if (newTickerList.length > tickerLimit) {
          return new Response(
            JSON.stringify({
              error: isSubscribed
                ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
                : `Want to add more stocks? Go Plus or Pro!`,
            }),
            { status: 403 }
          );
        }
        output = await pb.collection("portfolio").update(listId, { ticker: newTickerList });
      }
    }
  } catch (e) {
    // If the portfolio doesn't exist, create a new one.
    const tickersArray = Array.isArray(tickerInput) ? tickerInput : [tickerInput];
    if (tickersArray.length > tickerLimit) {
      return new Response(
        JSON.stringify({
          error: isSubscribed
            ? `You can only have up to ${tickerLimit} stocks in your portfolio.`
            : `Want to add more stocks? Go Plus or Pro!`,
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
