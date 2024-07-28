<script lang='ts'>
import { numberOfUnreadNotification, screenWidth } from '$lib/store';
import { onMount } from 'svelte';
import * as Card from "$lib/components/shadcn/card/index.ts";
import * as Table from "$lib/components/shadcn/table/index.ts";

//import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
import { abbreviateNumber } from '$lib/utils';
import { Chart } from 'svelte-echarts'
import Link from "lucide-svelte/icons/external-link";
import ThumbsUp from "lucide-svelte/icons/thumbs-up";
import MessageCircle from "lucide-svelte/icons/message-circle";
import Lazy from '$lib/components/Lazy.svelte';

  export let data;
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  let isLoaded = false;
  let optionGraphPost;
  let optionGraphComment;
  let optionGraphCompanySpread;
  let postList = [];
  let commentList = [];
  let numCompanyList = [];



  function formatUtcTimestamp(timestamp) {
    // Create a Date object from the UTC timestamp (in seconds)
    let date = new Date(timestamp * 1000);

    // Define arrays for month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Extract date components
    let day = date.getUTCDate();
    let month = monthNames[date.getUTCMonth()];
    let year = date.getUTCFullYear();
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();

    // Format minutes to always be two digits
    minutes = minutes < 10 ? '0' + minutes : minutes;

    // Determine AM or PM suffix and adjust hours for 12-hour format
    let amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Construct formatted date string
    let formattedDate = `${day} ${month} ${year}, ${hours}:${minutes} ${amPm}`;

    return formattedDate;
}

  function removeHttpsStrings(input) {
    // Split the input string by spaces
    let words = input?.split(' ');

    // Filter out words that contain "https"
    let filteredWords = words?.filter(word => !word?.includes('https'));

    // Join the filtered words back into a single string
    let output = filteredWords?.join(' ');

    return output;
}

function getPlotOptions() {
  
  let rawData = data?.getRedditTracker?.stats;
  rawData = rawData?.sort((a, b) => new Date(a?.date) - new Date(b?.date));
  let dates = [];

  rawData?.forEach(item => {
  
  dates?.push(item?.date);
  postList?.push(item?.totalPosts);
  commentList?.push(item?.totalComments)
  numCompanyList?.push(item?.companySpread)
  });

  const optionPost = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '0%',
    top: $screenWidth < 640 ? '20%' : '10%',
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      data: dates,
      axisLabel: {
        show: false // Hide x-axis labels
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      axisLabel: {
        show: false // Hide y-axis labels
      }
    },
  ],
  series: [
    {
      name: 'Total Posts',
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 1,
        color: '#3B82F6'
      },
      emphasis: {
        focus: 'series'
      },
      data: postList
    },
  ]
};
  
const optionComment = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '0%',
    top: $screenWidth < 640 ? '20%' : '10%',
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      data: dates,
      axisLabel: {
        show: false // Hide x-axis labels
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      axisLabel: {
        show: false // Hide y-axis labels
      }
    },
  ],
  series: [
    {
      name: 'Total Comments',
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 1,
        color: '#E11D48'
      },
      emphasis: {
        focus: 'series'
      },
      data: commentList
    },
  ]
};
  
