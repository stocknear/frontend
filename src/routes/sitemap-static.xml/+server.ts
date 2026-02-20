const website = "https://stocknear.com";

// All static pages - deduplicated, organized by priority
const pages = [
  // Core platform pages
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/stocks", priority: 0.95, changefreq: "daily" },
  { path: "/etf", priority: 0.95, changefreq: "daily" },
  { path: "/stock-screener", priority: 0.9, changefreq: "daily" },
  { path: "/options-screener", priority: 0.9, changefreq: "daily" },

  // Real-time data pages
  { path: "/market-news", priority: 0.9, changefreq: "hourly" },
  { path: "/market-news/general", priority: 0.7, changefreq: "hourly" },
  { path: "/news-flow", priority: 0.8, changefreq: "hourly" },
  { path: "/options-flow", priority: 0.85, changefreq: "hourly" },
  { path: "/unusual-order-flow", priority: 0.85, changefreq: "hourly" },
  { path: "/market-flow", priority: 0.85, changefreq: "hourly" },
  { path: "/heatmap", priority: 0.8, changefreq: "hourly" },

  // Analysis and research tools
  { path: "/compare", priority: 0.8, changefreq: "weekly" },
  { path: "/backtesting", priority: 0.85, changefreq: "weekly" },

  // Financial calendars
  { path: "/earnings-calendar", priority: 0.85, changefreq: "daily" },
  { path: "/economic-calendar", priority: 0.8, changefreq: "daily" },
  { path: "/dividends-calendar", priority: 0.75, changefreq: "daily" },

  // Tracking and analytics
  { path: "/insider-tracker", priority: 0.8, changefreq: "daily" },
  { path: "/politicians", priority: 0.75, changefreq: "daily" },
  { path: "/politicians/flow-data", priority: 0.6, changefreq: "daily" },
  { path: "/analysts", priority: 0.75, changefreq: "daily" },
  { path: "/analysts/top-stocks", priority: 0.65, changefreq: "daily" },
  { path: "/analysts/analyst-flow", priority: 0.65, changefreq: "daily" },
  { path: "/hedge-funds", priority: 0.75, changefreq: "weekly" },
  { path: "/reddit-tracker", priority: 0.65, changefreq: "hourly" },
  { path: "/potus-tracker", priority: 0.6, changefreq: "daily" },

  // IPOs
  { path: "/ipos", priority: 0.7, changefreq: "daily" },
  { path: "/ipos/news", priority: 0.65, changefreq: "daily" },
  { path: "/ipos/statistics", priority: 0.6, changefreq: "weekly" },

  // Market movers
  { path: "/market-mover/gainers", priority: 0.8, changefreq: "hourly" },
  { path: "/market-mover/losers", priority: 0.8, changefreq: "hourly" },
  { path: "/market-mover/active", priority: 0.8, changefreq: "hourly" },
  { path: "/market-mover/premarket/gainers", priority: 0.7, changefreq: "hourly" },
  { path: "/market-mover/premarket/losers", priority: 0.7, changefreq: "hourly" },
  { path: "/market-mover/afterhours/gainers", priority: 0.7, changefreq: "hourly" },
  { path: "/market-mover/afterhours/losers", priority: 0.7, changefreq: "hourly" },

  // Stock lists
  { path: "/list", priority: 0.6, changefreq: "weekly" },
  { path: "/list/magnificent-seven", priority: 0.8, changefreq: "daily" },
  { path: "/list/most-shorted-stocks", priority: 0.75, changefreq: "daily" },
  { path: "/list/penny-stocks", priority: 0.7, changefreq: "daily" },
  { path: "/list/overbought-stocks", priority: 0.65, changefreq: "daily" },
  { path: "/list/oversold-stocks", priority: 0.65, changefreq: "daily" },
  { path: "/list/most-buybacks", priority: 0.6, changefreq: "weekly" },
  { path: "/list/monthly-dividend-stocks", priority: 0.6, changefreq: "monthly" },
  { path: "/list/dividend-growth-stocks", priority: 0.65, changefreq: "daily" },
  { path: "/list/dividend/dividend-kings", priority: 0.7, changefreq: "monthly" },
  { path: "/list/dividend/dividend-aristocrats", priority: 0.7, changefreq: "monthly" },
  { path: "/list/market-cap/mega-cap-stocks", priority: 0.65, changefreq: "weekly" },
  { path: "/list/market-cap/large-cap-stocks", priority: 0.65, changefreq: "weekly" },
  { path: "/list/market-cap/mid-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { path: "/list/market-cap/small-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { path: "/list/market-cap/micro-cap-stocks", priority: 0.5, changefreq: "weekly" },
  { path: "/list/market-cap/nano-cap-stocks", priority: 0.5, changefreq: "weekly" },

  // Options lists
  { path: "/list/highest-open-interest", priority: 0.6, changefreq: "daily" },
  { path: "/list/highest-open-interest-change", priority: 0.6, changefreq: "daily" },
  { path: "/list/highest-option-iv-rank", priority: 0.6, changefreq: "daily" },
  { path: "/list/highest-option-premium", priority: 0.6, changefreq: "daily" },

  // Crypto/ETF lists
  { path: "/list/bitcoin-etfs", priority: 0.7, changefreq: "daily" },
  { path: "/list/ethereum-etfs", priority: 0.65, changefreq: "daily" },
  { path: "/list/crypto-etfs", priority: 0.65, changefreq: "daily" },

  // Industry and sector pages
  { path: "/industry", priority: 0.6, changefreq: "weekly" },
  { path: "/industry/sectors", priority: 0.6, changefreq: "weekly" },
  { path: "/industry/all", priority: 0.5, changefreq: "weekly" },

  // ETF pages
  { path: "/etf/etf-providers", priority: 0.6, changefreq: "monthly" },
  { path: "/etf/new-launches", priority: 0.7, changefreq: "weekly" },

  // Educational and tools
  { path: "/learning-center", priority: 0.75, changefreq: "weekly" },
  { path: "/options-calculator", priority: 0.65, changefreq: "monthly" },

  // Info pages
  { path: "/pricing", priority: 0.4, changefreq: "monthly" },
  { path: "/about", priority: 0.3, changefreq: "monthly" },
  { path: "/contact", priority: 0.3, changefreq: "yearly" },
  { path: "/faq", priority: 0.4, changefreq: "monthly" },
  { path: "/faq/ai-agents", priority: 0.5, changefreq: "monthly" },
  { path: "/newsletter", priority: 0.5, changefreq: "monthly" },
  { path: "/advertise", priority: 0.3, changefreq: "monthly" },
  { path: "/affiliate-program", priority: 0.3, changefreq: "monthly" },
  { path: "/price-alert", priority: 0.5, changefreq: "monthly" },
  { path: "/support", priority: 0.3, changefreq: "yearly" },

  // Legal pages
  { path: "/terms-of-use", priority: 0.2, changefreq: "yearly" },
  { path: "/privacy-policy", priority: 0.2, changefreq: "yearly" },
  { path: "/data-disclaimer", priority: 0.2, changefreq: "yearly" },
  { path: "/imprint", priority: 0.2, changefreq: "yearly" },
];

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ setHeaders }) {
  setHeaders({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=7200",
  });

  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${escapeXml(`${website}${page.path}`)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
