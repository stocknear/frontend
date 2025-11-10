import { convertToSlug } from "$lib/utils";

// Static pages with optimized priority and changefreq settings for financial platform
const pages = [
  // Core platform pages - Highest priority
  { title: "/", priority: 1.0, changefreq: "daily" },
  { title: "/stocks", priority: 0.95, changefreq: "daily" },
  { title: "/etf", priority: 0.95, changefreq: "daily" },
  { title: "/stock-screener", priority: 0.9, changefreq: "daily" },
  { title: "/options-screener", priority: 0.9, changefreq: "daily" },
  
  // Real-time data pages - High priority, frequent updates
  { title: "/market-news", priority: 0.9, changefreq: "hourly" },
  { title: "/options-flow", priority: 0.85, changefreq: "hourly" },
  { title: "/dark-pool-flow", priority: 0.85, changefreq: "hourly" },
  { title: "/market-flow", priority: 0.85, changefreq: "hourly" },
  { title: "/heatmap", priority: 0.8, changefreq: "hourly" },
  
  // Analysis and research tools - High priority
  { title: "/chat", priority: 0.9, changefreq: "weekly" },
  { title: "/compare", priority: 0.8, changefreq: "weekly" },
  { title: "/backtesting", priority: 0.85, changefreq: "weekly" },
  
  // Financial calendars - High priority for investors
  { title: "/earnings-calendar", priority: 0.85, changefreq: "daily" },
  { title: "/economic-calendar", priority: 0.8, changefreq: "daily" },
  { title: "/dividends-calendar", priority: 0.75, changefreq: "daily" },
  
  // Tracking and analytics - Medium-high priority
  { title: "/insider-tracker", priority: 0.8, changefreq: "daily" },
  { title: "/politicians", priority: 0.75, changefreq: "daily" },
  { title: "/analysts", priority: 0.75, changefreq: "daily" },
  { title: "/hedge-funds", priority: 0.75, changefreq: "weekly" },
  { title: "/ipos", priority: 0.7, changefreq: "daily" },
  { title: "/reddit-tracker", priority: 0.65, changefreq: "hourly" },
  
  // Educational and tools - Medium priority
  { title: "/blog", priority: 0.75, changefreq: "daily" },
  { title: "/learning-center", priority: 0.7, changefreq: "weekly" },
  { title: "/options-calculator", priority: 0.65, changefreq: "monthly" },
  // Market movers - high priority, frequent updates
  { title: "/market-mover/gainers", priority: 0.8, changefreq: "hourly" },
  { title: "/market-mover/losers", priority: 0.8, changefreq: "hourly" },
  { title: "/market-mover/active", priority: 0.8, changefreq: "hourly" },
  { title: "/market-mover/premarket/gainers", priority: 0.7, changefreq: "hourly" },
  { title: "/market-mover/premarket/losers", priority: 0.7, changefreq: "hourly" },
  { title: "/market-mover/afterhours/gainers", priority: 0.7, changefreq: "hourly" },
  { title: "/market-mover/afterhours/losers", priority: 0.7, changefreq: "hourly" },
  // Lists - medium priority
  { title: "/list", priority: 0.6, changefreq: "weekly" },
  { title: "/list/most-shorted-stocks", priority: 0.7, changefreq: "daily" },
  { title: "/list/monthly-dividend-stocks", priority: 0.6, changefreq: "monthly" },
  { title: "/list/dividend/dividend-kings", priority: 0.6, changefreq: "monthly" },
  { title: "/list/dividend/dividend-aristocrats", priority: 0.6, changefreq: "monthly" },
  { title: "/list/magnificent-seven", priority: 0.7, changefreq: "daily" },
  { title: "/list/most-buybacks", priority: 0.6, changefreq: "weekly" },
  { title: "/list/market-cap/mega-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { title: "/list/market-cap/large-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { title: "/list/market-cap/mid-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { title: "/list/market-cap/small-cap-stocks", priority: 0.6, changefreq: "weekly" },
  { title: "/list/market-cap/micro-cap-stocks", priority: 0.5, changefreq: "weekly" },
  { title: "/list/market-cap/nano-cap-stocks", priority: 0.5, changefreq: "weekly" },
  { title: "/list/highest-open-interest", priority: 0.6, changefreq: "daily" },
  { title: "/list/highest-open-interest-change", priority: 0.6, changefreq: "daily" },
  { title: "/list/highest-option-iv-rank", priority: 0.6, changefreq: "daily" },
  { title: "/list/highest-option-premium", priority: 0.6, changefreq: "daily" },
  { title: "/list/bitcoin-etfs", priority: 0.6, changefreq: "daily" },
  // Industry pages
  { title: "/industry", priority: 0.6, changefreq: "weekly" },
  { title: "/industry/sectors", priority: 0.6, changefreq: "weekly" },
  { title: "/industry/all", priority: 0.5, changefreq: "weekly" },
  // ETF pages
  { title: "/etf/etf-providers", priority: 0.6, changefreq: "monthly" },
  { title: "/etf/new-launches", priority: 0.7, changefreq: "weekly" },
  // User pages - lower priority
  { title: "/login", priority: 0.3, changefreq: "yearly" },
  { title: "/register", priority: 0.3, changefreq: "yearly" },
  { title: "/watchlist/stocks", priority: 0.4, changefreq: "weekly" },
  { title: "/watchlist/options", priority: 0.4, changefreq: "weekly" },
  { title: "/price-alert", priority: 0.5, changefreq: "monthly" },
  { title: "/newsletter", priority: 0.5, changefreq: "monthly" },
  // Info pages - lowest priority
  { title: "/pricing", priority: 0.4, changefreq: "monthly" },
  { title: "/terms-of-use", priority: 0.2, changefreq: "yearly" },
  { title: "/privacy-policy", priority: 0.2, changefreq: "yearly" },
  { title: "/data-disclaimer", priority: 0.2, changefreq: "yearly" },
  { title: "/imprint", priority: 0.2, changefreq: "yearly" },
  { title: "/about", priority: 0.3, changefreq: "monthly" },
  { title: "/contact", priority: 0.3, changefreq: "yearly" },
  { title: "/faq", priority: 0.4, changefreq: "monthly" },
  { title: "/advertise", priority: 0.3, changefreq: "monthly" },
  { title: "/affiliate-program", priority: 0.3, changefreq: "monthly" },
  // Special trackers
  { title: "/potus-tracker", priority: 0.6, changefreq: "daily" },
  // Sub-pages and specialized tools
  { title: "/market-news/general", priority: 0.7, changefreq: "hourly" },
  { title: "/ipos/news", priority: 0.65, changefreq: "daily" },
  { title: "/ipos/statistics", priority: 0.6, changefreq: "weekly" },
  { title: "/politicians/flow-data", priority: 0.6, changefreq: "daily" },
  { title: "/analysts/top-stocks", priority: 0.65, changefreq: "daily" },
  { title: "/analysts/analyst-flow", priority: 0.65, changefreq: "daily" },
  
  // FAQ and AI Agents - Important for user guidance
  { title: "/faq", priority: 0.5, changefreq: "monthly" },
  { title: "/faq/ai-agents", priority: 0.6, changefreq: "monthly" },
  
  // Market-cap and sector analysis pages
  { title: "/list/market-cap/mega-cap-stocks", priority: 0.65, changefreq: "weekly" },
  { title: "/list/market-cap/large-cap-stocks", priority: 0.65, changefreq: "weekly" },
  { title: "/list/dividend/dividend-aristocrats", priority: 0.7, changefreq: "monthly" },
  { title: "/list/dividend/dividend-kings", priority: 0.7, changefreq: "monthly" },
  
  // Popular ETF and crypto lists
  { title: "/list/bitcoin-etfs", priority: 0.7, changefreq: "daily" },
  { title: "/list/ethereum-etfs", priority: 0.65, changefreq: "daily" },
  { title: "/list/crypto-etfs", priority: 0.65, changefreq: "daily" },
  
  // High-interest stock lists
  { title: "/list/magnificent-seven", priority: 0.8, changefreq: "daily" },
  { title: "/list/most-shorted-stocks", priority: 0.75, changefreq: "daily" },
  { title: "/list/penny-stocks", priority: 0.7, changefreq: "daily" },
  { title: "/list/overbought-stocks", priority: 0.65, changefreq: "daily" },
  { title: "/list/oversold-stocks", priority: 0.65, changefreq: "daily" },
];

const website = "https://stocknear.com";

// Helper to format date to ISO 8601 format for lastmod
function formatLastmod(dateInput) {
  if (!dateInput) return "";
  
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  
  return date.toISOString();
}

// Escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Create URL element with all proper tags
const createUrlElement = (loc, { lastmod, changefreq, priority, images = [] } = {}) => {
  const lastmodTag = lastmod ? `    <lastmod>${formatLastmod(lastmod)}</lastmod>` : "";
  const changefreqTag = changefreq ? `    <changefreq>${changefreq}</changefreq>` : "";
  const priorityTag = priority !== undefined ? `    <priority>${priority}</priority>` : "";
  
  // Add image sitemap entries if images are provided
  const imageTags = images.length > 0 
    ? images.map(img => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      ${img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : ""}
      ${img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : ""}
    </image:image>`).join("")
    : "";

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmodTag}
${changefreqTag}
${priorityTag}${imageTags}
  </url>`;
};

// Create a sitemap index for multiple sitemaps (useful for large sites)
const createSitemapIndex = (sitemaps) => {
  const entries = sitemaps.map(sitemap => `  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>
    ${sitemap.lastmod ? `<lastmod>${formatLastmod(sitemap.lastmod)}</lastmod>` : ""}
  </sitemap>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, setHeaders, url }) {
  const { apiKey, apiURL, pb } = locals;
  
  try {
    // Set optimized cache headers for better SEO performance
    setHeaders({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min client, 1hr CDN - better for real-time data
      'X-Robots-Tag': 'noindex, nofollow', // Prevent sitemap from being indexed but allow following
      'Vary': 'Accept-Encoding',
      'ETag': `"sitemap-${Date.now()}"` // Better cache validation
    });

    // Check if this is a specific sitemap request
    const sitemapType = url.searchParams.get('type');
    
    // For very large sites, consider splitting sitemaps
    if (sitemapType) {
      return handleSpecificSitemap(sitemapType, locals);
    }

    // Fetch all data in parallel for better performance
    const [stocksResponse, articles, tutorials] = await Promise.all([
      fetch(`${apiURL}/full-searchbar`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey
        }
      }).then(res => res.json()).catch(() => []),
      pb.collection("articles").getFullList({ 
        sort: "-updated",
        fields: "id,title,slug,created,updated,image,excerpt" 
      }).catch(() => []),
      pb.collection("tutorials").getFullList({ 
        sort: "-updated",
        fields: "id,title,slug,created,updated,image,description" 
      }).catch(() => [])
    ]);

    // Process stocks with error handling
    const stocks = stocksResponse?.map(item => ({ 
      id: item?.symbol, 
      type: item?.type,
      lastUpdated: item?.lastUpdated || new Date()
    })) || [];

    // Generate sitemap
    const body = generateMainSitemap(stocks, articles, tutorials);
    
    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': String(new TextEncoder().encode(body).length)
      }
    });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return a minimal sitemap on error
    return new Response(generateErrorSitemap(), {
      headers: { 'Content-Type': 'application/xml' },
      status: 500
    });
  }
}

// Handle specific sitemap types for large sites
async function handleSpecificSitemap(type, locals) {
  // Implementation for specific sitemap types
  // This is useful when you have thousands of URLs
  switch(type) {
    case 'stocks':
      return generateStocksSitemap(locals);
    case 'articles':
      return generateArticlesSitemap(locals);
    case 'static':
      return generateStaticSitemap();
    default:
      return new Response('Sitemap not found', { status: 404 });
  }
}

// Main sitemap generator
const generateMainSitemap = (stocks, articles, tutorials) => {
  const currentDate = new Date();
  
  // Limit stocks to prevent sitemap from becoming too large (Google recommends max 50,000 URLs)
  const limitedStocks = stocks.slice(0, 10000);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${pages.map(page => {
    const loc = `${website}${page.title}`;
    return createUrlElement(loc, {
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: currentDate // You might want to track actual last modification
    });
  }).join("\n")}
${articles.map(item => {
    const loc = `${website}/blog/article/${item?.slug || convertToSlug(item?.title)}`;
    const images = item?.image ? [{
      loc: `${website}/images/articles/${item.image}`,
      title: item.title,
      caption: item.excerpt || item.title
    }] : [];
    
    return createUrlElement(loc, {
      lastmod: item.updated || item.created,
      changefreq: "weekly",
      priority: 0.7,
      images
    });
  }).join("\n")}
${tutorials.map(item => {
    const loc = `${website}/learning-center/article/${item?.slug || convertToSlug(item?.title)}`;
    const images = item?.image ? [{
      loc: `${website}/images/tutorials/${item.image}`,
      title: item.title,
      caption: item.description || item.title
    }] : [];
    
    return createUrlElement(loc, {
      lastmod: item.updated || item.created,
      changefreq: "monthly",
      priority: 0.6,
      images
    });
  }).join("\n")}
${limitedStocks.map(ticker => {
    const basePath = ticker.type === "Stock"
      ? "/stocks/"
      : ticker.type === "ETF"
      ? "/etf/"
      : "/index/";
    
    // Stocks and ETFs should have different priorities
    const priority = ticker.type === "Stock" ? 0.8 : ticker.type === "ETF" ? 0.7 : 0.6;
    
    return createUrlElement(`${website}${basePath}${ticker.id}`, {
      lastmod: ticker.lastUpdated,
      changefreq: "daily",
      priority
    });
  }).join("\n")}
</urlset>`;
};

// Generate error sitemap with just essential pages
const generateErrorSitemap = () => {
  const essentialPages = [
    { loc: website, priority: 1.0 },
    { loc: `${website}/stocks`, priority: 0.9 },
    { loc: `${website}/etf`, priority: 0.9 },
    { loc: `${website}/market-news`, priority: 0.8 },
    { loc: `${website}/blog`, priority: 0.7 }
  ];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${essentialPages.map(page => createUrlElement(page.loc, { priority: page.priority })).join("\n")}
</urlset>`;
};

// For very large sites, you might want to implement separate sitemap endpoints:
async function generateStocksSitemap(locals) {
  // Implementation for stocks-only sitemap
  // This would be accessible at /sitemap-stocks.xml
}

async function generateArticlesSitemap(locals) {
  // Implementation for articles-only sitemap
  // This would be accessible at /sitemap-articles.xml
}

async function generateStaticSitemap() {
  // Implementation for static pages sitemap
  // This would be accessible at /sitemap-static.xml
}

// Note: If you need to reference sitemap URLs elsewhere (like in robots.txt),
// create a separate config file: src/lib/config/sitemap.js
// Example:
// export const sitemapUrls = [
//   `${website}/sitemap.xml`,
//   `${website}/sitemap-stocks.xml`,
//   `${website}/sitemap-articles.xml`,
// ];