<script lang='ts'>

  import { onMount } from 'svelte';
 
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import * as Table from "$lib/components/shadcn/table/index.ts";
  import ArrowUpRight from "lucide-svelte/icons/arrow-up-right";
  import Zap from "lucide-svelte/icons/zap";
  import Bomb from "lucide-svelte/icons/bomb";
  import Crown from "lucide-svelte/icons/crown";
  import Activity from "lucide-svelte/icons/activity";
  import { abbreviateNumber, formatDate } from '$lib/utils';
  
  import {  numberOfUnreadNotification} from '$lib/store';

  import { Chart } from 'svelte-echarts'
  import { init, use } from 'echarts/core'
  import { BarChart } from 'echarts/charts'
  import { GridComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'

  // now with tree-shaking
  use([BarChart, GridComponent, CanvasRenderer])


  export let data;

  const quickInfo = data?.getDashboard?.quickInfo;


  function compareTimes(time1, time2) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  if (hours1 > hours2) return 1;
  if (hours1 < hours2) return -1;
  if (minutes1 > minutes2) return 1;
  if (minutes1 < minutes2) return -1;
  return 0;
}

function formatTime(timeString) {
  // Split the time string into components
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Determine AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight

  // Format the time string
  const formattedTimeString = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;

  return formattedTimeString;
}

function reformatDate(dateString) {
    return dateString.substring(5, 7) + '/' + dateString.substring(8) + '/' + dateString.substring(2, 4);
}


const tickerGraphName = data?.getDashboard?.retailTracker?.map(item => item?.symbol) || [];
const tradedList = data?.getDashboard?.retailTracker?.map(item => item?.traded) || [];

const optionsGraph = {
  animation: false,
  grid: {
    left: '2%',
    right: '3%',
    bottom: '6%',
    top: '0%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    splitLine: {
      show: false, // Disable x-axis grid lines
    },
    axisLabel: {
      show: false // Hide x-axis labels
    },
    axisTick: {
      show: false // Hide x-axis ticks
    },
    axisLine: {
      show: false // Hide x-axis line
    }
  },
  yAxis: {
    type: 'category',
    data: tickerGraphName,
    inverse: true,
    axisTick: {
      show: false // Hide x-axis ticks
    },
    axisLabel: {
        color: '#fff' // Set the y-axis label color to white
    }
  },
  series: [
    {
      data: tradedList,
      label: {
        show: true,
        position: 'inside',
        formatter: function(params) {
          return abbreviateNumber(params?.value,true);
        },
        fontWeight: 600,
      },
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      },
      itemStyle: {
        color: 'white'  // Bar color is white
      }
    }
  ]
};

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

<svelte:options immutable={true}/>


