/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, setHeaders }) {
  const { apiKey, apiURL } = locals;
  
  try {
    setHeaders({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200', // Longer cache for stocks sitemap
      'X-Robots-Tag': 'noindex, nofollow'
    });

    // Fetch stock data
    const stocksResponse = await fetch(`${apiURL}/full-searchbar`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      }
    }).then(res => res.json()).catch(() => []);

    const stocks = stocksResponse?.map(item => ({ 
      symbol: item?.symbol, 
      type: item?.type,
      lastUpdated: item?.lastUpdated || new Date()
    })) || [];

    const website = "https://stocknear.com";
    const currentDate = new Date().toISOString();
    
    // Limit to prevent oversized sitemaps (Google limit: 50,000 URLs)
    const limitedStocks = stocks.slice(0, 25000);

    const stockUrls = limitedStocks.map(ticker => {
      const basePath = ticker.type === "Stock"
        ? "/stocks/"
        : ticker.type === "ETF"
        ? "/etf/"
        : "/index/";
      
      const priority = ticker.type === "Stock" ? 0.8 : ticker.type === "ETF" ? 0.75 : 0.7;
      const lastmod = ticker.lastUpdated ? new Date(ticker.lastUpdated).toISOString() : currentDate;
      
      return `  <url>
    <loc>${website}${basePath}${ticker.symbol}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${stockUrls}
</urlset>`;

    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': String(new TextEncoder().encode(body).length)
      }
    });

  } catch (error) {
    console.error('Stocks sitemap generation error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      status: 500
    });
  }
}