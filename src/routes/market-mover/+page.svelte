<script lang='ts'>
import { goto } from '$app/navigation';
import { screenWidth, numberOfUnreadNotification } from '$lib/store';
import logo from '$lib/images/top_winner_logo.png';
import { abbreviateNumber } from '$lib/utils';
import MiniPlot from '$lib/components/MiniPlot.svelte';
import { onMount } from 'svelte';
import * as Tabs from "$lib/components/shadcn/tabs/index.js";
import ArrowLogo from "lucide-svelte/icons/move-up-right";

export let data;
let isLoaded = false;
const rawData = data?.getMiniPlotsIndex;

let priceDataSP500;
let priceDataNasdaq;
let priceDataDowJones;
let priceDataRussel2000;

let changeSP500, changeNasdaq, changeDowJones, changeRussel2000;
let previousCloseSP500, previousCloseNasdaq, previousCloseDowJones, previousCloseRussel2000;



function getCurrentDateFormatted() {
    // Get current date
    let date = new Date();
    
    // If today is Saturday or Sunday, move to the previous Friday
    if (date.getDay() === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    } else if (date.getDay() === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    }
    
    // Define months array for formatting
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Get formatted date components
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Return formatted date
    return `${month} ${day}, ${year}`;
}


// Assign values based on the symbol
rawData?.forEach(({ symbol, priceData, changesPercentage, previousClose }) => {
  switch (symbol) {
    case "SPY":
      priceDataSP500 = priceData?.map(({ time, value }) => ({ time: Date?.parse(time), value}));
      priceDataSP500 = priceDataSP500?.filter(item => item.value !== 0 && item.value !== null && item.value !== undefined)
      changeSP500 = changesPercentage;
      previousCloseSP500 = previousClose;
      break;
    case "QQQ":
      priceDataNasdaq = priceData?.map(({ time, value }) => ({ time: Date?.parse(time), value}));
      priceDataNasdaq = priceDataNasdaq?.filter(item => item.value !== 0 && item.value !== null && item.value !== undefined)
      changeNasdaq = changesPercentage;
      previousCloseNasdaq = previousClose;
      break;
    case "DIA":
      priceDataDowJones = priceData?.map(({ time, value }) => ({ time: Date?.parse(time), value}));
      priceDataDowJones = priceDataDowJones?.filter(item => item.value !== 0 && item.value !== null && item.value !== undefined)
      changeDowJones = changesPercentage
      previousCloseDowJones = previousClose;
      break;
    case "IWM":
      priceDataRussel2000 = priceData?.map(({ time, value }) => ({ time: Date?.parse(time), value}));
      priceDataRussel2000 = priceDataRussel2000?.filter(item => item.value !== 0 && item.value !== null && item.value !== undefined)
      changeRussel2000 = changesPercentage;
      previousCloseRussel2000 = previousClose;
      break;
    default:
      // Handle unknown symbol
      break;
  }
});


let outputList = data?.getDailyGainerLoserActive;
let gainerLoserActive = outputList?.gainers['1D']
let displaySection = 'gainer'
let order = 'highToLow';
let sortBy = ''; // Default sorting by change percentage


let buttonText = 'Top Winners';


function changeOrder(state:string) {
    if (state === 'highToLow')
    {
      order = 'lowToHigh';
    }
    else {
      order = 'highToLow';
    }
  }

const sortByChange = (tickerList) => {
    return tickerList?.sort(function(a, b) {
      if(order === 'highToLow')
      {
        return b?.changesPercentage - a?.changesPercentage;
      }
      else {
        return a?.changesPercentage - b?.changesPercentage;
      }
       
      });
  }

const sortByPrice = (tickerList) => {
    return tickerList?.sort(function(a, b) {
      if(order === 'highToLow')
      {
        return a?.price - b?.price;
      }
      else {
        return b?.price - a?.price;
      }
       
      });
  }

const sortByVolume = (tickerList) => {
    return tickerList?.sort(function(a, b) {
      if(order === 'highToLow')
      {
        return b?.volume - a?.volume;
      }
      else {
        return a?.volume - b?.volume;
      }
       
      });
  }

const sortByMarketCap = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.marketCap - a?.marketCap;
    }
    else {
      return a?.marketCap - b?.marketCap;
    }
  });
}

  
function changeSection(state) {

    displaySection = state;
    const timePeriod = '1D';
    sortBy = '';
    order = '';
    
    if (state === 'gainer')
    {
      gainerLoserActive = outputList?.gainers[timePeriod];
      buttonText = 'Top Winners'
    }
    else if (state === 'loser')
    {
      gainerLoserActive = outputList?.losers[timePeriod];
      buttonText = 'Top Losers'
    }
    else if (state === 'active')
    {
      gainerLoserActive = outputList?.active[timePeriod];
      buttonText = 'Most Active'
    }

}



