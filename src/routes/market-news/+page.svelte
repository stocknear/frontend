<script lang="ts">
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = data?.getStockNews;
  let marketNews = data?.getMarketNews;
  let news = rawData.slice(0, 10) ?? [];

  const formatDate = (dateString) => {
    // Create a date object for the input dateString
    const inputDate = new Date(dateString);

    // Create a date object for the current time in New York City
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentNYCDate = new Date(nycTime);

    // Calculate the difference in milliseconds
    const difference = inputDate.getTime() - currentNYCDate.getTime();

    // Convert the difference to minutes
    const minutes = Math.abs(Math.round(difference / (1000 * 60)));

    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(minutes / 1440);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  };

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && news?.length !== rawData?.length) {
      const nextIndex = news?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 25);
      news = [...news, ...filteredNewResults];
    }
  }

  onMount(async () => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  function checkIfYoutubeVideo(link) {
    const url = new URL(link);
    if (url.hostname === "www.youtube.com") {
      const searchParams = url.searchParams;
      searchParams?.delete("t"); // Remove the "t" parameter
      const videoIdMatch = url?.search?.match(/v=([^&]+)/);

      if (videoIdMatch) {
        return videoIdMatch[1];
      }
    } else {
      return null;
    }
  }

  // Track whether each video should be shown
  let showVideo = {};
  function handlePlayClick(index: number) {
    showVideo = { ...showVideo, [index]: true };
  }
</script>

<SEO
  title="All
    Stock News"
  description="The latest news on individual stocks on the US stock market, gathered from trusted finance and investing websites."
/>

<div class="w-full overflow-hidden m-auto mt-5">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full m-auto">
          <div class="grid grid-cols-1 gap-y-3">
            {#if news?.length !== 0}
              {#each news as item, index}
                <div class="w-full flex flex-col rounded m-auto">
                  {#if checkIfYoutubeVideo(item.url)}
                    {#if showVideo[index]}
                      <!-- Show the YouTube iframe when the user clicks play -->
                      <div class="w-full aspect-video mb-4">
                        <iframe
                          class="w-full h-full rounded border border-gray-300 dark:border-gray-800"
                          src={`https://www.youtube.com/embed/${checkIfYoutubeVideo(item.url)}`}
                          frameborder="0"
                          allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </div>
                    {:else}
                      <!-- Show the image placeholder with a play button -->
                      <div class="w-full aspect-video">
                        <div class="mb-3 sm:order-3 lg:pr-2">
                          <div
                            class="group relative block cursor-pointer bg-black bg-cover bg-[center_50%] object-contain after:block after:pb-[56.25%] after:content-[''] rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-brand_light focus:ring-offset-2"
                            style="background-image: url({item?.image});"
                            tabindex="0"
                            on:click={() => handlePlayClick(index)}
                          >
                            <div
                              class="absolute left-[50%] top-[50%] z-10 h-[46px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded bg-[#212121] opacity-80 transition-all before:absolute before:left-[50%] before:top-[50%] before:-translate-x-1/2 before:-translate-y-1/2 before:border-y-[11px] before:border-l-[19px] before:border-r-0 before:border-transparent before:border-l-white before:content-[''] group-hover:bg-[#ff0000] group-hover:opacity-100"
                            ></div>
                          </div>
                        </div>
                      </div>
                    {/if}
                    <div class="mt-3 w-full">
                      <h3
                        class="text-sm text-muted dark:text-white/80 truncate mb-2"
                      >
                        {formatDate(item?.publishedDate)} &#183; {item?.site}
                      </h3>
                      <a
                        href={item?.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        class="text-lg sm:text-xl font-bold"
                      >
                        {item?.title}
                        <p class=" text-sm mt-2 font-normal">
                          {item?.text?.length > 200
                            ? item?.text?.slice(0, 200) + "..."
                            : item?.text}
                        </p>
                      </a>
                    </div>
                  {:else}
                    <!-- Default news article display -->
                    <div class="w-full flex flex-col sm:flex-row">
                      <a
                        href={item?.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        class="w-full sm:max-w-56 h-fit max-h-96 sm:mr-3 border border-gray-300 dark:border-gray-800 rounded"
                      >
                        <div class="shrink-0 m-auto">
                          <img
                            src={item?.image}
                            class="h-auto w-full rounded"
                            alt="news image"
                            loading="lazy"
                          />
                        </div>
                      </a>
                      <div class="mt-3 sm:mt-0 w-full">
                        <h3
                          class="text-sm text-muted dark:text-white/80 truncate mb-2"
                        >
                          {formatDate(item?.publishedDate)} &#183; {item?.site}
                        </h3>
                        <a
                          href={item?.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          class="text-lg sm:text-xl font-bold"
                        >
                          {item?.title}
                          <p class=" text-sm mt-2 font-normal">
                            {item?.text?.length > 200
                              ? item?.text?.slice(0, 200) + "..."
                              : item?.text}
                          </p>
                        </a>
                      </div>
                    </div>
                  {/if}
                </div>
                <hr
                  class="border-gray-300 dark:border-gray-600 w-full m-auto mt-5 mb-5"
                />
              {/each}
            {/if}
          </div>
        </div>
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier) || data?.user?.freeTrial}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/pricing"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-semibold sm:ml-3">
                  Pro Subscription
                </h2>
              </div>
              <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>
        {/if}

        {#if marketNews?.length !== 0}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit mt-4 cursor-pointer"
          >
            <div class="p-4 text-sm">
              <h3 class="text-xl font-bold mb-3">Market News</h3>
              <ul class="">
                {#each marketNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {formatDate(item?.publishedDate)} ago -
                    <a
                      class="sm:hover:text-muted dark:sm:hover:text-white text-blue-700 dark:text-blue-400"
                      href={item?.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                    - {item?.site}
                  </li>
                {/each}
              </ul>
              <a
                href={`/market-news/general`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-5 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-default dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                More Market News
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>
