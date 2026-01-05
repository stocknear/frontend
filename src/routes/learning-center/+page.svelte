<script lang="ts">
  import { getImageURL, convertToSlug } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";

  export let data;

  const PAGE_SIZE = 6;
  const TOTAL_POSTS = data?.getTotalLength;

  $: totalPages = Math.ceil(TOTAL_POSTS / PAGE_SIZE);
  $: currentPage = parseInt($page.url.searchParams.get("page") ?? "1");
  $: allBlogPosts = [...data?.getAllBlogPost];
</script>

<SEO
  title="Learning Center - Stock Market Education & Investment Tutorials"
  description="Master stock market investing with our comprehensive Learning Center. Free tutorials on trading strategies, technical analysis, fundamental analysis, portfolio management, and investment education for beginners to advanced traders."
  keywords="stock market education, investment tutorials, trading strategies, learn investing, stock analysis tutorials, financial education, investment guide, stock market basics, portfolio management, technical analysis course"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Stocknear Learning Center",
    description:
      "Comprehensive stock market education and investment tutorials",
    url: "https://stocknear.com/learning-center",
    educationalUse: "Investment Education",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    teaches: [
      "Stock Market Investing",
      "Technical Analysis",
      "Fundamental Analysis",
      "Portfolio Management",
      "Trading Strategies",
    ],
    mainEntity: {
      "@type": "ItemList",
      name: "Educational Articles",
      description: "Stock market education and investment tutorial articles",
      numberOfItems: allBlogPosts?.length || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700 pb-2">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Learning Center
            </h1>
          </div>

          <div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-5">
            {#if allBlogPosts?.length !== 0}
              {#each allBlogPosts as item}
                <div
                  class="flex flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
                >
                  <div class="shrink-0">
                    <a
                      href={"/learning-center/article/" +
                        convertToSlug(item?.title)}
                      ><img
                        class="h-56 w-full object-cover border-b border-gray-300 dark:border-zinc-700"
                        src={getImageURL(
                          item?.collectionId,
                          item?.id,
                          item?.cover,
                        )}
                        alt="Tutorial Wallpaper"
                        loading="lazy"
                      /></a
                    >
                  </div>
                  <div
                    class="flex flex-1 flex-col justify-between bg-white/70 dark:bg-zinc-950/40 p-4 sm:p-6"
                  >
                    <div class="flex-1">
                      <a
                        href={"/learning-center/article/" +
                          convertToSlug(item?.title)}
                        class="mt-2 block group"
                        ><h2
                          class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >
                          {item?.title}
                        </h2>
                        <p
                          class="mt-3 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                        >
                          {item?.abstract.length > 250
                            ? item?.abstract?.slice(0, 250) + "..."
                            : item?.abstract}
                        </p></a
                      >
                    </div>
                    <div class="mt-6 flex items-center">
                      <div
                        class="flex items-center text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                      >
                        Published:
                        <time
                          datetime={item?.created}
                          class="ml-1 text-sm normal-case text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {new Date(item?.created)?.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            daySuffix: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <div class="my-4 flex w-full">
            {#if currentPage > 1}
              <a
                href={`/learning-center/?page=${currentPage - 1}`}
                class="mr-auto inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
              >
                <svg
                  class="w-5 h-5 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  ></path></svg
                ><span>Previous</span></a
              >
            {/if}
            {#if currentPage < totalPages}
              <a
                href={`/learning-center/?page=${currentPage + 1}`}
                class="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                ><span>Next</span>
                <svg
                  class="w-5 h-5 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  ></path></svg
                ></a
              >
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
