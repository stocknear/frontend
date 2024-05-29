<script lang='ts'>
  import "../app.css";

  import { Toaster } from 'svelte-french-toast';
  import {getImageURL} from '$lib/utils';

  import NProgress from 'nprogress';
  import 'nprogress/nprogress.css';

  import { page } from '$app/stores';
  import Footer from '$lib/components/Footer.svelte';
  import Searchbar from '$lib/components/Searchbar.svelte';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import PullToRefresh from '$lib/components/PullToRefresh.svelte';

  //import DiscountBanner from '$lib/components/DiscountBanner.svelte';
  
  import { beforeNavigate, afterNavigate, goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { showCookieConsent,  newAvatar, userRegion, screenWidth, stockTicker, etfTicker, searchBarData, loginData, numberOfUnreadNotification, cachedPosts, currentPagePosition, clientSideCache, twitchStatus } from '$lib/store';

  
  export let data;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;



async function pushNotification() {
  Notification?.requestPermission()?.then(perm => {
    if (perm === 'granted') {
      new Notification('Stocknear', {
        body: 'this is more text',
      })
    }
  })
}


  //Check Service Worker (SW)
async function detectSWUpdate() {
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing;
      newSW?.addEventListener('statechange', () => {
        if(newSW.state === 'installed') {
          if(confirm('New Update available! Reload to update?')) {
            newSW.postMessage({'type': 'SKIP_WAITING'});
            window.location.reload();
          }
        }
      })
    })
  }

  $userRegion = data?.region?.split("::")[0];

  let stockGuide = false;
  let etfGuide = false;
  let calendarGuide = false;
  let optionsGuide = false;
  let politicianGuide = false;

  let showSidebar = false;
  let collapse = false;


  const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL;
  let fastifyURL;

  userRegion.subscribe(value => {

    if (usRegion?.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
      fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
      fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
  });


  let hideHeader = false;

  NProgress.configure({ showSpinner: false });

  $: {
    const currentPath = $page.url.pathname;

    if (currentPath.startsWith('/etf/etf-providers') || currentPath.startsWith('/etf/new-launches')) {
      hideHeader = false; // Show the header for "/etf/etf-providers"
    } else if (currentPath.startsWith('/etf/')) {
      hideHeader = true; // Hide the header for other routes under "/etf/"
    }  else if (currentPath.startsWith('/crypto/')) {
      hideHeader = true; // Hide the header for other routes under "/etf/"
    } else {
      // Specify conditions for other routes where you want to hide the header
      hideHeader = currentPath.startsWith('/community/post') || currentPath.startsWith('/stocks/');
    }
  }

  $: hideFooter = $page.url.pathname.startsWith('/options-flow') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register') || $page.url.pathname.startsWith('/etf') || $page.url.pathname.startsWith('/stock-splits-calendar') || $page.url.pathname.startsWith('/dividends-calendar') || $page.url.pathname.startsWith('/earnings-calendar') || $page.url.pathname.startsWith('/market-mover') || $page.url.pathname.startsWith('/market-news') || $page.url.pathname.startsWith('/portfolio') || $page.url.pathname.startsWith('/hedge-funds') || $page.url.pathname.startsWith('/watchlist') || $page.url.pathname.startsWith('/stocks') || $page.url.pathname.startsWith('/community') || $page.url.pathname.startsWith('/stock-screener') || $page.url.pathname.startsWith('/price-alert');

  $: hideSidebar = $page.url.pathname.startsWith('/pricing') || $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/imprint') || $page.url.pathname.startsWith('/privacy-policy') || $page.url.pathname.startsWith('/terms-of-use') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/community/create-post') || $page.url.pathname.startsWith('/community/post/') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register')

 
  let hasUnreadElement = false;
  let notificationList = [];

function handleCollapse() {
  if ($screenWidth > 640)
  {
  collapse = !collapse
  stockGuide = false;
  etfGuide = false;
  optionsGuide = false;
  calendarGuide = false;
  }
}

function handleStockGuide() {

  stockGuide = !stockGuide;
  collapse = false;
}

function handleETFGuide() {

  etfGuide = !etfGuide;
  collapse = false;

}

function handleCalendarGuide() {
calendarGuide = !calendarGuide;
collapse = false;
}

function handleOptionsGuide() {
optionsGuide = !optionsGuide;
collapse = false;
}

function handlePoliticianGuide() {
politicianGuide = !politicianGuide;
collapse = false;
}




/** Dispatch event on click outside of node */
function clickOutside(node) {
  const handleClick = event => {
    // Get the element that was clicked
    const clickedElement = event.target;

    // Check if the clicked element or its parent matches the ignoreSelector
    if (clickedElement.closest('#navbar')) {
      // If it does, do nothing (the click was inside the ignored element)
      return;
    }

    // Original condition, plus the new check for the nav element
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(
        new CustomEvent('click_outside', node)
      );
    }
  }

  document.addEventListener('click', handleClick, true);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  }
}

function handleClickOutside(event) {
		showSidebar = false;
	}


//Define web workers:
let syncWorker: Worker | undefined = undefined;
// Handling messages from the worker
const handleMessage = (event) => {
    const output = event.data?.output;
    $searchBarData = output?.searchBarData;
    notificationList = output?.notificationList
    hasUnreadElement = output?.hasUnreadElement;
    const unreadNotificationList = output?.unreadNotificationList;
    $numberOfUnreadNotification = output?.numberOfUnreadNotification;
    //pushNotification()

};

const handleTwitchMessage = (event) => {
    const output = event.data?.output;
   $twitchStatus = output?.twitchStatus;
};


