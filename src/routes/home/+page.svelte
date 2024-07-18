<script lang='ts'>

  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { abbreviateNumber, formatDate } from '$lib/utils';
  //import StockSlider from '$lib/components/StockSlider.svelte';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import nancyPelosiProfile from '$lib/images/senator/Nancy_Pelosi.png';
  import warrenBuffetProfile from '$lib/images/hedge_funds/0001067983.png';
  //import michaelBurryProfile from '$lib/images/hedge_funds/0001649339.png';
  import analystAvatar from '$lib/images/hedge_funds/default-avatar.png';

  import { userRegion, searchBarData, numberOfUnreadNotification} from '$lib/store';


  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


  userRegion.subscribe(value => {
    if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
    }
  });

  export let data;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  const rawData = data?.getDailyGainerLoserActive;
  const rssFeedWIIM = data?.getRssFeedWIIM;



  let gainer = rawData?.gainers['1D']?.slice(0,5);
  let loser = rawData?.losers['1D']?.slice(0,5);
  let active = rawData?.active['1D']?.slice(0,5);
  //let sliderList = rawData?.active['1D'];

  let gainerLoserTickers = [];
  let showLoser = false;
  let buttonText = 'Top Winners';

  let trendingText = 'gainer';
  gainerLoserTickers = gainer;

function scrollToItem(state) {
  trendingText = state;
  
  const item = document?.getElementById('start-trending-slider');
  if (item) {
    item?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
  }
  
}



  function handleClick() {
    showLoser = !showLoser;
    buttonText = showLoser ? 'Top Losers' : 'Top Winners';
    
    if(showLoser)
    {
      gainerLoserTickers = loser;
    }
    else {
      gainerLoserTickers = gainer;
    }


  }


function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Return the difference in days
    return differenceInDays <=1;
}



let Feedback;

onMount( async() => {
    Feedback = (await import('$lib/components/Feedback.svelte')).default   
})


async function loadSearchData() {
    
    if($searchBarData?.length !== 0)
    {
      return
    }
    else {
  
       // make the GET request to the endpoint
       const response = await fetch(apiURL+'/searchbar-data', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json","X-API-KEY": apiKey
      },
      });
  
      $searchBarData = await response.json();
    }
     
  
  }
  


</script>
  
  


<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Free Stock Analysis Information for Small Investors · stocknear
  </title>

  <meta name="description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Free Stock Analysis Information for Small Investors · stocknear"/>
  <meta property="og:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Free Stock Analysis Information for Small Investors · stocknear"/>
  <meta name="twitter:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>



