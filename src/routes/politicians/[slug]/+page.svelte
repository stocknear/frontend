<script lang='ts'>
import { goto } from '$app/navigation';
import { screenWidth, numberOfUnreadNotification } from '$lib/store';
import republicanBackground from "$lib/images/bg-republican.png";
import democraticBackground from "$lib/images/bg-democratic.png";
import otherBackground from "$lib/images/bg-other.png";
import { getPartyForPoliticians, abbreviateNumber } from '$lib/utils';
import defaultAvatar from '$lib/images/senator/default-avatar.png';
import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
import { Chart } from 'svelte-echarts'

import { onMount } from 'svelte';

export let data;
let isLoaded = false;
let rawData = data?.getPolitician;
let displayList = [];
let optionsData = {};

let name = rawData?.at(0)?.representative ?? 'n/a';
let numOfTrades = rawData?.length;
let lastTradedDate = rawData?.at(0)?.transactionDate;
let politicianParty = 'n/a';
let images = {};
let buySellRatio = 0
let totalAmountTraded = 0;
let politicianImage;
let politicianDistrict;
let politicianCongress;
let numOfAssets = new Set(rawData?.map(item => item?.ticker))?.size;


function getYearFromDate(dateString) {
  return new Date(dateString).getFullYear();
}

// Function to extract the number from the amount string
function extractNumberFromAmount(amount) {
  const dashIndex = amount?.indexOf('-');
  if (dashIndex !== -1) {
    const numberAfterDash = amount?.slice(dashIndex + 1);
    const suffix = numberAfterDash?.slice(-1);
    let multiplier = 1;
    if (suffix === 'K') {
      multiplier = 1e3;
    } else if (suffix === 'M') {
      multiplier = 1e6;
    }
    const parsedNumber = parseFloat(numberAfterDash?.replace(/[^\d.]/g, '')) * multiplier;
    return isNaN(parsedNumber) ? 0 : parsedNumber;
  }
  return 0;
}

// Calculate the total sum
totalAmountTraded = rawData?.reduce((sum, item) => {
  const amount = item?.amount;
  const parsedAmount = extractNumberFromAmount(amount);
  return sum + parsedAmount;
}, 0);




async function infiniteHandler({ detail: { loaded, complete } }) 
{
  if (displayList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = displayList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 20);
      displayList = [...displayList, ...newArticles];
      loaded();
    }
}

// Function to load images only when they are viewed
async function loadImages() {
    const imageFiles = import.meta.glob('$lib/images/senator/*.png');
    const imagesPromises = [];

    for (const [path, resolver] of Object?.entries(imageFiles)) {
      const imageNameMatch = path.match(/\/([^/]+)\.png$/);
      if (imageNameMatch && imageNameMatch[1] !== 'default-avatar') {
        imagesPromises?.push(resolver()?.then(module => {
          images[imageNameMatch[1]] = module.default;
        }));
      }
    }

    await Promise?.all(imagesPromises);
  }


