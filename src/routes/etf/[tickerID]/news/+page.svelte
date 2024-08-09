<script lang='ts'>
  import {numberOfUnreadNotification, displayCompanyName, etfTicker} from '$lib/store';
  
  export let data;
  
  
  const formatDate = (dateString) => {
// Create a date object for the input dateString
const inputDate = new Date(dateString);
  
  // Create a date object for the current time in New York City
  const nycTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const currentNYCDate = new Date(nycTime);
  
  // Calculate the difference in milliseconds
  const difference = inputDate.getTime() - currentNYCDate.getTime();
  
  // Convert the difference to minutes
  const minutes = Math.abs(Math.round(difference / (1000 * 60)));
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.round(minutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
};
  
  let rawNews = data?.getStockNews;
  let newsList = rawNews?.slice(0,20) ?? [];
  
  
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
  
  function loadMoreData() {
    const nextIndex = newsList?.length;
    const newArticles = rawNews?.slice(nextIndex, nextIndex + 20);
    newsList = [...newsList, ...newArticles];
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
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) latest Stock Market News and Breaking Stories · stocknear`}/>
    <meta name="twitter:description" content={`Get the latest stock market news and breaking stories of ${$displayCompanyName} (${$etfTicker}).`} />
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
  
  
  <section class="w-auto max-w-4xl bg-[#09090B] overflow-hidden text-black h-full mb-40">
      <div class="m-auto h-full overflow-hidden ">
              <main class="">
                  <div class="sm:p-7 m-auto mt-2 sm:mt-0">
                      <div class="mb-6">
                          <h1 class="text-2xl sm:text-3xl text-white font-bold">
                            News
                          </h1>
                        </div>
  
                            {#if newsList.length !== 0}
                            <div class="grid grid-cols-1 gap-2 pb-5">
                            {#each newsList as item}
                                  <div class="w-full flex flex-col bg-[#09090B] rounded-lg m-auto">
                                      {#if videoId = checkIfYoutubeVideo(item.url)}
                                          <iframe
                                              class="w-full h-96 rounded-lg border border-gray-800"
                                              src={`https://www.youtube.com/embed/${videoId}`}
                                              frameborder="0"
                                              allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowfullscreen
                                          ></iframe>
                                      {:else}
                                          <a href={item?.url} rel="noopener noreferrer" target="_blank" class="border border-gray-800 rounded-lg">
                                          <div class="flex-shrink-0 m-auto ">
                                              <img src={item?.image} class=" w-full rounded-lg" alt="news image" loading="lazy">
                                          </div>
                                          </a>
                                      {/if}
                                      <div class="mb-1 w-full">
                                          <h3 class="text-sm sm:text-md text-white text-opacity-60 truncate mb-2 mt-3">
                                            {item?.site} · {formatDate(item?.publishedDate)} ago
                                          </h3>
                                          
                                          <a href={item?.url} rel="noopener noreferrer" target="_blank" class="text-lg font-bold text-white">
                                            {item?.title}
                                            <p class="text-white text-sm mt-2 font-normal">
                                              {item?.text}
                                            </p>
                                          </a>
                                      </div>
                                  </div>
                            
                                  <hr class="border-blue-400 w-full m-auto mt-5 mb-5">
                              {/each}
                              
                            </div>
                            {#if newsList?.length !== rawNews?.length}
                            <label on:click={loadMoreData} class="shadow-lg rounded-lg cursor-pointer w-5/6 sm:w-3/5 sm:max-w-3xl flex justify-center items-center py-3 h-full text-sm sm:text-[1rem] text-center font-semibold text-white m-auto hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6]">
                              Load More News
                            </label>
                            {/if}
  
  
                            {:else}
                            <div class="w-screen max-w-xl sm:flex sm:flex-row sm:items-center justify-center m-auto text-gray-100 font-medium bg-[#09090B] sm:rounded-lg h-auto p-5 mb-4">
                              <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>      
                              No news article published yet!
                            </div>
                            {/if}
  
                      
                  </div>
              </main>
      </div>
  </section>