<script>
  import { getImageURL } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import {
  blog_alt_wallpaper,
  blog_last_updated,
} from "$lib/paraglide/messages";
  import showdown from "showdown";
  // import ArticleBreadcrumbStructuredData from "$lib/components/ArticleBreadcrumbStructuredData.svelte";

  export let data;

  let article = data?.getArticle;
  let discordURL = import.meta.env.VITE_DISCORD_URL;

  let faqs = [];

  // Markdown to HTML converter
  const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    headerLevelStart: 2,
  });

  // Convert markdown to HTML, handling both markdown and existing HTML content
  function renderContent(content) {
    if (!content) return "";
    // If content already contains HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(content) && !content.startsWith("#") && !content.startsWith("-") && !content.startsWith("*")) {
      return content;
    }
    // Otherwise, convert markdown to HTML
    return converter.makeHtml(content);
  }

  $: {
    if (data?.getParams) {
      article = data?.getArticle;
      faqs = data?.getFAQ;
    }
  }

  $: renderedDescription = renderContent(article?.description);
</script>

<SEO
  title={article?.title}
  description={article?.abstract}
  keywords="stock market education, investment tutorial, {article?.title?.toLowerCase()}, learn investing, trading strategy, financial education, investment guide, stock analysis tutorial"
  image={article?.cover
    ? getImageURL(article?.collectionId, article?.id, article?.cover)
    : ""}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "EducationalArticle",
    headline: article?.title,
    description: article?.abstract,
    image: article?.cover
      ? getImageURL(article?.collectionId, article?.id, article?.cover)
      : "https://stocknear.com/pwa-512x512.png",
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/pwa-512x512.png",
      },
    },
    datePublished: article?.created,
    dateModified: article?.updated,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://stocknear.com/learning-center/article/${data?.getParams}`,
    },
    about: {
      "@type": "Thing",
      name: "Stock Market Education",
    },
    educationalLevel: "beginner",
    learningResourceType: "tutorial",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    wordCount:
      article?.description?.replace(/<[^>]*>/g, "")?.split(" ")?.length || 0,
  }}
/>

<!--
<ArticleBreadcrumbStructuredData
  title={article?.title}
  datePublished={article.created}
  dateModified={article?.updated}
  url={`learning-center/article/${data?.getParams}`}
  image={article?.cover
    ? getImageURL(article?.collectionId, article?.id, article?.cover)
    : ""}
/>

-->

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <main id="main" class="mt-2 w-full">
        {#if article?.cover}
          <img
            src={getImageURL(
              article?.collectionId,
              article?.id,
              article?.cover,
            )}
            class="h-[200px] w-full object-cover lg:h-[350px] rounded-2xl border border-gray-300 dark:border-zinc-700"
            loading="lazy"
            alt={blog_alt_wallpaper()}
          />
        {/if}
        <div class="lg:flex">
          <article
            class="z-5 relative mx-1 {article?.cover
              ? '-mt-10 lg:-mt-16'
              : 'mt-5'} rounded-2xl bg-white/80 dark:bg-zinc-950/60 p-3 xs:p-4 lg:ml-3 lg:p-5 xl:mx-4 border border-gray-300 dark:border-zinc-700 shadow-none"
          >
            <header
              class="pb-3 border-b border-gray-300 dark:border-zinc-700 w-full sm:min-w-[850px] sm:max-w-[850px]"
            >
              <h1
                class="mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {article?.title}
              </h1>
              <div class="">
                <div
                  class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                >
                  {blog_last_updated()} {new Date(article?.updated)?.toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      daySuffix: "2-digit",
                    },
                  )}
                </div>
              </div>
            </header>

            <div
              class="text-base mt-4 text-gray-600 dark:text-zinc-300 leading-relaxed"
            >
              <div class="content prose prose-lg dark:prose-invert max-w-4xl">
                {@html renderedDescription?.replace(
                  "__VIDEO_SRC__",
                  getImageURL(
                    article?.collectionId,
                    article?.id,
                    article?.video,
                  ),
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</section>

<style>
  /* Prose/Markdown Content Styles */
  .content :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 2rem 0 1rem;
    color: #111827;
  }

  :global(.dark) .content :global(h1) {
    color: #ffffff;
  }

  .content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.75rem 0 0.75rem;
    color: #111827;
  }

  :global(.dark) .content :global(h2) {
    color: #ffffff;
  }

  .content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: #111827;
  }

  :global(.dark) .content :global(h3) {
    color: #ffffff;
  }

  .content :global(p) {
    margin: 1rem 0;
    line-height: 1.75;
  }

  .content :global(blockquote) {
    border-left: 4px solid #8b5cf6;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark) .content :global(blockquote) {
    color: #a1a1aa;
  }

  .content :global(code) {
    background: #f3f4f6;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  :global(.dark) .content :global(code) {
    background: #27272a;
  }

  .content :global(pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    overflow-x: auto;
    font-size: 0.9rem;
  }

  .content :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .content :global(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .content :global(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .content :global(li) {
    margin: 0.5rem 0;
    line-height: 1.75;
  }

  .content :global(a) {
    color: #8b5cf6;
    text-decoration: underline;
  }

  .content :global(a:hover) {
    color: #7c3aed;
  }

  .content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
  }

  .content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .content :global(th),
  .content :global(td) {
    border: 1px solid #e5e7eb;
    padding: 0.75rem;
    text-align: left;
  }

  :global(.dark) .content :global(th),
  :global(.dark) .content :global(td) {
    border-color: #3f3f46;
  }

  .content :global(th) {
    background: #f9fafb;
    font-weight: 600;
  }

  :global(.dark) .content :global(th) {
    background: #27272a;
  }

  .content :global(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2rem 0;
  }

  :global(.dark) .content :global(hr) {
    border-top-color: #3f3f46;
  }

  .content :global(strong) {
    font-weight: 600;
  }

  .content :global(em) {
    font-style: italic;
  }
</style>

