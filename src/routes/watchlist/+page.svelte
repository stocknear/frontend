<script lang='ts'>
import { numberOfUnreadNotification } from '$lib/store';
//import { enhance } from '$app/forms';
import toast from 'svelte-french-toast';
import { onDestroy, onMount } from 'svelte';
import { Drawer } from "vaul-svelte";

import Input from '$lib/components/Input.svelte';
import WatchListCard from '$lib/components/WatchListCard.svelte';
import {screenWidth, switchWatchList } from '$lib/store';
import MiniPlot from '$lib/components/MiniPlot.svelte';
import { goto } from '$app/navigation';
import ArrowLogo from "lucide-svelte/icons/move-up-right";

let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;



export let data;

const rawData = data?.getMiniPlotsIndex;

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

    let displayWatchList;

    let allList = [];
    
  
  async function handleRenameList() {
    const clicked = document.getElementById('editNameWatchList');
    clicked.dispatchEvent(new MouseEvent('click'));
    const unClicked = document.getElementById('settingsWatchListModal');
    unClicked.dispatchEvent(new MouseEvent('click'));

  }

async function handleDeleteList() {
    const clicked = document.getElementById('deleteWatchList');
    clicked.dispatchEvent(new MouseEvent('click'));
    const unClicked = document.getElementById('settingsWatchListModal');
    unClicked.dispatchEvent(new MouseEvent('click'));

  }
    

