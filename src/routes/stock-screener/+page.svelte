<script lang='ts'>
  import { goto } from '$app/navigation';
  import { strategyId, userRegion, screenWidth, numberOfUnreadNotification } from '$lib/store';
  import Input  from '$lib/components/Input.svelte';
  import toast from 'svelte-french-toast';
  import logo from "$lib/images/stock_screener_logo.png";
  import { formatDate, formatRuleValue } from '$lib/utils';


  import { onMount } from 'svelte';
  
  const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL;
  let fastifyURL;

  userRegion.subscribe(value => {

    if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
      fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
      fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
  });


  export let data;
  export let form;
  
  let isLoaded = false;
  let strategyList = [];
  
async function getAllStrategies()
{
    const postData = {'userId': data?.user?.id}
    const response = await fetch(fastifyURL+'/all-strategies', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  const output = (await response.json())?.items;

  return output;

}


async function createStrategy(event)
{ 
  event.preventDefault();

  const formData = new FormData(event.target); // create a FormData object from the form

  formData.append('user', data?.user?.id);
	formData.append('rules', '[]');
	const title = formData.get('title');

  if (!title || title.length === 0) {
    toast.error('Title cannot be empty!', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
    return;
  }

  if (title?.length > 100) {
    toast.error('Title is too long. Keep it simple and concise bruv!', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
    return;
  }

  const postData = {};

  // Iterate through the FormData entries and populate the object
  for (const [key, value] of formData.entries()) {
    postData[key] = value;
  }



  const response = await fetch(fastifyURL+'/create-strategy', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  const output = (await response.json())?.items;

  if (output?.id && output?.id?.length !== 0) {
    toast.success('Strategy created successfully!', {
            style: 'border-radius: 200px; background: #333; color: #fff;'});
      goto("/stock-screener/"+output?.id);
  } else {
    toast.error('Something went wrong. Please try again later!', {
      style: 'border-radius: 200px; background: #333; color: #fff;'});
  }

  return output;

}

let LoginPopup;

onMount(async () => {
  if(data?.user) {
    strategyList = await getAllStrategies()
  }
  else {
    strategyList = [];
    LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
  }

  isLoaded = true;
})

  

    
  let editStrategyId;
  let deleteStrategyId;
  let ruleOfList = [];
  let strategyTitle;

  function handleView(liste, title) {
  

    ruleOfList = liste;
    strategyTitle = title;
    
  }
  
  
  async function handleDeleteStrategy() {
  
    const postData = {'strategyId': deleteStrategyId};

    const response = await fetch(fastifyURL+'/delete-strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
  
    const output = (await response.json())?.items
  
    if (output === 'success')
    {
      toast.success('Strategy deleted successfully!', {
        style: 'border-radius: 200px; background: #333; color: #fff;'});
  
        strategyList= strategyList?.filter(item => item?.id !== deleteStrategyId);
    }
    else if ( output === 'failure')
    {
      toast.error('Something went wrong. Please try again', {
        style: 'border-radius: 200px; background: #333; color: #fff;'});
    }
  
  
  }
  
  
  async function selectStrategy(state:String)
  {
    $strategyId = state;
    goto("/stock-screener/"+$strategyId);
  }
  
  
  const ruleMappings = {
        ratingRecommendation: 'Analyst Rating',
        revenue: 'Revenue',
        growthRevenue: 'Revenue Growth',
        costOfRevenue: 'Cost of Revenue',
        growthCostOfRevenue: 'Cost Of Revenue Growth',
        costAndExpenses: 'Cost & Expenses',
        growthCostAndExpenses: 'Cost & Expenses Growth',
        netIncome: 'Net Income',
        growthNetIncome: 'Net Income Growth',
        grossProfit: 'Gross Profit',
        growthGrossProfit: 'Gross Profit Growth',
        researchAndDevelopmentExpenses: 'R&D Expenses',
        growthResearchAndDevelopmentExpenses: 'R&D Expenses Growth',
        marketCap: 'Market Cap',
        eps: 'EPS',
        growthEPS: 'EPS Growth',
        interestIncome: 'Interest Income',
        interestExpenses: 'Interest Expenses',
        growthInterestExpenses: 'Interest Expenses Growth',
        operatingExpenses: 'Operating Expenses',
        growthOperatingExpenses: 'Operating Expenses Growth',
        operatingIncome: 'Operating Income',
        growthOperatingIncome: 'Operating Income Growth',
        pe: 'PE Ratio',
        beta: 'Beta',
        ebitda: 'EBITDA',
        growthEBITDA: 'EBITDA Growth',
        ESGScore: 'ESG Score',
        atr: 'Average True Range (ATR)',
        rsi: 'Relative Strength Index (RSI 14)',
        sma50: '50-Day Simple Moving Average (SMA-50)',
        sma200: '200-Day Simple Moving Average (SMA-200)',
        ema50: '50-Day Exp. Moving Average (EMA-50)',
        ema200: '200-Day Exp. Moving Average (EMA-200)',
        change1W: 'Price Change 1W',
        change1M: 'Price Change 1M',
        change3M: 'Price Change 3M',
        change6M: 'Price Change 6M',
        change1Y: 'Price Change 1Y',
        change3Y: 'Price Change 3Y',
        priceToBookRatio: 'Price to Book Ratio (PB)',
        priceToSalesRatio: 'Price to Sales Ratio (PS)',
        avgVolume: 'Avgerage Volume',
    };

  

</script>
  
  
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Free Stock Screener - Search, Filter and Analyze Stocks · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="A free stock screener to search, filter and analyze stocks with different indicators and metrics.">
    <!-- Other meta tags -->
    <meta property="og:title" content="Free Stock Screener - Search, Filter and Analyze Stocks · stocknear"/>
    <meta property="og:description" content="A free stock screener to search, filter and analyze stocks with different indicators and metrics.">
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Free Stock Screener - Search, Filter and Analyze Stocks · stocknear"/>
    <meta name="twitter:description" content="A free stock screener to search, filter and analyze stocks with different indicators and metrics.">
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>
      
  
      
  
  
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Stock Screener</li>
    </ul>
  </div>
      
  <div class="w-full max-w-4xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
  
      <!-- Start Column -->
      <div>
        <div class="flex flex-row justify-center items-center">
          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            Stock Screener
          </h1>
        </div>

        <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
          Scan the market with your own rules and find profitable stocks.
        </span>

        <div class="hidden sm:flex flex-col justify-center items-center m-auto pt-10 mb-10 sm:mb-0">
          <label for={data?.user ? "addStrategy": "userLogin"} class="flex flex-row items-center justify-center w-56 sm:w-72 hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 cursor-pointer py-2.5 px-4 font-medium text-center text-white rounded-full">
            <svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#E2E8F0" d="M16 2A14.172 14.172 0 0 0 2 16a14.172 14.172 0 0 0 14 14a14.172 14.172 0 0 0 14-14A14.172 14.172 0 0 0 16 2Zm8 15h-7v7h-2v-7H8v-2h7V8h2v7h7Z"/><path fill="none" d="M24 17h-7v7h-2v-7H8v-2h7V8h2v7h7v2z"/></svg>
            <span class="ml-2">
              New Strategy
            </span>
          </label>
        </div>


      </div>
      <!-- End Column -->
  
      <!-- Start Column -->
      <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
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
        

        <div class="z-1 absolute top-8">
          <img class="w-32 ml-3" src={logo} alt="logo" loading="lazy">
        </div>
      </div>
      <!-- End Column -->
    </div>

   
  </div>


    {#if isLoaded}
      {#if strategyList?.length === 0}
      <div class="flex justify-center items-center text-gray-400 font-bold text-2xl mt-10">
        No strategies available
      </div>
      {:else}
    
      <div class="hidden sm:block">
      {#each strategyList as st, index}
      <div class=" sm:rounded-xl border border-gray-800 pt-5 pb-5 sm:pb-0 mt-5">
        
        <div class="flex flex-row {$screenWidth >= 640 ? '-mb-4' : ''} ">
          <div class="text-white font-bold text-lg pl-5">
            {index+1}. Strategy
          </div>
        
          <div class="w-3/4 flex ml-auto flex-row justify-end items-center -mt-2">
            <div class="flex flex-col justify-center items-center mr-2">
              <label on:click|stopPropagation={() => handleView(st?.rules,st?.title)} for="viewStrategy" class="cursor-pointer w-8 h-8 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                <svg class="w-8 h-8 m-auto pt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1"></circle> <path d="M21 12C21 12 20 4 12 4C4 4 3 12 3 12" stroke="#fff" stroke-width="1"></path> </g></svg>
              </label>
              <span class="text-white text-xs mt-1">
                Rules
              </span>
            </div>
      
            <div class=" flex flex-col justify-center items-center ml-2 mr-2">
              <label on:click|stopPropagation={() => selectStrategy(st?.id)} class="cursor-pointer w-8 h-8 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                <svg class="h-6 w-6 m-auto pt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m19.3 8.925l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L19.3 8.925ZM17.85 10.4L7.25 21H3v-4.25l10.6-10.6l4.25 4.25Z"/></svg>
              </label>
              <span class="text-white text-xs mt-1">
                Open
              </span>
            </div>
      
            <div class=" flex flex-col justify-center items-center ml-2 mr-8">
              <label on:click|stopPropagation={() => deleteStrategyId= st?.id} for="deleteStrategy" class="cursor-pointer w-8 h-8 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                <svg class="h-6 w-6 m-auto pt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zm-200 0H360v-72h304v72z"/></svg>
              </label>
              <span class="text-white text-xs mt-1">
                Delete
              </span>
            </div>
          </div>
    
          <!--
          <div class="mt-1.5 ml-auto">
            <label 
              on:click={() => handleError(st?.rules)}
              class="flex items-center cursor-pointer"
            >

              <div class="relative {onlineDict[st?.id] ? 'opacity-[1.0]' : 'opacity-[0.4]'} ">
                <input
                  disabled={st?.rules.length === 0}
                  on:click={() => handleOnline(st?.rules, st?.id)} 
                  id={st?.id} 
                  checked={onlineDict[st?.id]} 
                  type="checkbox" 
                  class="sr-only"
                />
                <div class="w-10 h-4 bg-gray-400 rounded-full shadow-inner"></div>
                <div class="dot absolute w-6 h-6 bg-gray-400 rounded-full shadow -left-1 -top-1 transition"></div>
              </div>
            </label>
          </div>
    
          <span class="ml-2 mr-5 mt-1 text-gray-500 text-sm font-medium">
          {#if onlineDict[st?.id] === true}
            <span class="text-white text-sm">
              Online
            </span>
          {:else}
            <span class="text-gray-500 text-sm">
              Offline
            </span>
          {/if}
          </span>
          -->
        </div>
        
    
    
        <span class="text-white text-xs pl-5 italic">
          <svg class="inline-block w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#C2C4CA" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7l-.8 1.3Z"/></svg>
          Last updated: {formatDate(st?.updated)} ago
        </span>
    
        <div class="p-5 grid grid-cols-2 gap-10 flex justify-center items-center mb-2">
          <!--Start Column Title-->
          <div class="flex flex-col">
            <span class="text-white font-bold text-sm">
              Strategy Name
            </span>
            <span class="text-white text-sm">
              {st?.title}
            </span>
          </div>
          <!--End Column Title-->

          <!--Start Column Title-->
          <div class="flex flex-col">
            <span class="text-white font-bold text-sm">
              Number of Rules
            </span>
            <span class="text-white text-sm">
              {st?.rules?.length}
            </span>
          </div>
          <!--End Column Title-->


  
  
        </div>
      </div>
      {/each}
      </div>

      <div class="relative p-2 sm:hidden -mt-2">
        {#each strategyList as item, index}
          <div class="bg-[#09090B] shadow-lg rounded-lg border border-slate-800 h-fit pb-2 pl-4 pr-4 pt-4 mb-7">
              <div class="flex flex-row items-center">
                <label class="font-medium cursor-pointer flex flex-col w-40">
                  <span class="text-slate-300">No. Strategy</span>
                  <span class="text-slate-300 text-sm">{index+1}</span>
                </label>

                <div class="font-medium text-sm text-white flex flex-col justify-end items-end ml-auto">
                  <span class="text-end">Last updated</span>
                  <span class="text-end">
                    {formatDate(item?.updated)} ago
                  </span>
                </div>
              </div>
              <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />

              <div class="flex flex-row items-center">
                <div class="flex flex-col w-40">
                  <span class="font-medium text-slate-300">Title</span>
                  <span class="text-white text-sm font-medium">
                    {item?.title}
                  </span>
                </div>

                <div class="flex flex-col justify-end items-end ml-auto">
                  <span class="font-medium text-slate-300 text-ends">Total Rules</span>
                  <span class="text-white font-medium text-sm text-end">
                    {item?.rules?.length}
                  </span>
                </div>
              </div>

              <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />


              <div class="sm:hidden w-1/2 mt-5 m-auto flex flex-row justify-center items-center">
                <div class="flex flex-col justify-center items-center mr-5">
                  <label on:click|stopPropagation={() => handleView(item?.rules,item?.title)} for="viewStrategy" class="cursor-pointer w-12 h-12 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                    <svg class="w-10 h-10 hover:w-11 hover:h-11 ease-in-out duration-200 m-auto pt-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1"></circle> <path d="M21 12C21 12 20 4 12 4C4 4 3 12 3 12" stroke="#fff" stroke-width="1"></path> </g></svg>
                  </label>
                  <span class="text-white text-xs mt-1">
                    Rules
                  </span>
                </div>
          
                <div class=" flex flex-col justify-center items-center ml-5 mr-5">
                  <label on:click|stopPropagation={() => goto("/stock-screener/"+item?.id)} class="cursor-pointer w-12 h-12 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                    <svg class="h-8 w-8 hover:w-9 hover:h-9 ease-in-out duration-200 m-auto pt-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m19.3 8.925l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L19.3 8.925ZM17.85 10.4L7.25 21H3v-4.25l10.6-10.6l4.25 4.25Z"/></svg>
                  </label>
                  <span class="text-white text-xs mt-1">
                    Open
                  </span>
                </div>
          
                <div class=" flex flex-col justify-center items-center ml-5">
                  <label on:click|stopPropagation={() => deleteStrategyId= item?.id} for="deleteStrategy" class="cursor-pointer w-12 h-12 bg-[#0A59F5] hover:bg-[#0844BC] hover:ring-[1px] hover:bg-purple-600 bg-purple-600 bg-opacity-[0.6] duration-150 font-medium text-center text-white rounded-full">
                    <svg class="h-8 w-8 hover:w-9 hover:h-9 ease-in-out duration-200 m-auto pt-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zm-200 0H360v-72h304v72z"/></svg>
                  </label>
                  <span class="text-white text-xs mt-1">
                    Delete
                  </span>
                </div>
              </div>


          </div>
        {/each}
      </div>
    
    
      {/if}
    {:else}
    <div class="flex justify-center items-center h-80">
      <div class="relative">
      <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span class="loading loading-spinner loading-md"></span>
      </label>
      </div>
  </div>
    {/if}

    <div class="{!data?.user ? 'hidden' : ''} sm:hidden fixed z-50 w-full h-16 max-w-3xl -right-5 bottom-5">
      <div class="h-full max-w-3xl mx-auto">        
        <div class="flex items-center justify-end mr-10">
          <label for="addStrategy" class="inline-flex items-center justify-center w-14 h-14 font-medium bg-purple-600 bg-opacity-[0.6] rounded-full cursor-pointer">
            <svg class="w-8 h-8 text-white inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg>
          </label>
        </div>
      </div>
    </div>
    
  
  
  </section>
  
  
  
  
  
  
  
  
  
  
  <!--Start Add Strategy Modal-->
  <input type="checkbox" id="addStrategy" class="modal-toggle" />
  
  <dialog id="addStrategy" class="modal modal-bottom sm:modal-middle">
  
  
    <label for="addStrategy"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] border border-gray-800" >
  
        <h1 class="text-white text-2xl font-bold">
          New Strategy
        </h1>

  
  
      <form
        on:submit={createStrategy}
        method="POST"
        class="space-y-2 pt-5 pb-10 sm:pb-5"
        >
        <Input
          id="title"
          type="text"
          errors=''
          label="Strategy Name"
          required={true}
        />
      

        <button type="submit" class="mt-10 btn bg-purple-600 hover:bg-purple-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
          Create Strategy
        </button>
      
      </form>
  

  
          
        </div>
    </dialog>
  
  <!--End Add Strategy Modal-->
  
  
  
  
  <!--Start Edit Strategy Modal-->
  <input type="checkbox" id="editStrategy" class="modal-toggle" />
  
  <dialog id="editStrategy" class="modal modal-bottom sm:modal-middle">
  
  
    <label for="editStrategy"  class="cursor-pointer modal-backdrop"></label>
    
    
    <div class="modal-box w-full" >
  
      <ul class="mt-3 menu menu-compact text-[#A4AAB8] bg-[#000] rounded-md pt-3">
        <!--<hr>-->
        <li class="mb-3">
          <label on:click|stopPropagation={() => goto("/stock-screener/"+editStrategyId)} class="text-sm text-white cursor-pointer">
            <svg class="mr-auto h-5 w-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"/><path fill="white" d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2V19z"/></svg>
            Edit Strategy
          </label>
        </li>
        <li>
          <label class="text-sm text-[#E1341E] cursor-pointer">
            <svg class="mr-auto h-5 w-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#97372f" d="M7 21q-.825 0-1.413-.588T5 19V6q-.425 0-.713-.288T4 5q0-.425.288-.713T5 4h4q0-.425.288-.713T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.588 1.413T17 21H7ZM7 6v13h10V6H7Zm2 10q0 .425.288.713T10 17q.425 0 .713-.288T11 16V9q0-.425-.288-.713T10 8q-.425 0-.713.288T9 9v7Zm4 0q0 .425.288.713T14 17q.425 0 .713-.288T15 16V9q0-.425-.288-.713T14 8q-.425 0-.713.288T13 9v7ZM7 6v13V6Z"/></svg>  
            Delete Strategy
          </label>
      </li>
      </ul>
  
      <label for="editStrategy" class="btn btn-sm btn-circle absolute right-2 top-2 bg-red-600 hover:bg-red-800">✕</label>
          
        </div>
    </dialog>
  
  <!--End Edit Strategy Modal-->
  
  
  
  <!--Start Delete Strategy Modal-->
  <input type="checkbox" id="deleteStrategy" class="modal-toggle" />
  
  <dialog id="deleteStrategy" class="modal modal-bottom sm:modal-middle">
  
  
    <label for="deleteStrategy"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] border border-gray-800 overflow-hidden ">
  
      <h3 class="font-bold text-md sm:text-lg flex justify-center items-center mt-10 text-white">
        Are you sure you want to delete the strategy?
      </h3>
  
      <div class="modal-action w-full m-auto p-5 flex flex-col sm:flex-row items-center">
         
  
      <label for="deleteStrategy" on:click={handleDeleteStrategy} class="mt-5 btn bg-purple-600 hover:bg-purple-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
          Proceed
      </label>


      </div>
  
          
        </div>
    </dialog>
  
  <!--End Delete Strategy Modal-->
  
  
  
  {#if $screenWidth >=640}
  <!--Start View Strategy Modal-->
  <input type="checkbox" id="viewStrategy" class="modal-toggle" />
  
  <dialog id="viewStrategy" class="modal modal-bottom sm:modal-middle">
  
  
    <label for="viewStrategy"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] border border-gray-800 overflow-y-scroll overflow-hidden {$screenWidth < 640 ? 'min-h-screen' : 'h-[800px]'}">
  
  
      <!--Start Rule Preview-->
      <div class="mt-5 rounded-2xl pb-10">
      
        
        <div class="text-white font-bold text-3xl flex justify-start items-center ml-3 mb-5">
          {strategyTitle}
        </div>
  
  
        <div class="text-white font-bold text-2xl flex justify-start items-center ml-3 mt-5 pb-5">
          {ruleOfList?.length} Rules
        </div>
  
      
        {#each ruleOfList as rule,index}
          <div class="pl-3 pr-3 pb-2 text-white">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg">
                <div class="text-sm w-full mt-2">
                  <span class="mr-1">{index+1}.</span>
                  <!--<svg class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-green-400 indine-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>-->
                  {ruleMappings[rule.name] || rule.name} · {formatRuleValue(rule)}
                </div>
            </div>
          </div>
        {/each}       
      </div>
      <!--End Rule Preview-->

  </div>
</dialog>
<!--End View Strategy Modal-->



{:else}
<!--Start Drawer Sidewise for mobile-->


<div class="drawer drawer-end overflow-hidden" style="z-index: 9999">
  <input id="viewStrategy" type="checkbox" class="drawer-toggle"/>
 
  <div class="drawer-side overflow-hidden overflow-y-scroll">
    
    

  <div class="w-screen min-h-full bg-[#000] text-base-content overflow-y-scroll overflow-hidden p-2 pb-10">
    <!-- Search layout -->
    <div class="text-white font-bold text-2xl flex justify-start items-center pl-3 mt-5 pb-5 pt-10">
      {ruleOfList?.length} Rules · {strategyTitle}
    </div>


    {#each ruleOfList as rule,index}
          <div class="pl-3 pr-3 pb-2 text-white">
            <div class="flex flex-row items-center w-full bg-[#09090B] p-3 rounded-lg">
                <div class="text-sm w-full mt-2">
                  <span class="mr-1">{index+1}.</span>
                  <!--<svg class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-green-400 indine-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>-->
                  {ruleMappings[rule.name] || rule.name} · {formatRuleValue(rule)}
                </div>
            </div>
          </div>
        {/each}



<label for="viewStrategy" class="absolute left-6 top-4">
  <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
  <span class="text-white text-md font-medium">
    Return
  </span>
</label>

</div>

  </div>
</div>


<!--End Drawer Sidewise for mobile-->
{/if}



<!--Start Login Modal-->
{#if LoginPopup}
   <LoginPopup form={form}/>    
{/if}
<!--End Login Modal-->





<style>
  
  input:checked ~ .dot {
    transform: translateX(100%);
    background-color: #26D967;
  }
  
  
</style>