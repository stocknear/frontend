<script lang="ts">
  import {
    stockTicker,
    etfTicker,
    indexTicker,
    setCache,
    getCache,
  } from "$lib/store";
  import { formatDate } from "$lib/utils";
  import { page } from "$app/stores";

  export let data;

  let rawData = [];
  let rawDataPressRelease = [];
  let rawNewsVideos = [];

  let newsList = [];
  let displaySection = "all";

  async function getPressRelease() {
    displaySection = "press-releases";
    const cachedData = getCache($stockTicker, "getPressRelease");
    if (cachedData) {
      rawDataPressRelease = cachedData;
    } else {
      const postData = { ticker: $stockTicker, path: "stock-press-release" };
      const response = await fetch("/api/ticker-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      rawDataPressRelease = await response?.json();
      setCache($stockTicker, rawDataPressRelease, "getPressRelease");
    }
  }

  async function getNewsVideos() {
    displaySection = "videos";
    const cachedData = getCache($stockTicker, "getNewsVideos");
    if (cachedData) {
      rawNewsVideos = cachedData;
    } else {
      const postData = { ticker: $stockTicker, path: "news-videos" };
      const response = await fetch("/api/ticker-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      rawNewsVideos = await response?.json();
      setCache($stockTicker, rawNewsVideos, "getNewsVideos");
    }
  }

  // Memoize the YouTube video check function
  const videoCheckCache = new Map();
  function checkIfYoutubeVideo(link: string): string | null {
    if (videoCheckCache.has(link)) {
      return videoCheckCache.get(link);
    }
    try {
      const url = new URL(link);
      const result =
        url.hostname === "www.youtube.com" || url.hostname === "youtube.com"
          ? url.searchParams.get("v")
          : null;
      videoCheckCache.set(link, result);
      return result;
    } catch {
      videoCheckCache.set(link, null);
      return null;
    }
  }

  // Use a more efficient load more implementation
  function loadMoreData() {
    const nextIndex = newsList.length;
    newsList = [...newsList, ...rawData.slice(nextIndex, nextIndex + 20)];
  }

  // Pre-calculate video status once when data changes
  $: hasVideos = rawData.some((item) => checkIfYoutubeVideo(item.url) !== null);

  // Optimize filtered list computation
  $: filteredNewsList = (() => {
    switch (displaySection) {
      case "videos":
        return rawNewsVideos;
      case "press-releases":
        return rawDataPressRelease;
      default:
        return newsList;
    }
  })();

  $: {
    if ($stockTicker || $etfTicker || $indexTicker) {
      rawData = data?.getNews || [];
      if (rawData?.length > 0) {
        rawData?.sort(
          (a, b) => new Date(b?.publishedDate) - new Date(a?.publishedDate),
        );
      }

      rawDataPressRelease = [];
      newsList = rawData?.slice(0, 10) ?? [];
      displaySection = "all";
    }
  }

  // Track whether each video should be shown
  let showVideo = {};
  function handlePlayClick(index: number) {
    showVideo = { ...showVideo, [index]: true };
  }
</script>

<div class="space-y-3 overflow-hidden text-muted dark:text-white">
  <div class="w-auto lg:w-full p-1 flex flex-col m-auto">
    <div class="flex flex-col items-center w-full mb-1">
      <div class="flex flex-row justify-start mr-auto items-center">
        <div class="flex flex-row items-center">
          <label
            class="mr-1 cursor-pointer flex flex-row items-center text-2xl font-bold"
          >
            <h2>News</h2>
          </label>
        </div>
      </div>
    </div>

    <div class=" mt-1 sm:mt-0">
      <div
        class="hflex flex-row items-center justify-between overflow-x-auto border-b border-gray-300 dark:border-gray-600 py-1.5"
      >
        <ul
          class=" mb-0.5 flex flex-row overflow-x-auto whitespace-nowrap text-lg"
        >
          <li>
            <button
              on:click={() => (displaySection = "all")}
              class="cursor-pointer rounded px-3 py-0.5 sm:hover:bg-blue-50 dark:sm:hover:bg-secondary {displaySection ===
              'all'
                ? 'bg-blue-50 dark:bg-secondary'
                : ''}">All</button
            >
          </li>
          {#if hasVideos}
            <li>
              <button
                on:click={() => getNewsVideos()}
                class="ml-1 cursor-pointer rounded px-3 py-0.5 sm:hover:bg-blue-50 dark:sm:hover:bg-secondary {displaySection ===
                'videos'
                  ? 'bg-blue-50 dark:bg-secondary'
                  : ''}">Videos</button
              >
            </li>
          {/if}
          {#if !["etf", "index"].some( (sub) => $page.url.pathname?.includes(sub), )}
            <li>
              <button
                on:click={() => getPressRelease()}
                class="ml-1 cursor-pointer rounded px-3 py-0.5 sm:hover:bg-blue-50 dark:sm:hover:bg-secondary {displaySection ===
                'press-releases'
                  ? 'bg-blue-50 dark:bg-secondary'
                  : ''}"
                ><span class="inline sm:hidden">Press</span><span
                  class="hidden sm:inline">Press Releases</span
                ></button
              >
            </li>
          {/if}
        </ul>
      </div>
    </div>

    {#if rawData?.length > 0}
      {#if filteredNewsList?.length > 0}
        <div class="grid grid-cols-1 gap-2 pb-5 pt-5">
          {#each filteredNewsList as item, index (item.url)}
            <div class="w-full flex flex-col rounded m-auto">
              {#if checkIfYoutubeVideo(item.url)}
                {#if showVideo[index]}
                  <!-- Show the YouTube iframe when the user clicks play -->
                  <div class="w-full aspect-video mb-4">
                    <iframe
                      class="w-full h-full rounded border border-gray-800"
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
                  <h3 class="text-sm dark:text-white/80 truncate mb-2">
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
                    class="w-full sm:max-w-56 h-fit max-h-96 sm:mr-3 border border-gray-800 rounded"
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
                    <h3 class="text-sm text-white/80 truncate mb-2">
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
        </div>
      {:else}
        <div class="mt-5 mt-4 px-3 xs:px-4 sm:px-0">
          <div class="border-l-4 border-white p-4 text-white">
            <div class="flex flex-row items-center">
              <svg
                class="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width:40px"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                ></path></svg
              >
              <div class="ml-3 w-full sm:ml-4">
                <div class="flex w-full flex-row justify-between">
                  <div>
                    No {displaySection === "videos" ? "videos" : "articles"} found
                    for this stock.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      {#if newsList?.length !== rawData?.length && filteredNewsList?.length > 0 && displaySection === "all"}
        <label
          on:click={loadMoreData}
          class="shadow-lg rounded cursor-pointer w-5/6 sm:w-full flex justify-center items-center py-3 h-full text-sm sm:text-[1rem] text-center font-semibold text-black m-auto sm:hover:bg-gray-300 bg-[#fff]"
        >
          Load More News
        </label>
      {/if}
    {:else}
      <span class="text-white"> No News article available yet </span>
    {/if}
  </div>
</div>
