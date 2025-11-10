import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, locals }) => {
  // For GET requests, use default tickers for demo
  const defaultTickers = ['AAPL', 'GOOGL', 'MSFT'];
  const timePeriod = 'one-day';
  const { apiURL, apiKey } = locals;

  try {
    const fetchPromises = defaultTickers.map(async (ticker: string) => {
      const [quoteResponse, priceResponse] = await Promise.all([
        fetch(apiURL + "/stock-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey
          },
          body: JSON.stringify({ ticker })
        }),
        fetch(apiURL + "/one-day-price", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey
          },
          body: JSON.stringify({ ticker })
        })
      ]);

      const [quote, priceData] = await Promise.all([
        quoteResponse.json(),
        priceResponse.json()
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
  const { apiURL, apiKey } = locals;

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
      // Fetch both quote and price data for each ticker
      const [quoteResponse, priceResponse] = await Promise.all([
        fetch(apiURL + "/stock-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey
          },
          body: JSON.stringify({ ticker })
        }),
        // Fetch price data based on time period
        timePeriod === 'one-day' 
          ? fetch(apiURL + "/one-day-price", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey
              },
              body: JSON.stringify({ ticker })
            })
          : fetch(apiURL + "/historical-price", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey
              },
              body: JSON.stringify({ ticker, timePeriod })
            })
      ]);

      const [quote, priceData] = await Promise.all([
        quoteResponse.json(),
        priceResponse.json()
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
