<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth, numberOfUnreadNotification, etfTicker, stockTicker } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import logo from '$lib/images/trending_logo.png';
  import { fly } from 'svelte/transition';

  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

  export let data;
  
  let rawData = data?.getTrendingStocks;
  let trendingList = rawData?.slice(0,20);
  
async function infiniteHandler({ detail: { loaded, complete } }) 
{
if (trendingList?.length === rawData?.length) {
    complete();
  } else {
    const nextIndex = trendingList?.length;
    const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
    trendingList = [...trendingList, ...newArticles];
    loaded();
  }
}

async function assetSelector(symbol, assetType)
  {    
    if(assetType === 'etf')
    {
      etfTicker.update(value => symbol);
      goto(`/etf/${symbol}`)
    }
    else if(assetType === 'stock') {
      stockTicker.update(value => symbol);
      goto(`/stocks/${symbol}`)
    }
    
}


let charNumber = 25;

$: {
  if ($screenWidth < 640)
  {
    charNumber = 11;
  }
  else {
    charNumber = 25;
  }
}

</script>
     
    
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Today's Top Trending Stocks · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="A list of the most popular stocks today based on pageviews. The list is updated every 15 min.">
    <!-- Other meta tags -->
    <meta property="og:title" content="Today's Top Trending Stocks · stocknear"/>
    <meta property="og:description" content="A list of the most popular stocks today based on pageviews. The list is updated every 15 min.">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Today's Top Trending Stocks · stocknear"/>
    <meta name="twitter:description" content="A list of the most popular stocks today based on pageviews. The list is updated every 15 min.">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
      
    
  <section in:fly={{ x: -10, duration: 150, delay:150 }} out:fly={{ x: 5, duration: 150 }} class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
    <!--   
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Today's Top Trending Stocks</li>
      </ul>
    </div>
    -->
    
    <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Trending Stocks
            </h1>
          </div>
  
          <span class="text-white text-md font-medium text-center flex justify-center items-center ">
            Get the latest data on the top-viewed stock in the last 24 hours.
          </span>
  
  
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
          <svg class="w-40 -my-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
          </svg>
          
  
          <div class="z-1 absolute -top-7 right-11">
            <img class="w-20" src={logo} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
      </div>
  
     
    </div>
    
      <!-- Page wrapper -->
      <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
  
          
    
          <!-- Content area -->
          <div class="w-screen sm:w-full relative flex flex-col flex-1 overflow-hidden overflow-x-auto">     
            <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 overflow-x-auto">
                <thead>
                  <tr>
                    <td class="text-slate-200 font-medium text-sm text-start">No.</td>
                    <th class="text-slate-200 font-medium text-sm text-start">Symbol</th>
                    <td class="text-slate-200 hidden sm:table-cell font-medium text-sm text-start">Company Name</td>
                    <td class="text-slate-200 font-medium text-sm text-end">Views</td>
                    <td class="text-slate-200 font-medium text-sm text-end">Market Cap</td>
                    <td class="text-slate-200 font-medium text-end text-sm">Volume</td>
                    <td class="text-slate-200 font-medium text-sm text-end">EPS</td>
                  </tr>
                </thead>
                <tbody>
                  {#each trendingList as item,index}
                  <!-- row -->
                  <tr on:click={() => assetSelector(item?.symbol, item?.assetType)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#0F0F0F]'} border-b-[#0F0F0F] shake-ticker cursor-pointer">
                    
                    <td class="text-gray-200 pb-3 text-md text-start">
                      {index+1}
                    </td>

                    <th class="text-blue-400 font-normal">
                      {item?.symbol}
                    </th>

                    <td class="text-gray-200 pb-3 hidden sm:table-cell">
                      {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                    </td>
  
                  <td class="text-end text-white">
                    {item?.views}
                  </td>
  
                  <td class="text-white text-end">
                      {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                  </td>
  
                  <td class="text-white text-end">
                    {item?.volume !== null ? abbreviateNumber(item?.volume) : '-'}
                  </td>
  
                  <td class="text-white text-end w-10">
                    {item?.eps !== null ? item?.eps?.toFixed(2) : '-'}
                  </td>
  
    
    
                  </tr>
                  
              
                  {/each}
                </tbody>
              </table>
  
              <InfiniteLoading on:infinite={infiniteHandler} />

  


      </div>
  
  
      
  
  </section>
  

  