async function createWatchList(event) {
  event.preventDefault(); // prevent the default form submission behavior

  const formData = new FormData(event.target); // create a FormData object from the form

  const title = formData.get('title');

  if (!title || title?.length === 0) {
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
  for (const [key, value] of formData?.entries()) {
    postData[key] = value;
  }

  try {
    const response = await fetch(data?.fastifyURL + '/create-watchlist', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData),
    }); // make a POST request to the server with the FormData object

    if (response.ok) {
      toast.success('Watchlist created successfully!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });

      
        const clicked = document.getElementById('addWatchList');
        clicked?.dispatchEvent(new MouseEvent('click'));

        const anchor = document.createElement('a');
        anchor.href = '/watchlist';
        anchor.dispatchEvent(new MouseEvent('click'));
       
      
    } else {
      toast.error('Something went wrong. Please try again!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('An error occurred. Please try again later.', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
  }
}



async function editNameWatchList(event) {
  event.preventDefault(); // prevent the default form submission behavior

  const formData = new FormData(event.target); // create a FormData object from the form

  const title = formData.get('title');

  if (!title || title?.length === 0) {
    toast.error('Title cannot be empty!', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
    return;
  }

  if (title?.length > 40) {
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

  try {
    const response = await fetch(data?.fastifyURL + '/edit-name-watchlist', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData),
    }); // make a POST request to the server with the FormData object
    const output = (await response.json())?.items;

    if (output === 'success') {
      toast.success('Watchlist renamed successfully!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });

      for (const item of allList) {
        if (item?.title === postData['title']) {
          item.title = postData['title'];
        }
      }

      // Initialize an index variable
      let foundIndex = -1;
      // Iterate through the list and replace "Short" with "Long"
      allList?.forEach((item, index) => {
        if (item?.title === displayWatchList?.title) {
          item.title = postData?.title;
          foundIndex = index; // Store the index where the title was found
        }
      });

      allList = [...allList];
      displayWatchList = allList[foundIndex]

      const clicked = document.getElementById('editNameWatchList');
      clicked.dispatchEvent(new MouseEvent('click'));
       
      
    } else {
      toast.error('Something went wrong. Please try again!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('An error occurred. Please try again later.', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
  }
}





async function deleteWatchList(event) {
  event.preventDefault(); // prevent the default form submission behavior

  const postData = {'watchListId': displayWatchList?.id};

  try {
    
    const response = await fetch(data?.fastifyURL + '/delete-watchlist', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData),
    });

    const output = (await response.json())?.items;
    
  
    if (output === 'success') {
      toast.success('Watchlist deleted successfully!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });



      allList = allList?.filter(item => item?.id !== displayWatchList?.id);
      allList = [...allList];

      displayWatchList = allList[0];
      changeWatchList(displayWatchList);


      const clicked = document.getElementById('deleteWatchList');
      clicked.dispatchEvent(new MouseEvent('click'));
       
      
    } else {
      toast.error('Something went wrong. Please try again!', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('An error occurred. Please try again later.', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
  }
}



async function getAllListData()
{
    const postData = {'userId': data?.user?.id}
    const response = await fetch(data?.fastifyURL+'/all-watchlists', {
    method: 'POST',
    headers: {
    "Content-Type": "application/json"
    },
    body: JSON.stringify(postData)
});

    allList = (await response.json())?.items;
    console.log(allList)

    if(allList?.length !== 0)
    {
      displayWatchList = allList[0]
    }
    else {
      displayWatchList = '';
    }
    

}

function changeWatchList(newWatchList)
{
  displayWatchList = newWatchList;
  $switchWatchList = true;

}


onMount( async () => {

if (data?.user)
{
  await getAllListData()

}
isLoaded = true;



});

onDestroy( () => {
  $switchWatchList = false;
})




</script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Stock Watchlist · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="A stock watchlist tracker tool. Add stocks and ETFs to keep track of their performance.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Stock Watchlist · stocknear"/>
  <meta property="og:description" content="A stock watchlist tracker tool. Add stocks and ETFs to keep track of their performance.">
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Stock Watchlist · stocknear"/>
  <meta name="twitter:description" content="A stock watchlist tracker tool. Add stocks and ETFs to keep track of their performance.">
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    

      
    
    
        
    
    
<section class="w-full max-w-3xl sm:max-w-screen-2xl overflow-hidden min-h-screen pt-5 pb-40 lg:px-3">
          
  <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li>
      <li class="text-gray-300">Watchlist</li>
    </ul>
  </div>
          
  <div class="w-full overflow-hidden m-auto mt-5">
    
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
        <div class="relative flex justify-center items-start overflow-hidden w-full">


            <main class="w-full lg:w-3/4 lg:pr-5">


              <div class="w-full  m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
  
      <!-- Start Column -->
      <div>
        <div class="flex flex-row justify-center items-center">
          <h1 class="text-4xl sm:text-5xl text-white font-bold mb-5">
            Watchlist
          </h1>
        </div>

        <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center  items-center ">
          Monitor the performance and recent updates of your favorite stocks.
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
        
        <div class="z-1 absolute top-3 right-10 ">
          <img class="w-24" src={cloudFrontUrl+"/assets/watchlist_icon.png"} alt="logo" loading='lazy'>
        </div>
      </div>
      <!-- End Column -->
  
    </div>
  </div>
    

    {#if isLoaded}

    <div class="text-white text-xs sm:text-sm pb-5 sm:pb-2 pl-3 sm:pl-0">
      Stock Indexes - {getCurrentDateFormatted()}
    </div>

    <div class="w-full -mt-4 sm:mt-0 mb-8 m-auto flex justify-start sm:justify-center items-center p-3 sm:p-0">
      <div class="w-full grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-3 ">
      <MiniPlot title="S&P500" priceData = {priceDataSP500} changesPercentage={changeSP500} previousClose={previousCloseSP500}/>
      <MiniPlot title="Nasdaq" priceData = {priceDataNasdaq} changesPercentage={changeNasdaq} previousClose={previousCloseNasdaq}/>
      <MiniPlot title="Dow" priceData = {priceDataDowJones} changesPercentage={changeDowJones} previousClose={previousCloseDowJones}/>
      <MiniPlot title="Russel" priceData = {priceDataRussel2000} changesPercentage={changeRussel2000} previousClose={previousCloseRussel2000}/>
      </div>
    </div>

    {#if allList?.length !== 0}
      <div class="flex flex-row items-center w-full">

        <div class="flex flex-row items-center justify-between w-full">
          <label for="allList" class="ml-2 cursor-pointer w-auto px-4 bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out flex justify-center items-center py-3 rounded-lg shadow-lg">
            <span class="text-white text-md">
              {displayWatchList?.title?.length > 10 ? displayWatchList?.title?.slice(0,10) + '...' : displayWatchList?.title}
            </span>

            <svg class="inline-block w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
              <g transform="rotate(180 512 512)">
                  <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/>
              </g>
          </svg>

          </label>


          <label for="settingsWatchListModal" class="ml-auto sm:ml-5 mr-3 sm:mr-auto  cursor-pointer">
            <div class="rounded-full w-10 h-10 relative flex items-center justify-center">
              <svg class="w-6 h-6 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                <path fill="#cacaca" d="M156 128a28 28 0 1 1-28-28a28 28 0 0 1 28 28ZM48 100a28 28 0 1 0 28 28a28 28 0 0 0-28-28Zm160 0a28 28 0 1 0 28 28a28 28 0 0 0-28-28Z"/>
            </svg>
            </div>
          </label>

        </div>
      

          <label for="addWatchList" class="{$screenWidth < 640 || !data?.user ? 'hidden' : ''} cursor-pointer w-48 md:w-44 bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out flex justify-center items-center py-3 rounded-lg shadow-lg mr-2">
            <svg class="w-5 h-5 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M16 2A14.172 14.172 0 0 0 2 16a14.172 14.172 0 0 0 14 14a14.172 14.172 0 0 0 14-14A14.172 14.172 0 0 0 16 2Zm8 15h-7v7h-2v-7H8v-2h7V8h2v7h7Z"/><path fill="none" d="M24 17h-7v7h-2v-7H8v-2h7V8h2v7h7v2z"/></svg>
            <span class="ml-1 text-white text-sm">New Watchlist</span>
          </label>
        

      </div>
      {:else}
      <div class ="w-full m-auto flex justify-center items-center">
        <label for="addWatchList" class="{$screenWidth < 640 || !data?.user ? 'hidden' : ''} light-box cursor-pointer w-48 md:w-44 bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out flex justify-center items-center py-3 rounded-lg shadow-lg">
          <svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M16 2A14.172 14.172 0 0 0 2 16a14.172 14.172 0 0 0 14 14a14.172 14.172 0 0 0 14-14A14.172 14.172 0 0 0 16 2Zm8 15h-7v7h-2v-7H8v-2h7V8h2v7h7Z"/><path fill="none" d="M24 17h-7v7h-2v-7H8v-2h7V8h2v7h7v2z"/></svg>
          <span class="ml-2 text-white text-md">New Watchlist</span>
        </label>
      </div>
      {/if}

        {#if allList.length === 0}
        <div class="flex flex-col justify-center items-center m-auto pt-8">
            <span class="text-white font-bold text-white text-xl sm:text-3xl">
                Empty Watchlist
            </span>

            <span class="text-white text-sm sm:text-lg m-auto p-4 text-center">
                Fill it up with your favorite stocks and get realtime data and the latest news in one place!
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

        <WatchListCard
          watchListId={displayWatchList?.id}
          apiURL = {data?.apiURL}
          apiKey = {data?.apiKey}
        />
        
        
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
  
    
    



<!--Start Create Watchlist Modal-->
{#if $screenWidth < 640}
<!-- Mobile modal using Drawer component -->
<Drawer.Root>
    <!-- Trigger button -->
    <Drawer.Trigger>

      <div class="{!data?.user ? 'hidden' : ''} sm:hidden fixed w-full h-16 max-w-3xl -right-5 bottom-3">
        <div class="h-full max-w-3xl mx-auto">        
          <div class="flex items-center justify-end mr-10">
            <label class="inline-flex items-center justify-center w-14 h-14 border border-[#000] ring-[#000] bg-[#0DDE00] text-[0.95rem] font-bold rounded-full text-[#09090B]">
              <svg class="w-8 h-8 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="black" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
            </label>
          </div>
        </div>
      </div>

    </Drawer.Trigger>

    <Drawer.Portal>
    <!-- Overlay for mobile modal -->
    <Drawer.Overlay class="fixed inset-0 bg-black/40" />
    
    <!-- Mobile modal content -->
    <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] bg-[#09090B]">
        <!-- Modal content -->
        <form on:submit={createWatchList}
        class="space-y-2 pt-5 pb-5 flex-1 rounded-t-[10px] bg-[#09090B] p-4"
        >
        <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
        <div class="flex flex-col items-center m-auto text-center mb-10">
            <Drawer.Title class="text-white text-xl mb-2 font-medium">New Watchlist</Drawer.Title>
                          
              <Input
              id="title"
              type="text"
              label="List Name"
              errors=''
              required={true}
              />

              <input class="hidden" name='user' value={data?.user?.id} />
              <input class="hidden" name='ticker' value={JSON.stringify([])} />
          
              <Drawer.Close class="w-full max-w-lg mt-5 mb-5">
                <button type="submit" class="cursor-pointer px-7 py-2 rounded-full bg-[#0DDE00] text-center text-black font-medium">
                  Create
                </button>
              </Drawer.Close>
        </div>
        </form>
    </Drawer.Content>
    </Drawer.Portal>
</Drawer.Root>
{:else}

  <!-- Desktop modal using dialog component -->
    <input type="checkbox" id="addWatchList" class="modal-toggle" />
  
    <dialog id="addWatchList" class="modal modal-middle">
      <!-- Modal backdrop for desktop -->
      <label for="addWatchList" class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
      <!-- Desktop modal content -->
      <div class="modal-box w-full bg-[#191919]">
        <div class="text-white mb-5">
          <h3 class="font-bold text-2xl mb-5">New Watchlist</h3>
          
          <form
            on:submit={createWatchList}
            class="space-y-2 w-11/12 m-auto"
            >
            <Input
            id="title"
            type="text"
            label="List Name"
            errors=''
            required={true}
            />

            <input class="hidden" name='user' value={data?.user?.id} />
            <input class="hidden" name='ticker' value={JSON.stringify([])} />


            <button type="submit" class="mt-10 btn bg-purple-600 hover:bg-purple-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
              Create List
          </button>
        </form>

        </div>
      </div>
    </dialog>
  {/if}
  
<!--End Create Watchlist Modal-->



    



<!--Start Settings Watchlist Modal-->
<input type="checkbox" id="settingsWatchListModal" class="modal-toggle" />

<dialog id="settingsWatchListModal" class="modal modal-bottom sm:modal-middle">


    <label for="settingsWatchListModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] pb-5">

      <div class="flex flex-row items-center mb-8">
        <h3 class="text-white text-2xl font-bold">
        Settings
        </h3>
      </div>

      <label on:click={handleRenameList} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5 mt-5">

        <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg">
          
          <div class="flex flex-col items-center w-full">
            <span class="ml-1 text-white font-medium mr-auto">
              Rename List
            </span>
          </div>
          <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="#CBD5FF" d="M15 3c1.296 0 2.496.41 3.477 1.11l-9.134 9.133a1 1 0 1 0 1.414 1.414l9.134-9.134A5.977 5.977 0 0 1 21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10Zm6.657-.657a1 1 0 0 1 0 1.414L19.89 5.523a6.035 6.035 0 0 0-1.414-1.414l1.766-1.766a1 1 0 0 1 1.414 0Z"/></g></svg>
        </div>
      
    </label>


    <label on:click={handleDeleteList} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5 mt-5">

      <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg">
        
        <div class="flex flex-col items-center w-full">
          <span class="ml-1 text-white font-medium mr-auto">
            Delete List
          </span>
        </div>
          <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="#CBD5FF" d="M20 5a1 1 0 1 1 0 2h-1l-.003.071l-.933 13.071A2 2 0 0 1 16.069 22H7.93a2 2 0 0 1-1.995-1.858l-.933-13.07A1.017 1.017 0 0 1 5 7H4a1 1 0 0 1 0-2h16Zm-6-3a1 1 0 1 1 0 2h-4a1 1 0 0 1 0-2h4Z"/></g></svg>
      </div>    
  </label>


  </div>
</dialog>

<!--End Settings Watchlist Modal-->


    


<!--Start Edit Watchlist Modal-->

<input type="checkbox" id="editNameWatchList" class="modal-toggle" />

<dialog id="editNameWatchList" class="modal modal-bottom sm:modal-middle">


    <label for="editNameWatchList"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-600 " >

    <div class="flex flex-row items-center">
        <h3 class="text-white text-2xl font-bold">
        Rename Watchlist
        </h3>
    </div>



    <form
        on:submit={editNameWatchList}
        method="POST"
        class="space-y-2 pt-5 pb-10"
        >
        <Input
        id="title"
        type="text"
        label="New Name"
        errors=''
        required={true}
        />

        <input class="hidden" value={displayWatchList?.id} name ="watchListId"/>
    
        <button type="submit" class="mt-10 btn bg-purple-600 hover:bg-purple-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
            Update Name
        </button>
    </form>

   
        </div>
    </dialog>

<!--End Edit Watchlist Modal-->

    
    
<!--Start Delete Strategy Modal-->

<input type="checkbox" id="deleteWatchList" class="modal-toggle" />

<dialog id="deleteWatchList" class="modal modal-bottom sm:modal-middle">


  <label for="deleteWatchList"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-600 overflow-hidden">

    <h3 class="font-bold text-xl mb-5 pt-5 text-white m-auto w-3/4 text-center">
      Are you sure you want to delete the watchlist?
    </h3>

    <div class="modal-action w-full m-auto p-5 flex flex-col sm:flex-row items-center">
        
      <label on:click={deleteWatchList} class="sm:ml-3 btn bg-[#FF3131] hover:bg-[#ff4343] text-white btn-md w-full rounded-lg text-white font-bold text-md">
        Proceed
      </label>

    </div>

        
      </div>
  </dialog>

<!--End Delete Strategy Modal-->
    
    





<!--Start View All List-->
<input type="checkbox" id="allList" class="modal-toggle" />
    
<dialog id="allList" class="modal modal-bottom sm:modal-middle ">


  <label id="allList" for="allList"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-800">

    <h3 class="text-white text-2xl font-bold">
      Watchlists
    </h3>

  <label for="allList" class="cursor-pointer absolute right-5 top-5 bg-[#09090B] text-[1.8rem] text-white">
    <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"/></svg>
  </label>

    <div class="text-white mt-10">

      <div class="flex flex-col items-center w-full max-w-3xl bg-[#09090B]">

        {#each allList as item}
          <label for="allList" on:click={() => changeWatchList(item)} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {item === displayWatchList ? 'ring-2 ring-[#04E000]' : ''}">
                
                <div class="flex flex-col items-center w-full">
                  <span class="ml-1 text-white font-medium mr-auto">
                    {item?.title?.length > 40 ? item?.title?.slice(0,40) : item?.title}
                  </span>
                  <span class="ml-1 text-white text-opacity-40 text-sm font-medium mr-auto">
                    {item?.ticker?.length} Companies
                  </span>
                </div>
               

                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if item === displayWatchList}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>

              </div>
            
          </label>
        {/each}

      </div>
       
    </div>


        
      </div>
  </dialog>
<!--End View All List-->
    
    
    
  
<style lang="scss">

.light-box {
          --border-size: 2px;
          --border-angle: 0turn;
          background-image: conic-gradient(from var(--border-angle), #213, #112 50%, #213), conic-gradient(from var(--border-angle), transparent 20%, #08f, #f03);
          background-size: calc(100% - (var(--border-size) * 2)) calc(100% - (var(--border-size) * 2)), cover;
          background-position: center center;
          background-repeat: no-repeat;
        animation: bg-spin 3s linear infinite;
        @keyframes bg-spin {
          to {
            --border-angle: 1turn;
          }
        }
      }
  
      @property --border-angle {
    syntax: "<angle>";
    inherits: true;
    initial-value: 0turn;
  }
  

    </style>
    