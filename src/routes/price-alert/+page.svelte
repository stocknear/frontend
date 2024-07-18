<script lang='ts'>
import { numberOfUnreadNotification } from '$lib/store';
//import { enhance } from '$app/forms';
import toast from 'svelte-french-toast';
import { goto } from '$app/navigation';
import { userRegion, screenWidth } from '$lib/store';
import MiniPlot from '$lib/components/MiniPlot.svelte';
import { onMount } from 'svelte';


let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let fastifyURL;

userRegion.subscribe(value => {
    if (usRegion.includes(value)) {
    fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
    fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
});

export let data;

const rawData = data?.getMiniPlotsIndex;


let editMode = false;
let numberOfChecked = 0;
let deletePriceAlertList = [];

let priceDataSP500;
let priceDataNasdaq;
let priceDataDowJones;
let priceDataRussel2000;

let changeSP500, changeNasdaq, changeDowJones, changeRussel2000;
let previousCloseSP500, previousCloseNasdaq, previousCloseDowJones, previousCloseRussel2000;
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

let isLoaded = false;
let priceAlertList = [];
        
    
    
async function getPriceAlert()
{
    const postData = {'userId': data?.user?.id}
    const response = await fetch(fastifyURL+'/get-price-alert', {
    method: 'POST',
    headers: {
     "Content-Type": "application/json"
    },
    body: JSON.stringify(postData)
});

    priceAlertList = (await response.json())?.items;
    priceAlertList= priceAlertList?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));
}



function stockSelector(symbol, assetType) {
    if (editMode) {
    }
    else {
        goto(`/${assetType === 'stock' ? 'stocks' : assetType === 'etf' ? 'etf' : 'crypto'}/${symbol}`)
    }
}


async function handleFilter(priceAlertId) {

  const filterSet = new Set(deletePriceAlertList);

  // Check if the new filter already exists in the list
  if (filterSet?.has(priceAlertId)) {
    // If it exists, remove it from the list
    filterSet?.delete(priceAlertId);
  } else {
    // If it doesn't exist, add it to the list
    filterSet?.add(priceAlertId);

  }
  deletePriceAlertList = Array?.from(filterSet);
  numberOfChecked = deletePriceAlertList?.length;
}

async function handleDelete() {

    if (numberOfChecked === 0) {
        toast.error(`You need to select symbols before you can delete them`, {
            style: 'border-radius: 10px; background: #333; color: #fff;  padding: 12px; margin-top: 10px; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);',
        });
    }
    else {

        priceAlertList = priceAlertList?.filter(item => !deletePriceAlertList?.includes(item?.id));

        priceAlertList = [...priceAlertList];

        const postData = {
            'priceAlertIdList': deletePriceAlertList
        }

        const response = await fetch(fastifyURL+'/delete-price-alert', {
            method: 'POST',
            headers: {
             "Content-Type": "application/json"
            },
            body: JSON.stringify(postData)
        });
        deletePriceAlertList = [];
        numberOfChecked = 0;

    }

}


onMount( async () => {

if (data?.user)
{
    await getPriceAlert()

}
isLoaded = true;



});




let charNumber = 20;

  
$: {
  if ($screenWidth < 640)
  {
    charNumber = 15;
  }
  else {
    charNumber = 20;
  }
}

    
    
</script>


<svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Price Alert · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />

    <meta name="description" content="Set a price alert and get instant notification.">
    <!-- Other meta tags -->
    <meta property="og:title" content="Price Alert · stocknear"/>
    <meta property="og:description" content="Set a price alert and get instant notification.">
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Price Alert · stocknear"/>
    <meta name="twitter:description" content="Set a price alert and get instant notification.">
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>
        
    
          
        
        
            
        
        
    <div class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
         
      <div  class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
      
          <!-- Start Column -->
          <div>
            <div class="flex flex-row justify-center items-center">
              <h1 class="text-4xl sm:text-5xl text-white font-bold mb-5">
                Price Alert
              </h1>
            </div>
    
            <span class="text-white text-md font-medium text-center flex justify-center  items-center ">
              Get email notifications instantly when your alert goes off, so you never miss out!
            </span>
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
            
            
            <div class="z-1 absolute top-2">
              <img class="w-[120px] h-fit ml-10" src={cloudFrontUrl+"/assets/price_alert_logo.png"} alt="logo" loading='lazy'>
            </div>
          </div>
          <!-- End Column -->
      
        </div>
      </div>
        
    
        {#if isLoaded}
    
        <div class="w-full sm:-mt-6 mb-8 m-auto flex justify-center items-center p-3">
          <div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 lg:gap-y-0 gap-x-3 ">
          <MiniPlot title="S&P500" priceData = {priceDataSP500} changesPercentage={changeSP500} previousClose={previousCloseSP500}/>
          <MiniPlot title="Nasdaq 100" priceData = {priceDataNasdaq} changesPercentage={changeNasdaq} previousClose={previousCloseNasdaq}/>
          <MiniPlot title="Dow Jones" priceData = {priceDataDowJones} changesPercentage={changeDowJones} previousClose={previousCloseDowJones}/>
          <MiniPlot title="Russel 2000" priceData = {priceDataRussel2000} changesPercentage={changeRussel2000} previousClose={previousCloseRussel2000}/>
          </div>
        </div>
    
        
    
            {#if priceAlertList?.length === 0}
            <div class="flex flex-col justify-center items-center m-auto pt-8">
                <span class="text-white font-bold text-white text-xl sm:text-3xl">
                    No Alerts set
                </span>
    
                <span class="text-white text-sm sm:text-[1rem] m-auto p-4 text-center">
                    Create price alerts for your stocks that have the most potential in your opinion.
                </span>
                {#if !data?.user}
                <a class="w-64 flex mt-10 justify-center items-center m-auto btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group" href="/register">
                    Get Started 
                    <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
                    </span>
                </a>
                {/if}
    
            </div>
            {:else}

            <div class="flex flex-row justify-end items-center pr-4 sm:pr-0 pb-2">
                {#if editMode}
                <label on:click={handleDelete} class="cursor-pointer bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out px-4 py-2 rounded-lg shadow-lg mr-3">
                    <svg class="inline-block w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"/></svg>
                    <span class="ml-1 text-white text-sm">
                        {numberOfChecked}
                    </span>
                </label>
                {/if}
                <label on:click={() => editMode = !editMode} class="cursor-pointer bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out px-4 py-2 rounded-lg shadow-lg">
                    <svg class="inline-block w-5 h-5" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 1024 1024"><path fill="white" d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"/><path fill="white" d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"/></svg>
                    {#if !editMode}
                    <span class="ml-1 text-white text-sm">
                        Edit
                    </span>
                    {:else}
                    <span class="ml-1 text-white text-sm">
                      Cancel
                    </span>
                    {/if}
                </label>
            </div>
            <!--Start Table-->
            <div class="w-screen sm:w-full rounded-lg overflow-hidden overflow-x-scroll no-scrollbar">
                <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto mt-4 ">
                  <!-- head -->
                  <thead>
                    <tr class="">
                      <th class="text-white hidden sm:table-cell font-medium text-sm ">Symbol</th>
                      <th class="text-white font-medium text-sm ">Company</th>
                      <th class="text-white hidden sm:table-cell font-medium text-center text-sm ">Volume</th>
                      <th class="text-white font-medium text-end text-sm ">Price when Created</th>
                      <th class="text-white font-medium text-end text-sm ">Price Target</th>
                      <th class="text-white font-medium text-end text-sm ">Today</th>
                    </tr>
                  </thead>
                  <tbody class="p-3">
                    {#each priceAlertList as item, index}
                    <!-- row -->
                    <tr on:click={() => stockSelector(item?.symbol, item?.assetType)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] cursor-pointer">
                      
                      <td on:click={() => handleFilter(item?.id)} class="hidden sm:table-cell text-blue-400 font-medium text-sm text-start border-b-[#09090B] flex flex-row items-center">
                        <input type="checkbox" checked={deletePriceAlertList?.includes(item?.id) ?? false} class="{!editMode ? 'hidden' : ''} bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 mr-3" />
                        {item?.symbol}
                      </td>
        
                      <td on:click={() => handleFilter(item?.id)} class="text-gray-200 border-b-[#09090B]">
                        
                        <span class="hidden sm:block text-white">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                        <div class="sm:hidden flex flex-row items-center">
                            <input type="checkbox" checked={deletePriceAlertList?.includes(item?.id) ?? false} class="{!editMode ? 'hidden' : ''} bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 mr-3" />
                          <div class="flex flex-col w-24">
                            <span class="text-blue-400 font-medium">{item?.symbol}</span>
                            <span class="text-white">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                          </div>
                        </div>
                      </td>
                    
                    <td class="hidden sm:table-cell text-white font-medium text-sm text-center border-b-[#09090B]">
                        {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(item?.volume)}
                        
                    </td>
                    <td class="text-white font-medium text-sm text-end border-b-[#09090B]">
                        ${item?.priceWhenCreated}
                    </td>

        
                    <td class="text-white font-medium text-sm text-end border-b-[#09090B]">
                        ${item?.targetPrice}
                    </td>

        
                    <td class="text-gray-200 border-b-[#09090B]">
                      <div class="flex flex-row justify-end items-center">
        
                        <div class="flex flex-col mt-3">
                          <span class="text-white font-medium text-md ml-auto">${item.price?.toFixed(2)}</span>
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
            <!--End Table-->


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
        
        </div>
        
        
    
    