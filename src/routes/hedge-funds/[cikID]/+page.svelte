<script lang='ts'>

  import { displayCompanyName, screenWidth, numberOfUnreadNotification } from '$lib/store';
  import { formatString } from '$lib/utils';
  import { goto } from '$app/navigation';
  import { abbreviateNumber } from '$lib/utils';
  
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import { page } from '$app/stores';

  export let data;
  
  let notDestroyed = true;
  
  let sortBy = 'Value';
  let order = 'highToLow';
  
  
  let hedgeFundsData = data?.getHedgeFundsData ?? [];
  let rawData = hedgeFundsData[0]?.holdings;
  let holdings = hedgeFundsData[0]?.holdings; //rawData?.slice(0,20);

  let totalMarketValue = hedgeFundsData[0]?.marketValue ?? 'n/a';
  let numberOfStocks = 0;
  let winRate = hedgeFundsData[0]?.winRate ?? 'n/a';
  let turnover = hedgeFundsData[0]?.turnover?.toFixed(2) ?? 'n/a';
  let averageHoldingPeriod = hedgeFundsData[0]?.averageHoldingPeriod ?? 'n/a';
  let performancePercentage3year = hedgeFundsData[0]?.performancePercentage3year?.toFixed(2) ?? 'n/a';
  

  let industry = [];
  

  const navigation = [
      {
          title: 'Companies',
      },
      {
          title: 'Industries',
      },
  
  ];
  
  
  
  
  const sortByName = (liste) => {
      return liste.sort(function(a, b) {
        if(order === 'highToLow')
        {
          return a?.securityName.localeCompare(b?.securityName);
        }
        else {
          return b?.securityName.localeCompare(a?.securityName);
        }
        
      });
    };
  
  
  const sortByMarketValue = (liste) => {
      return liste.sort(function(a, b) {
        if(order === 'highToLow')
        {
          return b?.marketValue - a?.marketValue;
        }
        else {
          return a?.marketValue - b?.marketValue;
        }
         
        });
    }
      
  const sortByShares = (liste) => {
      return liste.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.sharesNumber - a?.sharesNumber;
          }
          else {
          return a?.sharesNumber - b?.sharesNumber;
          }
          
          });
  }
  
  const sortByOwnership = (liste) => {
      return liste.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.ownership - a?.ownership;
          }
          else {
          return a?.ownership - b?.ownership;
          }
          
          });
  }
  
  const sortByPortfolio = (liste) => {
      return liste.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.weight - a?.weight;
          }
          else {
          return a?.weight - b?.weight;
          }
          
          });
  }
  
  
  

  
  
      
  function selectSortingMethod(state:string) {
  
      order = 'highToLow';
  
      if(state === 'Value')
      {
      sortBy = state;
      rawData = sortByMarketValue(hedgeFundsData[0]?.holdings);
      holdings = rawData?.slice(0,25);
  
  
      }
  
      else if (state === 'Shares')
      {
      sortBy = state;
      rawData = sortByShares(hedgeFundsData[0]?.holdings);
      holdings = rawData?.slice(0,25);
  
  
      }
  
      else if (state === 'Ownership')
      {
      sortBy = state;
      rawData = sortByOwnership(hedgeFundsData[0]?.holdings);
      holdings = rawData?.slice(0,25);
  
  
      }
  
      else if (state === 'Portfolio')
      {
      sortBy = state;
      rawData = sortByPortfolio(hedgeFundsData[0]?.holdings);
      holdings = rawData?.slice(0,25);
    
      }
  
      else if (state === 'Name: A-Z')
      {
      sortBy = state;
      rawData = sortByName(hedgeFundsData[0]?.holdings);
      holdings = rawData?.slice(0,25);
      }
  
  }
  
  
  
  function changeOrder(state:string) {
      if (state === 'highToLow')
      {
      order = 'lowToHigh';
      }
      else {
      order = 'highToLow';
      }
  }
  
  
  
  
  