function normalizer(value) {
  if (Math?.abs(value) >= 1e12) {
    return { unit: 'T', denominator: 1e12 };
  } else if (Math?.abs(value) >= 1e9) {
    return { unit: 'B', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e6) {
    return { unit: 'M', denominator: 1e6 };
  } else if (Math?.abs(value) >= 1e5) {
    return { unit: 'K', denominator: 1e5 };
  } else {
    return { unit: '', denominator: 1 };
  }
}

async function getPlotOptions() {
    // Get unique years from the data
    const uniqueYears = [2017, 2018,2019,2020,2021,2022,2023,2024] //[...new Set(rawData?.map(item => getYearFromDate(item?.transactionDate)))]?.reverse();
    // Initialize boughtList and soldList arrays
    const boughtList = [];
    const soldList = [];
    const dates = [];

    // Calculate the total bought and sold amounts for each year
    uniqueYears?.forEach(year => {
      const boughtAmount = rawData
        ?.filter(item => getYearFromDate(item?.transactionDate) === year && item?.type === 'Bought')
        ?.reduce((sum, item) => sum + extractNumberFromAmount(item?.amount), 0);

      const soldAmount = rawData
        ?.filter(item => getYearFromDate(item.transactionDate) === year && item?.type === 'Sold')
        ?.reduce((sum, item) => sum + extractNumberFromAmount(item?.amount), 0);

      boughtList.push( boughtAmount );
      soldList.push( soldAmount );

      const fiscalYear = "FY" + String(year)?.slice(2);
      dates?.push(fiscalYear);
    });

    
    const maxBought = Math.max(...boughtList) ?? 0;
    const maxSold = Math.max(...soldList) ?? 0;
    const { unit, denominator } = normalizer(maxBought > maxSold ? maxBought : maxSold);



  const option = {
    silent: true,
    grid: {
        left: $screenWidth < 640 ? '5.2%' : '0.5%',
        right: $screenWidth < 640 ? '5%' : '0.5%',
        bottom: '0%',
        containLabel: true
    },
    xAxis: {
        data: dates,
        type: 'category',
        },
        yAxis: [
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
            axisLabel: {
            color: '#6E7079', // Change label color to white
            formatter: function (value) {
                return '$'+(value / denominator)?.toFixed(0) + unit; // Format value in millions
                },
            },
        },
        ],
    series: [
        {
            data: boughtList,
            type: 'bar',
            itemStyle: {
                    color: '#69B3A2' // Change bar color to white
              },
            barWidth: '10%',
          },
          
        {
            data: soldList,
            type: 'bar',
            itemStyle: {
                color: '#E8864D' // Change bar color to white
            },
            barWidth: '10%',
        },
    ]
    };


return option;
}

onMount(async () => {
  isLoaded = false;
    await loadImages();

    if (rawData && rawData.length > 0) {
    let firstItem = rawData[0];
    let representative = firstItem?.representative || '';

    representative = representative?.replace('Jr', '')
        ?.replace(/Dr./g, '')
        ?.replace(/Dr_/g, '');

    const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_')?.trim();
    firstItem.image = images[fullName] || defaultAvatar;
    firstItem.representative = fullName?.replace(/_/g, ' ');

    const party = getPartyForPoliticians(firstItem?.representative);
    firstItem.party = party;

    politicianImage = firstItem?.image;
    politicianParty = firstItem?.party;
    politicianDistrict = firstItem?.district;
    politicianCongress = firstItem?.congress;

    optionsData = await getPlotOptions();

    const typeCounts = rawData?.reduce((counts, item) => {
    counts[item?.type] = (counts[item?.type ] || 0) + 1;
    return counts;
}, {});

    buySellRatio = typeCounts['Bought'] > 0 && typeCounts['Sold'] === undefined ? 1 : typeCounts['Bought'] === undefined ? 0 : typeCounts["Bought"]/typeCounts["Sold"];

  displayList = rawData?.slice(0,20) ?? [];

}

  isLoaded = true;

});



  let charNumber = 40;
  $: {
    if ($screenWidth < 640)
    {
      charNumber = 15;
    }
    else {
      charNumber = 40;
    }
  }
  
        
  </script>
  
  
