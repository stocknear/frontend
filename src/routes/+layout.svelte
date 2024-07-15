<script lang='ts'>
  import "../app.css";
  import "../app.pcss";
  
  import { Toaster } from 'svelte-french-toast';
  import {getImageURL} from '$lib/utils';

  import NProgress from 'nprogress';
  import 'nprogress/nprogress.css';

  import { page } from '$app/stores';
  import Footer from '$lib/components/Footer.svelte';
  import Searchbar from '$lib/components/Searchbar.svelte';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  //import PullToRefresh from '$lib/components/PullToRefresh.svelte';

  //import DiscountBanner from '$lib/components/DiscountBanner.svelte';
  
  import { beforeNavigate, afterNavigate, goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { showCookieConsent,  newAvatar, userRegion, screenWidth, stockTicker, etfTicker, searchBarData, loginData, numberOfUnreadNotification, cachedPosts, currentPagePosition, clientSideCache, twitchStatus } from '$lib/store';

  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.ts";
  import { Input } from "$lib/components/shadcn/input/index.ts";
  import * as Sheet from "$lib/components/shadcn/sheet/index.ts";
  import * as Tooltip from "$lib/components/shadcn/tooltip/index.js";
  import * as Accordion from "$lib/components/shadcn/accordion/index.js";

  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Copy from "lucide-svelte/icons/copy";
  import CreditCard from "lucide-svelte/icons/credit-card";
  import File from "lucide-svelte/icons/file";
  import Home from "lucide-svelte/icons/house";
  import LineChart from "lucide-svelte/icons/line-chart";
  import ListFilter from "lucide-svelte/icons/list-filter";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import Package from "lucide-svelte/icons/package";
  import Package2 from "lucide-svelte/icons/package-2";
  import Menu from "lucide-svelte/icons/menu";
  import Search from "lucide-svelte/icons/search";
  import Settings from "lucide-svelte/icons/settings";
  import ShoppingCart from "lucide-svelte/icons/shopping-cart";
  import Truck from "lucide-svelte/icons/truck";
  import UsersRound from "lucide-svelte/icons/users-round";
  import Stock from "lucide-svelte/icons/candlestick-chart";
  import Calendar from "lucide-svelte/icons/calendar";
  import Option from "lucide-svelte/icons/waves";
  import HandShake from "lucide-svelte/icons/handshake";
  import Layers from "lucide-svelte/icons/layers";
  import Box from "lucide-svelte/icons/box";
  import Boxes from "lucide-svelte/icons/boxes";
  import Newspaper from "lucide-svelte/icons/newspaper";
  import MessageCircle from "lucide-svelte/icons/message-circle";


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

  $: hideSidebar = $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/imprint') || $page.url.pathname.startsWith('/privacy-policy') || $page.url.pathname.startsWith('/terms-of-use') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/community/create-post') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register')

 
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
    notificationList = output?.notificationList
    hasUnreadElement = output?.hasUnreadElement;
    //const unreadNotificationList = output?.unreadNotificationList;
    $numberOfUnreadNotification = output?.numberOfUnreadNotification;
    //pushNotification()

};

/*
const handleTwitchMessage = (event) => {
    const output = event.data?.output;
   $twitchStatus = output?.twitchStatus;
};
*/


const loadWorker = async () => {

  if ('serviceWorker' in navigator) {
  const SyncWorker = await import('$lib/workers/notificationWorker?worker');
  syncWorker = new SyncWorker.default();

  syncWorker.postMessage({ message: {'fastifyURL': fastifyURL, 'userId': data?.user?.id }});
  syncWorker.onmessage = handleMessage;
  } else {
    // Fallback logic here
    await fallbackWorker();
  }
  

};

