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
export async function GET({ locals }) {
  const { pb } = locals;

  try {
    const tutorials = await pb.collection("tutorials").getFullList({
      sort: "-updated",
      fields: "id,title,created,updated",
      requestKey: "sitemap-articles",
    });

    const seenSlugs = new Set<string>();
    const eligibleTutorials = tutorials
      .map((item) => ({ item, slug: convertToSlug(item?.title) }))
      .filter(({ slug }) => {
        if (!slug || seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      });
    if (eligibleTutorials.length === 0) {
      throw new Error(
        "The article sitemap source returned no eligible articles",
      );
    }

    const urls = eligibleTutorials
      .map((item) => {
        const lastmod = item.item?.updated || item.item?.created;
        const date = lastmod ? new Date(lastmod) : null;
        const lastmodTag =
          date && !Number.isNaN(date.getTime())
            ? `\n    <lastmod>${date.toISOString()}</lastmod>`
            : "";

        return `  <url>
    <loc>${escapeXml(`${website}/learning-center/article/${item.slug}`)}</loc>${lastmodTag}
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
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (error) {
    console.error("Articles sitemap error:", error);
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }
}
