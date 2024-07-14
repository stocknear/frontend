<script lang="ts">
import { formatDate } from "$lib/utils";


import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
import { numberOfUnreadNotification } from '$lib/store';

export let data;


let rawData = data?.getMarketNews;
let news = rawData.slice(0,5) ?? [];


async function infiniteHandler({ detail: { loaded, complete } }) 
{
  if (news?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = news?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      news = [...news, ...newArticles];
      loaded();
    }
}

let videoId = null;


function checkIfYoutubeVideo(link) {

  const url = new URL(link);
  if (url.hostname === "www.youtube.com") {
  const searchParams = url.searchParams;
  searchParams?.delete('t'); // Remove the "t" parameter
  const videoIdMatch = url?.search?.match(/v=([^&]+)/);

  if (videoIdMatch) {
    return videoIdMatch[1];
  }
  } else {
    return null;
  }

}


</script>

<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Today's Stock Market News and Breaking Stories · stocknear
</title>
<meta name="description" content={`Get the latest stock market news and breaking stories from the world's best finance and investing websites.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Today's Stock Market News and Breaking Stories · stocknear`}/>
<meta property="og:description" content={`Get the latest stock market news and breaking stories from the world's best finance and investing websites.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Today's Stock Market News and Breaking Stories · stocknear`}/>
<meta name="twitter:description" content={`Get the latest stock market news and breaking stories from the world's best finance and investing websites.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>


<section class="w-full max-w-5xl overflow-hidden m-auto mt-10">
  
  <div class="flex justify-center w-full m-auto overflow-hidden">
      <div class="relative flex justify-center items-center overflow-hidden">
          <main>
              <div class="w-screen sm:w-full m-auto">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {#if news.length !== 0}
                      {#each news as item}
                          <div class="flex flex-col w-full mt-5 bg-[#09090B] shadow-lg h-auto sm:h-[430px] pb-10 sm:pb-5 rounded-none sm:rounded-lg m-auto">
                            {#if videoId = checkIfYoutubeVideo(item.url)}
                                <iframe
                                    class="w-full h-56 rounded-none sm:rounded-lg"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    frameborder="0"
                                    allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowfullscreen
                                ></iframe>
                            {:else}
                                <a href={item.url} target="_blank">
                                <div class="h-48 sm:h-56 m-auto border border-slate-800 rounded-none sm:rounded-lg ">
                                    <img src={item?.image} class="w-screen sm:w-full h-48 sm:h-56 rounded-none sm:rounded-t-lg" alt="news image" loading="lazy">
                                </div>
                                </a>
                            {/if}

                            <div class="pl-3 pr-3">
                              <label class="mt-3 mb-3 cursor-pointer text-xs text-gray-200 flex flex-row items-center">
                                <div class="rounded-full w-6 h-6 relative bg-gray-800 mr-1.5 mb-0.5">
                                  <img class="rounded-full w-4 h-4 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} loading="lazy" />
                                </div>
                                {item?.symbol} · {formatDate(item?.publishedDate)} ago
                                <span class="ml-auto text-gray-300 italic text-xs mr-2">
                                  Source: {item?.site}
                                </span>
                              </label>
                                
                                  <a href={item.url} target="_blank" class="text-lg font-bold text-white">
                                    {item?.title?.length > 120 ? item?.title?.slice(0,120) +'...' : item?.title}
                                  </a>
                                  <p class="text-white text-sm mt-2">
                                    {item?.text.length > 100 ? item?.text.slice(0,100) + "..." : item?.text}
                                  </p>
                              </div>

                        </div>

                          {/each}

                          <InfiniteLoading on:infinite={infiniteHandler} />

  
                      
                      {/if}
                  </div>

          </main>
      </div>
  </div>
</section>





