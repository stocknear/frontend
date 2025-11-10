/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, setHeaders }) {
  const { pb } = locals;
  
  try {
    setHeaders({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600', // Shorter cache for news content
      'X-Robots-Tag': 'noindex, nofollow'
    });

    // Fetch articles and tutorials in parallel
    const [articles, tutorials] = await Promise.all([
      pb.collection("articles").getFullList({ 
        sort: "-updated",
        fields: "id,title,slug,created,updated,image,excerpt",
        limit: 10000 // Reasonable limit for news content
      }).catch(() => []),
      pb.collection("tutorials").getFullList({ 
        sort: "-updated",
        fields: "id,title,slug,created,updated,image,description",
        limit: 5000 // Tutorials update less frequently
      }).catch(() => [])
    ]);

    const website = "https://stocknear.com";
    
    // Helper function to convert title to slug if needed
    const convertToSlug = (str) => {
      return str?.toLowerCase()
        ?.replace(/[^a-z0-9 -]/g, '')
        ?.replace(/\s+/g, '-')
        ?.replace(/-+/g, '-')
        ?.trim() || '';
    };

    // Generate article URLs
    const articleUrls = articles.map(item => {
      const slug = item?.slug || convertToSlug(item?.title);
      const loc = `${website}/blog/article/${slug}`;
      const lastmod = (item.updated || item.created) ? new Date(item.updated || item.created).toISOString() : '';
      
      // Include image information for better SEO
      const imageTag = item?.image 
        ? `
    <image:image>
      <image:loc>${website}/images/articles/${item.image}</image:loc>
      <image:title>${escapeXml(item.title)}</image:title>
      <image:caption>${escapeXml(item.excerpt || item.title)}</image:caption>
    </image:image>`
        : '';
      
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
    }).join("\n");

    // Generate tutorial URLs
    const tutorialUrls = tutorials.map(item => {
      const slug = item?.slug || convertToSlug(item?.title);
      const loc = `${website}/learning-center/article/${slug}`;
      const lastmod = (item.updated || item.created) ? new Date(item.updated || item.created).toISOString() : '';
      
      const imageTag = item?.image 
        ? `
    <image:image>
      <image:loc>${website}/images/tutorials/${item.image}</image:loc>
      <image:title>${escapeXml(item.title)}</image:title>
      <image:caption>${escapeXml(item.description || item.title)}</image:caption>
    </image:image>`
        : '';
      
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>${imageTag}
  </url>`;
    }).join("\n");

    // Helper function to escape XML
    function escapeXml(unsafe) {
      if (!unsafe) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${articleUrls}
${tutorialUrls}
</urlset>`;

    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': String(new TextEncoder().encode(body).length)
      }
    });

  } catch (error) {
    console.error('News sitemap generation error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      status: 500
    });
  }
}