const loadWorker = async () => {

  if ('serviceWorker' in navigator) {
  const SyncWorker = await import('$lib/workers/searchNotificationWorker?worker');
  syncWorker = new SyncWorker.default();

  syncWorker.postMessage({ message: {'apiURL': apiURL, 'fastifyURL': fastifyURL, 'userId': data?.user?.id }});
  syncWorker.onmessage = handleMessage;
  } else {
    // Fallback logic here
    await fallbackWorker();
  }
  

};

async function fallbackWorker() {
  // Implement fallback logic here, e.g., using timers or other techniques
  console.log('Fallback worker activated');
  try {

  const response = await fetch(apiURL + '/searchbar-data', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  $searchBarData  = await response.json();
  } catch (error) {
  // Set worker status to idle and send error message
  $searchBarData = [];
  }

  const postData = {'userId': data?.user?.id};

    const response = await fetch(fastifyURL+'/get-notifications', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    notificationList  = (await response.json())?.items;
    hasUnreadElement = notificationList?.some(item => item?.readed === false);
    $numberOfUnreadNotification = notificationList?.filter(item => item?.readed === false)?.length;


}


/*
const loadTwitchWorker = async () => {

const SyncWorker = await import('$lib/workers/twitchStatusWorker?worker');
syncWorker = new SyncWorker.default();

syncWorker.postMessage({ message: {'fastifyURL': fastifyURL }});
syncWorker.onmessage = handleTwitchMessage;

};
*/

let Cookie;
$showCookieConsent = typeof data?.cookieConsent !== 'undefined' ? false : true;

onMount(async () => {
  await loadWorker();

  //await pushNotification()
    
  if($showCookieConsent === true) {
      Cookie = (await import("$lib/components/Cookie.svelte")).default;
  }
  //await loadTwitchWorker();

  /*
  if (window.innerWidth <= 768) {
    detectSWUpdate();
  }
  */
  

})



beforeNavigate(async () => {
      NProgress.start();
   });

afterNavigate(async () => {
      NProgress.done();
   });


//Delete cached Posts when going to other directories
$: {
  if( $page.url.pathname === '/community' || $page.url.pathname.startsWith('/community/post') )
  {
  }
  else {
    $cachedPosts = [];
    $currentPagePosition = 0;
  }
}


$: {
  if($page.url.pathname)
  {
    $loginData = data?.user;
    //data.currentPath = $page.url.pathname
  }
}





let innerWidth;




$: {
    if ($stockTicker && !$clientSideCache[$stockTicker]) {
      $clientSideCache[$stockTicker] = {};
    }
}

$: {
    if ($etfTicker && !$clientSideCache[$etfTicker]) {
      $clientSideCache[$etfTicker] = {};
    }
}

$: {
  if($newAvatar?.length !== 0)
  {
    data.user.avatar = $newAvatar;
    $newAvatar = '';
  }
}


$: {
  if(innerWidth)
  {
    $screenWidth = innerWidth
  }
}

$: {
  if($screenWidth < 1536)
  {
    collapse = false;
  }
}
</script>

<svelte:window bind:innerWidth/>

    
<div class="app">

  <!--<ViewTransition />-->

  <!--Start Navbar-->
  <div id="navbar" class="navbar {$screenWidth < 640 && hideHeader ? 'invisible -mt-20' : ''} border-b border-[#0F0F0F] w-screen sticky top-0 z-40 bg-[#202020]">

  <div class="w-full max-w-[1600px] m-auto">
    <div class="flex flex-row items-center w-full xl:px-2">
      
        <div class="flex flex-row items-center cursor-pointer">
          <label on:click={() => showSidebar = !showSidebar} class="cursor-pointer sm:ml-3 mr-1.5 2xl:hidden">
            {#if !showSidebar}
              <svg class="w-8 h-8 cusor-pointer text-slate-300 fill-current inline-block transition-transform duration-300 ease-in-out" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="18" height="1" />
                <rect x="4" y="11" width="18" height="1" />
                <rect x="4" y="17" width="18" height="1" />
              </svg>
            {:else}
            <svg class="w-8 h-8 rotate-180 transition-transform duration-300 ease-in-out cusor-pointer text-slate-300 fill-current inline-block" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#BEC8D3" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></g></svg>
            {/if}
          </label>
          <a href="/" class="flex flex-row items-center ml-2">
            <div class="flex justify-center items-center text-lg sm:text-xl font-medium mr-auto">
                <span class="self-center text-gray-200 font-semibold whitespace-nowrap">Stocknear</span>
            </div>
          </a>

          <!--<Searchbar />-->


        </div>
    </div>



    <div class="flex justify-between items-center">
      <div class="mr-2">
        <Searchbar />
      </div>  
      {#if !data?.user}
     
      <div class="mr-4">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <a href="/login" class="inline-flex items-center justify-center w-full sm:h-8 font-medium bg-blue-600 hover:bg-blue-500 ml-1 mr-2 rounded-full cursor-pointer">
              <span class="text-white text-sm sm:text-[1rem] px-1.5 py-1.5  sm:pl-2 sm:pr-2">
                Login
              </span>
            </a>
      </div>
      {:else}
      <NotificationBell 
        data={data}
        hasUnreadElement={hasUnreadElement}
        />
      <div class="dropdown dropdown-end ">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->

        <label for="mobileProfileData" class="sm:hidden btn btn-ghost btn-circle avatar">
          <div class="w-9 h-9 rounded-full">
            <img style="clip-path: circle(50%);" class="w-8 sm:w-36 bg-slate-300 rounded-full inline-block "

            src={data?.user?.avatar
              ? getImageURL(data?.user.collectionId, data?.user.id, data?.user.avatar)
              : `https://api.dicebear.com/7.x/thumbs/svg?seed=${data?.user?.username}`}
              />
          </div>
        </label>

        <label tabindex="0" class="cursor-pointer hidden sm:block w-9 h-9 rounded-full avatar mr-4"> <!--Remove mr-4 when you add Post button again -->
            <img style="clip-path: circle(50%);" class="flex-shrink-0 bg-slate-300 rounded-full inline-block "
            src={data?.user?.avatar
              ? getImageURL(data?.user.collectionId, data?.user.id, data?.user.avatar)
              : `https://api.dicebear.com/7.x/thumbs/svg?seed=${data?.user?.username}`}
              />
        </label>
        
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
       <ul tabindex="1" class="border border-gray-700 mt-2 p-2 menu dropdown-content text-white bg-[#202020] rounded-md w-52">
          <li class="mb-3 hover:bg-[#2B3139] rounded-lg">
            <a href="/community/profile">
              <div class="avatar flex-shrink-0 w-8 h-8 rounded-full -ml-0.5" >
                <svg style="clip-path: circle(50%);" class="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="white"><path d="M32 20a8 8 0 1 1-16 0a8 8 0 0 1 16 0"/><path fill-rule="evenodd" d="M23.184 43.984C12.517 43.556 4 34.772 4 24C4 12.954 12.954 4 24 4s20 8.954 20 20s-8.954 20-20 20h-.274q-.272 0-.542-.016M11.166 36.62a3.028 3.028 0 0 1 2.523-4.005c7.796-.863 12.874-.785 20.632.018a2.99 2.99 0 0 1 2.498 4.002A17.94 17.94 0 0 0 42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 4.916 1.971 9.373 5.166 12.621" clip-rule="evenodd"/></g></svg>
              </div>
                <div class=" flex flex-row justify-start items-center">
                <span class="text-white">Profile</span>
              </div>
            </a>
            <!--Set to /profile/ to make it default active -->
          </li>
          <li class="mb-3 hover:bg-[#2B3139] rounded-lg">
            <a  href="/watchlist">
              <svg class="shrink-0 h-6 w-6" fill="white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" stroke="#1A1A27"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>star-solid</title> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="icons_Q2" data-name="icons Q2"> <path d="M24,3a2.1,2.1,0,0,0-1.8,1.1L16.5,15.7,3.7,17.5A2.1,2.1,0,0,0,2.6,21l9.2,8.9L9.7,42.7A2,2,0,0,0,11.6,45l1-.2,11.4-6,11.4,6,1,.2a2,2,0,0,0,1.9-2.3L36.2,29.9,45.4,21a2.1,2.1,0,0,0-1.1-3.5L31.5,15.7,25.8,4.1A2.1,2.1,0,0,0,24,3Z"></path> </g> </g> </g></svg>
              <span class="ml-1 text-white font-medium">Watchlist</span>
            </a>
            <!--Set to /profile/ to make it default active -->
          </li>

          <li class="mb-3 hover:bg-[#2B3139] rounded-lg">
            <a href="/price-alert">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 inline-block" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M0 0h24v24H0z"/><path fill="white" d="M16 6.072a8 8 0 1 1-11.995 7.213L4 13l.005-.285A8 8 0 0 1 16 6.072M12 10a1 1 0 0 0-1 1v1h-1l-.117.007A1 1 0 0 0 10 14h1v1l.007.117A1 1 0 0 0 13 15v-1h1l.117-.007A1 1 0 0 0 14 12h-1v-1l-.007-.117A1 1 0 0 0 12 10"/><path fill="white" d="M6.412 3.191A1 1 0 0 1 7.685 4.73l-.097.08l-2.75 2a1 1 0 0 1-1.273-1.54l.097-.08zm9.779.221a1 1 0 0 1 1.291-.288l.106.067l2.75 2a1 1 0 0 1-1.07 1.685l-.106-.067l-2.75-2a1 1 0 0 1-.22-1.397z"/></g></svg>
              <span class="ml-1 text-white font-medium">Price Alert</span>
            </a>
          </li>
          
          
          <li class="mb-3 hover:bg-[#2B3139] rounded-lg">
            <a  href="/portfolio">
              <svg class="shrink-0 h-6 w-6" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M0 7.49996C0 3.52583 3.09098 0.27365 7 0.0163574V4.0354C5.30385 4.27801 4 5.73672 4 7.49996C4 9.43295 5.567 11 7.5 11C8.28618 11 9.01181 10.7407 9.5961 10.3031L12.438 13.1451C11.1188 14.3 9.39113 15 7.5 15C3.35786 15 0 11.6421 0 7.49996Z" fill="#fff"></path> <path d="M13.1451 12.438C14.3001 11.1187 15 9.39107 15 7.49996C15 6.46644 14.7909 5.48175 14.4128 4.58586L10.7552 6.21147C10.9132 6.61024 11 7.04496 11 7.49996C11 8.28611 10.7408 9.01174 10.3032 9.59602L13.1451 12.438Z" fill="#fff"></path> <path d="M8 4.0354V0.0163574C10.5416 0.183645 12.7373 1.61699 13.9626 3.69166L10.2541 5.33986C9.71063 4.64791 8.91203 4.16585 8 4.0354Z" fill="#fff"></path> </g></svg>
              <span class="ml-1 text-white font-medium">Portfolio</span>
            </a>
          </li>
        

          
          <hr class="border-slate-700">

          <li class="mt-3 hover:bg-[#2B3139] rounded-lg">
            <form action="/logout" method="POST">
              <button type="submit" class="w-full text-start">
                  <svg class="w-6 h-6 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="white" d="M6 30h12a2.002 2.002 0 0 0 2-2v-3h-2v3H6V4h12v3h2V4a2.002 2.002 0 0 0-2-2H6a2.002 2.002 0 0 0-2 2v24a2.002 2.002 0 0 0 2 2Z"/><path fill="white" d="M20.586 20.586L24.172 17H10v-2h14.172l-3.586-3.586L22 10l6 6l-6 6l-1.414-1.414z"/></svg>
                  <span class="text-start text-white">Logout</span>
              </button>
            </form>
          </li>
        </ul>
      </div>

          <div class="m-auto ml-2 mr-4 hidden">
            <label on:click={() => goto('/community/create-post')} class="shadow-lg inline-flex items-center justify-center w-full sm:h-10 font-medium bg-[#3C74D4] duration-150 ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer">
              <svg class="ml-4 w-4 h-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="m362.7 19.3l-48.4 48.4l130 130l48.4-48.4c25-25 25-65.5 0-90.5l-39.4-39.5c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2c-2.5 8.5-.2 17.6 6 23.8s15.3 8.5 23.7 6.1L151 475.7c14.1-4.2 27-11.8 37.4-22.2l233.3-233.2l-130-130z"/></svg>
              <span class="text-white text-md pl-2 pr-4">
                Post
              </span>
            </label>
          </div>

          
      {/if}
    </div>

  </div>


  </div>
  <!--End Navbar-->


<div class="xl:w-full xl:max-w-[1600px] xl:m-auto {hideSidebar ? 'hidden' : ''}">
<aside class:hidden={!showSidebar}
use:clickOutside on:click_outside={handleClickOutside}
class="fixed 2xl:block top-0 left-0 xl:left-auto w-56 sm:{collapse ? 'w-20' : 'w-56'} z-30 min-h-screen pt-12 sm:pt-16 border transition-transform -translate-x-full bg-[#202020] xl:bg-[#0F0F0F] translate-x-0 border-r border-slate-800 xl:border-none">
  <div class="pb-4 overflow-y-auto scroller bg-[#202020] xl:bg-[#0F0F0F] h-screen">
    <ul class="mt-1 bg-[#202020] xl:bg-[#0F0F0F] menu pt-5 pb-20">

      <li on:click={() => showSidebar = !showSidebar} class="px-1 rounded-sm mb-2 last:mb-0">
        <a href="/" for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {$page.url.pathname=== '/' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="#CCCCCC" xmlns="http://www.w3.org/2000/svg"><path d="M20.8593 8.36985L13.9293 2.82985C12.8593 1.96985 11.1293 1.96985 10.0693 2.81985L3.13929 8.36985C2.35929 8.98985 1.85929 10.2998 2.02929 11.2798L3.35929 19.2398C3.59929 20.6598 4.95929 21.8098 6.39929 21.8098H17.5993C19.0293 21.8098 20.3993 20.6498 20.6393 19.2398L21.9693 11.2798C22.1293 10.2998 21.6293 8.98985 20.8593 8.36985ZM11.9993 15.4998C10.6193 15.4998 9.49929 14.3798 9.49929 12.9998C9.49929 11.6198 10.6193 10.4998 11.9993 10.4998C13.3793 10.4998 14.4993 11.6198 14.4993 12.9998C14.4993 14.3798 13.3793 15.4998 11.9993 15.4998Z" fill="#CCCCCC"></path></svg>
                <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                    Home
                </span>
            </div>
        </div>
        </a>
    </li>

      <!-- Stock Guide-->
      <li  class="px-1 rounded-sm mb-2 last:mb-0">
          <summary on:click={handleStockGuide}>
            <div class="flex flex-row items-center">
              <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCCCCC" d="M16 19v-4.808h3V19zm-5.5 0V5h3v14zM5 19V9.808h3V19z"/></svg>
              <label class="cursor-pointer 2xl:{collapse ? 'hidden' : ''} text-md text-white font-medium ml-3 duration-200">
                    Stocks
                </label>
                <div class="2xl:{collapse ? 'hidden' : ''} border-r border-slate-600 h-6 ml-3 mr-3" />                
                <svg class="2xl:{collapse ? 'hidden' : ''} w-2.5 {stockGuide ? 'rotate-180' : 'rotate-90'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></svg>
            </div>
          </summary>
          {#if stockGuide}
          <ul class="mt-2">

            <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0  hover:bg-[#272727] rounded-md {$page.url.pathname=== '/analysts' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <a href={"/analysts"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Top Analysts
                </span>
              </a>
            </li>
            <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0  hover:bg-[#272727] rounded-md {$page.url.pathname=== '/analysts/top-stocks' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <a href={"/analysts/top-stocks"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Top Stocks
                </span>
              </a>
            </li>
            
            <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/stock-screener' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
                <a href={"/stock-screener"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                    <span class="text-sm font-medium text-white">
                        Stock Screener
                    </span>
                </a>
            </li>

            <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0  hover:bg-[#272727] rounded-md {$page.url.pathname=== '/market-mover' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <a href={"/market-mover"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Market Mover
                </span>
              </a>
            </li>

            <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0  hover:bg-[#272727] rounded-md {$page.url.pathname=== '/heatmaps' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <label for="sidebar" on:click={() => goto("/heatmaps")} class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                    <span class="text-sm font-medium text-white ">
                        Heatmaps
                    </span>
                  </label>
          </li>

              <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0  hover:bg-[#272727] rounded-md {$page.url.pathname=== '/list' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
                  <a href={"/list"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                    <span class="text-sm font-medium text-white ">
                        Stock Lists
                    </span>
                  </a>
                </li>
           
          </ul>
          {/if}
      </li>


      <!-- ETF Guide-->
      <li  class="px-1 rounded-sm mb-2 last:mb-0">
        <summary on:click={handleETFGuide}>
          <div class="flex items-center">
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCCCCC" d="M20.894 13.553a1 1 0 0 1-.447 1.341l-8 4a1 1 0 0 1-.894 0l-8-4a1 1 0 0 1 .894-1.788L12 16.88l7.554-3.775a1 1 0 0 1 1.341.447M12.008 5q.056 0 .111.007l.111.02l.086.024l.012.006l.012.002l.029.014l.05.019l.016.009l.012.005l8 4a1 1 0 0 1 0 1.788l-8 4a1 1 0 0 1-.894 0l-8-4a1 1 0 0 1 0-1.788l8-4l.011-.005l.018-.01l.078-.032l.011-.002l.013-.006l.086-.024l.11-.02l.056-.005z"/></svg>
              <span class="2xl:{collapse ? 'hidden' : ''} text-md text-white font-medium ml-3 duration-200">
                  ETFs
              </span>
              <div class="2xl:{collapse ? 'hidden' : ''} border-r border-slate-600 h-6 ml-3 mr-3" />
              <svg class="2xl:{collapse ? 'hidden' : ''} w-2.5 {etfGuide ? 'rotate-180' : 'rotate-90'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></svg>
          </div>
        </summary>
        {#if etfGuide}
        <ul class="mt-2">

          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/stock-screener' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <a href={"/etf/new-launches"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                  <span class="text-sm font-medium text-white">
                      New Launches
                  </span>
              </a>
          </li>

          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/dividends-calendar' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <a href={"/etf/etf-providers"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                  <span class="text-sm font-medium text-white ">
                      ETF Providers
                  </span>
              </a>
          </li>
        </ul>
        {/if}
      </li>


       <!-- Options Guide-->
       <li  class="px-1 rounded-sm mb-2 last:mb-0">
        <summary on:click={handleCalendarGuide}>
          <div class="flex items-center">
            <svg class="w-7 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#CCCCCC" d="M128 0c17.7 0 32 14.3 32 32v32h128V32c0-17.7 14.3-32 32-32s32 14.3 32 32v32h48c26.5 0 48 21.5 48 48v48H0v-48c0-26.5 21.5-48 48-48h48V32c0-17.7 14.3-32 32-32M0 192h448v272c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16m128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16m144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16m144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16"/></svg>
              <span class="2xl:{collapse ? 'hidden' : ''} text-md text-white font-medium ml-3 duration-200">
                  Calendar
              </span>
              <div class="2xl:{collapse ? 'hidden' : ''} border-r border-slate-600 h-6 ml-3 mr-3" />
              <svg class="2xl:{collapse ? 'hidden' : ''} w-2.5 {calendarGuide ? 'rotate-180' : 'rotate-90'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></svg>
          </div>
        </summary>
        {#if calendarGuide}
        <ul class="mt-2">

          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/dividends-calendar' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/dividends-calendar"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Dividends Calendar
                </span>
            </a>
        </li>
        <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/earnings-calendar' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/earnings-calendar"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Earnings Calendar
                </span>
            </a>
        </li>
        <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  { $page.url.pathname?.includes('/ipos')? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
          <a href={"/ipos/2024"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
              <span class="text-sm font-medium text-white ">
                  IPO Calendar
              </span>
          </a>
      </li>
        <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/economic-calendar' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
          <a href={"/economic-calendar"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
              <span class="text-sm font-medium text-white ">
                  Economic Calendar
              </span>
          </a>
      </li>

        <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/stock-splits-calendar' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
          <a href={"/stock-splits-calendar"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
              <span class="text-sm font-medium text-white ">
                  Stock Splits Calendar
              </span>
          </a>
        </li>
        </ul>
        {/if}
      </li>

      <li  class="px-1 rounded-sm mb-2 last:mb-0">
        <summary on:click={handleOptionsGuide}>
          <div class="flex items-center">
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#CCCCCC"><g fill="none"><path d="M24 0v24H0V0zM12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036c-.01-.003-.019 0-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="white" d="M18.147 6.733a10.578 10.578 0 0 0-5.244.528l-.346.132a13.606 13.606 0 0 1-7.16.84c-1.038-.16-2.12-.418-3.068-.891a1.5 1.5 0 0 1 1.202-2.745l.132.058c.682.32 1.45.499 2.19.613c1.344.206 3.183.22 5.244-.529l.346-.132a13.606 13.606 0 0 1 7.16-.84c1.038.16 2.119.419 3.066.89a1.514 1.514 0 0 1 .672 2.014c-.369.738-1.122.907-2.005.674l-2.19-.612Zm0 6a10.578 10.578 0 0 0-5.244.528l-.346.132a13.606 13.606 0 0 1-7.16.84c-1.038-.16-2.12-.418-3.068-.891a1.5 1.5 0 0 1 1.202-2.745l.132.058c.682.32 1.45.499 2.19.613c1.344.206 3.183.22 5.244-.529l.346-.132a13.606 13.606 0 0 1 7.16-.84c1.038.16 2.119.419 3.066.89a1.514 1.514 0 0 1 .672 2.014c-.369.739-1.122.907-2.005.674l-2.19-.612Zm-5.954 6.8l.364-.14a10.607 10.607 0 0 1 5.59-.66l2.19.612c.882.233 1.635.065 2.005-.674a1.514 1.514 0 0 0-.673-2.013c-.947-.472-2.028-.73-3.066-.89a13.583 13.583 0 0 0-6.797.7l-.363.14c-2.202.88-4.172.878-5.59.66c-.634-.098-1.29-.243-1.893-.484l-.297-.13a1.5 1.5 0 0 0-1.334 2.688c.947.473 2.03.731 3.068.89c1.752.27 4.143.28 6.796-.7Z"/></g></svg>
              <span class="2xl:{collapse ? 'hidden' : ''} text-md text-white font-medium ml-3 duration-200">
                  Options
              </span>
              <div class="2xl:{collapse ? 'hidden' : ''} border-r border-slate-600 h-6 ml-3 mr-3" />
              <svg class="2xl:{collapse ? 'hidden' : ''} w-2.5 {optionsGuide ? 'rotate-180' : 'rotate-90'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></svg>
          </div>
        </summary>
        {#if optionsGuide}
        <ul class="mt-2">

          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/options-flow' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/options-flow"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Flow Data
                </span>
            </a>
        </li>
        <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/options-zero-dte' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/options-zero-dte"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    0DTE Flow
                </span>
            </a>
        </li>
        </ul>
        {/if}
      </li>
  
      <li  class="px-1 rounded-sm mb-2 last:mb-0">
        <summary on:click={handlePoliticianGuide}>
          <div class="flex items-center">
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="#CCCCCC" fill-rule="evenodd" d="M7 3.36A1.68 1.68 0 1 0 7 0a1.68 1.68 0 0 0 0 3.36M4.359 5.788a2.801 2.801 0 0 1 5.282 0H4.36ZM1.894 7.035a.75.75 0 0 0 .065 1.497h.891l.36 4.9a.5.5 0 0 0 .498.463h6.584a.5.5 0 0 0 .498-.464l.36-4.899h.891a.75.75 0 0 0 .065-1.497a.632.632 0 0 1-.065.003H1.96a.633.633 0 0 1-.065-.003ZM7 8.7a.5.5 0 0 1 .448.279l.262.53l.586.086a.5.5 0 0 1 .277.853l-.424.413l.1.583a.5.5 0 0 1-.725.527L7 11.695l-.524.275a.5.5 0 0 1-.725-.527l.1-.583l-.424-.413a.5.5 0 0 1 .277-.853l.586-.085l.262-.531A.5.5 0 0 1 7 8.699Z" clip-rule="evenodd"/></svg>
              <span class="2xl:{collapse ? 'hidden' : ''} text-md text-white font-medium ml-3 duration-200">
                  Congress
              </span>
              <div class="2xl:{collapse ? 'hidden' : ''} border-r border-slate-600 h-6 ml-3 mr-3" />
              <svg class="2xl:{collapse ? 'hidden' : ''} w-2.5 {politicianGuide ? 'rotate-180' : 'rotate-90'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></svg>
          </div>
        </summary>
        {#if politicianGuide}
        <ul class="mt-2">
          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/options-zero-dte' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/politicians/new-trades"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    New Trades
                </span>
            </a>
        </li>
          <li on:click={() => showSidebar = !showSidebar} class="mb-1 last:mb-0 hover:bg-[#272727] rounded-md  {$page.url.pathname=== '/options-flow' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <a href={"/politicians"} for="sidebar" class="block text-slate-400 hover:text-slate-200 transition duration-150 truncate">
                <span class="text-sm font-medium text-white ">
                    Politicians
                </span>
            </a>
        </li>
        </ul>
        {/if}
      </li>

      <li on:click={() => showSidebar = !showSidebar} class="px-1 rounded-sm mb-2 last:mb-0">
          <a href={"/hedge-funds"} for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {$page?.url?.pathname?.startsWith('/hedge-funds') ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg class="w-7 h-7" viewBox="0 0 24 24" fill="#CCCCCC" xmlns="http://www.w3.org/2000/svg"><path opacity="0.97" d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM8.31 16.31C7.59 16.31 7 15.72 7 15C7 14.28 7.59 13.69 8.31 13.69C9.03 13.69 9.62 14.28 9.62 15C9.62 15.72 9.03 16.31 8.31 16.31ZM12 10.31C11.28 10.31 10.69 9.72 10.69 9C10.69 8.28 11.28 7.69 12 7.69C12.72 7.69 13.31 8.28 13.31 9C13.31 9.72 12.72 10.31 12 10.31ZM15.69 16.31C14.97 16.31 14.38 15.72 14.38 15C14.38 14.28 14.97 13.69 15.69 13.69C16.41 13.69 17 14.28 17 15C17 15.72 16.41 16.31 15.69 16.31Z" fill="currentColor"></path></svg>
                      <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                          Hedge Funds
                      </span>
                  </div>
              </div>
          </a>
      </li>



      <li on:click={() => showSidebar = !showSidebar} class="px-1 rounded-sm mb-2 last:mb-0">
        <a href={'/market-news'} for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {['/market-news','/market-news/crypto','/market-news/general']?.includes($page.url.pathname) ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCCCCC" fill-rule="evenodd" d="M18 4v3h3a1 1 0 0 1 1 1v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1m2 14a1 1 0 1 1-2 0V9h2zM6 8a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1m2 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1" clip-rule="evenodd"/></svg>
                    <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                        News
                    </span>
                </div>
            </div>
        </a>
    </li>


  
      <!-- Community -->
      <li on:click={() => showSidebar = !showSidebar} class="px-1 rounded-sm mb-2 last:mb-0" >
          <a href={"/community"} for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {$page.url.pathname=== '/community' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
              <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg class="w-7 h-7"  viewBox="0 0 24 24" fill="#CCCCCC" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM7 12.75H5C4.59 12.75 4.25 12.41 4.25 12C4.25 11.59 4.59 11.25 5 11.25H7C7.41 11.25 7.75 11.59 7.75 12C7.75 12.41 7.41 12.75 7 12.75ZM12 14.25C10.76 14.25 9.75 13.24 9.75 12C9.75 10.76 10.76 9.75 12 9.75C13.24 9.75 14.25 10.76 14.25 12C14.25 13.24 13.24 14.25 12 14.25ZM19 12.75H17C16.59 12.75 16.25 12.41 16.25 12C16.25 11.59 16.59 11.25 17 11.25H19C19.41 11.25 19.75 11.59 19.75 12C19.75 12.41 19.41 12.75 19 12.75Z" fill="#CCCCCC"></path></svg>
                      <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                        Community
                    </span>
                    </div>
              </div>
          </a>
      </li>


      <li on:click={() => showSidebar = !showSidebar} class="px-1 rounded-sm mb-2 last:mb-0" >
        <a href={"/leaderboard"} for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {$page.url.pathname=== '/leaderboard' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#CCCCCC" d="M216 96a88 88 0 1 0-144 67.83V240a8 8 0 0 0 11.58 7.16L128 225l44.43 22.21a8.1 8.1 0 0 0 3.57.79a8 8 0 0 0 8-8v-76.17A87.85 87.85 0 0 0 216 96M56 96a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72m16 0a56 56 0 1 1 56 56a56.06 56.06 0 0 1-56-56"/></svg>
                    <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                      Leaderboard
                  </span>
                  </div>
            </div>
          </a>
      </li>

      <li on:click={() => showSidebar = !showSidebar} class="{data?.user?.tier === 'Pro' ? 'hidden' : ''} px-1 rounded-sm pb-40 sm:pb-6 last:mb-0" >
        <a href={"/pricing"} for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150 {$page.url.pathname=== '/pricing' ? 'text-white bg-[#272727] xl:bg-[#0F0F0F] rounded-md ' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCCCCC" d="M17.66 11.2c-.23-.3-.51-.56-.77-.82c-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32c-2.59 2.08-3.61 5.75-2.39 8.9c.04.1.08.2.08.33c0 .22-.15.42-.35.5c-.23.1-.47.04-.66-.12a.6.6 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5c.14.6.41 1.2.71 1.73c1.08 1.73 2.95 2.97 4.96 3.22c2.14.27 4.43-.12 6.07-1.6c1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6c-1.12.4-2.24-.16-2.9-.82c1.19-.28 1.9-1.16 2.11-2.05c.17-.8-.15-1.46-.28-2.23c-.12-.74-.1-1.37.17-2.06c.19.38.39.76.63 1.06c.77 1 1.98 1.44 2.24 2.8c.04.14.06.28.06.43c.03.82-.33 1.72-.93 2.27"/></svg>
                  
                  <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                      Become a Pro
                  </span>
                  </div>
            </div>
          </a>
      </li>


    <!--
      <li on:click={handleCollapse} class="hidden 2xl:block px-1 pb-20 rounded-sm" >
        <label for="sidebar" class="block text-slate-200 hover:text-white truncate transition duration-150">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <svg class="w-7 h-7 {collapse ? 'rotate-180' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m4.836 12l6.207 6.207l1.414-1.414L7.664 12l4.793-4.793l-1.414-1.414zm5.65 0l6.207 6.207l1.414-1.414L13.314 12l4.793-4.793l-1.414-1.414z"/></svg>
                    <span class="2xl:{collapse ? 'hidden' : ''} text-md font-medium ml-3 duration-200">
                      Collapse
                  </span>
                  </div>
            </div>
          </label>
      </li>
    -->



  </ul>
  </div>
</aside>
</div>
  




{#if $screenWidth < 640}
<!--Start Mobile Profile Data Modal-->
<input type="checkbox" id="mobileProfileData" class="modal-toggle" />

<dialog id="mobileProfileData" class="modal modal-bottom ">


  <label for="mobileProfileData"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  <div class="modal-box bg-[#202020]">

    {#if data?.user}
    <ul class="menu menu-compact dropdown-content text-white bg-[#202020] rounded">
      <li class="mb-3">
        <label for ="mobileProfileData" on:click={() => goto('/community/profile/')}>
          <div class="avatar flex-shrink-0 w-10 h-10 -ml-1">
            <svg style="clip-path: circle(50%);" class="flex-shrink-0 w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="white"><path d="M32 20a8 8 0 1 1-16 0a8 8 0 0 1 16 0"/><path fill-rule="evenodd" d="M23.184 43.984C12.517 43.556 4 34.772 4 24C4 12.954 12.954 4 24 4s20 8.954 20 20s-8.954 20-20 20h-.274q-.272 0-.542-.016M11.166 36.62a3.028 3.028 0 0 1 2.523-4.005c7.796-.863 12.874-.785 20.632.018a2.99 2.99 0 0 1 2.498 4.002A17.94 17.94 0 0 0 42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 4.916 1.971 9.373 5.166 12.621" clip-rule="evenodd"/></g></svg>
          </div>
                <div class="flex-row items-center text-[1rem]">
                 Profile
                </div>
              </label>
        <!--Set to /profile/ to make it default active -->
      </li>
      <li class="mb-3">
        <label class="cursor-pointer" for="mobileProfileData" on:click={() => goto('/watchlist/')}>
          <svg class="shrink-0 h-7 w-7" fill="white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" stroke="#1A1A27"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>star-solid</title> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="icons_Q2" data-name="icons Q2"> <path d="M24,3a2.1,2.1,0,0,0-1.8,1.1L16.5,15.7,3.7,17.5A2.1,2.1,0,0,0,2.6,21l9.2,8.9L9.7,42.7A2,2,0,0,0,11.6,45l1-.2,11.4-6,11.4,6,1,.2a2,2,0,0,0,1.9-2.3L36.2,29.9,45.4,21a2.1,2.1,0,0,0-1.1-3.5L31.5,15.7,25.8,4.1A2.1,2.1,0,0,0,24,3Z"></path> </g> </g> </g></svg>
          <span class="ml-1 text-white font-medium text-[1rem]">Watchlist</span>
        </label>
        <!--Set to /profile/ to make it default active -->
      </li>

      
      <li class="mb-3">
        <label class="cursor-pointer" for="mobileProfileData" on:click={() => goto('/price-alert/')}>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 inline-block" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M0 0h24v24H0z"/><path fill="white" d="M16 6.072a8 8 0 1 1-11.995 7.213L4 13l.005-.285A8 8 0 0 1 16 6.072M12 10a1 1 0 0 0-1 1v1h-1l-.117.007A1 1 0 0 0 10 14h1v1l.007.117A1 1 0 0 0 13 15v-1h1l.117-.007A1 1 0 0 0 14 12h-1v-1l-.007-.117A1 1 0 0 0 12 10"/><path fill="white" d="M6.412 3.191A1 1 0 0 1 7.685 4.73l-.097.08l-2.75 2a1 1 0 0 1-1.273-1.54l.097-.08zm9.779.221a1 1 0 0 1 1.291-.288l.106.067l2.75 2a1 1 0 0 1-1.07 1.685l-.106-.067l-2.75-2a1 1 0 0 1-.22-1.397z"/></g></svg>
          <span class="ml-1 text-white font-medium text-[1rem]">Price Alert</span>
        </label>
      </li>
      
      <li class="mb-3">
        <label class="cursor-pointer" for="mobileProfileData" on:click={() => goto('/portfolio/')}>
          <svg class="shrink-0 h-7 w-7" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M0 7.49996C0 3.52583 3.09098 0.27365 7 0.0163574V4.0354C5.30385 4.27801 4 5.73672 4 7.49996C4 9.43295 5.567 11 7.5 11C8.28618 11 9.01181 10.7407 9.5961 10.3031L12.438 13.1451C11.1188 14.3 9.39113 15 7.5 15C3.35786 15 0 11.6421 0 7.49996Z" fill="#fff"></path> <path d="M13.1451 12.438C14.3001 11.1187 15 9.39107 15 7.49996C15 6.46644 14.7909 5.48175 14.4128 4.58586L10.7552 6.21147C10.9132 6.61024 11 7.04496 11 7.49996C11 8.28611 10.7408 9.01174 10.3032 9.59602L13.1451 12.438Z" fill="#fff"></path> <path d="M8 4.0354V0.0163574C10.5416 0.183645 12.7373 1.61699 13.9626 3.69166L10.2541 5.33986C9.71063 4.64791 8.91203 4.16585 8 4.0354Z" fill="#fff"></path> </g></svg>
          <span class="ml-1 text-white font-medium text-[1rem]">Portfolio</span>
        </label>
      </li>
    




      <hr class="border-slate-700">
      <li class="mt-3">
        <form action="/logout" method="POST">
          <button type="submit" class="w-full text-start">
              <svg class="w-6 h-6 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="white" d="M6 30h12a2.002 2.002 0 0 0 2-2v-3h-2v3H6V4h12v3h2V4a2.002 2.002 0 0 0-2-2H6a2.002 2.002 0 0 0-2 2v24a2.002 2.002 0 0 0 2 2Z"/><path fill="white" d="M20.586 20.586L24.172 17H10v-2h14.172l-3.586-3.586L22 10l6 6l-6 6l-1.414-1.414z"/></svg>
              <span class="text-start">Logout</span>
          </button>
        </form>
      </li>
      <li>
        <span style="font-size: 9px;" class="block text-start text-gray-400">© 2024 stocknear. All Rights Reserved.
      </li>
    </ul>
    {:else}

      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <ul class="menu menu-compact dropdown-content text-gray-300 rounded">
          <li class="mb-3">
              <!-- svelte-ignore a11y-missing-attribute -->
              <label for="mobileProfileData" on:click={() => goto('/login')} class="cursor-pointer">
                  <svg class="shrink-0 w-7 h-7 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="white" d="M6 30h12a2.002 2.002 0 0 0 2-2v-3h-2v3H6V4h12v3h2V4a2.002 2.002 0 0 0-2-2H6a2.002 2.002 0 0 0-2 2v24a2.002 2.002 0 0 0 2 2Z"/><path fill="white" d="M20.586 20.586L24.172 17H10v-2h14.172l-3.586-3.586L22 10l6 6l-6 6l-1.414-1.414z"/></svg>
                  <span class="ml-2 text-start">Login</span>
              </label>
          </li>

          <hr class="border-slate-700">
          <li>
            <span style="font-size: 9px;" class="block text-start text-gray-400">© 2024 stocknear. All Rights Reserved.
          </li>
        </ul>
    {/if}
        
      </div>     
  </dialog>
<!--End Mobile Profile Data Modal-->
{/if}




<main>
    <!--<Firefly/>-->
  <Toaster class="bg-[#1A1A27] text-white text-medium"/>
  {#if Cookie && $showCookieConsent === true}
  <Cookie />
  {/if}

  {#if $screenWidth < 640}
    <PullToRefresh />
  {/if}

    <!--
    {#key data?.currentPath}

      <div in:pageTransitionIn={{ duration: 250 }} out:pageTransitionOut={{duration: 250}}>
        <slot />
      </div>

    {/key}
    -->
    <slot />
    
    {#if !hideFooter}
    <Footer/>
    {/if}
  </main>



 
</div>


<style>
.scroller {
  scrollbar-width: thin;
}



</style>