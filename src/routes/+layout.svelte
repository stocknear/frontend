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
          <a href="/" class="flex flex-row items-center ml-1">
            <div class="flex justify-center items-center text-xl font-medium mr-auto ml-2">
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
              <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M6 19h3.692v-5.885h4.616V19H18v-9l-6-4.538L6 10zm-1 1V9.5l7-5.288L19 9.5V20h-5.692v-5.885h-2.616V20zm7-7.77"/></svg>
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
              <svg class="w-7 h-7 inline-block mr-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M4 19h4.673v-8H4zm5.673 0h4.654V5H9.673zm5.654 0H20v-6h-4.673zM3 18.385v-6.77q0-.666.475-1.14Q3.949 10 4.615 10h4.058V5.615q0-.666.475-1.14Q9.622 4 10.288 4h3.424q.666 0 1.14.475q.475.474.475 1.14V12h4.058q.666 0 1.14.475q.475.474.475 1.14v4.77q0 .666-.475 1.14q-.474.475-1.14.475H4.615q-.666 0-1.14-.475Q3 19.051 3 18.385"/></svg>  
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
              <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M9.115 17q-.69 0-1.152-.462q-.463-.463-.463-1.153V4.615q0-.69.463-1.152Q8.425 3 9.115 3h7.77q.69 0 1.152.463q.463.462.463 1.152v10.77q0 .69-.462 1.153q-.463.462-1.153.462zm0-1h7.77q.23 0 .423-.192q.192-.193.192-.423V4.615q0-.23-.192-.423Q17.115 4 16.885 4h-7.77q-.23 0-.423.192q-.192.193-.192.423v10.77q0 .23.192.423q.193.192.423.192m-3 4q-.69 0-1.152-.462q-.463-.463-.463-1.153V6.615h1v11.77q0 .23.192.423q.193.192.423.192h8.77v1zM8.5 16V4z"/></svg>
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
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#D4D4D4" d="M5 9.615h14v-3q0-.23-.192-.423Q18.615 6 18.385 6H5.615q-.23 0-.423.192Q5 6.385 5 6.615zm0 0V6zM5.615 21q-.69 0-1.152-.462Q4 20.075 4 19.385V6.615q0-.69.463-1.152Q4.925 5 5.615 5h1.77V2.77h1.077V5h7.153V2.77h1V5h1.77q.69 0 1.152.463q.463.462.463 1.152v5.252q-.244-.09-.494-.134q-.25-.045-.506-.081v-1.037H5v8.77q0 .23.192.423q.193.192.423.192h6.704q.08.28.201.521q.122.24.255.479zm12.77 1q-1.672 0-2.836-1.164Q14.385 19.67 14.385 18t1.164-2.836Q16.713 14 18.385 14q1.67 0 2.835 1.164T22.385 18q0 1.671-1.165 2.836T18.385 22m1.655-1.798l.547-.546l-1.818-1.818v-2.723H18v3.047z"/></svg>
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
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M237.43 130.55C215.84 176.57 197 198 178 198c-23.83 0-39.2-32.76-55.47-67.45C109.26 102.17 94.17 70 78 70c-9.18 0-25 10.5-48.53 60.55a6 6 0 0 1-10.86-5.1C40.16 79.43 59 58 78 58c23.83 0 39.2 32.76 55.47 67.45C146.74 153.83 161.83 186 178 186c9.18 0 25.05-10.5 48.53-60.55a6 6 0 0 1 10.86 5.1Z"/></svg>
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
            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
              <path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.6" d="M7 3.77A1.604 1.604 0 1 0 7 .564A1.604 1.604 0 0 0 7 3.77M1.959 6.979H12.04m-9.165 0l.459 6.416m7.791-6.416l-.459 6.416M7 8.59l.59 1.195l1.318.192l-.954.93l.225 1.313L7 11.6l-1.18.62l.226-1.313l-.954-.93l1.318-.192zM10 7a3 3 0 0 0-6 0"/>
            </svg>
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
                    <svg class="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
                      <g id="SVGRepo_bgCarrier" stroke="none"></g>
                      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <g>
                          <path fill="none" d="M0 0h24v24H0z"></path>
                          <path d="M20 6h3v2h-1v11h1v2H1v-2h1V8H1V6h3V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2zm0 2H4v11h3v-7h2v7h2v-7h2v7h2v-7h2v7h3V8zM6 5v1h12V5H6z" stroke="#202020" stroke-width="1"></path>
                        </g>
                      </g>
                    </svg>
                    
                    
                    
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
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="white" d="M5 6.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M10.5 9a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm-.5 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5M5.5 9a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm.5 3v-2h2v2zM2 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a2 2 0 0 1 2 2v5.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 13.5zm13 0a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8.5A1.5 1.5 0 0 0 4.5 15h11a1.5 1.5 0 0 0 1.5-1.5V8a1 1 0 0 0-1-1v6.5a.5.5 0 0 1-1 0z"/></svg>
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
                    <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="white" d="m14.878.282l.348 1.071a2.205 2.205 0 0 0 1.399 1.397l1.071.348l.021.006a.423.423 0 0 1 0 .798l-1.071.348a2.208 2.208 0 0 0-1.399 1.397l-.348 1.07a.423.423 0 0 1-.798 0l-.349-1.07a2.23 2.23 0 0 0-.532-.867a2.224 2.224 0 0 0-.866-.536l-1.071-.348a.423.423 0 0 1 0-.798l1.071-.348a2.208 2.208 0 0 0 1.377-1.397l.348-1.07a.423.423 0 0 1 .799 0m4.905 7.931l-.766-.248a1.577 1.577 0 0 1-.998-.999l-.25-.764a.302.302 0 0 0-.57 0l-.248.764a1.576 1.576 0 0 1-.984.999l-.765.248a.303.303 0 0 0 0 .57l.765.249a1.578 1.578 0 0 1 1 1.002l.248.764a.302.302 0 0 0 .57 0l.249-.764a1.576 1.576 0 0 1 .999-.999l.765-.248a.303.303 0 0 0 0-.57zM17.502 12a1.328 1.328 0 0 1-.73-.22a7.003 7.003 0 0 1-10.195 4.328l-.087-.039l-.091-.021a.502.502 0 0 0-.188.01l-3.024.754l.756-3.02l.014-.095a.5.5 0 0 0-.063-.272A7 7 0 0 1 10.088 3a1.417 1.417 0 0 1 .863-.847l.216-.07A8 8 0 0 0 2 10l.007.346l.026.382a7.95 7.95 0 0 0 .829 2.887l.063.12l-.91 3.644l-.014.083v.082a.5.5 0 0 0 .62.441l3.645-.91l.12.064a8.003 8.003 0 0 0 11.366-5.157a1.76 1.76 0 0 1-.25.018"/></svg>
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
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M7.385 2.577h9.23v7.08q0 .537-.288.997q-.289.46-.777.754l-3.358 2.023l.739 2.377h2.877l-2.37 1.661l.931 2.916L12 18.573l-2.37 1.812l.932-2.916l-2.37-1.661h2.877l.739-2.377l-3.396-1.985q-.489-.275-.758-.754q-.27-.479-.27-1.034zm1 1v6.08q0 .29.144.53q.144.24.394.394l2.577 1.507V3.577zm7.23 0H12.5v8.511l2.577-1.507q.25-.154.394-.394q.144-.24.144-.53zM12.5 7.833"/></svg>
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
                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="white" stroke="#202020" stroke-width="1" d="M12 4.21c1.24.51 2.65.79 4 .79c1.05 0 2.1-.16 3.08-.46C18.5 5.5 18 6.71 18 8c0 1.32.54 2.93 1.1 4.63c.4 1.2.9 2.7.9 3.37c0 1.03-3.53 3-8 3.96C7.54 19 4 17.03 4 16c0-.67.5-2.17.9-3.37C5.46 10.93 6 9.32 6 8c0-1.29-.5-2.5-1.08-3.46C5.9 4.84 6.96 5 8 5c1.35 0 2.76-.28 4-.79M20 2c-1.15.64-2.6 1-4 1s-2.86-.37-4-1c-1.14.63-2.6 1-4 1s-2.85-.36-4-1L2 4s2 2 2 4s-2 6-2 8c0 4 10 6 10 6s10-2 10-6c0-2-2-6-2-8s2-4 2-4zm-4.95 14.45l-3.08-1.86l-3.07 1.86l.82-3.5L7 10.61l3.58-.31L11.97 7l1.4 3.29l3.58.31l-2.72 2.34z"/>
                  </svg>
                  
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