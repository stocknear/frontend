<script lang='ts'>
  import "../app.css";
  import "../app.pcss";
  
  import { Toaster } from 'svelte-french-toast';
  import {getImageURL } from '$lib/utils';

  import NProgress from 'nprogress';
  import 'nprogress/nprogress.css';

  import { page } from '$app/stores';
  import Footer from '$lib/components/Footer.svelte';
  import Searchbar from '$lib/components/Searchbar.svelte';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import { goto } from "$app/navigation";
  //import PullToRefresh from '$lib/components/PullToRefresh.svelte';

  //import DiscountBanner from '$lib/components/DiscountBanner.svelte';
  
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { showCookieConsent,  newAvatar, userRegion, screenWidth, stockTicker, etfTicker, loginData, numberOfUnreadNotification, cachedPosts, currentPagePosition, clientSideCache, twitchStatus } from '$lib/store';

  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.ts";
  //import { Input } from "$lib/components/shadcn/input/index.ts";
  import * as Sheet from "$lib/components/shadcn/sheet/index.ts";
  import * as Accordion from "$lib/components/shadcn/accordion/index.js";


  import Home from "lucide-svelte/icons/house";
  import Menu from "lucide-svelte/icons/menu";
  import Stock from "lucide-svelte/icons/candlestick-chart";
  import Calendar from "lucide-svelte/icons/calendar";
  import Option from "lucide-svelte/icons/waves";
  import HandShake from "lucide-svelte/icons/handshake";
  import Layers from "lucide-svelte/icons/layers";
  import Boxes from "lucide-svelte/icons/boxes";
  import Newspaper from "lucide-svelte/icons/newspaper";
  import MessageCircle from "lucide-svelte/icons/message-circle";
  import AudioLine from "lucide-svelte/icons/audio-lines";

  import { Pane, Splitpanes } from 'svelte-splitpanes';

  export let data;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


