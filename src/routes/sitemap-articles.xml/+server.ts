import { convertToSlug } from "$lib/utils";

const website = "https://stocknear.com";

function escapeXml(str: string) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, setHeaders }) {
  const { pb } = locals;

  setHeaders({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=7200",
  });

  try {
    const tutorials = await pb.collection("tutorials").getFullList({
      sort: "-updated",
      fields: "id,title,created,updated",
      requestKey: "sitemap-articles",
    });

    const urls = tutorials
      .map((item) => {
        const slug = convertToSlug(item?.title);
        const lastmod = item.updated || item.created;
        const lastmodTag = lastmod
          ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
          : "";

        return `  <url>
    <loc>${escapeXml(`${website}/learning-center/article/${slug}`)}</loc>${lastmodTag}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
      .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(body, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Articles sitemap error:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      { headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }
}
