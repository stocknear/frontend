<script lang="ts">
  import { getImageURL, convertToSlug } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";
  import {
  blog_alt_post_wallpaper,
  blog_next,
  blog_previous,
  blog_published,
  blog_seo_description,
  blog_seo_keywords,
  blog_seo_title,
  blog_structured_blog_posts,
  blog_structured_blog_posts_description,
  blog_structured_description,
  blog_structured_name,
  blog_title,
} from "$lib/paraglide/messages";

  export let data;

  const PAGE_SIZE = 6;
  const TOTAL_POSTS = data?.getTotalLength;

  $: totalPages = Math.ceil(TOTAL_POSTS / PAGE_SIZE);
  $: currentPage = parseInt($page.url.searchParams.get("page") ?? "1");
  $: allBlogPosts = [...data?.getAllBlogPost];
</script>

<SEO
  title={blog_seo_title()}
  description={blog_seo_description()}
  keywords={blog_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Blog",
    name: blog_structured_name(),
    description: blog_structured_description(),
    url: "https://stocknear.com/blog",
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "ItemList",
      name: blog_structured_blog_posts(),
      description: blog_structured_blog_posts_description(),
      numberOfItems: allBlogPosts?.length || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-[80vh] pb-20 pt-5 px-4 lg:px-3"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b-[2px] border-[#2C6288] dark:border-white">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              {blog_title()}
            </h1>
          </div>

          <div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-5">
            {#if allBlogPosts?.length !== 0}
              {#each allBlogPosts as item}
                <div
                  class="shadow-xl sm:hover:shadow-2xl flex flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700"
                >
                  <div class="shrink-0">
                    <a href={"/blog/article/" + convertToSlug(item?.title)}
                      ><img
                        class="h-56 w-full object-cover border-b border-gray-300 dark:border-gray-700"
                        src={getImageURL(
                          item?.collectionId,
                          item?.id,
                          item?.cover,
                        )}
                        alt={blog_alt_post_wallpaper()}
                        loading="lazy"
                      /></a
                    >
                  </div>
                  <div
                    class="flex flex-1 flex-col justify-between bg-gray-50 shadow dark:bg-table p-4 sm:p-6"
                  >
                    <div class="flex-1">
                      <a
                        href={"/blog/article/" + convertToSlug(item?.title)}
                        class="mt-2 block"
                        ><h2 class="text-lg sm:text-xl font-semibold">
                          {item?.title}
                        </h2>
                        <p class="mt-3 text-sm">
                          {item?.abstract.length > 250
                            ? item?.abstract?.slice(0, 250) + "..."
                            : item?.abstract}
                        </p></a
                      >
                    </div>
                    <div class="mt-6 flex items-center">
                      <div class="flex text-sm">
                        {blog_published()} <time datetime={item?.created} class="ml-1">
                          {new Date(item?.created)?.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            daySuffix: "2-digit",
                          })}</time
                        >
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
                href={`/blog/?page=${currentPage - 1}`}
                class="mr-auto flex flex-row item-center text-blue-800 dark:text-white sm:hover:text-muted dark:sm:hover:text-blue-400"
              >
                <svg
                  class="w-6 h-6 mr-2 rotate-180"
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
                ><span>{blog_previous()}</span></a
              >
            {/if}
            {#if currentPage < totalPages}
              <a
                href={`/blog/?page=${currentPage + 1}`}
                class="ml-auto flex flex-row item-center text-blue-800 dark:text-white sm:hover:text-muted dark:sm:hover:text-blue-400"
                ><span>{blog_next()}</span>
                <svg
                  class="w-6 h-6 ml-2 inline-block"
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