//const trialLeftDays = Math?.floor(addDays(data, 7, ''));


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

  $: hideFooter = $page.url.pathname.startsWith('/dark-pool-flow') || $page.url.pathname.startsWith('/options-flow') ||   $page.url.pathname.startsWith('/options-zero-dte') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register') || $page.url.pathname.startsWith('/etf') || $page.url.pathname.startsWith('/stock-splits-calendar') || $page.url.pathname.startsWith('/dividends-calendar') || $page.url.pathname.startsWith('/earnings-calendar') || $page.url.pathname.startsWith('/market-mover') || $page.url.pathname.startsWith('/market-news') || $page.url.pathname.startsWith('/portfolio') || $page.url.pathname.startsWith('/hedge-funds') || $page.url.pathname.startsWith('/watchlist') || $page.url.pathname.startsWith('/stocks') || $page.url.pathname.startsWith('/community') || $page.url.pathname.startsWith('/stock-screener') || $page.url.pathname.startsWith('/price-alert');

  //$: hideSidebar = $page.url.pathname.startsWith('/contact') || $page.url.pathname.startsWith('/imprint') || $page.url.pathname.startsWith('/privacy-policy') || $page.url.pathname.startsWith('/terms-of-use') || $page.url.pathname.startsWith('/about') || $page.url.pathname.startsWith('/community/create-post') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register')

 
  let hasUnreadElement = false;
  let notificationList = [];


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
  syncWorker.postMessage({ message: {'fastifyURL': data?.fastifyURL, 'userId': data?.user?.id }});
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
    const response = await fetch(data?.fastifyURL+'/get-notifications', {
        method: 'POST',
        headers: {
        "Content-Type": "application/json"
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


</script>

<svelte:window bind:innerWidth/>

<svelte:options immutable = {true} />


<div class="app {$page?.url?.pathname === '/' ? 'bg-[#000]' : ''}">





<div class="flex min-h-screen w-full flex-col bg-[#09090B]">

  <Splitpanes class="w-full " theme="no-splitter" horizontal dblClickSplitter={false}>
    <Pane size={6} minSize={10} maxSize={6} class="w-full navbar sticky {$screenWidth < 640 && hideHeader ? 'invisible -mt-20' : ''} top-0 z-40 bg-[#09090B] border-b border-gray-800 flex h-14 items-center gap-4 px-4 sm:h-auto sm:px-6">
        
          <Sheet.Root >
            <Sheet.Trigger asChild let:builder>
              <Button builders={[builder]} size="icon" class="sm:xl bg-[#09090B] text-white sm:hover:bg-[#27272A] border-none">
                <Menu class=" h-5.5 w-5.5 sm:w-7 sm:h-7" />
                <span class="sr-only">Toggle Menu</span>
              </Button>
            </Sheet.Trigger>
            <Sheet.Content side="left" class="max-w-screen w-full sm:max-w-xs bg-[#141417] overflow-y-scroll">
              <nav class=" grid gap-6 text-lg font-medium bg-[#141417]">
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
                    <span class="ml-3 text-white text-[1rem]">Home</span>
                  </a>
                </Button>
              </Sheet.Close>
              
              
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <Stock class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">Stocks</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/analysts" class="text-start w-full text-[1rem] text-white ml-4 mt-2">Top Analyst</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/analysts/top-stocks" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Top Analyst Stocks</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/most-shorted-stocks" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Shorted Stocks</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/stock-screener" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Stock Screener</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/market-mover" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Market Mover</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/heatmaps" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Heatmaps</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/list" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Stock Lists</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <Layers class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">ETFs</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
    
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/etf/new-launches" class="text-start w-full text-[1rem] text-white ml-4 mt-2">New Launches</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/etf/etf-providers" class="text-start w-full text-[1rem] text-white ml-4 mt-4">ETF Providers</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
    
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <Calendar class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">Calendar</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
    
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/dividends-calendar" class="text-start w-full text-[1rem] text-white ml-4 mt-2">Dividends Calendar</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/earnings-calendar" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Earnings Calendar</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/ipos/2024" class="text-start w-full text-[1rem] text-white ml-4 mt-4">IPO Calendar</a>
                          </Button>
                          <!--
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/fda-calendar" class="text-start w-full text-[1rem] text-white ml-4 mt-4">FDA Calendar</a>
                          </Button>
                          -->
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/economic-calendar" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Economic Calendar</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/stock-splits-calendar" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Stock Splits Calendar</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
    
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <Option class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">Options</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
    
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/options-flow" class="text-start w-full text-[1rem] text-white ml-4 mt-2">Options Flow</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/options-zero-dte" class="text-start w-full text-[1rem] text-white ml-4 mt-4">0DTE Flow</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
    
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <HandShake class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">Congress</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
    
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/politicians/flow-data" class="text-start w-full text-[1rem] text-white ml-4 mt-2">Congress Flow</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/politicians" class="text-start w-full text-[1rem] text-white ml-4 mt-4">All Politicians</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
    
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              <div class="flex flex-row items-center w-full">
    
                <Accordion.Root class="w-full">
      
                  <Accordion.Item value="item-1">
      
                    <Accordion.Trigger class="">
                      <AudioLine class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                      <span class="text-white ml-1 mr-auto">Tracker Datasets</span>
                    </Accordion.Trigger>
                    <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
    
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/cramer-tracker" class="text-start w-full text-[1rem] text-white ml-4 mt-2">Jim Cramer Tracker</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/most-retail-volume" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Retail Trader Tracker</a>
                          </Button>
                          <Button builders={[builder]} type="submit" class="w-full bg-[#141417] hover:bg-[#141417]">
                            <a href="/reddit-tracker" class="text-start w-full text-[1rem] text-white ml-4 mt-4">Reddit Tracker</a>
                          </Button>
                        </div>
    
                      </Sheet.Close>
    
                      
                    </Accordion.Content
                    >
                  </Accordion.Item>
                </Accordion.Root>
                        
              </div>
    
              
    
              <!--
            <Sheet.Close asChild let:builder>
              <Button builders={[builder]} type="submit" class="bg-[#141417] hover:bg-[#141417] -ml-4 w-full">
                <a href="/dark-pool-flow" class="flex flex-row items-center w-full -mt-2"> 
                      <div class="flex flex-row items-center mr-auto">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                          <Box class="h-5.5 w-5.5" />  
                        </div>
                        <span class="ml-3 text-white text-[1rem]">Dark Pool</span>
                      </div>
                </a>
              </Button>
            </Sheet.Close>
            -->
    
            <Sheet.Close asChild let:builder>
              <Button builders={[builder]} type="submit" class="bg-[#141417] hover:bg-[#141417] -ml-4 w-full">
                <a href="/hedge-funds" class="flex flex-row items-center w-full -mt-2"> 
                      <div class="flex flex-row items-center mr-auto">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                          <Boxes class="h-5.5 w-5.5" />  
                        </div>
                        <span class="ml-3 text-white text-[1rem]">Hedge Funds</span>
                      </div>
                </a>
              </Button>
            </Sheet.Close>  
    
            <Sheet.Close asChild let:builder>
              <Button builders={[builder]} type="submit" class="bg-[#141417] hover:bg-[#141417] -ml-4 w-full">
                <a href="/market-news" class="flex flex-row items-center w-full -mt-2"> 
                      <div class="flex flex-row items-center mr-auto">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                          <Newspaper class="h-5.5 w-5.5" />  
                        </div>
                        <span class="ml-3 text-white text-[1rem]">News</span>
                      </div>
                </a>
              </Button>
            </Sheet.Close>  
    
            <Sheet.Close asChild let:builder>
              <Button builders={[builder]} type="submit" class="bg-[#141417] hover:bg-[#141417] -ml-4 w-full">
                <a href="/community" class="flex flex-row items-center w-full -mt-2"> 
                      <div class="flex flex-row items-center mr-auto">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                          <MessageCircle class="h-5.5 w-5.5" />  
                        </div>
                        <span class="ml-3 text-white text-[1rem]">Community</span>
                      </div>
                </a>
              </Button>
            </Sheet.Close>  
    
    
              </nav>
    
              {#if data?.user?.tier === 'Free' || data?.user?.freeTrial === true}
              <div class="pt-10 w-full mb-5 m-auto sticky">
                <Card.Root
                >
                  <Card.Header class="p-4">
                    <Card.Title>Upgrade to Pro</Card.Title>
                    <Card.Description>
                      {#if data?.user?.freeTrial === true}
                       Your free trial will expire soon.
                       Upgrade now for unlimited access to all features!
                      {:else}
                        Unlock all features of the platform and level up your trading.
                      {/if}
                    </Card.Description>
                  </Card.Header>
                  <Card.Content class="p-4 pt-0">
                    <Sheet.Close asChild let:builder>
                      <Button on:click={() => goto('/pricing')} builders={[builder]} type="submit" size="sm" class="w-full bg-white hover:bg-white/80">
                        <span class="flex flex-row items-center text-black font-semibold text-center">
                          Upgrade
                        </span>
                      </Button>
                  </Sheet.Close>
                  </Card.Content>
                </Card.Root>
              </div>
              {/if}
    
            </Sheet.Content>
          </Sheet.Root>
          
          <a href="/" class="-ml-2 flex w-9 flex-shrink-0">
            <img class="avatar w-9 3xl:w-10 rounded-full" src={cloudFrontUrl+"/assets/stocknear_logo.png"} />
            <span class="text-white font-semibold ml-2 text-lg">Stocknear</span>
          </a>
    
          
          <div class="relative ml-auto">
            <!--
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
            <Input
              type="search"
              placeholder="Search..."
              class="w-full rounded-lg bg-[#202327] placeholder-gray-400 border-none pl-8 md:w-[300px] lg:w-[700px] border-transparent focus:border-transparent focus:ring-0 "
              autocomplete="off"
              />
            -->
            <Searchbar apiURL={data?.apiURL} apiKey={data?.apiKey}/>
    
            <NotificationBell 
              data={data}
              hasUnreadElement={hasUnreadElement}
            />
    
          </div>
    
          
          <DropdownMenu.Root >
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                size="icon"
                class="overflow-hidden rounded-full"
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
              {#if data?.user}
              <DropdownMenu.Item>
                <form class="cursor-pointer" action="/logout" method="POST">
                  <button type="submit" class="w-full text-start">
                      <span class="text-start">Logout</span>
                  </button>
                </form>
              </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
    
       
    </Pane>
    <Pane>
      <Splitpanes class="w-full" theme="modern-theme">
        <Pane class="hidden 3xl:inline-block" size={$screenWidth < 1750 ? 0 : 14}  maxSize={14} minSize={0}>
          <aside class="fixed overflow-y-scroll scroller overflow-hidden inset-y-0 left-0 z-50 3xl:flex w-72 flex-col 3xl:border-r 3xl:border-gray-800 bg-[#141417]">
            <nav class="flex flex-col items-center mr-auto gap-y-4 3xl:py-5 w-full">
              <a
                href="/"
                class="-ml-3 mb-5 flex justify-end items-center h-9 w-9 shrink-0 gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:text-base"
              >
              <img class="avatar w-9 3xl:w-12 rounded-full" src={cloudFrontUrl+"/assets/stocknear_logo.png"} />
                <span class="text-white text-xl">Stocknear</span>
              </a>
              
              <a href="/" class="flex flex-row items-center ml-9 w-full">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8">
                  <Home class="h-5.5 w-5.5" />  
                </div>
                <span class="ml-3 text-white">Home</span>
                </a>
        
        
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <Stock class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">Stocks</span>
                      </Accordion.Trigger>
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <a href="/analysts" class="text-[1rem] text-white ml-4 mt-4">Top Analyst</a>
                          <a href="/analysts/top-stocks" class="text-[1rem] text-white ml-4 mt-4">Top Analyst Stocks</a>
                          <a href="/most-shorted-stocks" class="text-[1rem] text-white ml-4 mt-4">Shorted Stocks</a>
                          <a href="/stock-screener" class="text-[1rem] text-white ml-4 mt-4">Stock Screener</a>
                          <a href="/market-mover" class="text-[1rem] text-white ml-4 mt-4">Market Mover</a>
                          <a href="/heatmaps" class="text-[1rem] text-white ml-4 mt-4">Heatmaps</a>
                          <a href="/list" class="text-[1rem] text-white ml-4 mt-4">Stock Lists</a>
        
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
               
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <Layers class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">ETFs</span>
                      </Accordion.Trigger>
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <a href="/etf/new-launches" class="text-[1rem] text-white ml-4 mt-4">New Launches</a>
                          <a href="/etf/etf-providers" class="text-[1rem] text-white ml-4 mt-4">ETF Providers</a>
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
        
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <Calendar class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">Calendar</span>
                      </Accordion.Trigger>
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <a href="/dividends-calendar" class="text-[1rem] text-white ml-4 mt-4">Dividends Calendar</a>
                          <a href="/earnings-calendar" class="text-[1rem] text-white ml-4 mt-4">Earnings Calendar</a>
                          <a href="/ipos/2024" class="text-[1rem] text-white ml-4 mt-4">IPO Calendar</a>
                          <!--<a href="/fda-calendar" class="text-[1rem] text-white ml-4 mt-4">FDA Calendar</a>-->
                          <a href="/economic-calendar" class="text-[1rem] text-white ml-4 mt-4">Economic Calendar</a>
                          <a href="/stock-splits-calendar" class="text-[1rem] text-white ml-4 mt-4">Stock Splits Calendar</a>
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
        
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <Option class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">Options</span>
                      </Accordion.Trigger>
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <a href="/options-flow" class="text-[1rem] text-white ml-4 mt-4">Options Flow</a>
                          <a href="/options-zero-dte" class="text-[1rem] text-white ml-4 mt-4">0DTE Flow</a>
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
        
        
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <HandShake class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">Congress</span>
                      </Accordion.Trigger>
                      
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <div class="flex flex-col items-start">
                            <a href="/politicians/flow-data" class="text-[1rem] text-white ml-4 mt-4">Congress Flow</a>
                            <a href="/politicians" class="text-[1rem] text-white ml-4 mt-4">All Politicians</a>
                          </div>
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
        
                <div class="flex flex-row items-center ml-9 w-full mt-3">
        
                  <Accordion.Root class="w-full">
        
                    <Accordion.Item value="item-1">
        
                      <Accordion.Trigger class="">
                        <AudioLine class="h-5.5 w-5.5 mr-3 text-white ml-1"/>  
                        <span class="text-white ml-1 mr-auto">Tracker Datasets</span>
                      </Accordion.Trigger>
                      <Accordion.Content class="border-l border-gray-500 ml-2 mt-5">
                        <div class="flex flex-col items-start">
                          <a href="/cramer-tracker" class="text-[1rem] text-white ml-4 mt-4">Jim Cramer Tracker</a>
                          <a href="/most-retail-volume" class="text-[1rem] text-white ml-4 mt-4">Retail Trader Tracker</a>
                          <a href="/reddit-tracker" class="text-[1rem] text-white ml-4 mt-4">Reddit Tracker</a>
                        </div>
                        
                      </Accordion.Content
                      >
                    </Accordion.Item>
                  </Accordion.Root>
                          
                </div>
        
                <!--
                <a href="/dark-pool-flow" class="flex flex-row items-center ml-9 w-full mt-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
                  >
                    <Box class="h-5.5 w-5.5" />
                    
                  </div>
                  <span class="ml-3 text-white">Dark Pool</span>
                </a>
              -->
        
                <a href="/hedge-funds" class="flex flex-row items-center ml-9 w-full mt-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
                  >
                    <Boxes class="h-5.5 w-5.5" />
                    
                  </div>
                  <span class="ml-3 text-white">Hedge Funds</span>
                </a>
        
                <a href="/market-news" class="flex flex-row items-center ml-9 w-full mt-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
                  >
                    <Newspaper class="h-5.5 w-5.5" />
                    
                  </div>
                  <span class="ml-3 text-white">News</span>
                </a>
        
                <a href="/community" class="flex flex-row items-center ml-9 w-full mt-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:text-white md:h-8 md:w-8"
                  >
                    <MessageCircle class="h-5.5 w-5.5" />
                    
                  </div>
                  <span class="ml-3 text-white">Community</span>
                </a>
                    
            </nav>
            {#if data?.user?.tier === 'Free' || data?.user?.freeTrial === true}
            <div class="mt-auto p-4 ">
              <Card.Root
                data-x-chunk-name="dashboard-02-chunk-0"
                data-x-chunk-description="A card with a call to action"
              >
                <Card.Header class="p-2 pt-0 md:p-4">
                  <Card.Title>Upgrade to Pro</Card.Title>
                  <Card.Description>
                    {#if data?.user?.freeTrial === true}
                      Your free trial will be expired soon.
                      Upgrade now for unlimited access to all features!
                    {:else}
                      Unlock all features of the platform and level up your trading.
                    {/if}
                  </Card.Description>
                </Card.Header>
                <Card.Content class="p-2 pt-0 md:p-4 md:pt-0">
                  <a href="/pricing" class="flex justify-center items-center text-center rounded-lg text-sm py-2 m-auto text-center w-full bg-white text-black font-semibold hover:bg-white/80">
                    Upgrade
                  </a>
                </Card.Content>
              </Card.Root>
            </div>
            {/if}
        
          </aside>
        </Pane>
        <Pane class="w-full">
         
            <main class="xl:pl-10 w-full overflow-y-auto bg-[#09090B] sm:p-4">
              <slot />
          <Toaster class="bg-[#1A1A27] text-white text-medium"/>
          {#if Cookie && $showCookieConsent === true}
          <Cookie />
          {/if}
          </main>

        </Pane>
      </Splitpanes>
    </Pane>
    <Pane size={6} minSize={6} maxSize={6}>
      {#if !hideFooter}
      <Footer/>
      {/if}
    </Pane>
  </Splitpanes>

</div>

</div>



<style global lang="scss">

.scroller {
    scrollbar-width: thin;
  }
  


  .splitpanes.modern-theme {
    .splitpanes__pane {
      background-color: #f8f8f8;
    }
    .splitpanes__splitter {
      background-color: #ccc;
      position: relative;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        transition: opacity 0.4s;
        background-color: #2db9d2;
        opacity: 0;
        z-index: 1;
      }
      &:hover:before {
        opacity: 1;
      }
      &.splitpanes__splitter__active {
        z-index: 2; /* Fix an issue of overlap fighting with a near hovered splitter */
      }
    }
  }
  .modern-theme {
    &.splitpanes--vertical > .splitpanes__splitter:before {
      left: -3px;
      right: -3px;
      height: 100%;
      cursor: col-resize;
    }
    &.splitpanes--horizontal > .splitpanes__splitter:before {
      top: -3px;
      bottom: -3px;
      width: 100%;
      cursor: row-resize;
    }
  }

  .splitpanes.no-splitter {
    .splitpanes__pane {
      background-color: #f8f8f8;
    }
    .splitpanes__splitter {
      background-color: #ccc;
      position: relative;
    }
  }
  .no-splitter {
    &.splitpanes--horizontal > .splitpanes__splitter:before {
      width: 0.125rem;
      pointer-events: none;
      cursor: none;
    }
    &.splitpanes--vertical > .splitpanes__splitter:before {
      height: 0.125rem;
      pointer-events: none;
      cursor: none;
    }
  }


</style>

