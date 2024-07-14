<script lang='ts'>
    import { numberOfUnreadNotification } from '$lib/store';
    import { page } from '$app/stores';
    import logo from '$lib/images/list_logo.png';

    import { fly } from 'svelte/transition';
    
    
    export let data;

let navigation = [
    {
        title: 'Stock Lists',
        link: '/list'
    },
    {
        title: 'Mega-Cap Stocks',
        link: '/list/mega-cap-stocks'
    },
    {
        title: 'Large-Cap Stocks',
        link: '/list/large-cap-stocks'
    },
    {
        title: 'Mid-Cap Stocks',
        link: '/list/mid-cap-stocks'
    },
    {
        title: 'Small-Cap Stocks',
        link: '/list/small-cap-stocks'
    },
    {
        title: 'Micro-Cap Stocks',
        link: '/list/micro-cap-stocks'
    },
    {
        title: 'Nano-Cap Stocks',
        link: '/list/nano-cap-stocks'
    },
    {
        title: 'All Stocks Listed on the NASDAQ',
        link: '/list/nasdaq-stocks'
    },
    {
        title: 'All Stocks Listed on the NYSE',
        link: '/list/nyse-stocks'
    },
    {
        title: 'All Stocks Listed on XETRA',
        link: '/list/xetra-stocks'
    },
    {
        title: 'All Stocks Listed on AMEX',
        link: '/list/amex-stocks'
    },
    {
        title: 'Dow Jones Industrial Average Stocks List',
        link: '/list/dow-jones-stocks'
    },
    {
        title: 'NASDAQ 100 Index Stocks List',
        link: '/list/nasdaq-100-stocks'
    },
    {
        title: 'S&P 500 Index Stocks List',
        link: '/list/sp-500-stocks'
    },
    {
        title: 'German Companies on the US Stock Market',
        link: '/list/german-stocks-us'
    },
    {
        title: 'Canadian Companies on the US Stock Market',
        link: '/list/canadian-stocks-us'
    },
    {
        title: 'Chinese Companies on the US Stock Market',
        link: '/list/chinese-stocks-us'
    },
    {
        title: 'Indian Companies on the US Stock Market',
        link: '/list/indian-stocks-us'
    },
    {
        title: 'Israeli Companies on the US Stock Market',
        link: '/list/israeli-stocks-us'
    },
    {
        title: 'UK Companies on the US Stock Market',
        link: '/list/uk-stocks-us'
    },
    {
        title: 'Japanese Companies on the US Stock Market',
        link: '/list/japanese-stocks-us'
    },
    {
        title: 'Financials Sector Stocks',
        link: '/list/financial-sector'
    },
    {
        title: 'Healthcare Sector Stocks',
        link: '/list/healthcare-sector'
    },
    {
        title: 'Technology Sector Stocks',
        link: '/list/technology-sector'
    },
    {
        title: 'Industrials Sector Stocks',
        link: '/list/industrials-sector'
    },
    {
        title: 'Energy Sector Stocks',
        link: '/list/energy-sector'
    },
    {
        title: 'Utilities Sector Stocks',
        link: '/list/utilities-sector'
    },
    {
        title: 'Consumer Cyclical Sector Stocks',
        link: '/list/consumer-cyclical-sector'
    },
    {
        title: 'Real Estate Sector Stocks',
        link: '/list/real-estate-sector'
    },
    {
        title: 'Basic Materials Sector Stocks',
        link: '/list/basic-materials-sector'
    },
    {
        title: 'Communication Services Sector Stocks',
        link: '/list/communication-services-sector'
    },
    {
        title: 'Consumer Defensive Sector Stocks',
        link: '/list/consumer-defensive-sector'
    },
    {
        title: 'Delisted Companies',
        link: '/list/delisted-stocks'
    },
    {
        title: 'Bitcoin ETFs',
        link: '/list/bitcoin-etfs'
    },
    {
        title: 'Magnificent Seven Stocks',
        link: '/list/magnificent-seven'
    },
    
];

let updatedNavigation = navigation?.map(item => {
    return {
        ...item,
        link: item.link + '/'
    };
});

const combinedNavigation = navigation?.concat(updatedNavigation);
</script>
        


<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Stock Lists · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Lists of stocks that share common characteristics. See companies ranked by market cap, employee count, sales or others.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Stock Lists · stocknear"/>
  <meta property="og:description" content="Lists of stocks that share common characteristics. See companies ranked by market cap, employee count, sales or others.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Stock Lists · stocknear"/>
  <meta name="twitter:description" content="Lists of stocks that share common characteristics. See companies ranked by market cap, employee count, sales or others.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
    
          
        <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-4 pb-40">
            
            <div class="text-sm breadcrumbs ml-4">
                <ul>
                  <li><a href="/" class="text-gray-300">Home</a></li> 
                  <li><a href="/list/" class="text-gray-300">Lists</a></li>
                  {#if $page.url.pathname.startsWith('/list/')}
                    <li>
                        <a class="text-gray-300">
                            {combinedNavigation?.find((item) => item?.link === $page.url.pathname)?.title}
                        </a>
                    </li> 
                    {/if}
                </ul>
            </div>



        <div class="hidden sm:block w-full max-w-4xl m-auto bg-[#09090B] sm:rounded-xl h-auto p-10 mt-3 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
        
            <!-- Start Column -->
            <div>
                <div class="flex flex-row justify-center items-center">
                <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                    Stocks Lists
                </h1>
                </div>

                <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                    Identify various companies based on their market capitalization ranking
                </span>


            </div>
            <!-- End Column -->
        
            <!-- Start Column -->
            <div class="relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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
                

                <div class="z-1 absolute top-2">
                <img class="w-32 ml-4" src={logo} alt="logo" loading="lazy">
                </div>
            </div>
            <!-- End Column -->
            </div>

        
        </div>


        
        <div class="mt-10 sm:mt-0 w-full max-w-4xl m-auto mb-10 bg-[#09090B] pl-3 pr-3 overflow-hidden">
        
        
            <!--Start Top Winners/Losers-->
            <div class="flex flex-col justify-center items-center">
              
              <div class="ml-2 text-start w-full text-white mb-2">
                {#each navigation as item}
                  {#if item?.link === $page.url.pathname}      
                    <span class="font-bold text-2xl">
                      {item?.title}
                    </span>
                  {/if}
                  {/each}
              </div>
    
              <div class="border-b mt-2 border-blue-400 w-full mb-4" />

              

              <slot />


              
          
    
      
          
          </div>
    
    
        
     
        
        </section>
        
        