async function infiniteHandler({ detail: { loaded, complete } }) 
{

  if (holdings?.length === rawData?.length && notDestroyed) {
      complete();
    } 
    else if (notDestroyed) {
      const nextIndex = holdings?.length;
      const newHoldings = rawData?.slice(nextIndex, nextIndex + 25);
      holdings = [...holdings, ...newHoldings];
      loaded();
    }
}





  /*
  industry = hedgeFundsData[0]?.industry;

  industry = industry?.filter(item => item?.weight >= 0.1)?.map(item => {
  // Check if industryTitle is empty or null, and replace it with "n/a"
  if (!item.industryTitle) {
      item.industryTitle = "n/a";
  }
  return item;
  });
  */



  $: {
      if(order)
      {
        if(sortBy === 'Value')
        {
          //rawData  = sortByMarketValue(hedgeFundsData[0]?.holdings);
          holdings = sortByMarketValue(hedgeFundsData[0]?.holdings);
          //holdings = rawData?.slice(0,25);
          
        }
    
        else if (sortBy === 'Shares')
        {
          //rawData = sortByShares(hedgeFundsData[0]?.holdings);
          holdings = sortByShares(hedgeFundsData[0]?.holdings);
          //holdings = rawData?.slice(0,25);
  
        }
    
        else if (sortBy === 'Ownership')
        {
          //rawData = sortByOwnership(hedgeFundsData[0]?.holdings);
          holdings = sortByOwnership(hedgeFundsData[0]?.holdings);
          //holdings = rawData?.slice(0,25);
  
        }
  
        else if (sortBy === 'Portfolio')
        {
          //rawData = sortByPortfolio(hedgeFundsData[0]?.holdings);
          holdings = sortByPortfolio(hedgeFundsData[0]?.holdings);
          //holdings = rawData?.slice(0,25);
  
        }
  
        else if (sortBy === 'Name: A-Z')
        {
          //rawData = sortByName(hedgeFundsData[0]?.holdings);
          holdings = sortByName(hedgeFundsData[0]?.holdings);
          //holdings = rawData?.slice(0,25);
  
        }
  
       
      }
  }


$: {
  if ($page.url.pathname !== '/hedge-funds/'+data?.getCIKData) {
    notDestroyed = false;
  }
}
</script>



<!-- HEADER FOR BETTER SEO -->
<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {formatString($displayCompanyName)} - Hedge Fund · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <!-- Other meta tags -->
  <meta property="og:title" content="{formatString($displayCompanyName)} - Hedge Fund · stocknear"/>
  <meta property="og:description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{formatString($displayCompanyName)} - Hedge Fund · stocknear"/>
  <meta name="twitter:description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>


