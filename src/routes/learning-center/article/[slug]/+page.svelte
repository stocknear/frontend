<script>
  import { getImageURL } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  // import ArticleBreadcrumbStructuredData from "$lib/components/ArticleBreadcrumbStructuredData.svelte";

  export let data;

  let article = data?.getArticle;
  let discordURL = import.meta.env.VITE_DISCORD_URL;

  let faqs = [];

  $: {
    if (data?.getParams) {
      article = data?.getArticle;
      faqs = data?.getFAQ;
    }
  }
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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
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
            class="h-[200px] w-full object-cover lg:h-[350px] rounded border border-gray-300 dark:border-gray-800"
            loading="lazy"
            alt="Wallpaper"
          />
        {/if}
        <div class="lg:flex">
          <article
            class="z-5 relative mx-1 {article?.cover
              ? '-mt-10 lg:-mt-16'
              : 'mt-5'} rounded-t-md bg-white dark:bg-default p-3 xs:p-4 lg:ml-3 lg:p-5 xl:mx-4"
          >
            <header
              class="pb-3 border-b-[2px] border-[#2C6288] dark:border-white w-full sm:min-w-[850px] sm:max-w-[850px]"
            >
              <h1 class="mb-3 text-2xl sm:text-3xl font-bold md:text-4xl">
                {article?.title}
              </h1>
              <div class="">
                <div>
                  Last Updated: {new Date(article?.updated)?.toLocaleString(
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

            <div class="text-lg mt-4">
              <div class="content max-w-4xl">
                {@html article?.description?.replace(
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