const optionCompanySpread = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '0%',
    top: $screenWidth < 640 ? '20%' : '10%',
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      data: dates,
      axisLabel: {
        show: false // Hide x-axis labels
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      axisLabel: {
        show: false // Hide y-axis labels
      }
    },
  ],
  series: [
    {
      name: 'Company Spread',
      type: 'bar',
      smooth: true,
      barWidth: '90%',
      showSymbol: false,
      data: numCompanyList,
      itemStyle: {
            color: '#22C55E'
          }
    },
  ]
};
  return {optionPost, optionComment, optionCompanySpread};
  }
  
      
  onMount(() => {
    const {optionPost, optionComment, optionCompanySpread } = getPlotOptions()
    optionGraphPost = optionPost
    optionGraphComment = optionComment
    optionGraphCompanySpread = optionCompanySpread
    isLoaded = true;
  })
    
    
          
    </script>
    
    <svelte:head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
        {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Wallstreetbets Tracker · stocknear
    </title>
    <meta name="description" content={`Track the stocks and discussion of Wallstreetbets in realtime.`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`Wallstreetbets Tracker · stocknear`}/>
    <meta property="og:description" content={`Track the stocks and discussion of Wallstreetbets in realtime.`} />
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
    
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`Wallstreetbets Tracker · stocknear`}/>
    <meta name="twitter:description" content={`Track the stocks and discussion of Wallstreetbets in realtime.`} />
    <!-- Add more Twitter meta tags as needed -->
    
    </svelte:head>
    
    <svelte:options immutable = {true} />

    
    <section class="w-full max-w-screen overflow-hidden m-auto min-h-screen bg-[#09090B] pb-40">
          
      <div class="flex flex-col w-full max-w-6xl 3xl:max-w-7xl m-auto justify-center items-center">
        <div class="text-center mb-10 w-full px-4 3xl:px-10 mt-10 3xl:ml-20">    

      <div class="flex flex-col items-start mb-10">
      <div class="flex flex-row items-center mb-10">
        <div class="flex-shrink-0 rounded-full w-12 h-12 sm:w-20 sm:h-20 relative bg-[#27272A] flex items-center border border-gray-600 justify-center">
          <img style="clip-path: circle(50%);" class="avatar w-9 h-9 sm:w-16 sm:h-16" src={cloudFrontUrl+'/reddit/wallstreetbets_logo.png'} alt="stock logo"/>
        </div>
        <h1 class="text-white text-xl sm:text-4xl font-bold text-start w-full pl-4">
          r/Wallstreetbets Tracker
        </h1>
      </div>

      <div class="text-start w-full text-gray-300 text-[1rem]">
        <span class="font-semibold text-white">Description:</span> <br> Like 4chan found a Bloomberg Terminal. 
      </div>
    </div>
      
                      
        <div class="flex justify-center w-full m-auto overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden w-full">
                <main class="w-full">
                 
    
                  {#if isLoaded}

                  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
                    <Card.Root class="bg-[#141417]">
                      <Card.Header class="flex flex-col items-start space-y-0 pb-2">
                        <Card.Title class="text-start text-xl sm:text-2xl font-semibold pb-2">Post Activity</Card.Title>
                        <Card.Description class="text-gray-300 text-sm pb-2">Number of Posts in the last 24 hours:</Card.Description>
                        <Card.Description class="text-white text-[1rem] pb-2"><span class="text-[#408FFF] font-bold text-2xl">
                          +{postList?.at(-1)}
                        </span> posts today
                      </Card.Description>
                      <Card.Description class="text-gray-400 text-sm pb-2">
                        {((postList?.at(-1)/postList?.at(-2) -1)*100)?.toFixed(0)}% from yesterday
                      </Card.Description>

                      </Card.Header>
                      <Card.Content>
                        <Lazy>
                          <div class="app w-full h-[150px]">
                            <Chart options={optionGraphPost} class="chart" />
                          </div>
                        </Lazy>
                      </Card.Content>
                    </Card.Root>

                    <Card.Root class="bg-[#141417]">
                      <Card.Header class="flex flex-col items-start space-y-0 pb-2">
                        <Card.Title class="text-start text-xl sm:text-2xl font-semibold pb-2">Comment Activity</Card.Title>
                        <Card.Description class="text-gray-300 text-sm pb-2">Number of Comments in the last 24 hours:</Card.Description>
                        <Card.Description class="text-white text-[1rem] pb-2"><span class="text-[#F71F4F] font-bold text-2xl">
                          +{abbreviateNumber(commentList?.at(-1))}
                          </span> comments today
                        </Card.Description>
                        <Card.Description class="text-gray-400 text-sm pb-2">
                          {((commentList?.at(-1)/commentList?.at(-2) -1)*100)?.toFixed(0)}% from yesterday
                        </Card.Description>

                      </Card.Header>
                      <Card.Content>
                        <Lazy>
                          <div class="app w-full h-[150px]">
                            <Chart options={optionGraphComment} class="chart" />
                          </div>
                        </Lazy>
                      </Card.Content>
                    </Card.Root>

                    <Card.Root class="bg-[#141417]">
                      <Card.Header class="flex flex-col items-start space-y-0 pb-2">
                        <Card.Title class="text-start text-xl sm:text-2xl font-semibold pb-2">Company Spread</Card.Title>
                        <Card.Description class="text-start text-gray-300 text-sm pb-2">Number of Tickers discussed in the last 24 hours:</Card.Description>
                        <Card.Description class="text-white text-[1rem] pb-2"><span class="text-[#24D766] font-bold text-2xl">
                          +{numCompanyList?.at(-1)}
                          </span> discussed today
                        </Card.Description>

                        <Card.Description class="text-gray-400 text-sm pb-2">
                          {((numCompanyList?.at(-1)/numCompanyList?.at(-2) -1)*100)?.toFixed(0)}% from yesterday
                        </Card.Description>

                      </Card.Header>
                      <Card.Content>
                      <Lazy>
                        <div class="app w-full h-[150px]">
                          <Chart options={optionGraphCompanySpread} class="chart" />
                        </div>
                      </Lazy>
                      </Card.Content>
                    </Card.Root>

                  </div>

                  <div class="mt-10 grid gap-4 md:gap-8 grid-cols-1 text-start">
                  <Lazy>
                    <Card.Root class="order-1 overflow-x-scroll h-full">
                      <Card.Header class="flex flex-row items-center">
                        <div class="flex flex-col items-start w-full">
                          <div class="flex flex-row w-full items-center">
                            <Card.Title class="text-xl sm:text-2xl text-white font-semibold">Latest Posts</Card.Title>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Content class="p-3 sm:p-6">
                        {#each data?.getRedditTracker?.posts as item}
                        <div class="flex flex-col items-start mb-3 p-3 border border-gray-800 rounded-lg bg-[#141417]">
                          <a href={'https://www.reddit.com'+item?.permalink} rel="noopener noreferrer" target="_blank" class="text-[1rem] sm:text-xl font-semibold mb-3 transition duration-100 text-white sm:hover:text-blue-400">
                              {item?.title}
                          </a>

                          {#if item?.selftext?.length !== 0}
                          <div class="text-sm sm:text-[1rem] mb-3">
                            {#if $screenWidth < 640}
                            {item?.selftext?.length > 400 ? removeHttpsStrings(item?.selftext)?.slice(0,240)+ '...' : removeHttpsStrings(item?.selftext)}
                            {:else}
                            {item?.selftext?.length > 1000 ? removeHttpsStrings(item?.selftext)?.slice(0,800)+ '...' : removeHttpsStrings(item?.selftext)}
                            {/if}
                          </div>
                          {/if}

                          <div class="flex flex-row items-center mb-5 mt-3">
                            <label class="mr-4 text-sm">
                              <ThumbsUp class="h-5 w-5 inline-block -mt-1 shrink-0 mr-1" /> {(item?.upvote_ratio*100)}%
                            </label>
                            <label class="text-sm">
                              <MessageCircle class="h-5 w-5 inline-block -mt-1 shrink-0 mr-1" /> {item?.num_comments}
                            </label>
                          </div>

                          <label class="mt-2 mb-2 text-xs bg-white rounded-lg px-3 py-1 text-black">
                            {item?.link_flair_text}
                          </label>


                          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mt-3">
                            <a href={'https://www.reddit.com/user/'+item?.author} rel="noopener noreferrer" target="_blank"  class="text-sm text-white sm:hover:text-blue-400">
                              Posted by {item?.author}
                            </a>
                            <a href={'https://www.reddit.com'+item?.permalink} rel="noopener noreferrer" target="_blank"  class="mt-2 sm:mt-0 text-sm text-white sm:hover:text-blue-400">
                              {formatUtcTimestamp(item?.created_utc)}
                              <Link class="h-3 w-3 inline-block shrink-0 -mt-1 ml-1" />
                            </a>
                          </div>

                          
                        </div>
                        {/each}
                      </Card.Content>
                    </Card.Root>
                  </Lazy>
                    <Card.Root class="order-0 overflow-x-scroll h-[500px]">
                      <Card.Header>
                        <Card.Title class="text-start text-xl w-full flex flex-row items-center">
                          <span>
                            Last 14 Days Trend
                          </span>
                        </Card.Title>
                      </Card.Header>
                      <Card.Content class="grid gap-y-4">
                        <Table.Root class="overflow-x-scroll w-full">
                          <Table.Header>
                            <Table.Row>
                              <Table.Head class="text-white text-[1rem]">Rank</Table.Head>
                              <Table.Head class="text-white text-[1rem]">Symbol</Table.Head>
                              <Table.Head class="text-white text-[1rem] text-end">Mentions</Table.Head>
                              <Table.Head class="text-white text-[1rem] text-end">Calls</Table.Head>
                              <Table.Head class="text-white text-[1rem] text-end">Puts</Table.Head>
                              <Table.Head class="text-white text-[1rem] text-end">Sentiment</Table.Head>
                              <Table.Head class="text-white text-[1rem] text-end">Price</Table.Head>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {#each data?.getRedditTracker?.trending as item, index}
                            <Table.Row>
                              <Table.Cell class="text-left text-[1rem]">
                                #{index+1}
                              </Table.Cell>
                              <Table.Cell>
                                <a href={item?.assetType === 'stocks' ? `/stocks/${item?.symbol}` : `/etf/${item?.symbol}`} class="whitespace-wrap font-medium">
                                  <div class="flex flex-col items-start text-[1rem]">
                                    <span class="text-blue-400 sm:hover:text-white transition duration-100">{item?.symbol}</span>
                                    <span class="text-white whitespace-wrap text-sm hidden sm:block">
                                        {item?.name}
                                    </span>
                                </div>
                                </a>
                              </Table.Cell>                              
                              <Table.Cell class="text-right text-[1rem]">{item?.count}</Table.Cell>
                              <Table.Cell class="text-right text-[1rem] text-[#00FC50]">{item?.call}</Table.Cell>
                              <Table.Cell class="text-right text-[1rem] text-[#FC2120]">{item?.put}</Table.Cell>
                              <Table.Cell class="text-right text-[1rem] {item?.avgSentiment > 0.4 ? 'text-[#00FC50]' : item?.avgSentiment <-0.1 ? 'text-[#FC2120]' : 'text-[#C6A755]'} ">{item?.avgSentiment > 0.4 ? 'Bullish' : item?.avgSentiment <= -0.1 ? 'Bearish' : 'Neutral'}</Table.Cell>
                              <Table.Cell>
                                <div class="flex flex-row justify-end items-center text-[1rem]">

                                  <div class="flex flex-col mt-3">
                                    <span class="text-white ml-auto">${item.price?.toFixed(2)}</span>
                                    <span class="{item?.changesPercentage > 0 ? 'text-[#00FC50]' : 'text-[#FC2120]'} text-sm font-semibold text-end">{item?.changesPercentage?.toFixed(2)}%</span>
                                    
                                  </div>
                  
                                  
                              </div>
                              </Table.Cell>
                            </Table.Row>
                            {/each}
                          </Table.Body>
                        </Table.Root>
                      </Card.Content>
                    </Card.Root>
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
  
                
                </main>
            </div>
        </div>
    
      
          
          
      </div>
      </div>
    </section>
    
<style>
.app {
height: 150px;
max-width: 100%; /* Ensure chart width doesn't exceed the container */

}

@media (max-width: 640px) {
.app {
  height: 120px;
}
}

.chart {
width: 100%;
}

</style>