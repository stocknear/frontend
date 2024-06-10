import { userRegion } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];
let apiURL;
userRegion.subscribe(value => {
if (usRegion.includes(value)) {
  apiURL = import.meta.env.VITE_USEAST_API_URL;
} else {
  apiURL = import.meta.env.VITE_EU_API_URL;
}
});


export const config = {
	runtime: 'nodejs20.x',
  };


const pages = [
    {title: "/"},
    {title: "/most-shorted-stocks"},
    {title: "/stocks"},
    {title: "/etf"},
    {title: "/crypto"},
    {title: "/etf/etf-providers"},
    {title: "/etf/new-launches"},
    {title: "/trending"},
    {title: "/price-alert"},
    {title: "/heatmaps"},
    {title: "/portfolio"},
    {title: "/newsletter"},
    {title: "/options-flow"},
    {title: "/options-zero-dte"},
    {title: "/ipos"},
    {title: "/list"},
    {title: "/list/mega-cap-stocks"},
    {title: "/list/large-cap-stocks"},
    {title: "/list/mid-cap-stocks"},
    {title: "/list/small-cap-stocks"},
    {title: "/list/micro-cap-stocks"},
    {title: "/list/nano-cap-stocks"},
    {title: "/list/nasdaq-stocks"},
    {title: "/list/nyse-stocks"},
    {title: "/list/xetra-stocks"},
    {title: "/list/nasdaq-100-stocks"},
    {title: "/list/dow-jones-stocks"},
    {title: "/list/sp-500-stocks"},
    {title: "/list/canadian-stocks-us"},
    {title: "/list/chinese-stocks-us"},
    {title: "/list/indian-stocks-us"},
    {title: "/list/japanese-stocks-us"},
    {title: "/list/german-stocks-us"},
    {title: "/list/israeli-stocks-us"},
    {title: "/list/uk-stocks-us"},
    {title: "/list/financial-sector"},
    {title: "/list/healthcare-sector"},
    {title: "/list/technology-sector"},
    {title: "/list/industrials-sector"},
    {title: "/list/energy-sector"},
    {title: "/list/utilities-sector"},
    {title: "/list/consumer-cyclical-sector"},
    {title: "/list/real-estate-sector"},
    {title: "/list/basic-materials-sector"},
    {title: "/list/communication-services-sector"},
    {title: "/list/consumer-defensive-sector"},
    {title: "/list/delisted-stocks"},
    {title: "/list/bitcoin-etfs"},
    {title: "/stock-screener"},
    {title: "/market-news"},
    {title: "/market-news/crypto"},
    {title: "/market-news/general"},
    {title: "/earnings-calendar"},
    {title: "/economic-calendar"},
    {title: "/dividends-calendar"},
    {title: "/stock-splits-calendar"},
    {title: "/market-mover"},
    {title: "/community"},
    {title: "/community/create-post"},
    {title: "/hedge-funds"},
    {title: "/login"},
    {title: "/register"},
    {title: "/watchlist"},
    {title: "/leaderboard"},
    {title: "/tournament-rules"},
    {title: "/pricing"},
    {title: "/terms-of-use"},
    {title: "/privacy-policy"},
    {title: "/imprint"},
    {title: "/about"},
    {title: "/contact"},
    {title: "/blog"},
    {title: "/politicians"},
    {title: "/politicians/new-trades"},
    {title: "/analysts"},
    {title: "/analysts/top-stocks"},
    
];

const site = "https://stocknear.com"
const website = "https://stocknear.com"


/** @type {import('./$types').RequestHandler} */
export async function GET({locals}) {


    //get all posts;

    const outputPost = await locals.pb.collection('posts').getFullList() ;

    const outputBlogPost = await locals.pb.collection('articles').getFullList() ;

    const posts = outputPost?.map(item => ({
        id: item.id,
    }));


    const articles = outputBlogPost?.map(item => ({
      id: item.id,
    }));


    const rawData = await fetch(apiURL+'/searchbar-data', {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      },
      });
  
    const outputStocks = await rawData.json();
    const stocks = outputStocks?.map(item => ({
          id: item?.symbol,
          type: item?.type
      }));
    


    const body = sitemap(posts, articles, stocks, pages);
    const response = new Response(body);
    response.headers.set('Cache-Control', 'max-age=0, s-maxage=3600');
    response.headers.set('Content-Type', 'application/xml');
    return response;
}

// Modified sitemap function
const sitemap = (posts, articles, stocks, pages) => `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="https://www.w3.org/1999/xhtml"
  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
  ${pages.map((page) => `
  <url>
    <loc>${website}${page.title}</loc>
  </url>
  `).join('')}
  ${stocks.map((ticker) => {
    // Determine the path based on the type of the ticker
    const path = ticker.type === 'Stock' ? '/stocks/' : ticker.type === 'ETF' ? '/etf/' : '/stocks/';
    return `
    <url>
      <loc>${website}${path}${ticker.id}</loc>
    </url>
    `;
  }).join('')}
  ${articles.map((article) => `
  <url>
    <loc>${website}/blog/article/${article.id}</loc>
  </url>
  `).join('')}
  ${posts.map((post) => `
  <url>
    <loc>${website}/community/post/${post.id}</loc>
  </url>
  `).join('')}
</urlset>`;