<script lang='ts'>
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import { formatDate } from '$lib/utils';
  import { etfTicker, numberOfUnreadNotification, displayCompanyName} from '$lib/store';
  export let data;
  
  
  
  
  let rawNews = data?.getStockNews;
  let newsList = rawNews?.slice(0,5) ?? [];
  
  
  let videoId = null;
  
  function checkIfYoutubeVideo(link) {
  
      const url = new URL(link);
      if (url?.hostname === "www.youtube.com") {
      const searchParams = url.searchParams;
      searchParams.delete('t'); // Remove the "t" parameter
      const videoIdMatch = url?.search?.match(/v=([^&]+)/);
  
      if (videoIdMatch) {
      return videoIdMatch[1];
      }
      } else {
      return null;
      }
  }
  
  
  
  
  
    async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  
  
  
    if (newsList?.length === rawNews?.length) {
        complete();
      } else {
        const nextIndex = newsList?.length;
        const newArticles = rawNews?.slice(nextIndex, nextIndex + 5);
        newsList = [...newsList, ...newArticles];
        loaded();
      }
  }
  
  
  
  </script>
  
  
  <svelte:head>
  
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$etfTicker}) latest Stock Market News and Breaking Stories · stocknear
    </title>
    <meta name="description" content={`Get the latest stock market news and breaking stories of ${$displayCompanyName} (${$etfTicker}).`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$etfTicker}) latest Stock Market News and Breaking Stories · stocknear`}/>
    <meta property="og:description" content={`Get the latest stock market news and breaking stories of ${$displayCompanyName} (${$etfTicker}).`} />
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) latest Stock Market News and Breaking Stories · stocknear`}/>
    <meta name="twitter:description" content={`Get the latest stock market news and breaking stories of ${$displayCompanyName} (${$etfTicker}).`} />
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
  
  
  
  <section class="w-auto max-w-3xl bg-[#0F0F0F] overflow-hidden text-black h-full mb-40">
      <div class="m-auto h-full overflow-hidden">
              <main>
                  <div class="sm:p-7 m-auto mt-5 sm:mt-0">
                      <div class="mb-6">
                          <h1 class="text-2xl sm:text-3xl text-white font-bold">
                            News
                          </h1>
                        </div>
  
                        <div class="grid grid-cols-1 gap-2">
                            {#if newsList.length !== 0}
                            {#each newsList as item}
                                  <div class="flex flex-col bg-[#0F0F0F] rounded-lg m-auto">
                                      {#if videoId = checkIfYoutubeVideo(item.url)}
                                          <iframe
                                              class="w-full h-96 rounded-lg"
                                              src={`https://www.youtube.com/embed/${videoId}`}
                                              frameborder="0"
                                              allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowfullscreen
                                          ></iframe>
                                      {:else}
                                          <a href={item.url} target="_blank">
                                          <div class="flex-shrink-0 m-auto ">
                                              <img src={item.image} class=" w-full rounded-lg" alt="news image" loading="lazy">
                                          </div>
                                          </a>
                                      {/if}
                                      <div class="mb-1 w-full">
                                          <h3 class="text-sm sm:text-md text-white text-opacity-60 truncate mb-2 mt-3">
                                            {item?.site} · {formatDate(item?.publishedDate)} ago
                                          </h3>
                                          
                                          <a href={item.url} target="_blank" class="text-lg font-bold text-white">
                                            {item?.title}
                                          </a>
                                          <p class="text-white text-sm mt-2">
                                            {item?.text}
                                          </p>
                                      </div>
                                  </div>
                            
                                  <hr class="border-blue-400 w-full m-auto mt-5 mb-5">
  
                                  
                              {/each}
  
                              <InfiniteLoading on:infinite={infiniteHandler} />
  
  
                                
                            {:else}
                            <h2 class="mt-20 text-3xl font-bold text-slate-700 mb-20 m-auto">
                              No data available
                              <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
                            </h2>
                            {/if}
                        </div>
  
                      
                  </div>
              </main>
      </div>
  </section>