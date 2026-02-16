import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const GET: RequestHandler = async ({ locals }) => {
  // For GET requests, use default tickers for demo
  const defaultTickers = ['AAPL', 'GOOGL', 'MSFT'];

  try {
    const fetchPromises = defaultTickers.map(async (ticker: string) => {
      const [quote, priceData] = await Promise.all([
        postAPI(locals, "/stock-quote", { ticker }),
        postAPI(locals, "/one-day-price", { ticker }),
      ]);

      return {
        ticker,
        quote,
        priceData,
        timePeriod: 'one-day'
      };
    });

    const results = await Promise.all(fetchPromises);
    return new Response(JSON.stringify(results));
  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data" }),
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();

  const tickerList = data?.tickerList;
  const timePeriod = data?.timePeriod || 'one-day';

  if (!tickerList || tickerList.length === 0) {
    return new Response(
      JSON.stringify({ error: "No ticker list provided" }),
      { status: 400 }
    );
  }

  try {
    const fetchPromises = tickerList.map(async (ticker: string) => {
      const [quote, priceData] = await Promise.all([
        postAPI(locals, "/stock-quote", { ticker }),
        timePeriod === 'one-day'
          ? postAPI(locals, "/one-day-price", { ticker })
          : postAPI(locals, "/historical-price", { ticker, timePeriod }),
      ]);

      return {
        ticker,
        quote,
        priceData,
        timePeriod
      };
    });

    const results = await Promise.all(fetchPromises);
    return new Response(JSON.stringify(results));
  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data" }),
      { status: 500 }
    );
  }
};