function selectTimeInterval(event) {
    sortBy = '';
    order = '';
   
    const timePeriod = event.target.value === 'oneDay' ? '1D' : event.target.value === 'oneWeek' ? '1W' : event.target.value === 'oneMonth' ? '1M' : event.target.value === 'threeMonths' ? '3M' : '6M';


    if (buttonText === 'Top Winners')
    {
      gainerLoserActive = outputList?.gainers[timePeriod];
    }
    else if (buttonText === 'Top Losers')
    {
      gainerLoserActive = outputList?.losers[timePeriod];
    }
    else if (buttonText === 'Most Active')
    {
      gainerLoserActive = outputList?.active[timePeriod];
    }
    
  }

onMount( () => {
  isLoaded = true;
})

  $: {
  if(order)
  {
     
    // Add this condition for market cap sorting
    if (sortBy === 'marketCap') {
      gainerLoserActive = sortByMarketCap(gainerLoserActive);
    }
    else if (sortBy === 'change') {
      gainerLoserActive = sortByChange(gainerLoserActive);
    }
    else if (sortBy === 'price') {
      gainerLoserActive = sortByPrice(gainerLoserActive);
    }
    else if (sortBy === 'volume') {
      gainerLoserActive = sortByVolume(gainerLoserActive);
    }
  }
}


$: charNumber = $screenWidth < 640 ? 20 : 30;

</script>