<svelte:head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''}  Which stocks is {name} trading? · stocknear
</title>
<meta name="description" content={`A list of all trades from the US Politician ${name}.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Which stocks is ${name} trading? · stocknear`}/>
<meta property="og:description" content={`A list of all trades from the US Politician ${name}.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Which stocks is ${name} trading? · stocknear`}/>
<meta name="twitter:description" content={`A list of all trades from the US Politician ${name}.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>



  <section class="w-full max-w-6xl overflow-hidden m-auto min-h-screen pt-5 pb-60 sm:px-10 xl:px-0">

    <div class="text-sm breadcrumbs ml-4 pb-10">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li><a href="/politicians" class="text-gray-300">Politicians</a></li> 
        <li class="text-gray-300">{name}</li>
      </ul>
    </div>
            
            
    <div class="w-full overflow-hidden m-auto px-3 sm:px-0">
      
      <div class="flex justify-center w-full m-auto overflow-hidden">
          <div class="relative flex flex-col sm:flex-row justify-between items-start overflow-hidden w-full">

            <aside class="relative fixed w-full sm:w-1/3">        
                <!--Start Card-->
                <div class="w-full bg-[#202020] border border-slate-800 rounded-lg h-auto pb-4">
                  <div class="flex flex-col relative ">
                    {#if politicianParty === 'Republican'}
                    <img class="absolute  w-full m-auto rounded-lg " src={republicanBackground} />
                    {:else if politicianParty === 'Democratic'}
                      <img class="absolute w-[500px] m-auto rounded-lg"  src={democraticBackground} />
                    {:else}
                      <img class="absolute w-[500px] m-auto rounded-lg" src={otherBackground} />
                    {/if}
                    <div class="flex flex-col justify-center items-center rounded-2xl ">


                      <div class="mt-10 rounded-full border border-slate-600 w-24 h-24 relative {politicianParty === 'Republican' ? 'republican-striped bg-[#98272B]' : politicianParty === 'Democratic' ? 'democratic-striped bg-[#295AC7]' : 'other-striped bg-[#20202E]'} flex items-center justify-center">
                        <img style="clip-path: circle(50%);" class="rounded-full w-20"  src={politicianImage} loading="lazy"/>
                      </div>
                      <span class="text-white text-lg sm:text-xl font-medium mt-6 mb-2">
                        {name?.replace('Dr','')}
                      </span>
                      <span class="text-white text-md mb-8">
                        {politicianParty ?? 'n/a'} / {politicianCongress} {#if politicianDistrict !== undefined && politicianDistrict?.length !== 0} / {politicianDistrict} {/if}
                      </span>

                    </div>

                    <div class="flex flex-row justify-between items-center w-full px-10 pb-4">
                      <label class="cursor-pointer flex flex-col items-center">
                        <span class="text-white text-[1rem] font-semibold">{abbreviateNumber(numOfTrades)}</span>
                        <span class="text-slate-300 font-medium text-sm">Total Trades</span>
                      </label>
  
                      <div class="flex flex-col items-center ">
                        <span class="text-white text-[1rem] font-semibold">
                          {lastTradedDate?.length !== undefined ? new Date(lastTradedDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                        </span>
                        <span class="text-slate-300 font-medium text-sm">Last Traded</span>
                      </div>
                    </div>


                </div>
              </div>
                <!--End Card-->

                 <!--Start Widget-->
                 <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center ">
                  <div class="w-full grid grid-cols-2 gap-y-3 lg:gap-y-3 gap-x-3 ">
                     <!--Start Total Amount Traded-->  
                     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] rounded-2xl h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm ">Total Amount</span>
                          <span class="text-start text-[1rem] font-medium text-white mt-0.5">
                            ${new Intl.NumberFormat("en", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                          }).format(totalAmountTraded)}
                          </span>
                      </div>
                      
                  </div>
                  <!--End Total Amount Traded-->
                    <!--Start Buy/Sell-->  
                    <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-2xl h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm sm:text-[1rem] ">Buy/Sell</span>
                          <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
                            {buySellRatio?.toFixed(3)}
                          </span>
                      </div>
                      <!-- Circular Progress -->
                        <div class="relative size-12 ml-auto">
                          <svg class="size-full w-12 h-12" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {buySellRatio >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- buySellRatio*100) >= 0 ? 100-(buySellRatio*100)?.toFixed(2) : 0}></circle>
                            </g>
                          </svg>
                          <!-- Percentage Text -->
                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            <span class="text-center text-white text-sm">{buySellRatio?.toFixed(2)}</span>
                          </div>
                        </div>
                      <!-- End Circular Progress -->
            
                  </div>
                  <!--End Buy/Sell-->
                  
                    </div>
                  </div>
                <!--End Widget-->

            </aside>


              <main class="w-full mt-10 sm:mt-0 sm:w-3/4 sm:ml-5">
              
                {#if isLoaded && Object?.keys(optionsData)?.length !== 0}
                <div class="p-0 sm:p-10 bg-[#0F0F0F] sm:bg-[#202020] rounded-lg sm:min-h-[330px] mb-10 sm:mb-6">

                  <div class="flex flex-row justify-center sm:justify-start items-center">
                    <svg class="w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#849AAE" d="M576 0c17.7 0 32 14.3 32 32v448c0 17.7-14.3 32-32 32s-32-14.3-32-32V32c0-17.7 14.3-32 32-32M448 96c17.7 0 32 14.3 32 32v352c0 17.7-14.3 32-32 32s-32-14.3-32-32V128c0-17.7 14.3-32 32-32m-96 128v256c0 17.7-14.3 32-32 32s-32-14.3-32-32V224c0-17.7 14.3-32 32-32s32 14.3 32 32m-160 64c17.7 0 32 14.3 32 32v160c0 17.7-14.3 32-32 32s-32-14.3-32-32V320c0-17.7 14.3-32 32-32M96 416v64c0 17.7-14.3 32-32 32s-32-14.3-32-32v-64c0-17.7 14.3-32 32-32s32 14.3 32 32"/></svg>
                    <span class="ml-3 text-white text-xl">Trade Amount by Year</span>
                  </div>
                  <div class="app w-full h-[300px] ">
                    <Chart options={optionsData} class="chart" />
                  </div>

                  <div class="flex flex-row items-center justify-between mx-auto mt-10 sm:mt-5 w-56 sm:w-80">
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-[#313131] transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#69B3A2] border-4 box-content border-[#313131] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                        Bought
                    </span>
                </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full bg-[#313131] transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#E8864D] border-4 box-content border-[#313131] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                        Sold
                        </span>
                    </div>
            
                
            </div>


                </div>
                {/if}
              <div class="p-0 sm:p-10 bg-[#0F0F0F] sm:bg-[#202020] rounded-lg sm:min-h-[330px]">
                <div class="w-full m-auto h-auto sm:max-h-[500px] sm:overflow-y-scroll scroller">


                  {#if rawData?.length !== 0}
                  <div class="hidden sm:block">
                  <span class="text-[#F5F5F5] font-bold text-2xl">
                    {numOfAssets} Assets
                  </span>

                    <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#202020] m-auto mt-4 ">
                      <!-- head -->
                      <thead>
                        <tr class="bg-[#202020]">
                          <th class="shadow-md text-start bg-[#202020] text-white text-sm font-semibold">
                            Name
                          </th>
                          <th class="shadow-md text-end bg-[#202020] text-white text-sm font-semibold">
                            Transaction Date
                          </th>
                          <th class="shadow-md text-end bg-[#202020] text-white text-sm font-semibold">
                            Disclosure Date
                          </th>
                          <th class="shadow-md text-end bg-[#202020]  text-white text-sm font-semibold">
                            Amount
                          </th>
                          <th class="shadow-md text-white font-semibold text-end text-sm">Type</th>
                        </tr>
                      </thead>
                      <tbody class="p-0">
                        {#each displayList as item}
                            <tr on:click={() => goto(`/${item?.assetType === 'stock' ? 'stocks' : item?.assetType === 'etf' ? 'etf' : 'crypto'}/${item?.ticker}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#202020] border-b-[#202020] cursor-pointer">
    
                              <td class="text-gray-200 pb-3 border-b border-b-[#202020]">
                                <div class="flex flex-row items-center">
                                  <div class="flex-shrink-0 rounded-full w-7 h-7 relative bg-[#202020] flex items-center justify-center">
                                    <img style="clip-path: circle(50%);" class="avatar w-5 h-5" src={`https://financialmodelingprep.com/image-stock/${item?.ticker}.png`} alt="stock logo"/>
                                  </div>
                                  <div class="flex flex-col ml-3">
                                    <span class="text-blue-400">{item?.ticker?.replace('_',' ')}</span>
                                    <span class="text-white text-opacity-60 text-xs">{item?.name}</span>
                                  </div>
                                </div>
                                <!--{item?.firstName} {item?.lastName}-->
                              </td>
    
                                <td class="text-end text-sm text-white border-b border-b-[#202020]">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-sm text-white border-b border-b-[#202020]">
                                  {new Date(item?.disclosureDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                              </td>

                                <td class="text-end text-xs sm:text-sm text-white border-b border-b-[#202020]">
                                    {item?.amount}
                                </td>
                                <td class="text-start text-end text-sm text-white border-b border-b-[#202020]">
                                  {#if item?.type === 'Bought'}
                                    <span class="text-[#10DB06]">Bought</span>
                                  {:else if item?.type === 'Sold'}
                                    <span class="text-[#FF2F1F]">Sold</span>
                                  {:else if item?.type === 'Exchange'}
                                    <span class="text-[#C6A755]">Exchange</span>
                                  {/if}
                                </td>
                            </tr>
                          {/each}
                      </tbody>
                    </table>
                  </div>
                  

                  <div class="sm:hidden flex flex-col justify-center w-full m-auto h-full overflow-hidden mt-3">
      
                    <span class="ml-3 text-[#F5F5F5] font-bold text-2xl">
                      {numOfAssets} Assets
                    </span>

                    <!-- Content area -->
                    <div class="mt-4 w-full overflow-x-auto scroller">
                      

                      <table class="-ml-2 table table-pin-cols table-sm table-compact mt-3 w-screen">
                          <thead>
                            <tr class="">
                              <td class="text-slate-200 font-semibold text-sm text-start">Name</td>
                              <td class="bg-[#0F0F0F] font-semibold text-slate-200 text-sm text-start">Transaction Date</td>
                              <td class="bg-[#0F0F0F] font-semibold text-slate-200 text-sm text-start">Disclosure Date</td>
                              <td class="bg-[#0F0F0F] text-slate-200 font-semibold text-sm text-start">Amount</td>
                              <td class="bg-[#0F0F0F] text-white font-semibold text-end text-sm">Type</td>
                            </tr>
                          </thead>
                          <tbody>
                            {#each displayList as item,index}
                            <!-- row -->
                            <tr on:click={() => goto(`/${item?.assetType === 'stock' ? 'stocks' : item?.assetType === 'etf' ? 'etf' : 'crypto'}/${item?.ticker}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#0F0F0F] border-b-[#0F0F0F] cursor-pointer">
                              
                              <td class="text-gray-200 pb-3 border-b border-b-[#0F0F0F]">
                                <div class="-ml-1 flex flex-row items-center">
                                  <div class="flex flex-col">
                                    <span class="text-blue-400 text-sm">{item?.ticker?.replace('_',' ')}</span>
                                    <span class="text-white text-opacity-60 text-xs">{item?.name?.length < charNumber ? item?.name : item?.name?.slice(0,charNumber)+'...'}</span>
                                  </div>
                                </div>
                                <!--{item?.firstName} {item?.lastName}-->
                              </td>
    
                                <td class="text-end text-xs text-white border-b border-b-[#0F0F0F]">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-xs text-white border-b border-b-[#0F0F0F]">
                                  {new Date(item?.disclosureDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-xs text-white border-b border-b-[#0F0F0F]">
                                    {item?.amount}
                                </td>
                                <td class="text-start text-end text-xs text-white border-b border-b-[#0F0F0F]">
                                  {#if item?.type === 'Bought'}
                                    <span class="text-[#10DB06]">Bought</span>
                                  {:else if item?.type === 'Sold'}
                                    <span class="text-[#FF2F1F]">Sold</span>
                                  {:else if item?.type === 'Exchange'}
                                    <span class="text-[#C6A755]">Exchange</span>
                                  {/if}
                                </td>
                      
              
              
                            </tr>
                            
                        
                            {/each}
                          </tbody>
                        </table>
                      </div>
        
          
          
                </div>
            
                    <InfiniteLoading on:infinite={infiniteHandler} />


                    {:else} 
                    <div class="flex justify-center items-center m-auto sm:mt-24 mt-32 mb-6">
                      <div class="text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-slate-800 p-4">
                        <svg class="w-5 h-5 inline-block mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                        No Trading activity found
                      </div>
                    </div>
                    {/if}

                    

                    
  
                </div>
              </div>
              </main>
          </div>
      </div>
  
    
    </div>
        
        
    
  </section>
  
  
    

<style>
.scroller {
  scrollbar-width: thin;
}
  .app {
      height: 300px;
      max-width: 100%; /* Ensure chart width doesn't exceed the container */
  
      }
  
      @media (max-width: 640px) {
      .app {
          height: 230px;
      }
      }
  
      .chart {
      width: 100%;
      }
  .republican-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #98272B,
        #98272B 10px,
        #840412 10px,
        #840412 20px
    );
}

.democratic-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #295AC7,
        #295AC7 10px,
        #164D9D 10px,
        #164D9D 20px
    );
}

.other-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #A4A6A8,
        #A4A6A8 10px,
        #C0C3C5 10px,
        #C0C3C5 20px
    );
}
  </style>