<div class="w-full max-w-6xl overflow-hidden m-auto min-h-screen bg-[#09090B]">



  <div class=" m-auto flex flex-wrap flex-col justify-center items-center md:flex-row sm:px-5">
    <!--Left Col-->

    
    
    <div class="flex flex-col w-full max-w-6xl justify-center items-center">
      <div class="text-center mb-10 w-full">                
        <!---Start-Autocomplete-Searchbar-->
        <!--
        {#if sliderList?.length !== 0}
        <StockSlider sliderList={sliderList}/>
        {/if}
        -->

        {#if Feedback}
          <Feedback data={data} />
        {/if}
        <section>
          <div class="relative w-full max-w-6xl mx-auto overflow-hidden">

            <!--
            <div class="overflow-hidden overflow-x-hidden w-auto">
              <Snow />
            </div>
            -->
        
            
              <div class="w-full max-w-5xl m-auto flex justify-center overflow-hidden">
                  <div class="py-7">
    
                      <!-- Section content -->
                      <div class="relative m-auto">
      
                          <!-- Section header -->
                          <div class="h-auto">
                            
                            <div class="w-full sm:rounded-xl h-auto p-5 sm:p-10 mt-3">
                              <div class="grid grid-cols-1 gap-10">
                            
                                <!-- Start Column -->
                                <div >

                                  <!--
                                  {#if (data?.user?.tier === 'Pro' && data?.user?.freeTrial === true) || (data?.user?.tier !== 'Pro' && data?.user?.freeTrial === false) }
                                  <div class="text-center mb-5 relative w-fit flex justify-center m-auto">
                                    <a href="/pricing" class="text-white antialiased bg-[#27272A] w-full px-4 py-2 rounded-xl m-auto font-medium text-sm flex items-center">
                                      <span class="font-semibold uppercase">SAVE 50% Off Subscription – Summer Special!</span>
                                    </a>
                                    <div class="absolute top-[-1.2rem] -right-5 sm:-right-8 rotate-[7deg]">
                                      <span class="bg-[#FBCE3C] text-black text-sm sm:text-[0.9rem] rounded-xl font-semibold sm:me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                                        Discount
                                      </span>
                                    </div>
                                  </div>
                                  {:else}
                                
                                  <div class="text-center mb-5 relative w-fit flex justify-center m-auto">
                                    <a href="/dark-pool-flow" class="text-white antialiased bg-[#27272A] w-full px-4 py-2 rounded-xl m-auto font-medium text-sm flex items-center">
                                      <span class="font-semibold">Realtime Dark Pool Trades from Hedge Funds</span>
                                    </a>
                                    <div class="absolute top-[-1.2rem] -right-5 sm:-right-8 rotate-[7deg]">
                                      <span class="bg-[#FBCE3C] text-black text-sm sm:text-[0.9rem] rounded-xl font-semibold sm:me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                                        New
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/if}
                                  -->
                                  
          

                                  <div class="flex flex-row justify-center items-center">
                                    
                                    <h1 class="text-center text-4xl sm:text-5xl text-white font-bold mb-6 w-full">
                                      Stock Analysis for Data
                                      <span class="text-[#FBCE3C] italic">Freaks</span>
                                    </h1>
                                  </div>


                                   <!-- Start Image -->
                                   <!--
                                <div class="ml-2 m-auto flex justify-center items-center w-full">
                                    <img class="w-36 sm:w-44 m-auto mt-2 mb-8" src={cloudFrontUrl+"/assets/wsb_praising_logo.png"} alt="logo">
                                </div>
                                -->
                                  <!-- End Image -->
                                  
                                  <span class="text-center flex-1 justify-center items-center text-white text-[1rem] sm:text-lg">
                                    Track the forces driving the stock market with our actionable and easy-to-understand data.
                                  </span>
                                  
                                    
                               
                                    <div class="flex justify-center items-center mt-8 mb-6 m-auto w-full max-w-64 sm:max-w-3xl">
                                      <label on:click={loadSearchData} for="searchBarModal" class="shadow-lg w-96 h-10 sm:h-12 flex flex-row items-center justify-start bg-[#202327] appearance-none py-3 cursor-pointer border border-slate-600 rounded-lg">
                                          <svg class="w-4 h-4 shrink-0 ml-3 sm:ml-5 text-white inline-block" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm8.707 12.293a.999.999 0 11-1.414 1.414L11.9 13.314a8.019 8.019 0 001.414-1.414l2.393 2.393z" fill="currentColor"></path>
                                          </svg>
                                          <span class="text-sm sm:text-lg text-slate-200 ml-3">
                                            Explore Stocks and ETF's...
                                          </span>
                                      </label>
                                     </div>
                                     
                                    
                                    
                                  <!-- End Search button -->
  
                                    <!-- Ticker Logos -->
                                    {#if active?.length !== 0}
                                    <div class="w-auto m-auto flex flex-row items-center justify-center mt-6 text-lg sm:text-xl">
                                      <span class="text-center text-slate-100">
                                        Trending:
                                      </span>
                                      {#each active?.slice(0,4) as item, index}
                                        <a href={'/stocks/'+item?.symbol} class="ml-1 text-blue-400 sm:hover:text-slate-100">
                                          {item?.symbol}
                                        </a>
                                        {#if index !== 3}
                                        <span class="text-blue-400">,</span>
                                        {/if}
                                      {/each}
                                    </div>
                                    {/if}

                                  
                                  
                                    {#if data?.user}
                                    <div class="text-white text-center text-[1rem] sm:text-lg mt-8 mb-4 font-medium">
                                      Track the investment portfolios of prominent Wall Street Figures.
                                    </div>

                                    <div class="w-full max-w-64 sm:max-w-3xl m-auto grid grid-cols-1 md:grid-cols-3 gap-y-3 sm:gap-x-5 flex justify-center items-center">
                                      
                                      <a href="/politicians/61b59ab669" class="px-4 py-3 text-white bg-[#202327] rounded-lg flex flex-row items-center font-medium transition duration-150 ease-in-out group">
                                        <div class="flex flex-row items-center">
                                          <div class="shadow-lg rounded-full border border-slate-600 w-10 h-10 relative democratic-striped bg-[#295AC7] flex items-center justify-center">
                                            <img style="clip-path: circle(50%);" class="rounded-full w-8" src={nancyPelosiProfile} loading="lazy"/>
                                          </div>
                                          <div class="flex flex-col items-start ml-2">
                                            <span class="text-sm text-start">Track Nancy Pelosi</span>
                                            <span class="text-xs text-gray-400">Dem &#183; House</span>
                                          </div>
                                        </div>
                                      </a>
                                      <a href="/hedge-funds/0001067983" class="px-4 py-3 text-white bg-[#202327] rounded-lg flex flex-row items-center font-medium transition duration-150 ease-in-out group">
                                        <div class="flex flex-row items-center">
                                          <div class="shadow-lg rounded-full border border-slate-600 w-10 h-10 relative hedge-fund-striped bg-[#20202E] flex items-center justify-center">
                                            <img style="clip-path: circle(50%);" class="rounded-full w-8" src={warrenBuffetProfile} loading="lazy"/>
                                          </div>
                                          <div class="flex flex-col items-start ml-2">
                                            <span class="text-sm text-start">Track Warren Buffet</span>
                                            <span class="text-xs text-gray-400">Berkshire Hathaway</span>
                                          </div>
                                        </div>
                                      </a>
                                      <a href="/analysts/5874f5e45064ed0001eb1bc5" class="px-4 py-3 text-white bg-[#202327] rounded-lg flex flex-row items-center font-medium transition duration-150 ease-in-out group">
                                        <div class="flex flex-row items-center">
                                          <div class="shadow-lg rounded-full border border-slate-600 w-10 h-10 relative analyst-striped bg-[#737D62] flex items-center justify-center">
                                            <img style="clip-path: circle(50%);" class="rounded-full w-8" src={analystAvatar} loading="lazy"/>
                                          </div>
                                          <div class="flex flex-col items-start ml-2">
                                            <span class="text-sm text-start">Track Keith Horowitz</span>
                                            <span class="text-xs text-gray-400">Analyst at Citigroup</span>
                                          </div>
                                        </div>
                                      </a>

                                    </div>
                                    {/if}
                                    

                                     
              
                                </div>
                                <!-- End Column -->
                            

                            
                              </div>
                            </div>


                      </div>
      
                  </div>
              </div>
      
          </div>

  <div class="w-full max-w-3xl m-auto mb-20 -mt-4 flex justify-center items-center">
    <a href="/community" class="px-4 py-3 text-white bg-[#202327] rounded-lg flex flex-row items-center font-medium transition duration-150 ease-in-out group">
      <svg class="w-6 h-6 mr-2"  viewBox="0 0 24 24" fill="#CCCCCC" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM7 12.75H5C4.59 12.75 4.25 12.41 4.25 12C4.25 11.59 4.59 11.25 5 11.25H7C7.41 11.25 7.75 11.59 7.75 12C7.75 12.41 7.41 12.75 7 12.75ZM12 14.25C10.76 14.25 9.75 13.24 9.75 12C9.75 10.76 10.76 9.75 12 9.75C13.24 9.75 14.25 10.76 14.25 12C14.25 13.24 13.24 14.25 12 14.25ZM19 12.75H17C16.59 12.75 16.25 12.41 16.25 12C16.25 11.59 16.59 11.25 17 11.25H19C19.41 11.25 19.75 11.59 19.75 12C19.75 12.41 19.41 12.75 19 12.75Z" fill="#CCCCCC"></path></svg>
      <span>Follow the Community </span>
      <span class="ml-1 mt-0.5 tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
    </span>
    </a>
  </div>
  
  

          

  <div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10 w-full m-auto pb-14 sm:pb-20 sm:mt-10">

  
    <div class="hidden sm:block w-full">
      
      <!--Start Top Winners/Losers-->
      <div id="step-top-winners" class="flex justify-between items-center">
          <button on:click={handleClick}>          
          <h2 class="text-white text-xl sm:text-2xl font-bold text-start mb-2 ml-2 sm:ml-0">
            <svg class="h-6 w-6 inline-block transform transition-transform {showLoser ? 'mb-2' : 'rotate-180'} mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
              {buttonText} Today
          </h2>
        </button>
      </div>

      <!--Start of Mode-->
      <table class="table table-sm table-pin-rows table-compact rounded-none sm:rounded-lg">
        <thead class="rounded-lg">
          <tr class="bg-[#09090B]">
            <th class="text-white font-semibold text-sm">Symbol</th>
            <th class="text-white font-semibold text-sm">Name</th>
            <th class="text-white font-semibold text-sm ">Market Cap</th>
            <th class="text-white font-semibold text-end text-sm">Today</th>
          </tr>
        </thead>

        <tbody>
          {#each gainerLoserTickers as item}
          <tr on:click={() => goto("/stocks/"+item.symbol)} class="odd:bg-[#27272A] cursor-pointer">
            <td class="text-blue-400">
                {item?.symbol}
            </td>

            <td class="text-white">
              {item?.name?.length > 20 ? item?.name?.slice(0,20) + "..." : item?.name}
            </td>
            

      
              <td class="text-white">
                {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
              </td>

      
              <td class="text-white font-semibold">
                <div class="flex flex-row justify-end items-center">
      
                  <div class="flex flex-col items-center">
                    <span class="text-white text-md ml-auto">${item.price?.toFixed(2)}</span>
                    <div class="flex flex-row mt-1">
                      {#if item?.changesPercentage >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs font-medium">+{item?.changesPercentage?.toFixed(2)}%</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs font-medium">{item?.changesPercentage?.toFixed(2)}% </span> 
                      {/if}
                    </div>
                  </div>
      
                  
              </div>
            </td>
          </tr>
          {/each}
        </tbody>
      </table>


    </div>



     <!--Start Mobile Trending Scrollbar-->
     <div class="sm:hidden overflow-hidden">
      <div class="flex flex-row items-center w-full">



        <label class="text-white text-xl p-4 font-medium flex flex-row items-center">
          Trending
          <InfoModal
          title={'Trending'}
          content={"Explore today's market highlights, including top gainers, losers and the most actively traded stocks."}
          id={'trendingModal'}
          />
        </label>
          
      

        <a href="/market-mover" class="ml-auto text-slate-300 text-sm font-medium pr-4 cursor-pointer">
          See All
        </a>
      </div>

      <div class="w-full flex flex-row items-center mb-5 ml-3 overflow-hidden">
        <label on:click={() => scrollToItem('gainer')} class="flex flex-row items-center {trendingText === 'gainer' ? 'bg-[#333333]' : 'bg-[#09090B]'} rounded-xl py-1">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="white" d="m1 7.4l.7.7l6-6l6 6l.7-.7L8.1 1h-.7L1 7.4zm0 6l.7.7l6-6l6 6l.7-.7L8.1 7h-.7L1 13.4z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Gainers
          </span>
        </label>
        <label on:click={() => scrollToItem('loser')} class="flex flex-row items-center {trendingText === 'loser' ? 'bg-[#333333]' : 'bg-[#09090B]'} rounded-xl py-1 ml-4">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M240 136v64a8 8 0 0 1-8 8h-64a8 8 0 0 1 0-16h44.69L136 115.31l-34.34 34.35a8 8 0 0 1-11.32 0l-72-72a8 8 0 0 1 11.32-11.32L96 132.69l34.34-34.35a8 8 0 0 1 11.32 0L224 180.69V136a8 8 0 0 1 16 0Z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Losers
          </span>
        </label>
        <label on:click={() => scrollToItem('active')} class="flex flex-row items-center {trendingText === 'active' ? 'bg-[#333333]' : 'bg-[#09090B]'} rounded-xl py-1 ml-4">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M253.78 17.188c-130.728 0-236.905 106.177-236.905 236.906C16.875 384.824 123.052 491 253.78 491c130.73 0 236.907-106.18 236.907-236.906c0-130.73-106.177-236.906-236.906-236.906zm0 18.687c120.63 0 218.22 97.59 218.22 218.22c0 120.626-97.59 218.218-218.22 218.218c-120.628 0-218.218-97.59-218.218-218.22s97.59-218.218 218.22-218.218zm101.19 46.313l-76.41 132.875c15.916 9.635 25.177 26.33 26.125 43.78h148.407c1.644-70.01-33.49-138.867-98.125-176.656zm-205.126 2.468c-27.1 16.725-50.68 40.147-67.72 69.656c-19.01 32.928-26.926 69.12-26 104.532H196a54.04 54.04 0 0 1 7.188-24.438c5.21-9.024 12.64-16 21.218-20.625L149.844 84.657zm100.594 141.156a36.723 36.723 0 0 0-2.594.094c-11.446.793-22.288 7.084-28.5 17.844c-9.94 17.216-4.09 38.967 13.125 48.906c17.213 9.94 38.935 4.12 48.874-13.094c9.94-17.215 4.12-38.967-13.094-48.906c-5.648-3.26-11.768-4.824-17.813-4.844zm28.218 82.375c-16.127 9.75-36.864 10.846-54.406 1.25l-68.03 117.22c29.454 16.785 61.044 25.177 92.75 26c34.567.898 68.72-7.786 99.124-24.032l-69.438-120.438z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Most Active
          </span>
        </label>
      </div>

      <div class="w-screen no-scrollbar grid grid-cols-5 gap-x-44 overflow-hidden overflow-x-scroll pl-5 pr-10">
        {#each (trendingText === 'gainer' ? gainer : trendingText === 'loser' ? loser : active) as item,index}
          <a href={"/stocks/"+item?.symbol} class="bg-[#09090B] rounded-lg  h-[90px] w-36 relative">
            <span class="stroke-text absolute right-32 bottom-0">
              {index+1}
            </span>
            <div class="flex flex-row items-center justify-end p-2">
              <span class="text-slate-200 text-sm font-medium mr-2">
                {item?.symbol}
              </span>
              <div class="rounded-full w-7 h-7 relative bg-[#09090B] flex items-center justify-center">
                <img style="clip-path: circle(50%);" class="w-5 h-5" src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`} alt="stock logo" loading='lazy'/>
              </div>
            </div>

            <div class="flex flex-col items-center">
              <span class="text-white font-bold text-xs ml-auto mr-2">${item.price?.toFixed(2)}</span>
              <div class="flex flex-row mt-1 ml-auto mr-2">
                {#if item?.changesPercentage >=0}
                  <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                  <span class="text-[#10DB06] text-xs font-medium">+{item?.changesPercentage?.toFixed(2)}%</span>
                {:else}
                  <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                  <span class="text-[#FF2F1F] text-xs font-medium">{item?.changesPercentage?.toFixed(2)}% </span> 
                {/if}
              </div>
            </div>

            
          </a>
        {/each}
      </div>
    </div>
    <!--End Mobile Trending Scrollbar-->

    <!--End Top Winners/Losers-->

    <div class="hidden sm:block w-full mt-10 lg:mt-0">
      <div>
        <div id="step-most-active" class="flex justify-between items-center">
          
          <h2 class="text-white text-xl sm:text-2xl font-bold text-start mb-2 ml-2 sm:ml-0">
            Most Active Today
          </h2>
          
        </div>

      <table class="table table-sm table-compact table-pin-rows shadow-md rounded-none sm:rounded-lg bg-[#09090B]">
        <thead>
          <tr class="bg-[#09090B]">
            <th class="text-white font-semibold text-sm">Symbol</th>
            <th class="text-white font-semibold text-sm">Name</th>
            <th class="text-white font-semibold text-sm ">Volume</th>
            <th class="text-white font-semibold text-end text-sm">Today</th>
          </tr>
        </thead>
        <tbody>
          {#each active as item, index}
          <tr on:click={() => goto("/stocks/"+item?.symbol)} class="odd:bg-[#27272A] cursor-pointer">
            <td class="text-blue-400 ">
              {item?.symbol}
            </td>
            
            <td class="text-white ">
              {item?.name?.length > 20 ? item?.name?.slice(0,20) + "..." : item?.name}
            </td>
    
      
  
          <td class="text-white ">
            {item?.volume !== null ? abbreviateNumber(item?.volume) : '-'}
          </td>

  
          <td class="text-white  font-semibold">
            <div class="flex flex-row justify-end items-center">
  
              <div class="flex flex-col items-center">
                <span class="text-white text-md ml-auto">${item.price?.toFixed(2)}</span>
                <div class="flex flex-row mt-1">
                  {#if item?.changesPercentage >=0}
                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                    <span class="text-[#10DB06] text-xs">+{item?.changesPercentage?.toFixed(2)}%</span>
                  {:else}
                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                    <span class="text-[#FF2F1F] text-xs">{item?.changesPercentage?.toFixed(2)}% </span> 
                  {/if}
                  </div>
              </div>
  
              
          </div>
        </td>
      </tr>
          {/each}
        </tbody>
      </table>

    </div>
  </div>




  </div>


    <!--Start WIIM-->
    <div class="w-full m-auto p-2 sm:p-0 mb-20">
      <h2 class="text-white text-xl sm:text-2xl font-bold text-start mt-5 mb-2 ml-2 ">
        Latest Market Momentum
      </h2>
          {#each rssFeedWIIM?.slice(0,5) as item}
          <div class="shadow-md bg-[#27272A] p-6 mb-4 rounded-lg text-start">
            <div class="text-sm text-white">
              <div class="flex flex-col items-start">
                <div class="hidden sm:flex flex-row items-center mb-3">
                  {#if latestInfoDate(item?.date)}
                    <label class="bg-[#2D4F8A] text-white font-medium text-xs rounded-lg px-2 py-0.5">New</label>
                    <span class="ml-2 mr-2"> &#183;</span>
                  {/if}
                  <span class="text-gray-300 text-xs">
                    {formatDate(item?.date)} ago
                  </span>
                </div>
                <span class="text-white">{item?.text}</span>
                <div class="flex flex-col mt-5 items-start w-full">
                  <div class="flex flex-wrap gap-y-3 flex-row items-center">
                    {#each item?.stocks as item2}
                      <div class="mr-2 mb-2 sm:mb-0">
                        <a href={item2?.assetType === 'stock' ? `/stocks/${item2?.ticker}` : item2?.assetType === 'etf' ? `/etf/${item2?.ticker}` : ''} class="cursor-pointer w-fit bg-[#404040] bg-opacity-[0.5] sm:hover:bg-opacity-[0.6] px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-xl hover:text-white text-blue-400">
                          {item2?.ticker}
                        </a>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="sm:hidden flex flex-row items-center justify-end mt-3 ml-auto">
                    {#if latestInfoDate(item?.date)}
                      <label class="bg-[#2D4F8A] text-white font-medium text-xs rounded-lg px-2 py-0.5">New</label>
                      <span class="ml-2 mr-2"> &#183;</span>
                    {/if}
                    <span class="text-gray-300 text-xs">
                      {formatDate(item?.date)} ago
                    </span>
                  </div>

                </div>
              </div>
              
            </div>
          </div>
          {/each}
    </div>
    <!--End WIIM-->
    
    



      </section>

  

        
     </div>


    </div>

    
    

  </div>

  

</div>








  
<style>
   


.scrollbar {
    display: grid;
    grid-gap: 90px;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }


  .stroke-text {
  font-size: 56px; /* Adjust the font size as needed */
  font-weight: bold; /* Adjust the font weight as needed */
  color: transparent; /* Make the text transparent */
  -webkit-text-stroke: 1px #CBD5E1; /* Add a black stroke outline with a thickness of 2px */
}


.democratic-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #295AC7,
        #295AC7 10px,
        #164D9D 10px,
        #164D9D 20px
    );
}

.hedge-fund-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #A77120,
        #A77120 10px,
        #90621C 10px,
        #90621C 20px
    );
}

.analyst-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #737D62,
        #737D62 10px,
        #677058 10px,
        #677058 20px
    );
}



</style>