<div class="w-full xl:max-w-screen-2xl overflow-hidden m-auto min-h-screen bg-[#09090B]">
    
    <div class="flex flex-col m-auto justify-center items-center">
      <div class="text-center mb-10 w-full px-4 sm:px-3 mt-10 ">                
      
        {#if Feedback}
          <Feedback data={data} />
        {/if}
        
        <div class="text-center mb-10 relative w-fit flex justify-center m-auto">
          <a href="/corporate-lobbying-tracker" class="text-white antialiased bg-[#27272A] w-full px-4 py-2 rounded-lg m-auto font-medium text-[1rem] flex items-center">
            <span class="font-semibold">Corporate Lobbying Tracker</span>
          </a>
          <div class="absolute top-[-1.2rem] -right-5 sm:-right-8 rotate-[7deg]">
            <span class="bg-[#FBCE3C] text-black text-sm sm:text-[0.9rem] rounded-xl font-semibold sm:me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
              New
            </span>
          </div>
        </div>

        <h1 class="text-white text-3xl font-semibold text-start w-full pl-4 pb-4 sm:pb-2">
          Dashboard
        </h1>

    

        <main class="flex flex-1 flex-col gap-4 sm:p-4 md:gap-8">
          <div class="grid gap-4 grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="cursor-pointer text-start text-[1rem] sm:text-xl font-semibold">
                  <a href="/market-mover" class="sm:hover:underline">Most Active</a>
                </Card.Title>
                <Activity class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <a href={`/stocks/${quickInfo?.active?.symbol}`} class="flex text-start text-blue-400 sm:hover:text-white text-[1rem] sm:text-lg font-semibold">{quickInfo?.active?.symbol}</a>
                <p class="text-start text-[1rem] sm:text-lg font-medium text-white mt-1">
                  <!--${quickInfo?.active?.price}-->
                      {#if quickInfo?.active?.changesPercentage >=0}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                      <span class="text-[#10DB06] font-medium">+{quickInfo?.active?.changesPercentage?.toFixed(2)}%</span>
                    {:else}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5 inline-block rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                      <span class="text-[#FF2F1F] font-medium">{quickInfo?.active?.changesPercentage?.toFixed(2)}% </span> 
                    {/if}
                </p>
              </Card.Content>
            </Card.Root>
            <Card.Root >
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-[1rem] sm:text-xl font-semibold">
                  <a href="/market-mover" class="sm:hover:underline">Biggest Winner</a>
                </Card.Title>
                <Crown class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <a href={`/stocks/${quickInfo?.winner?.symbol}`} class="flex text-start text-blue-400 sm:hover:text-white text-[1rem] sm:text-lg font-semibold">{quickInfo?.winner?.symbol}</a>
                <p class="text-start text-[1rem] sm:text-lg font-medium text-white mt-1">
                  <!--${quickInfo?.winner?.price}-->
                      {#if quickInfo?.winner?.changesPercentage >=0}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                      <span class="text-[#10DB06] font-medium">+{abbreviateNumber(quickInfo?.winner?.changesPercentage?.toFixed(2))}%</span>
                    {:else}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                      <span class="text-[#FF2F1F] font-medium">{abbreviateNumber(quickInfo?.winner?.changesPercentage?.toFixed(2))}% </span> 
                    {/if}
                </p>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-[1rem] sm:text-xl font-semibold">
                  <a href="/market-mover" class="sm:hover:underline">Biggest Loser</a>
                </Card.Title>
                <Bomb class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <a href={`/stocks/${quickInfo?.loser?.symbol}`} class="flex text-start text-blue-400 sm:hover:text-white text-[1rem] sm:text-lg font-semibold">{quickInfo?.loser?.symbol}</a>
                <p class="text-start text-[1rem] sm:text-lg font-medium text-white mt-1">
                  <!--${quickInfo?.loser?.price?.toFixed(2)}-->
                      {#if quickInfo?.loser?.changesPercentage >=0}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                      <span class="text-[#10DB06] font-medium">+{abbreviateNumber(quickInfo?.loser?.changesPercentage?.toFixed(2))}%</span>
                    {:else}
                      <svg class="hidden sm:inline-block w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                      <span class="text-[#FF2F1F] font-medium">{abbreviateNumber(quickInfo?.loser?.changesPercentage?.toFixed(2))}% </span> 
                    {/if}
                </p>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-start text-[1rem] sm:text-xl font-semibold">
                  <a href="/most-shorted-stocks" class="sm:hover:underline"> Most Shorted</a>
                </Card.Title>
                <Zap class="h-4 w-4 shrink-0" />
              </Card.Header>
              <Card.Content>
                <a href={`/stocks/${quickInfo?.shorted?.symbol}`} class="flex text-start text-blue-400 sm:hover:text-white text-[1rem] sm:text-lg font-semibold">{quickInfo?.shorted?.symbol}</a>
                <p class="text-start text-[1rem] sm:text-lg font-medium text-[#FF2F1F] mt-1">
                  Short: {quickInfo?.shorted?.shortOutStandingPercent?.toFixed(2)}%
                </p>
              </Card.Content>
            </Card.Root>
          </div>


      

          <div class="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 text-start">

            <Card.Root class="overflow-x-scroll overflow-hidden overflow-y-scroll">
              <Card.Header class="flex flex-row items-center">
                <div class="flex flex-col items-start w-full">
                  <div class="flex flex-row w-full items-center">
                    <Card.Title class="text-xl sm:text-2xl tex-white font-semibold">Hottest Options Contract</Card.Title>
                    <a href="/options-flow" class="ml-auto rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-2 font-semibold bg-white text-black">
                      View All
                      <ArrowUpRight class="hidden sm:inline-block h-4 w-4 shrink-0 -mt-1 ml-0.5" />
                    </a>
                  </div>
                  <Card.Description class="mt-2 text-sm sm:text-[1rem]">Recent hedge fund options with the highest premiums.</Card.Description>
                </div>
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
                    {#each data?.getDashboard?.optionsFlow as item}
                    <Table.Row>
                      <Table.Cell>
                        <a href={item?.assetType === 'stock' ? `/stocks/${item?.ticker}` : `/etf/${item?.ticker}`} class="text-sm sm:text-[1rem] font-medium text-blue-400 sm:hover:text-white transition duration-100">{item?.ticker}</a>
                      </Table.Cell>
                      <Table.Cell class="xl:table.-column text-sm sm:text-[1rem] {item?.put_call === 'Calls' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">
                        {abbreviateNumber(item?.cost_basis,true)}
                      </Table.Cell>
                      <Table.Cell class="xl:table.-column text-sm sm:text-[1rem]">
                        ${item?.strike_price}
                      </Table.Cell>
                      <Table.Cell class="md:table.-cell xl:table.-column text-sm sm:text-[1rem] {item?.sentiment === 'Bullish' ? 'text-[#00FC50]' : item?.sentiment === 'Bearish' ? 'text-[#FC2120]' : 'text-[#C6A755]'}">
                        {item?.sentiment}
                      </Table.Cell>
                      <Table.Cell class="md:table.-cell xl:table.-column text-sm sm:text-[1rem] {item?.put_call === 'Calls' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">
                        {item?.put_call}
                      </Table.Cell>
                      
                      <Table.Cell class="text-right text-sm sm:text-[1rem]">{reformatDate(item?.date_expiration)}</Table.Cell>
                    </Table.Row>
                    {/each}
                  </Table.Body>
                </Table.Root>
              </Card.Content>
            </Card.Root>
            
            <Card.Root class="overflow-hidden">
              <Card.Header class="flex flex-row items-center">
                <div class="flex flex-col items-start w-full">
                  <div class="flex flex-row w-full items-center">
                    <Card.Title class="text-xl sm:text-2xl tex-white font-semibold">Retail Trader Tracker</Card.Title>
                    <a href="/most-retail-volume" class="ml-auto rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-2 font-semibold bg-white text-black">
                      View All
                      <ArrowUpRight class="hidden sm:inline-block h-4 w-4 shrink-0 -mt-1 ml-0.5" />
                    </a>
                  </div>
                  <Card.Description class="mt-2 text-sm sm:text-[1rem]">Latest Retail Trader investing behavior to identify market trends.</Card.Description>
                </div>
              </Card.Header>
              <Card.Content>                
                {#if data?.getDashboard?.retailTracker?.length !== 0}
                  <div class="app w-full h-[300px] mt-5">
                    <Chart {init} options={optionsGraph} class="chart" />
                </div>
                  {:else}
                  <div class="flex justify-center items-center h-80">
                    <div class="relative">
                    <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="loading loading-spinner loading-md"></span>
                    </label>
                    </div>
                </div>
                  {/if}
              </Card.Content>
            </Card.Root>
          </div>


            <!--Start Earnings Section-->
            <div class="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 text-start">

              <Card.Root class="overflow-x-scroll overflow-hidden overflow-y-scroll no-scrollbar sm:max-h-[400px]">
                <Card.Header class="flex flex-row items-center">
                  <div class="flex flex-col items-start w-full">
                    <div class="flex flex-row w-full items-center">
                      <Card.Title class="text-xl sm:text-2xl tex-white font-semibold">Upcoming Earnings</Card.Title>
                      <a href="/earnings-calendar" class="ml-auto rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-2 font-semibold bg-white text-black">
                        View All
                        <ArrowUpRight class="hidden sm:inline-block h-4 w-4 shrink-0 -mt-1 ml-0.5" />
                      </a>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <ul style="padding-left: 5px;">
                    {#each data?.getDashboard?.upcomingEarnings as item}
                        <li style="margin-left: 8px; line-height: 22px; margin-bottom: 30px; list-style-type: disc;">
                            <strong>{item?.name}</strong> (<a href="/stocks/{item?.symbol}" class="text-blue-400 sm:hover:text-white">{item?.symbol}</a>)
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(new Date().toLocaleDateString('en-US', { weekday: 'long' })) ? "will report tomorrow" : "will report monday"}
                            {#if item?.time}
                                {#if compareTimes(item?.time, '16:00') > 0}
                                    after market closes.
                                {:else if compareTimes(item?.time, '09:30') < 0}
                                    before market opens.
                                {:else}
                                    during market.
                                {/if}
                            {/if}Analysts estimate {abbreviateNumber(item?.revenueEst,true)} in revenue ({((item?.revenueEst/item?.revenuePrior-1)*100)?.toFixed(2)}% YoY) and ${item?.epsEst} in earnings per share ({((item?.epsEst/item?.epsPrior-1)*100)?.toFixed(2)}% YoY).</li>

                    {/each}
                  </ul>
                </Card.Content>
              </Card.Root>
              
              <Card.Root class="overflow-x-scroll overflow-hidden overflow-y-scroll no-scrollbar sm:max-h-[400px]">
                <Card.Header class="flex flex-row items-center">
                  <div class="flex flex-col items-start w-full">
                    <div class="flex flex-row w-full items-center">
                      <Card.Title class="text-xl sm:text-2xl tex-white font-semibold">Recent Earnings <span class="text-sm text-gray-300">(NYSE Time)</span></Card.Title>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <ul style="padding-left: 5px;">
                    {#each data?.getDashboard?.recentEarnings as item}
                    <strong>{item?.name}</strong> (<a href="/stocks/{item?.symbol}" class="sm:hover:text-white text-blue-400">{item?.symbol}</a>) has released its quarterly earnings at {formatTime(item?.time)}:
  
                    <li style="color: #fff; line-height: 22px; margin-top:10px; margin-left: 30px; margin-bottom: 10px; list-style-type: disc;">
                        Revenue of {abbreviateNumber(item?.revenue,true)} ({(item?.revenue/item?.revenuePrior-1) > 0 ? '+' :''}{((item?.revenue/item?.revenuePrior-1)*100)?.toFixed(2)}% YoY) {item?.revenueSurprise > 0 ? 'beats' : 'misses'} by {abbreviateNumber(Math.abs(item?.revenueSurprise),true)}.
                    </li>
                    <li style="color: #fff; line-height: 22px; margin-top:0px; margin-left: 30px; margin-bottom: 30px; list-style-type: disc;">
                        EPS of ${item?.eps} ({(item?.eps/item?.epsPrior-1) > 0 ? '+' :''}{((item?.eps/item?.epsPrior-1)*100)?.toFixed(2)}% YoY) {item?.epsSurprise > 0 ? 'beats' : 'misses'} by ${Math.abs(item?.epsSurprise)?.toFixed(2)}.
                    </li>

                    {/each}
                </ul>
               
                </Card.Content>
              </Card.Root>
              
        
            </div>
            <!--End of Earnings Section-->


          <div class="grid gap-4 sm:gap-8 sm:grid-cols-3 text-start">
            <Card.Root class="sm:col-span-2 overflow-x-scroll overflow-hidden overflow-y-scroll">
              <Card.Header class="flex flex-row items-center">
                <div class="text-start grid gap-2">
                  <Card.Title class="text-2xl text-white font-semibold">Market Momentum</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                {#each data?.getDashboard?.wiimFeed as item}
                  <div class="pb-4 sm:pb-6 border-b sm:border border-gray-800 sm:p-6 mb-4 rounded-none sm:rounded-lg text-start">
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
                        <span class="text-white text-sm sm:text-[1rem]">{item?.text}</span>
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
                <Card.Title class="text-start text-2xl text-white">Market News</Card.Title>
              </Card.Header>
              <Card.Content class="">
                <div class="mb-4 rounded-lg text-start">
                    {#each data?.getDashboard?.marketNews as item}
                      <div class="flex flex-col items-start pt-4 pb-4 border-t border-gray-800">
                        <div class="flex flex-row items-center mb-3">
                          <span class="text-gray-300 text-xs">
                            {formatDate(item?.date)} ago
                          </span>
                        </div>
                        <a href={item?.url} rel="noopener noreferrer" target="_blank" class="text-sm sm:text-[1rem] text-blue-400 sm:hover:text-white transition duration-100">
                          {item?.text}
                        </a>
                      </div>
                    {/each}
                    
                    
                </div>
             
              </Card.Content>
            </Card.Root>
          </div>
        </main>
      
        
     </div>

    </div>
</div>








  
<style>


.app {
  height: 250px;
  max-width: 100%; /* Ensure chart width doesn't exceed the container */
  
  }
  
  @media (max-width: 640px) {
  .app {
    height: 210px;
  }
  }
  
  .chart {
  width: 100%;
  }

   .chart-container {
    width: 100%;
    height: 250px;
  }
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