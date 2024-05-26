<script lang='ts'>
import { goto } from '$app/navigation';
import { articleId, screenWidth, numberOfUnreadNotification } from '$lib/store';
import { abbreviateNumber} from '$lib/utils';
import { Carousel } from 'flowbite-svelte';
import {getImageURL, formatDate} from '$lib/utils';


export let data;



let trendingText = 'gainer';
let gainer = data?.getDailyGainerLoserActive?.gainers['1D'].slice(0,5);
let loser = data?.getDailyGainerLoserActive?.losers['1D'].slice(0,5);
let active = data?.getDailyGainerLoserActive?.active['1D'].slice(0,5);
let gainerLoserTickers = gainer;
let news = data?.getMarketNews?.slice(0,5);


let images = data?.getRecentBlogPost?.map((item) => ({
  alt: 'Blog Post Cover',
  src: getImageURL(item?.collectionId, item?.id, item?.cover),
  title: item?.title
}));
let image;

function blogSelector(state:string)
{
    $articleId = data?.getRecentBlogPost?.find((item) => item?.title === state)?.id;
    goto('/blog/article/'+$articleId)
}

const hedgeFundsList = [
  {
    name: 'BlackRock',
    marketValue: '$3.48T',
    winRate: 31.84,
    link: '/hedge-funds/0001364742',
  },
  {
    name: 'Vanguard Group',
    marketValue: '$4.07T',
    winRate: 31.84,
    link: '/hedge-funds/0000102909',
  },
  {
    name: 'Quilter PLC',
    marketValue: '$25.35T',
    winRate: 32.35,
    link: '/hedge-funds/0001770632',
  },
  {
    name: 'Morgan Stanley',
    marketValue: '$983.41B',
    winRate: 28.14,
    link: '/hedge-funds/0000895421',
  },
  {
    name: 'Mackay Shields',
    marketValue: '$3.63T',
    winRate: 30.57,
    link: '/hedge-funds/0000061227',
  },
];

const etfList = data?.getPopularETFs;

const sectorList = [
  {
    title: 'Basic Materials',
    link: '/list/basic-materials-sector'
  },
  {
    title: 'Communication Services',
    link: '/list/communication-services-sector'
  },
  {
    title: 'Consumer Defensive',
    link: '/list/consumer-defensive-sector'
  },
  {
    title: 'Consumer Cyclical',
    link: '/list/consumer-cyclical-sector'
  },
  {
    title: 'Energy',
    link: '/list/energy-sector'
  },
  {
    title: 'Financials',
    link: '/list/financial-sector'
  },
  {
    title: 'Healthcare',
    link: '/list/healthcare-sector'
  },
  {
    title: 'Industrials',
    link: '/list/industrials-sector'
  },
  {
    title: 'Real Estate',
    link: '/list/real-estate-sector'
  },
  {
    title: 'Utilities',
    link: '/list/utilities-sector'
  },
  {
    title: 'Technology',
    link: '/list/technology-sector'
  }
]