<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Today's Top Stock Gainers, Losers and Most Active · stocknear
</title>
<meta name="description" content={`A list of the stocks with the highest percentage gain, highest percentage loss and most active today. See stock price, volume, market cap and more.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Today's Top Stock Gainers, Losers and Most Active · stocknear`}/>
<meta property="og:description" content={`A list of the stocks with the highest percentage gain, highest percentage loss and most active today. See stock price, volume, market cap and more.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Today's Top Stock Gainers, Losers and Most Active · stocknear`}/>
<meta name="twitter:description" content={`A list of the stocks with the highest percentage gain, highest percentage loss and most active today. See stock price, volume, market cap and more.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
  
<section class="w-full max-w-3xl sm:max-w-screen-2xl overflow-hidden min-h-screen pt-5 pb-40 lg:px-3">
          
  <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li>
      <li class="text-gray-300">Market Movers</li>
    </ul>
  </div>
          
  <div class="w-full overflow-hidden m-auto mt-5">
    
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
        <div class="relative flex justify-center items-start overflow-hidden w-full">


            <main class="w-full lg:w-3/4 lg:pr-5">


              <div class="w-full  m-auto sm:bg-[#27272A] h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
  
      <!-- Start Column -->
      <div>
        <div class="flex flex-row justify-center items-center">
          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            Market Movers
          </h1>
        </div>

        <span class="hidden sm:block text-white text-md font-semibold text-center flex justify-center items-center ">
          Explore top-performing, underperforming & most active traded stocks across different time frames.
        </span>


      </div>
      <!-- End Column -->
  
      <!-- Start Column -->
      <div class="hidden sm:block relative m-auto mb-5 mt-5 md:mb-0 md:mt-0">
        <svg class="w-32 -my-4" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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
        
        
        <div class="z-1 absolute -top-3 right-1">
          <img class="w-28" src={logo} alt="logo" loading="lazy">
        </div>
      </div>
      <!-- End Column -->
    </div>

  </div>

  {#if isLoaded}

  <div class="text-white text-xs sm:text-sm pb-5 sm:pb-2 pl-3 sm:pl-0">
    Stock Indexes - {getCurrentDateFormatted()}
  </div>

  <div class="w-full sm:hidden -mt-4 sm:mt-0 mb-8 m-auto flex justify-start sm:justify-center items-center p-3 sm:p-0">
    <div class="w-full grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-3 ">
    <MiniPlot title="S&P500" priceData = {priceDataSP500} changesPercentage={changeSP500} previousClose={previousCloseSP500}/>
    <MiniPlot title="Nasdaq" priceData = {priceDataNasdaq} changesPercentage={changeNasdaq} previousClose={previousCloseNasdaq}/>
    <MiniPlot title="Dow" priceData = {priceDataDowJones} changesPercentage={changeDowJones} previousClose={previousCloseDowJones}/>
    <MiniPlot title="Russel" priceData = {priceDataRussel2000} changesPercentage={changeRussel2000} previousClose={previousCloseRussel2000}/>
    </div>
  </div>


    <div class="w-full m-auto mb-10 bg-[#09090B] pl-3 pr-3 sm:pl-0 sm:pr-0">
     
      

        <div class="tabs flex flex-row justify-between sm:justify-start items-center w-full pl-3 pr-3 sm:pl-0 sm:pr-0">
          <Tabs.Root value="gainers" class="w-[400px]">
            <Tabs.List class="grid w-full grid-cols-3 bg-[#27272A]">
              <Tabs.Trigger on:click={() => (changeSection('gainer'))} value="gainers">Gainers</Tabs.Trigger>
              <Tabs.Trigger on:click={() => (changeSection('loser'))} value="losers">Losers</Tabs.Trigger>
              <Tabs.Trigger on:click={() => (changeSection('active'))} value="active">Active</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>

      </div>

    
    <!--Start Top Winners/Losers-->
    <div class="flex flex-col justify-center items-center overflow-hidden">
      

        
      <div class="w-full flex justify-start sm:justify-end items-center mb-10 ml-5 sm:ml-0">
        <div class="relative flex flex-col items-start">
          <span class="sm:hidden text-white text-sm mb-3">
            Time Period:
          </span>
        <select class="w-32 text-white select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={selectTimeInterval}>
            <option disabled>Choose a time period</option>
            <option value="oneDay" selected>1 Day</option>
            <option value="oneWeek">1 Week</option>
            <option value="oneMonth">1 Month</option>
            <option value="threeMonths">3 Months</option>
            <option value="sixMonths">6 Months</option>                                    
        </select>
        </div>
    </div>
    


    <div class="w-full overflow-x-scroll no-scrollbar">
      <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B]">
        <thead>
          <tr>
            <th class="text-white font-semibold text-[1rem] whitespace-nowrap">Company</th>
            <th on:click={() => { sortBy = 'change'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-[1rem] text-end">
              % Change
              <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'change' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </th>
            <th on:click={() => { sortBy = 'price'; changeOrder(order); }} class="cursor-pointer text-white font-semibold text-end text-[1rem]">
              Price
              <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'price' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </th>
            <th on:click={() => { sortBy = 'marketCap'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-[1rem] text-end">
              Market Cap
              <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'marketCap' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </th>
            <th on:click={() => { sortBy = 'volume'; changeOrder(order); }} class="cursor-pointer text-white font-semibold text-[1rem] text-end">
              Volume
              <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'volume' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each gainerLoserActive as item, index}
          <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] cursor-pointer">
    
          <td class="border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
            <div class="flex flex-col">
              <span class="text-blue-400 font-semibold">
                {item?.symbol}
              </span>
              <span class="text-white text-sm border-b-[#09090B]">
                {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
              </span>
            </div>
          </td>

          <td class="text-white text-end text-sm sm:text-[1rem] font-semibold border-b-[#09090B]">
              {#if item?.changesPercentage >=0}
                <span class="text-[#10DB06]">+{item?.changesPercentage >= 1000 ? abbreviateNumber(item?.changesPercentage) : item?.changesPercentage?.toFixed(2)}%</span>
              {:else}
                <span class="text-[#FF2F1F]">{item?.changesPercentage <= -1000 ? abbreviateNumber(item?.changesPercentage) : item?.changesPercentage?.toFixed(2)}% </span> 
              {/if}
          </td>

          <td class="text-white font-semibold text-sm sm:text-[1rem] text-end border-b-[#09090B]">
            ${item?.price?.toFixed(2)}
          </td>

          <td class="text-white text-sm sm:text-[1rem] font-semibold border-b-[#09090B] text-end">
            {item?.marketCap !== null ? abbreviateNumber(item?.marketCap, true) : '-'}
          </td>

          <td class="text-white text-sm sm:text-[1rem] font-semibold border-b-[#09090B] text-end">
            {item?.volume !== null ? abbreviateNumber(item?.volume) : '-'}
          </td>





          </tr>
          {/each}
        </tbody>
      </table>

    </div>



  </div>

  {:else}
  <div class="flex justify-center items-center h-80">
    <div class="relative">
    <label class="bg-[#09090B] rounded-lg h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span class="loading loading-spinner loading-md"></span>
    </label>
    </div>
</div>

  {/if}


</main>


<aside class="hidden lg:block relative fixed w-1/4 ml-4">        

  {#if data?.user?.tier !== 'Pro' || data?.user?.freeTrial}
  <div on:click={() => goto('/pricing')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Pro Subscription
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Upgrade now for unlimited access to all data and tools.
          </span>
      </div>
  </div>
  {/if}

  <div on:click={() => goto('/analysts')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Wallstreet Analyst
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Get the latest top Wall Street analyst ratings.
          </span>
      </div>
  </div>

  <div on:click={() => goto('/politicians')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Congress Trading
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Get the latest top Congress trading insights.
          </span>
      </div>
  </div>

</aside>

</div>
</div>


</div>



</section>

