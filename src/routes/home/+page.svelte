<script lang='ts'>

  import { onMount } from 'svelte';
 
  import * as Avatar from "$lib/components/shadcn/avatar/index.js";
  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import * as Table from "$lib/components/shadcn/table/index.ts";
  import ArrowUpRight from "lucide-svelte/icons/arrow-up-right";
  import Zap from "lucide-svelte/icons/zap";
  import Bomb from "lucide-svelte/icons/bomb";
  import Crown from "lucide-svelte/icons/crown";
  import Activity from "lucide-svelte/icons/activity";
  import { abbreviateNumber, formatDate, formatString } from '$lib/utils';
  
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



<div class="w-full max-w-screen overflow-hidden m-auto min-h-screen bg-[#09090B]">
    
    <div class="flex flex-col w-full max-w-7xl m-auto justify-center items-center">
      <div class="text-center mb-10 w-full px-4 sm:px-3 mt-10">                
        
        <h1 class="text-white text-3xl font-semibold text-start w-full pl-4 pb-4 sm:pb-2">
          Dashboard
        </h1>

        <main class="flex flex-1 flex-col gap-4 sm:p-4 md:gap-8">
          <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-xl font-semibold">Most Active</Card.Title>
                <Activity class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <div class="text-start text-2xl font-bold">$45,231.89</div>
                <p class="text-start text-sm text-muted-foreground">+20.1% from last month</p>
              </Card.Content>
            </Card.Root>
            <Card.Root class="hidden sm:block">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-xl font-semibold">Biggest Winner</Card.Title>
                <Crown class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <div class="text-start text-2xl font-bold">+2350</div>
                <p class="text-start text-sm text-muted-foreground">+180.1% from last month</p>
              </Card.Content>
            </Card.Root>
            <Card.Root class="hidden sm:block">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-xl font-semibold">Biggest Loser</Card.Title>
                <Bomb class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <div class="text-start text-2xl font-bold">+12,234</div>
                <p class="text-start text-sm text-muted-foreground">+19% from last month</p>
              </Card.Content>
            </Card.Root>
            <Card.Root class="hidden sm:block">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-xl font-semibold">Most Shorted</Card.Title>
                <Zap class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <div class="text-start text-2xl font-bold">+573</div>
                <p class="text-start text-sm text-muted-foreground">+201 since last hour</p>
              </Card.Content>
            </Card.Root>
          </div>

          <div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 text-start">
            <Card.Root class="xl:col-span-2 overflow-x-scroll">
              <Card.Header class="flex flex-row items-center">
                <div class="text-start grid gap-2">
                  <Card.Title class="text-2xl tex-white font-semibold">Hottest Options Contract</Card.Title>
                  <Card.Description>Recent options transaction of Hedge Funds</Card.Description>
                </div>
                <Button href="##" class="w-24 ml-auto gap-1 font-semibold bg-white text-black">
                  View All
                  <ArrowUpRight class="h-4 w-4 shrink-0" />
                </Button>
              </Card.Header>
              <Card.Content>
                <Table.Root class="overflow-x-scroll w-full">
                  <Table.Header>
                    <Table.Row>
                      <Table.Head class="text-white">Symbol</Table.Head>
                      <Table.Head class="text-white">Prem.</Table.Head>
                      <Table.Head class="text-white">Strike</Table.Head>
                      <Table.Head class="text-white">Sent.</Table.Head>
                      <Table.Head class="text-white">C/P</Table.Head>
                      <Table.Head class="text-right text-white">Expiry</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each data?.getOptionsFlowFeed?.slice(0,3) as item}
                    <Table.Row>
                      <Table.Cell>
                        <div class="font-medium text-blue-400">{item?.ticker}</div>
                        <div class="hidden sm:flex text-sm text-gray-300">
                            {item?.name}
                        </div>
                      </Table.Cell>
                      <Table.Cell class="xl:table.-column">
                        {abbreviateNumber(item?.cost_basis)}
                      </Table.Cell>
                      <Table.Cell class="xl:table.-column">
                        ${item?.strike_price}
                      </Table.Cell>
                      <Table.Cell class="md:table.-cell xl:table.-column">
                        {item?.sentiment}
                      </Table.Cell>
                      <Table.Cell class="md:table.-cell xl:table.-column">
                        {item?.put_call}
                      </Table.Cell>
                      
                      <Table.Cell class="text-right">07/26/24</Table.Cell>
                    </Table.Row>
                    {/each}
                  </Table.Body>
                </Table.Root>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Card.Title class="text-start text-xl w-full flex flex-row items-center">
                  <span>
                    Latest Congress Trading
                  </span>
                  <a href="/politicians/flow-data" class="ml-auto rounded-lg text-sm px-3 py-1.5 font-semibold bg-white text-black">
                    View All
                    <ArrowUpRight class="h-4 w-4 shrink-0 -mt-1 ml-0.5 inline-block" />
                  </a>
                </Card.Title>
              </Card.Header>
              <Card.Content class="grid gap-y-4">
                {#each data?.getPoliticianRSS?.slice(0,4) as item}
                <div class="flex items-center gap-x-4">
                  <Avatar.Root class="h-12 w-12 border border-gray-800 flex-shrink-0 avatar {item?.party === 'Republican' ? 'bg-[#98272B]' : item?.party === 'Democratic' ? 'bg-[#295AC7]' : 'bg-[#20202E]'} sm:flex">
                    <Avatar.Image src={item?.image} alt="Avatar" />
                    <Avatar.Fallback>OM</Avatar.Fallback>
                  </Avatar.Root>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">{item?.representative?.replace('Dr','')}</p>
                    <p class="text-sm text-muted-foreground">{item?.party ?? 'n/a'}</p>
                  </div>
                  <div class="flex flex-col items-end justify-end text-lg ml-auto">
                    <p class="text-sm text-white font-medium leading-none">
                      {formatString(item?.assetDescription) ?? '-'}
                    </p>
                    
                    <p class="text-sm text-white font-medium mt-1">{item?.amount?.replace("$1,000,001 - $5,000,000","$1Mio - $5Mio")}</p>
                    <p class="text-sm text-white font-medium mt-1">
                      {#if item?.type === 'Bought'}
                      <span class="text-[#10DB06]">Bought</span>
                      {:else if item?.type === 'Sold'}
                        <span class="text-[#FF2F1F]">Sold</span>
                      {/if}
                    </p>
                  </div>
                </div>
                {/each}
              </Card.Content>
            </Card.Root>
          </div>


          <div class="grid gap-4 sm:gap-8 sm:grid-cols-3 text-start">
            <Card.Root class="sm:col-span-2 overflow-x-scroll">
              <Card.Header class="flex flex-row items-center">
                <div class="text-start grid gap-2">
                  <Card.Title class="text-2xl tex-white font-semibold">Market Momentum</Card.Title>
                  <Card.Description>Recent options transaction of Hedge Funds</Card.Description>
                </div>
              </Card.Header>
              <Card.Content>
                {#each rssFeedWIIM.slice(0,5) as item}
                  <div class="border border-gray-800 p-6 mb-4 rounded-lg text-start">
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
                              <div class="p-2 pt-1 sm:pt-2 pl-0">
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
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Card.Title class="text-start">Market News</Card.Title>
              </Card.Header>
              <Card.Content class="">
                <div class="mb-4 rounded-lg text-start">
                  <div class="text-sm">
                    <div class="flex flex-col items-start">
                      <div class="hidden sm:flex flex-row items-center mb-3">
                
                        <span class="text-gray-300 text-xs">
                          17m ago
                        </span>
                      </div>
                      <span class="text-sm text-blue-400">S&P 500 Staggers To Worst Week Since April As Goldman Sachs Warns Of Cool Summe... - Forbes</span>
                    </div>
                    
                  </div>
                </div>
             
              </Card.Content>
            </Card.Root>
          </div>
        </main>
      
        
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


</style>