</script>
       
      
    <!-- HEADER FOR BETTER SEO -->
    <svelte:head>
      <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Explore · stocknear</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
    
      <meta name="description" content="Explore the US Stock Market for different sectors, trending stocks, popular etf's and hedge funds.">
      <!-- Other meta tags -->
      <meta property="og:title" content="Explore · stocknear"/>
      <meta property="og:description" content="Explore the US Stock Market for different sectors, trending stocks, popular etf's and hedge funds.">
      <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <meta property="og:type" content="website"/>
      <!-- Add more Open Graph meta tags as needed -->
    
      <!-- Twitter specific meta tags -->
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content="Explore · stocknear"/>
      <meta name="twitter:description" content="Explore the US Stock Market for different sectors, trending stocks, popular etf's and hedge funds.">
      <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <!-- Add more Twitter meta tags as needed -->
    </svelte:head>
        
      
    <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-10 pb-40">
            
          
      <div class="text-sm breadcrumbs ml-4 mb-5">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Explore</li>
        </ul>
    </div>
      
        <!-- Page wrapper -->
        <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
    
      
      
        <!-- Content area -->
            <div class="flex flex-col overflow-hidden w-full">
    
              <h1 class="font-bold text-white text-4xl ml-2 mb-5 mt-5 text-center sm:text-start">
                Discover
              </h1>
            <div class="w-full relative z-20">
                <Carousel class="opacity-[0.6]" {images} duration={15900} let:Controls let:Indicators on:change={({ detail }) => (image = detail)}>                
                  <label class="cursor-pointer" slot="slide" on:click={() => blogSelector(image?.title)} let:Slide let:index>
                    <Slide image={images[index]} />
                  </label>
                  <Indicators />
                  <Controls />
                </Carousel>
                <div class="text-white absolute top-0 rounded-lg sm:bg-[#000] sm:bg-opacity-[0.7] w-full font-medium text-[1rem] sm:text-lg text-start p-3">
                  {image?.title}
                </div>
            </div>

            <!--Start Search bar-->
            <div id="step-search" class="flex justify-center items-center mt-10 mb-3 w-11/12 m-auto">
              <label for="searchBarModal" class="w-96 h-10 sm:h-12 flex flex-row items-center justify-start bg-[#202327] appearance-none py-3 cursor-pointer border border-slate-600 rounded-full">
                  <svg class="w-4 h-4 shrink-0 ml-3 sm:ml-5 text-white inline-block" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm8.707 12.293a.999.999 0 11-1.414 1.414L11.9 13.314a8.019 8.019 0 001.414-1.414l2.393 2.393z" fill="currentColor"></path>
                  </svg>
                  <span class="text-slate-200 ml-3">
                    Explore Stocks and ETF's...
                  </span>
              </label>
             </div>
            <!-- End Search bar-->


            <!--Start Trending Stocks-->
            <div class="flex flex-row items-center w-full mt-16 mb-4 pl-2">    
              <h2 class="font-bold text-white text-2xl sm:text-3xl ">
                Trending Stocks
              </h2>
      
              <a href="/market-mover" class="ml-auto pr-5 sm:ml-5 text-slate-300 hover:text-white text-[1rem] font-medium cursor-pointer">
                See All
              </a>
            </div>
      
            <div class="w-full flex flex-row items-center mb-5 ml-3 overflow-hidden">
              <label on:click={() => trendingText = 'gainer'} class="cursor-pointer flex flex-row items-center {trendingText === 'gainer' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1">
                <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="white" d="m1 7.4l.7.7l6-6l6 6l.7-.7L8.1 1h-.7L1 7.4zm0 6l.7.7l6-6l6 6l.7-.7L8.1 7h-.7L1 13.4z"/></svg>
                <span class="text-white text-sm font-medium ml-2 mr-4">
                  Gainers
                </span>
              </label>
              <label on:click={() => trendingText = 'loser'} class="cursor-pointer flex flex-row items-center {trendingText === 'loser' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1 ml-4">
                <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M240 136v64a8 8 0 0 1-8 8h-64a8 8 0 0 1 0-16h44.69L136 115.31l-34.34 34.35a8 8 0 0 1-11.32 0l-72-72a8 8 0 0 1 11.32-11.32L96 132.69l34.34-34.35a8 8 0 0 1 11.32 0L224 180.69V136a8 8 0 0 1 16 0Z"/></svg>
                <span class="text-white text-sm font-medium ml-2 mr-4">
                  Losers
                </span>
              </label>
              <label on:click={() => trendingText = 'active'} class="cursor-pointer flex flex-row items-center {trendingText === 'active' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1 ml-4">
                <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M253.78 17.188c-130.728 0-236.905 106.177-236.905 236.906C16.875 384.824 123.052 491 253.78 491c130.73 0 236.907-106.18 236.907-236.906c0-130.73-106.177-236.906-236.906-236.906zm0 18.687c120.63 0 218.22 97.59 218.22 218.22c0 120.626-97.59 218.218-218.22 218.218c-120.628 0-218.218-97.59-218.218-218.22s97.59-218.218 218.22-218.218zm101.19 46.313l-76.41 132.875c15.916 9.635 25.177 26.33 26.125 43.78h148.407c1.644-70.01-33.49-138.867-98.125-176.656zm-205.126 2.468c-27.1 16.725-50.68 40.147-67.72 69.656c-19.01 32.928-26.926 69.12-26 104.532H196a54.04 54.04 0 0 1 7.188-24.438c5.21-9.024 12.64-16 21.218-20.625L149.844 84.657zm100.594 141.156a36.723 36.723 0 0 0-2.594.094c-11.446.793-22.288 7.084-28.5 17.844c-9.94 17.216-4.09 38.967 13.125 48.906c17.213 9.94 38.935 4.12 48.874-13.094c9.94-17.215 4.12-38.967-13.094-48.906c-5.648-3.26-11.768-4.824-17.813-4.844zm28.218 82.375c-16.127 9.75-36.864 10.846-54.406 1.25l-68.03 117.22c29.454 16.785 61.044 25.177 92.75 26c34.567.898 68.72-7.786 99.124-24.032l-69.438-120.438z"/></svg>
                <span class="text-white text-sm font-medium ml-2 mr-4">
                  Most Active
                </span>
              </label>
            </div>
      
            <div class="w-full scrollbar-hedge-fund no-scrollbar overflow-hidden pl-4">
              {#each (trendingText === 'gainer' ? gainer : trendingText === 'loser' ? loser : active) as item,index}
                <a  href={"/stocks/"+item?.symbol} class="bg-[#202020] rounded-lg {index ===1 ? '-ml-5' : index === 2 ? '-ml-10' : index === 3 ? '-ml-16' : index === 4 ? '-ml-20' : ''}  h-[90px] w-36 relative">
                  <span class="stroke-text absolute right-32 bottom-0">
                    {index+1}
                  </span>
                  <div class="flex flex-row items-center justify-end p-2">
                    <span class="text-slate-200 text-sm font-medium mr-2">
                      {item?.symbol}
                    </span>
                    <div class="rounded-full w-7 h-7 relative bg-[#0F0F0F] flex items-center justify-center">
                      <img style="clip-path: circle(50%);" class="w-5 h-5" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} alt="stock logo"/>
                    </div>
                  </div>
      
                  <div class="flex flex-col items-center">
                    <span class="text-white font-bold text-xs sm:text-sm ml-auto mr-2">${item.price?.toFixed(2)}</span>
                    <div class="flex flex-row mt-1 ml-auto mr-2">
                      {#if item.changesPercentage >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs sm:text-sm">+{item.changesPercentage?.toFixed(2)} %</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs sm:text-sm">{item.changesPercentage?.toFixed(2)} % </span> 
                      {/if}
                    </div>
                  </div>
      
                  
                </a>
              {/each}
            </div>

            <!--End Trending Stocks-->


  

             <!--Start ETF's-->
            <div class="flex flex-row items-center w-full mt-16 mb-4 pl-2">    
              <h2 class="font-bold text-white text-2xl sm:text-3xl ">
                Popular ETF's
              </h2>
      
              <a href="/etf" class="ml-auto pr-5 sm:ml-5 text-slate-300 hover:text-white text-[1rem] font-medium cursor-pointer">
                See All
              </a>
            </div>

            <div class="w-full scrollbar-hedge-fund no-scrollbar overflow-hidden pl-4">
              {#each etfList as item,index}
                <a href={"/etf/"+item?.symbol} class="bg-[#202020] rounded-lg h-[90px] w-36 relative  {index ===1 ? '-ml-5' : index === 2 ? '-ml-10' : index === 3 ? '-ml-16' : index === 4 ? '-ml-20' : ''} ">
                  <span class="stroke-text absolute right-32 bottom-0">
                    {index+1}
                  </span>
                  <div class="flex flex-row items-center justify-end p-2">
                    <span class="text-slate-100 text-sm font-medium mr-2">
                      {item?.symbol}
                    </span>
                    <div class="rounded-full w-7 h-7 relative bg-[#0F0F0F] flex items-center justify-center">
                      <img style="clip-path: circle(50%);" class="w-5 h-5" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} alt="stock logo"/>
                    </div>
                  </div>
      

                  <div class="flex flex-col items-center">
                    <span class="text-white font-bold text-xs sm:text-sm ml-auto mr-2">${item?.price}</span>
                    <div class="flex flex-row mt-1 ml-auto mr-2">
                      {#if item?.changesPercentage >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs sm:text-sm">+{item?.changesPercentage?.toFixed(2)}%</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs sm:text-sm">{item?.changesPercentage?.toFixed(2)}% </span> 
                      {/if}
                    </div>
                  </div>

                </a>
              {/each}
            </div>
            <!--End ETF's-->

            <!--Start Hedge Funds-->
            <div class="flex flex-row items-center w-full mt-16 mb-4 pl-2">    
              <h2 class="font-bold text-white text-2xl sm:text-3xl ">
                Popular Hedge Funds
              </h2>
      
              <a href="/hedge-funds/category/best" class="ml-auto pr-5 sm:ml-5 text-slate-300 hover:text-white text-[1rem] font-medium cursor-pointer">
                See All
              </a>
            </div>

            <div class="w-full scrollbar-hedge-fund no-scrollbar overflow-hidden pl-4">
              {#each hedgeFundsList as item,index}
                <a href={item?.link} class="bg-[#202020] rounded-lg h-[90px] w-36 relative  {index ===1 ? '-ml-5' : index === 2 ? '-ml-10' : index === 3 ? '-ml-16' : index === 4 ? '-ml-20' : ''} ">
                  <span class="stroke-text absolute right-32 bottom-0">
                    {index+1}
                  </span>
                  <div class="flex flex-row items-center justify-end p-2">
                    <span class="text-slate-100 text-[0.79rem] font-medium mr-2">
                      {item?.name.length > 15 ? item?.name.slice(0,15) + "..." : item?.name}
                    </span>
                    <div class="rounded-full w-6 h-6 relative bg-[#0F0F0F] flex items-center justify-center">
                      <svg class="w-4 h-4" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <polyline points="256,477.208 256,34.792 0,477.208 "></polyline> <polyline style="fill:#DDDDDD;" points="256,477.208 256,34.792 512,477.208 "></polyline> <polygon style="fill:#E21B1B;" points="0,475.376 256,311.976 512,475.376 "></polygon> </g></svg>
                    </div>
                  </div>
      

                  <div class="flex flex-col items-center">
                    <span class="text-white font-bold text-xs sm:text-sm ml-auto mr-2">{item.marketValue}</span>
                    <div class="flex flex-row mt-1 ml-auto mr-2">
                      {#if item?.winRate >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs sm:text-sm">+{item?.winRate}%</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs sm:text-sm">{item?.winRate}% </span> 
                      {/if}
                    </div>
                  </div>

                </a>
              {/each}
            </div>
            <!--End Hedge Funds-->


             <!--Start Categories-->
             <div class="flex flex-row items-center w-full mt-16 mb-4 pl-2">    
              <h2 class="font-bold text-white text-2xl sm:text-3xl ">
                Categories
              </h2>
      
              <a href="/list/" class="ml-auto pr-5 sm:ml-5 text-slate-300 hover:text-white text-[1rem] font-medium cursor-pointer">
                See All
              </a>
            </div>
            

            <div class="grid sm:grid-flow-row-dense grid-cols-2 sm:grid-cols-4 md:grid-cols-6 grid-rows-2 gap-4 w-full p-3">
              {#each sectorList as item}
                <a href={item?.link} class="cursor-pointer hover:bg-[#34343a] bg-[#202020] rounded-md sm:rounded-xl p-2 h-14 m-auto text-center flex justify-center items-center text-white font-medium text-sm w-full sm:w-36">
                  {item?.title}
                </a>
              {/each}
            </div>


            <!--End Categories-->

        <!--Start Latest news-->
        <div class="flex flex-row items-center w-full mt-16 mb-4 pl-2">    
          <h2 class="font-bold text-white text-2xl sm:text-3xl ">
            Latest News
          </h2>
  
          <a href="/market-news" class="ml-auto pr-5 sm:ml-5 text-slate-300 hover:text-white text-[1rem] font-medium cursor-pointer">
            See All
          </a>
        </div>

        <div class="relative text-gray-800 m-auto">
          <div class="flex flex-wrap items-center">
            {#each news as item}
                      
            <a href={item.url} target="_blank" class="cursor-pointer mb-10 w-full ">
              <div class="flex-shrink-0 float-left">
                <img src={item.image} class="float-left w-36 sm:w-40 rounded-xl ml-2 mr-4 mb-2" alt="news image">
                <div class="absolute w-36 sm:w-40 ml-2 mr-4 mb-2 h-6 bg-[#0C0F17] bg-opacity-80 flex justify-center items-center">
                  <p class="text-white italic text-xs">{(new URL(item?.url)).hostname.replace('www.','')}</p>
                </div>
              </div>
      
              <div class="flex-grow">
                <a href={"/stocks/"+item?.symbol} class="text-sm font-medium text-gray-400 flex flex-row">
                  <div class="rounded-full w-6 h-6 relative bg-[#0F0F0F] mr-1.5 mb-0.5">
                    <img class="rounded-full w-4 h-4 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} />
                  </div>
                  {item.symbol} &centerdot; {formatDate(item.publishedDate)} ago
                </a>
                <h2 class="text-start text-sm sm:text-[0.94rem] font-bold flex-shrink text-white pr-1">{item.title}</h2>
                <p class="text-start text-gray-300 text-sm sm:text-md p-2">{item?.text?.length > 250 ? item?.text?.slice(0,250) + '...' : item?.text}</p>
              </div>
            </a>
            {/each}
          </div>
        </div>
        <!--End Latest news-->


        </div>
        
    
    

    </section>
    
    
    
  
<style>




.scrollbar-hedge-fund {
    display: grid;
    grid-gap: 100px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar-hedge-fund::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar-hedge-fund::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }



.scrollbar-sector {
    display: grid;
    grid-gap: 60px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: row;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar-sector::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar-sector::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }

  .stroke-text {
  font-size: 56px; /* Adjust the font size as needed */
  font-weight: bold; /* Adjust the font weight as needed */
  color: transparent; /* Make the text transparent */
  -webkit-text-stroke: 1px #CBD5E1; /* Add a black stroke outline with a thickness of 2px */
}
</style>