<section class=" w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
    

    <div class="text-sm breadcrumbs ml-4 mb-5 no-scrollbar mr-5">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li><a href="/hedge-funds" class="text-gray-300">Hedge Funds</a></li>
        {#if $page.url.pathname.startsWith('/hedge-funds/')}
          <li class="text-gray-300">
              {formatString($displayCompanyName)}
          </li> 
          {/if}
      </ul>
  </div>

    
    <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#202020] sm:rounded-lg h-auto p-5 mb-4">
      <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
      Core Profile of the Hedge Fund {formatString($displayCompanyName)} for the quarter Q1 2024.
    </div>


      
      <div class="stats stats-horizontal bg-[#202020] w-full rounded-lg">
            
        <div class="grid grid-cols-2 sm:grid-cols-3">

          <div class="stat">
            <label for="stocksInfo" class="cursor-pointer flex flex-row items-center stat-title text-lg sm:text-xl font-semibold text-gray-300">
              Stocks
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#fff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value mt-1 text-lg sm:text-xl text-gray-200 font-semibold">
              {rawData?.length}
            </div>
          </div>
          


          <div class="stat">
            <label for="marketValueInfo" class="cursor-pointer flex flex-row items-center stat-title text-lg sm:text-xl font-semibold text-gray-300">
              Value
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#565656"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value mt-1 text-lg font-semibold text-gray-200">
              {abbreviateNumber(totalMarketValue,true)}
            </div>
          </div>
          
          <div class="stat">
            <label for="winRateInfo" class="cursor-pointer flex flex-row items-center stat-title -my-2 mb-1 sm:my-0  sm:mb-0 text-lg sm:text-xl font-semibold text-gray-300">
              Win Rate
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#565656"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value text-lg font-semibold text-gray-200">
              <div class="flex flex-row items-center">
                <div class="flex flex-col items-center">
                    <div class="flex flex-row mt-1 items-center">
                        {#if winRate >=0}
                        <svg class="inline-block w-6 h-6 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-[0.95rem] sm:text-lg">+{winRate?.toFixed(2)} %</span>
                        {:else}
                        <svg class="inline-block w-2.5 h-2.5 sm:w-4 sm:h-4 ml-auto m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF2F1F" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#FF2F1F] text-[0.95rem] sm:text-lg">{winRate?.toFixed(2)} % </span> 
                        {/if}
                    </div>
                </div>                
            </div>
            </div>
          </div>

          <div class="stat">
            <label for="turnoverInfo" class="cursor-pointer flex flex-row items-center stat-title -my-2 mb-1 text-lg sm:text-xl font-semibold text-gray-300">
              Turnover
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#565656"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value text-lg font-semibold text-gray-200">
              {turnover}
            </div>
          </div>

          <div class="stat">
            <label for="avgHoldingInfo" class="cursor-pointer flex flex-row items-center stat-title -my-2 mb-1 text-lg sm:text-xl font-semibold text-gray-300">
              Avg. Holding
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#565656"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value text-lg font-semibold text-gray-200">
              {averageHoldingPeriod} months
            </div>
          </div>


          <div class="stat">
            <label for="performanceInfo" class="cursor-pointer flex flex-row items-center stat-title -my-2 mb-1 text-lg sm:text-xl font-semibold text-gray-300">
              3-Year Performance
              <svg class="ml-2 w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#565656"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#565656" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            <div class="stat-value text-lg font-semibold text-gray-200">
              <div class="flex flex-row items-center font-medium">
                <div class="flex flex-col items-center">
                    <div class="flex flex-row mt-1 items-center">
                        {#if performancePercentage3year >=0}
                        <svg class="inline-block w-6 h-6 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-[0.95rem] sm:text-lg">+{abbreviateNumber(performancePercentage3year)} %</span>
                        {:else}
                        <svg class="inline-block w-6 h-6 mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-[0.95rem] sm:text-lg">{abbreviateNumber(performancePercentage3year)} % </span> 
                        {/if}
                    </div>
                </div>                
            </div>
            </div>
          </div>


        </div>

          
        </div>
  

   

    <div class="flex justify-start items-center ml-3 mb-10 mt-10">
        <label for="sortByModal" class="cursor-pointer bg-[#0F0F0F] flex flex-row items-center">
          <span class="text-white text-sm sm:text-md mr-2">
            Sort By: 
          </span>
            <div class="flex flex-row items-center">
                <span class="text-sm sm:text-md m-auto font-medium text-white">
                  {sortBy}
                </span>
                <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                    <g transform="rotate(180 512 512)">
                        <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/>
                    </g>
                </svg>
            </div>
          </label>

          <label on:click={() => changeOrder(order)} class="ml-auto flex flex-row items-center mr-3 cursor-pointer">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path fill="{order === 'highToLow' ? 'white' : 'gray'}" d="m7.5 1.5l.354-.354L7.5.793l-.354.353l.354.354Zm-.354.354l4 4l.708-.708l-4-4l-.708.708Zm0-.708l-4 4l.708.708l4-4l-.708-.708ZM7 1.5V14h1V1.5H7Z"/></svg>
            <svg class="w-5 h-5 -ml-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><g transform="rotate(180 7.5 7.5)"><path fill="{order === 'lowToHigh' ? 'white' : 'gray'}" d="m7.5 1.5l.354-.354L7.5.793l-.354.353l.354.354Zm-.354.354l4 4l.708-.708l-4-4l-.708.708Zm0-.708l-4 4l.708.708l4-4l-.708-.708ZM7 1.5V14h1V1.5H7Z"/></g></svg>
          </label>
  
      </div>

      {#if holdings?.length !== 0}
        <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-[#0F0F0F] m-auto mt-4 ">
          <!-- head -->
          <thead>
            <tr class="border border-[#0F0F0F]">
              <th class="text-white font-bold text-sm">Company</th>
              <th class="text-white font-bold text-center sm:text-end text-sm ">Value</th>
              <th class="text-white font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Shares' ? 'hidden' : ''}">Shares</th>
              <th class="text-white font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Ownership' ? 'hidden' : ''}">Ownership</th>
              <th class="text-white font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Value' && sortBy !== 'Portfolio' && sortBy !== 'Name: A-Z' ? 'hidden' : ''}">Portfolio</th>
            </tr>
          </thead>
          <tbody >
            {#each holdings as item,index}
            <!-- row -->
            <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] border-b-[#0F0F0F] cursor-pointer">
              <td class="text-gray-200 border-b-[#0F0F0F] pb-4">
                <div class="flex flex-row items-center">
                  <div class="flex flex-col">
                    <span class="text-blue-400">{item?.symbol}</span>
                    <span class="text-white">{item?.securityName?.length > 20 ? formatString(item?.securityName?.slice(0,20)) + "..." : formatString(item?.securityName)}</span>
                  </div>
                </div>
              </td>



            <td class="text-gray-200 border-b-[#0F0F0F]">
                <div class="flex flex-row justify-center sm:justify-end items-center">
  
                  <div class="flex flex-col">
                    <span class="text-white text-md ml-auto">{abbreviateNumber(item?.marketValue,true)}</span>
                    <!--
                    <div class="flex flex-row mt-1">
                      {#if item.changeInMarketValuePercentage >=0}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#10DB06] text-xs">+{abbreviateNumber(item.changeInMarketValuePercentage?.toFixed(2))} %</span>
                      {:else}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 ml-auto m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF2F1F" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#FF2F1F] text-xs">{abbreviateNumber(item.changeInMarketValuePercentage)?.toFixed(2)} % </span> 
                      {/if}
                    </div>
                    -->
                  </div>
  
                  
              </div>
            </td>
            
            <td class="text-gray-200 border-b-[#0F0F0F] {$screenWidth < 640 && sortBy !== 'Shares' ? 'hidden' : ''}">
                <div class="flex flex-row justify-end items-center">
  
                  <div class="flex flex-col">
                    <span class="text-white  text-md ml-auto">{abbreviateNumber(item?.sharesNumber)}</span>
                    <!--
                    <div class="flex flex-row mt-1">
                      {#if item?.changeInSharesNumberPercentage >=0}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#10DB06] text-xs">+{abbreviateNumber(item?.changeInSharesNumberPercentage?.toFixed(2))} %</span>
                      {:else}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 ml-auto m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF2F1F" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#FF2F1F] text-xs">{abbreviateNumber(item?.changeInSharesNumberPercentage?.toFixed(2))} % </span> 
                      {/if}
                    </div>
                    -->
                  </div>
  
                  
              </div>
            </td>



            <td class="text-gray-200 border-b-[#0F0F0F] {$screenWidth < 640 && sortBy !== 'Ownership' ? 'hidden' : ''}">
                <div class="flex flex-row justify-end items-center">

                <div class="flex flex-col">
                    <span class="text-white  text-md ml-auto">
                      {item?.ownership <= 0.01 ? "< 0.01%" : item?.ownership?.toFixed(2)+'%'}
                    </span>
                    <!--
                    <div class="flex flex-row mt-1">
                    {#if item.changeInOwnershipPercentage >=0}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#10DB06] text-xs">+{abbreviateNumber(item.changeInOwnershipPercentage?.toFixed(2))} %</span>
                    {:else}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 ml-auto m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF2F1F" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#FF2F1F] text-xs">{abbreviateNumber(item.changeInOwnershipPercentage?.toFixed(2))} % </span> 
                    {/if}
                    </div>
                    -->
                </div>              
                </div>
            </td>


            <td class="text-gray-200 border-b-[#0F0F0F] {$screenWidth < 640 && sortBy !== 'Value' && sortBy !== 'Portfolio' && sortBy !== 'Name: A-Z' ? 'hidden' : ''}">
                <div class="flex flex-row justify-end items-center">

                <div class="flex flex-col">
                    <span class="text-white text-md ml-auto">{item?.weight?.toFixed(2)}%</span>
                    <!--
                    <div class="flex flex-row mt-1">
                    {#if item.changeInWeightPercentage >=0}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#10DB06] text-xs">+{abbreviateNumber(item.changeInWeightPercentage?.toFixed(2))} %</span>
                    {:else}
                        <svg class="inline-block w-2.5 h-2.5 mr-1 ml-auto m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF2F1F" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                        <span class="text-[#FF2F1F] text-xs">{abbreviateNumber(item.changeInWeightPercentage?.toFixed(2))} % </span> 
                    {/if}
                    </div>
                  -->
                </div>              
                </div>
            </td>

        

          </tr>
            
         

            {/each}


          </tbody>
        </table>

        <!--<InfiniteLoading on:infinite={infiniteHandler} />-->

      {/if}

   

  </section>
    

    






  <!--Start Sort By Modal-->
  <input type="checkbox" id="sortByModal" class="modal-toggle" />
      
  <dialog id="sortByModal" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="sortByModal" for="sortByModal"  class="cursor-pointer modal-backdrop bg-[#0F0F0F] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">
  
  
  
    <label for="sortByModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white">
        <h3 class="font-medium text-lg sm:text-2xl mb-10">
          Sort By
        </h3>
  
  
        <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
  

              

          <label for="sortByModal" on:click={() => selectSortingMethod('Value')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Value' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Value
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if sortBy === 'Value'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>


          <label for="sortByModal" on:click={() => selectSortingMethod('Shares')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Shares' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Shares
              </span>
  
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Shares'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
  
            </div>
           
          </label>

  
  
        
          <label for="sortByModal" on:click={() => selectSortingMethod('Ownership')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Ownership' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                Ownership
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Ownership'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
            </div>
          </label>

          <label for="sortByModal" on:click={() => selectSortingMethod('Portfolio')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Portfolio' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                Portfolio
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Portfolio'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
            </div>
          </label>

          <label for="sortByModal" on:click={() => selectSortingMethod('Name: A-Z')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Name: A-Z' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                Name: A-Z
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Name: A-Z'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
            </div>
          </label>
  
        
  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End Sort By Modal-->
  


        

<!--Start Stocks Info-->
<input type="checkbox" id="stocksInfo" class="modal-toggle" />

<dialog id="stocksInfo" class="modal modal-bottom sm:modal-middle">


  <label for="stocksInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020]" >


  <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Stocks
      </h3>

      <span class="text-white">
        The total number of companies of the hedge fund's portfolio.
      </span>


    </div>

        
      </div>
  </dialog>
  <!--End Stocks Info-->

  
<!--Start Market Cap Info-->
<input type="checkbox" id="marketValueInfo" class="modal-toggle" />

<dialog id="marketValueInfo" class="modal modal-bottom sm:modal-middle">


  <label for="marketValueInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020]" >


  <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Total Value
      </h3>

      <span class="text-white">
        The current value of all companies that the Hedge Fund invested in this quarter.
      </span>


    </div>

        
      </div>
  </dialog>
  <!--End Market Cap Info-->


  
<!--Start Winrate Info-->
<input type="checkbox" id="winRateInfo" class="modal-toggle" />
<dialog id="winRateInfo" class="modal modal-bottom sm:modal-middle">
  <label for="winRateInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    <div class="modal-box w-full bg-[#202020]" >
      <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Win Rate
      </h3>
      
      <span class="text-white">
        The win rate is calculated by dividing the number of profitable trades by the total trades executed this quarter.
      </span>
    </div>

    </div>
</dialog>
  <!--End Winrate Info-->

<!--Start Turnover Info-->
<input type="checkbox" id="turnoverInfo" class="modal-toggle" />

<dialog id="turnoverInfo" class="modal modal-bottom sm:modal-middle">


  <label for="turnoverInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020]" >


  <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Turnover
      </h3>

      <span class="text-white">
        Turnover is the rate at which a fund's or portfolio's holdings are bought and sold over a period, reflecting its trading activity and frequency.
      </span>


    </div>

        
      </div>
  </dialog>
  <!--End Turnover Info-->



<!--Start Avg. Holding Info-->
<input type="checkbox" id="avgHoldingInfo" class="modal-toggle" />

<dialog id="avgHoldingInfo" class="modal modal-bottom sm:modal-middle">


  <label for="avgHoldingInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020]" >


  <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Average Holding Period
      </h3>

      <span class="text-white">
        The average asset holding in the hedge fund's portfolio.
      </span>


    </div>
        
    </div>
</dialog>
  <!--End Avg. Holding Info-->

<!--Start Performance Info-->
<input type="checkbox" id="performanceInfo" class="modal-toggle" />

<dialog id="performanceInfo" class="modal modal-bottom sm:modal-middle">
  <label for="performanceInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>

  <div class="modal-box w-full bg-[#202020]" >

  <div class="text-white mb-5">
      <h3 class="font-bold text-2xl mb-5">
        Performance
      </h3>

      <span class="text-white">
        The Hedge Fund's performance is assessed by comparing its current market value to that of the previous quarter.
      </span>


    </div>
        
    </div>
</dialog>
  <!--End Performance Info-->