async function fallbackWorker() {
  // Implement fallback logic here, e.g., using timers or other techniques
  console.log('Fallback worker activated');

  const postData = {'userId': data?.user?.id};
    const response = await fetch(fastifyURL+'/get-notifications', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    notificationList  = (await response.json())?.items;
    hasUnreadElement = notificationList?.length !== 0 ? true : false;
    $numberOfUnreadNotification = notificationList?.length

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




<div class="flex min-h-screen w-full flex-col bg-[#09090B]">
  <aside class="fixed inset-y-0 left-0 z-50 hidden w-56 flex-col 2xl:border-r 2xl:border-gray-800 bg-[#141417] 2xl:flex">
    <nav class="flex flex-col items-center mr-auto gap-y-4 2xl:py-5 w-full">
      <a
        href="/"
        class="mr-12 mb-5 group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
      >
      <img class="avatar w-9 2xl:w-10 rounded-full" src={cloudFrontUrl+"/assets/stocknear_logo.png"} />
        <span class="text-white text-xl">Stocknear</span>
      </a>
      
      <a href="/" class="flex flex-row items-center ml-5 mr-auto">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
          <Home class="h-5.5 w-5.5" />  
        </div>
        <span class="ml-3 text-white">Home</span>
        </a>


        <div class="flex flex-row items-center ml-5 mr-auto mt-3 w-3/4">

          <Accordion.Root class="w-fit">

            <Accordion.Item value="item-1">

              <Accordion.Trigger class="">
                <Stock class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                <span class="text-white mr-auto">Stocks</span>
              </Accordion.Trigger>
              <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                <div class="flex flex-col items-start">
                  <a href="#" class="text-white ml-4 mt-2">Top Analyst</a>
                  <a href="#" class="text-white ml-4 mt-2">Top Analyst Stocks</a>
                  <a href="#" class="text-white ml-4 mt-2">Shorted Stocks</a>
                  <a href="#" class="text-white ml-4 mt-2">Retail Trader Tracker</a>
                </div>
                
              </Accordion.Content
              >
            </Accordion.Item>
          </Accordion.Root>
                  
        </div>
       
        <div class="flex flex-row items-center ml-5 mr-auto mt-3 w-3/4">

          <Accordion.Root class="w-fit">

            <Accordion.Item value="item-1">

              <Accordion.Trigger class="">
                <Layers class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                <span class="text-white mr-auto">ETFs</span>
              </Accordion.Trigger>
              <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                <div class="flex flex-col items-start">
                  <a href="#" class="text-white ml-4 mt-2">Top Analyst</a>
                  <a href="#" class="text-white ml-4 mt-2">Top Analyst Stocks</a>
                  <a href="#" class="text-white ml-4 mt-2">Shorted Stocks</a>
                  <a href="#" class="text-white ml-4 mt-2">Retail Trader Tracker</a>
                </div>
                
              </Accordion.Content
              >
            </Accordion.Item>
          </Accordion.Root>
                  
        </div>

        <div class="flex flex-row items-center ml-5 mr-auto mt-3 w-3/4">

          <Accordion.Root class="w-fit">

            <Accordion.Item value="item-1">

              <Accordion.Trigger class="">
                <Calendar class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                <span class="text-white mr-auto">Calendar</span>
              </Accordion.Trigger>
              <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                <div class="flex flex-col items-start">
                  <a href="#" class="text-white ml-4 mt-4">Top Analyst</a>
                  <a href="#" class="text-white ml-4 mt-4">Top Analyst Stocks</a>
                  <a href="#" class="text-white ml-4 mt-4">Shorted Stocks</a>
                  <a href="#" class="text-white ml-4 mt-4">Retail Trader Tracker</a>
                </div>
                
              </Accordion.Content
              >
            </Accordion.Item>
          </Accordion.Root>
                  
        </div>

        <div class="flex flex-row items-center ml-5 mr-auto mt-3 w-3/4">

          <Accordion.Root class="w-fit">

            <Accordion.Item value="item-1">

              <Accordion.Trigger class="">
                <Option class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                <span class="text-white mr-auto">Options</span>
              </Accordion.Trigger>
              <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                <div class="flex flex-col items-start">
                  <a href="#" class="text-white ml-4 mt-2">Options Flow</a>
                  <a href="#" class="text-white ml-4 mt-4">0DTE Flow</a>
                </div>
                
              </Accordion.Content
              >
            </Accordion.Item>
          </Accordion.Root>
                  
        </div>


        <div class="flex flex-row items-center ml-5 mr-auto mt-3 w-3/4">

          <Accordion.Root class="w-fit">

            <Accordion.Item value="item-1">

              <Accordion.Trigger class="">
                <HandShake class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                <span class="text-white mr-auto">Congress</span>
              </Accordion.Trigger>
              <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                <div class="flex flex-col items-start">
                  <a href="#" class="text-white ml-4 mt-4">Top Analyst</a>
                  <a href="#" class="text-white ml-4 mt-4">Top Analyst Stocks</a>
                  <a href="#" class="text-white ml-4 mt-4">Shorted Stocks</a>
                  <a href="#" class="text-white ml-4 mt-4">Retail Trader Tracker</a>
                </div>
                
              </Accordion.Content
              >
            </Accordion.Item>
          </Accordion.Root>
                  
        </div>

        <a href="/dark-pool-flow" class="flex flex-row items-center ml-5 mt-3 mr-auto">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
          >
            <Box class="h-5.5 w-5.5" />
            
          </div>
          <span class="ml-3 text-white">Dark Pool</span>
        </a>

        <a href="/hedge-funds" class="flex flex-row items-center ml-5 mt-3 mr-auto">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
          >
            <Boxes class="h-5.5 w-5.5" />
            
          </div>
          <span class="ml-3 text-white">Hedge Funds</span>
        </a>

        <a href="/market-news" class="flex flex-row items-center ml-5 mt-3 mr-auto">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
          >
            <Newspaper class="h-5.5 w-5.5" />
            
          </div>
          <span class="ml-3 text-white">Newspaper</span>
        </a>

        <a href="/community" class="flex flex-row items-center ml-5 mt-3 mr-auto">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
          >
            <MessageCircle class="h-5.5 w-5.5" />
            
          </div>
          <span class="ml-3 text-white">Community</span>
        </a>
            
    </nav>
   
  </aside>
  <div class="flex flex-col">
    <header class="navbar {$screenWidth < 640 && hideHeader ? 'invisible -mt-20' : ''} sticky top-0 z-40 bg-[#141417] flex h-14 items-center gap-4 px-4 sm:h-auto sm:px-6">
      <Sheet.Root>
        <Sheet.Trigger asChild let:builder>
          <Button builders={[builder]} size="icon" class="sm:xl bg-[#141417] text-white sm:hover:bg-white sm:hover:text-black border-none">
            <Menu class="h-5.5 w-5.5 sm:w-7 sm:h-7" />
            <span class="sr-only">Toggle Menu</span>
          </Button>
        </Sheet.Trigger>
        <Sheet.Content side="left" class="sm:max-w-xs bg-[#141417]">
          <nav class="grid gap-6 text-lg font-medium bg-[#141417]">
            <a
            href="/"
            class="flex items-center gap-4 px-0.5 text-white"
          >
          <img class="avatar w-9 sm:w-10 rounded-full" src={cloudFrontUrl+"/assets/stocknear_logo.png"} />
            Stocknear
          </a>

          <Sheet.Close asChild let:builder>
            <Button builders={[builder]} type="submit" class="bg-[#141417] hover:bg-[#141417] -ml-4 mr-auto">
              <a href="/" class="flex flex-row items-center mr-auto mt-5 ">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                  <Home class="h-5.5 w-5.5" />  
                </div>
                <span class="ml-1.5 text-white text-[1rem]">Home</span>
              </a>
            </Button>
          </Sheet.Close>
          
          
          <div class="flex flex-row items-center mr-auto">

            <Accordion.Root class="w-fit">
  
              <Accordion.Item value="item-1">
  
                <Accordion.Trigger class="w-fit">
                  <Stock class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                  <span class="text-white mr-auto">Stocks</span>
                </Accordion.Trigger>
                <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                  <Sheet.Close asChild let:builder>
                    <div class="flex flex-col items-start">
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/new-launches" class="text-[1rem] text-white ml-4 mt-2">Top Analyst</a>
                      </Button>
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/etf-providers" class="text-[1rem] text-white ml-4 mt-4">Top Analyst Stocks</a>
                      </Button>
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/etf-providers" class="text-[1rem] text-white ml-4 mt-4">Shorted Stocks</a>
                      </Button>
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/etf-providers" class="text-[1rem] text-white ml-4 mt-4">Retail Trader Tracker</a>
                      </Button>
                    </div>

                  </Sheet.Close>
                  
                </Accordion.Content
                >
              </Accordion.Item>
            </Accordion.Root>
                    
          </div>

          <div class="flex flex-row items-center mr-auto  w-3/4">

            <Accordion.Root class="w-fit">
  
              <Accordion.Item value="item-1">
  
                <Accordion.Trigger class="">
                  <Layers class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                  <span class="text-white mr-auto">ETFs</span>
                </Accordion.Trigger>
                <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">

                  <Sheet.Close asChild let:builder>
                    <div class="flex flex-col items-start">
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/new-launches" class="text-[1rem] text-white ml-4 mt-2">New Launches</a>
                      </Button>
                      <Button builders={[builder]} type="submit" class="bg-[#141417]">
                        <a href="/etf/etf-providers" class="text-[1rem] text-white ml-4 mt-4">ETF Providers</a>
                      </Button>
                    </div>

                  </Sheet.Close>

                  
                </Accordion.Content
                >
              </Accordion.Item>
            </Accordion.Root>
                    
          </div>
         

          </nav>
        </Sheet.Content>
      </Sheet.Root>
      
      <a href="/" class="-ml-2 flex w-9 flex-shrink-0">
        <img class="avatar w-9 2xl:w-10 rounded-full" src={cloudFrontUrl+"/assets/stocknear_logo.png"} />
        <span class="text-white hidden sm:block font-semibold ml-2 text-lg">Stocknear</span>
      </a>

      <div class="relative m-auto flex-1 md:grow-0">
        
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
        <Input
          type="search"
          placeholder="Search..."
          class="w-full rounded-lg bg-[#202327] placeholder-gray-400 border-none pl-8 md:w-[300px] lg:w-[700px] border-transparent focus:border-transparent focus:ring-0 "
          autocomplete="off"
          />
      </div>
      <DropdownMenu.Root >
        <DropdownMenu.Trigger asChild let:builder>
          <Button
            size="icon"
            class="overflow-hidden rounded-full "
            builders={[builder]}
          >
            <img
            src={data?.user?.avatar
              ? getImageURL(data?.user.collectionId, data?.user.id, data?.user.avatar)
              : `https://avatar.vercel.sh/${data?.user?.username}`}
              width={36}
              height={36}
              alt="Avatar"
              class="overflow-hidden rounded-full"
            />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item>
            <a href="/community/profile">
              My Account
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>
            <a href="/watchlist">
              Watchlist
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <a href="/price-alert">
             Price Alert
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>
            <form class="cursor-pointer" action="/logout" method="POST">
              <button type="submit" class="w-full text-start">
                  <span class="text-start">Logout</span>
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>
    <main
      class="w-full"
    >
      <slot />


      {#if !hideFooter}
      <Footer/>
      {/if}
    </main>
  </div>
</div>



<style>
  .scroller {
    scrollbar-width: thin;
  }
  
  
  
  </style>