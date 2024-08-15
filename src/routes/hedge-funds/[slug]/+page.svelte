<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth, numberOfUnreadNotification, displayCompanyName } from '$lib/store';
  import cardBackground from "$lib/images/bg-hedge-funds.png";
  import defaultAvatar from "$lib/images/hedge_funds/default-avatar.png";
  import { abbreviateNumber, formatString } from '$lib/utils';

import { Chart } from 'svelte-echarts'
import { init, use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])
  
  
  import { onMount } from 'svelte';
  
  export let data;

  let isLoaded = false;
  let rawData = data?.getHedgeFundsData;
  let rawList = []
  let displayList = [];
  let optionsData = {};
  let currentPage=1;
  const itemsPerPage = 50;
  let images = {};


  let numOfAssets;
  let changeAssetType = 'Stocks'
  const spyData = [{'date': '1993-03-31', 'price': 25.51}, {'date': '1993-06-30', 'price': 25.62}, {'date': '1993-09-30', 'price': 26.28}, {'date': '1993-12-31', 'price': 26.83}, {'date': '1994-03-31', 'price': 25.83}, {'date': '1994-06-30', 'price': 25.93}, {'date': '1994-09-30', 'price': 27.08}, {'date': '1994-12-31', 'price': 26.94}, {'date': '1995-03-31', 'price': 29.79}, {'date': '1995-06-30', 'price': 32.53}, {'date': '1995-09-30', 'price': 35.16}, {'date': '1995-12-31', 'price': 37.19}, {'date': '1996-03-31', 'price': 39.3}, {'date': '1996-06-30', 'price': 40.99}, {'date': '1996-09-30', 'price': 42.13}, {'date': '1996-12-31', 'price': 45.56}, {'date': '1997-03-31', 'price': 46.68}, {'date': '1997-06-30', 'price': 54.91}, {'date': '1997-09-30', 'price': 58.89}, {'date': '1997-12-31', 'price': 60.81}, {'date': '1998-03-31', 'price': 69.07}, {'date': '1998-06-30', 'price': 71.42}, {'date': '1998-09-30', 'price': 64.36}, {'date': '1998-12-31', 'price': 78.26}, {'date': '1999-03-31', 'price': 81.67}, {'date': '1999-06-30', 'price': 87.42}, {'date': '1999-09-30', 'price': 82.38}, {'date': '1999-12-31', 'price': 94.21}, {'date': '2000-03-31', 'price': 96.7}, {'date': '2000-06-30', 'price': 93.65}, {'date': '2000-09-30', 'price': 92.81}, {'date': '2000-12-31', 'price': 85.03}, {'date': '2001-03-31', 'price': 75.84}, {'date': '2001-06-30', 'price': 79.91}, {'date': '2001-09-30', 'price': 68.33}, {'date': '2001-12-31', 'price': 75.04}, {'date': '2002-03-31', 'price': 75.4}, {'date': '2002-06-30', 'price': 65.38}, {'date': '2002-09-30', 'price': 54.28}, {'date': '2002-12-31', 'price': 58.84}, {'date': '2003-03-31', 'price': 56.74}, {'date': '2003-06-30', 'price': 65.61}, {'date': '2003-09-30', 'price': 67.42}, {'date': '2003-12-31', 'price': 75.42}, {'date': '2004-03-31', 'price': 76.92}, {'date': '2004-06-30', 'price': 78.18}, {'date': '2004-09-30', 'price': 76.61}, {'date': '2004-12-31', 'price': 83.49}, {'date': '2005-03-31', 'price': 81.8}, {'date': '2005-06-30', 'price': 82.98}, {'date': '2005-09-30', 'price': 86.03}, {'date': '2005-12-31', 'price': 87.52}, {'date': '2006-03-31', 'price': 91.62}, {'date': '2006-06-30', 'price': 90.22}, {'date': '2006-09-30', 'price': 95.1}, {'date': '2006-12-31', 'price': 101.39}, {'date': '2007-03-31', 'price': 102.06}, {'date': '2007-06-30', 'price': 108.59}, {'date': '2007-09-30', 'price': 110.66}, {'date': '2007-12-31', 'price': 106.61}, {'date': '2008-03-31', 'price': 96.7}, {'date': '2008-06-30', 'price': 94.25}, {'date': '2008-09-30', 'price': 85.91}, {'date': '2008-12-31', 'price': 67.38}, {'date': '2009-03-31', 'price': 59.8}, {'date': '2009-06-30', 'price': 69.54}, {'date': '2009-09-30', 'price': 80.24}, {'date': '2009-12-31', 'price': 85.14}, {'date': '2010-03-31', 'price': 89.75}, {'date': '2010-06-30', 'price': 79.56}, {'date': '2010-09-30', 'price': 88.44}, {'date': '2010-12-31', 'price': 97.96}, {'date': '2011-03-31', 'price': 103.73}, {'date': '2011-06-30', 'price': 103.76}, {'date': '2011-09-30', 'price': 89.42}, {'date': '2011-12-31', 'price': 99.81}, {'date': '2012-03-31', 'price': 112.48}, {'date': '2012-06-30', 'price': 109.28}, {'date': '2012-09-30', 'price': 116.22}, {'date': '2012-12-31', 'price': 115.77}, {'date': '2013-03-31', 'price': 127.93}, {'date': '2013-06-30', 'price': 131.69}, {'date': '2013-09-30', 'price': 138.59}, {'date': '2013-12-31', 'price': 153.17}, {'date': '2014-03-31', 'price': 155.78}, {'date': '2014-06-30', 'price': 163.82}, {'date': '2014-09-30', 'price': 165.68}, {'date': '2014-12-31', 'price': 173.8}, {'date': '2015-03-31', 'price': 175.33}, {'date': '2015-06-30', 'price': 175.69}, {'date': '2015-09-30', 'price': 164.4}, {'date': '2015-12-31', 'price': 175.94}, {'date': '2016-03-31', 'price': 178.28}, {'date': '2016-06-30', 'price': 182.66}, {'date': '2016-09-30', 'price': 189.56}, {'date': '2016-12-31', 'price': 197.05}, {'date': '2017-03-31', 'price': 208.72}, {'date': '2017-06-30', 'price': 215.13}, {'date': '2017-09-30', 'price': 224.63}, {'date': '2017-12-31', 'price': 239.82}, {'date': '2018-03-31', 'price': 237.44}, {'date': '2018-06-30', 'price': 245.87}, {'date': '2018-09-30', 'price': 264.68}, {'date': '2018-12-31', 'price': 228.87}, {'date': '2019-03-31', 'price': 259.82}, {'date': '2019-06-30', 'price': 270.81}, {'date': '2019-09-30', 'price': 275.56}, {'date': '2019-12-31', 'price': 300.33}, {'date': '2020-03-31', 'price': 241.92}, {'date': '2020-06-30', 'price': 290.7}, {'date': '2020-09-30', 'price': 316.97}, {'date': '2020-12-31', 'price': 355.38}, {'date': '2021-03-31', 'price': 377.95}, {'date': '2021-06-30', 'price': 409.55}, {'date': '2021-09-30', 'price': 411.9}, {'date': '2021-12-31', 'price': 457.48}, {'date': '2022-03-31', 'price': 436.37}, {'date': '2022-06-30', 'price': 366.07}, {'date': '2022-09-30', 'price': 348.02}, {'date': '2022-12-31', 'price': 374.33}, {'date': '2023-03-31', 'price': 402.25}, {'date': '2023-06-30', 'price': 437.17}, {'date': '2023-09-30', 'price': 423.07}, {'date': '2023-12-31', 'price': 472.31}, {'date': '2024-03-31', 'price': 521.39}, {'date': '2024-06-30', 'price': 544.22}];
  const tabs = [
    {
      title: "Stocks",
    },
    {
      title: "Options",
    }
  ];


let activeIdx = 0;


function changeTab(index) {
    activeIdx = index;
    switch (activeIdx) {
        case 0:
            changeAssetType = 'Stocks';
            break;
        case 1:
            changeAssetType = 'Options';
            break;
        // Default case in case changeType doesn't match any of the specified cases
        default:
            // Handle the default case or leave it empty if not needed
            break;
    }
}


// Helper function to calculate percentage difference
function calculatePercentageDifference(startPrice, endPrice) {
  return ((endPrice - startPrice) / startPrice) * 100;
}

// Helper function to get the last day of the quarter for a given date
function getQuarterEndDate(date) {
  const d = new Date(date);
  const month = d.getMonth();
  const year = d.getFullYear();

  if (month < 3) return `${year}-03-31`;
  if (month < 6) return `${year}-06-30`;
  if (month < 9) return `${year}-09-30`;
  return `${year}-12-31`;
}

// Efficient function to add spyPerformance and convert dates to quarter-end dates
function addSpyPerformance(data, spyPriceData) {
  // Create a map for quick lookup of spy prices by date
  const spyPriceMap = new Map(spyPriceData.map(entry => [entry.date, entry.price]));

  // Convert data dates to quarter-end dates
  const quarterData = data?.map(item => ({
    ...item,
    date: getQuarterEndDate(item.date)
  }));

  // Get the starting price from the first date in data
  const startDate = quarterData[0].date;
  const startSpyPrice = spyPriceMap.get(startDate);

  if (startSpyPrice === undefined) {
    console.warn(`Starting price for date ${startDate} not found in spyPriceData. Setting initial spyPerformance to 0.`);
  }

  return quarterData?.map((item, index) => {
    const spyPrice = spyPriceMap.get(item.date);

    if (spyPrice === undefined) {
      console.warn(`Price for date ${item.date} not found in spyPriceData. Skipping spyPerformance calculation for this date.`);
      return {
        ...item,
        spyPerformance: index === 0 ? 0 : null // Use null or any indicator for missing data
      };
    }

    const spyPerformance = index === 0 ? 0 : calculatePercentageDifference(startSpyPrice, spyPrice);

    return {
      ...item,
      spyPerformance
    };
  });
}

// Function to format date to FY and quarter
function formatToFY(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11, so we add 1

  // Fiscal year starts in April
  const fiscalYear = month >= 4 ? year : year - 1;
  const fiscalYearString = fiscalYear.toString().slice(-2);
  
  // Determine fiscal quarter
  let quarter;
  if (month >= 4 && month <= 6) {
    quarter = 1;
  } else if (month >= 7 && month <= 9) {
    quarter = 2;
  } else if (month >= 10 && month <= 12) {
    quarter = 3;
  } else {
    quarter = 4;
  }

  return `FY${fiscalYearString} Q${quarter}`;
}


  // Function to load images only when they are viewed
  async function loadImages() {
      const imageFiles = import.meta.glob('$lib/images/hedge_funds/*.png');
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
      // Initialize boughtList and soldList arrays
      const data = rawData?.summary?.slice(0,20)
      ?.map(item => ({ date: item?.date, performancePercentage: item?.performancePercentage }))
      ?.reverse();

      const updatedData = addSpyPerformance(data, spyData);
      const dates = updatedData?.map(item => formatToFY(item?.date));

      const hedgeFundPerformance = updatedData?.map(item => item?.performancePercentage?.toFixed(2))
      const spyPerformance = updatedData?.map(item => item?.spyPerformance?.toFixed(2))

      const { unit, denominator } = normalizer(Math.max(...hedgeFundPerformance) ?? 0);


    const option = {
      silent: true,
      animation: false,
      tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
      },
      grid: {
          left: $screenWidth < 640 ? '0.5%' : '0.5%',
          right: $screenWidth < 640 ? '1%' : '5%',
          bottom: '0%',
          containLabel: true
      },
      xAxis: {
          data: dates,
          type: 'category',
          axisLabel: {
            color: '#fff'
          }
          },
          yAxis: [
          {
              type: 'value',
              splitLine: {
              show: false, // Disable x-axis grid lines
              },
              axisLabel: {
              color: '#fff', // Change label color to white
              formatter: function (value) {
                  return value >= 0 ? +(value / denominator)?.toFixed(0) + unit+'%' : ''; // Format value in millions
                  },
              },
          },
          ],
      series: [
            {
              name: 'SPY',
              data: spyPerformance,
              type: 'bar',
              showSymbol: false,
              itemStyle: {
                      color: '#FF9E21' // Change bar color to white
                },
            },
            {  name: 'Hedge Fund',
              data: hedgeFundPerformance,
              type: 'bar',
              showSymbol: false,
              itemStyle: {
                      color: '#36A2EB' // Change bar color to white
                },
            },
      ]
      };
  
  
  return option;
  }
  
onMount(async () => {
    await loadImages();
    optionsData = await getPlotOptions();
    isLoaded = true;
});
  


  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage += 1;
    }
  }



  $: {
    if(changeAssetType && typeof window !== 'undefined') {
      let liste;
      rawList = rawData?.holdings ?? [];
      if(changeAssetType === 'Stocks') {
        liste = rawList?.filter(item => item?.putCallShare === 'Share')
      }
      else {
        liste = rawList?.filter(item => item?.putCallShare !== 'Share')
      }
      numOfAssets = liste?.length //new Set(liste?.map(item => item?.symbol))?.size;
      rawList = liste;
      displayList = rawList?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }
  }

  $: totalPages = Math?.ceil(rawList.length / itemsPerPage);

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
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {formatString($displayCompanyName)} - Hedge Fund · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <!-- Other meta tags -->
  <meta property="og:title" content="{formatString($displayCompanyName)} - Hedge Fund · stocknear"/>
  <meta property="og:description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{formatString($displayCompanyName)} - Hedge Fund · stocknear"/>
  <meta name="twitter:description" content="Get detailed information about portfolio size, market value, win rate, turn over, and peformance of the hedge fund.">
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

  
  
<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">

  
          
          
  <div class="sm:ml-10 w-full overflow-hidden m-auto px-3 sm:px-0">

    <div class="text-sm sm:text-[1rem] breadcrumbs pb-10">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li><a href="/hedge-funds" class="text-gray-300">Hedge Funds</a></li> 
        <li class="text-gray-300">Company Data</li>
      </ul>
    </div>

    <div class="flex justify-center w-full m-auto overflow-hidden">
        <div class="relative flex flex-col sm:flex-row justify-between items-start overflow-hidden w-full">
  
              <aside class="relative fixed w-full sm:w-1/3">        
                <!--Start Card-->
                <div class="w-full bg-[#141417] border border-gray-800 rounded-lg h-auto pb-4">
                  <div class="flex flex-col relative ">
                    <img class="absolute w-full m-auto rounded-lg" src={cardBackground} />
                    <div class="flex flex-col justify-center items-center rounded-lg ">

                      <div class="mt-10 rounded-full border border-slate-600 w-24 h-24 relative hedge-fund-striped bg-[#20202E] flex items-center justify-center">
                        <img style="clip-path: circle(50%);" class="rounded-full w-20"  src={images[rawData?.cik] ?? defaultAvatar} loading="lazy"/>
                      </div>
                      <span class="text-white text-md font-semibold mt-2 mb-2 w-64 text-center">
                        {formatString($displayCompanyName)}
                      </span>

                    </div>


                    <div class="relative bottom-0 w-full px-8 mt-8">
                      <div class="flex flex-row justify-between items-center w-full mb-6">
                        <label class="cursor-pointer flex flex-col items-start">
                          <span class="text-white text-[1rem] font-semibold">{abbreviateNumber(rawData.numberOfStocks)}</span>
                          <span class="text-slate-300 font-medium text-sm"># of Holdings</span>
                        </label>
    
                        <div class="flex flex-col items-end ">
                          <span class="text-white text-[1rem] font-semibold">
                            {rawData.turnover?.toFixed(2)}
                          </span>
                          <span class="text-slate-300 font-medium text-sm">Turnover</span>
                        </div>
                      </div>

                      <div class="flex flex-row justify-between items-center w-full">
                        <label class="cursor-pointer flex flex-col items-start">
                            <div class="flex flex-row mt-1 text-white text-[1rem] font-semibold">
                                {rawData?.averageHoldingPeriod} months
                            </div>
                          <span class="text-slate-300 font-medium text-sm">Avg. Holding</span>
                        </label>
    
                        <div class="flex flex-col items-end ">
                          <div class="flex flex-row mt-1 text-[1rem] font-semibold">
                            {#if rawData.winRate >=0}
                              <span class="text-[#10DB06]">+{abbreviateNumber(rawData.winRate?.toFixed(2))}%</span>
                            {:else}
                              <span class="text-[#FF2F1F]">{abbreviateNumber(rawData.winRate?.toFixed(2))}% </span> 
                            {/if}
                          </div>
                          <span class="text-slate-300 font-medium text-sm">Win Rate</span>
                        </div>
                      </div>
                    </div>

                </div>
              </div>
                <!--End Card-->

                 <!--Start Widget-->
                 <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center ">
                  <div class="sm:hidden w-full grid grid-cols-2 gap-y-3 lg:gap-y-3 gap-x-3 ">
                     <!--Start Total Amount Traded-->  
                     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm ">AUM</span>
                          <span class="text-start text-[1rem] font-medium text-white mt-0.5">
                            {abbreviateNumber(rawData?.marketValue,true)}
                          </span>
                      </div>
                      
                  </div>
                  <!--End Total Amount Traded-->
                  
                    <!--Start-->  
                    <div class="sm:hidden flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm sm:text-[0.85rem]">3 Year Perf.</span>
                          <span class="text-start text-[1rem] sm:text-sm font-semibold text-white mt-0.5">
                            {#if rawData?.performancePercentage3year >=0}
                            <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performancePercentage3year?.toFixed(2))}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performancePercentage3year?.toFixed(2))}% </span> 
                          {/if}
                          </span>
                      </div>
                      <!-- Circular Progress -->
                        <div class="relative size-10 ml-auto">
                          <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performancePercentage3year >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performancePercentage3year) >= 0 ? 100-(rawData?.performancePercentage3year)?.toFixed(2) : 0}></circle>
                            </g>
                          </svg>
                          <!-- Percentage Text -->
                          <!--
                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            <span class="text-center text-white text-sm">{rawData?.performancePercentage3year?.toFixed(2)}</span>
                          </div>
                        </div>
                        -->
                      <!-- End Circular Progress -->
            
                  </div>
                </div>
                  <!--End-->

                  <!--Start-->  
                   <div class="sm:hidden flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm sm:text-[0.85rem]">5 Year Perf.</span>
                        <span class="text-start text-[1rem] sm:text-sm font-semibold text-white mt-0.5">
                          {#if rawData?.performancePercentage5year >=0}
                          <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performancePercentage5year?.toFixed(2))}%</span>
                        {:else}
                          <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performancePercentage5year?.toFixed(2))}% </span> 
                        {/if}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-10 ml-auto">
                        <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performancePercentage5year >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performancePercentage5year) >= 0 ? 100-(rawData?.performancePercentage5year)?.toFixed(2) : 0}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <!--
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{rawData?.performancePercentage5year?.toFixed(2)}</span>
                        </div>
                      </div>
                      -->
                    <!-- End Circular Progress -->
                </div>
              </div>
                <!--End-->


                   <!--Start-->  
                   <div class="sm:hidden flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm sm:text-[0.85rem]">Incept. Perf.</span>
                        <span class="text-start text-[1rem] sm:text-sm font-semibold text-white mt-0.5">
                          {#if rawData?.performanceSinceInceptionPercentage >=0}
                          <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performanceSinceInceptionPercentage?.toFixed(2))}%</span>
                        {:else}
                          <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performanceSinceInceptionPercentage?.toFixed(2))}% </span> 
                        {/if}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-10 ml-auto">
                        <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performanceSinceInceptionPercentage >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performanceSinceInceptionPercentage) >= 0 ? 100-(rawData?.performanceSinceInceptionPercentage)?.toFixed(2) : 0}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <!--
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{rawData?.performanceSinceInceptionPercentage?.toFixed(2)}</span>
                        </div>
                      </div>
                      -->
                    <!-- End Circular Progress -->
                </div>
              </div>
                <!--End-->

                  </div>
                <!--End Widget-->

            </aside>
  
  
                <main class="w-full mt-10 sm:mt-0 sm:ml-5">
                
                  {#if isLoaded && Object?.keys(optionsData)?.length !== 0}
                  <div class="p-0 sm:p-10 bg-[#09090B] sm:bg-[#09090B] rounded-lg sm:min-h-[330px] mb-10 sm:mb-6">
  
                    <div class="flex flex-row justify-center sm:justify-start items-center">
                      <svg class="w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#849AAE" d="M576 0c17.7 0 32 14.3 32 32v448c0 17.7-14.3 32-32 32s-32-14.3-32-32V32c0-17.7 14.3-32 32-32M448 96c17.7 0 32 14.3 32 32v352c0 17.7-14.3 32-32 32s-32-14.3-32-32V128c0-17.7 14.3-32 32-32m-96 128v256c0 17.7-14.3 32-32 32s-32-14.3-32-32V224c0-17.7 14.3-32 32-32s32 14.3 32 32m-160 64c17.7 0 32 14.3 32 32v160c0 17.7-14.3 32-32 32s-32-14.3-32-32V320c0-17.7 14.3-32 32-32M96 416v64c0 17.7-14.3 32-32 32s-32-14.3-32-32v-64c0-17.7 14.3-32 32-32s32 14.3 32 32"/></svg>
                      <span class="ml-3 text-white text-xl">Performance History</span>
                    </div>
                    
                    <div class="app w-full">
                      <Chart {init} options={optionsData} class="chart" />
                    </div>
                  
  
                    <div class="flex flex-row items-center justify-between mx-auto mt-10 sm:mt-5 w-56 sm:w-80">
                      <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                          <div class="h-full bg-[#313131] transform -translate-x-1/2 " aria-hidden="true"></div>
                          <div class="w-3 h-3 bg-[#FFAD24] border-4 box-content border-[#313131] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                          <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                          SPY
                          </span>
                      </div>

                      <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full bg-[#313131] transform -translate-x-1/2" aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#36A2EB] border-4 box-content border-[#313131] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                            Hedge Fund
                        </span>
                    </div>
                
              </div>
  

                  </div>
                  
                  {/if}


                   <!--Start Widget-->
                 <div class="hidden sm:flex justify-center items-center w-full sm:w-11/12 mt-5 mb-10">
                  <div class="w-full grid grid-cols-4 gap-y-3 lg:gap-y-3 gap-x-3">
                     <!--Start Total Amount Traded-->  
                     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-[1rem]">AUM</span>
                          <span class="text-start text-[1rem] font-medium text-white mt-0.5">
                            {abbreviateNumber(rawData?.marketValue,true)}
                          </span>
                      </div>
                      
                  </div>
                  <!--End Total Amount Traded-->
                  
                    <!--Start-->  
                    <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-[1rem]">3 Year Perf.</span>
                          <span class="text-start text-[1rem] font-semibold text-white mt-0.5">
                            {#if rawData?.performancePercentage3year >=0}
                            <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performancePercentage3year?.toFixed(2))}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performancePercentage3year?.toFixed(2))}% </span> 
                          {/if}
                          </span>
                      </div>
                      <!-- Circular Progress -->
                        <div class="relative size-10 ml-auto">
                          <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performancePercentage3year >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performancePercentage3year) >= 0 ? 100-(rawData?.performancePercentage3year)?.toFixed(2) : 0}></circle>
                            </g>
                          </svg>
                        </div>
                      </div>
                  <!--End-->

                     <!--Start-->  
                     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-[1rem]">5 Year Perf.</span>
                          <span class="text-start text-[1rem] font-semibold text-white mt-0.5">
                            {#if rawData?.performancePercentage5year >=0}
                            <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performancePercentage5year?.toFixed(2))}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performancePercentage5year?.toFixed(2))}% </span> 
                          {/if}
                          </span>
                      </div>
                      <!-- Circular Progress -->
                        <div class="relative size-10 ml-auto">
                          <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performancePercentage5year >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performancePercentage5year) >= 0 ? 100-(rawData?.performancePercentage5year)?.toFixed(2) : 0}></circle>
                            </g>
                          </svg>
                  </div>
                </div>
                  <!--End-->
  
  
                     <!--Start-->  
                     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-[1rem]">Incept. Perf.</span>
                          <span class="text-start text-[1rem] font-semibold text-white mt-0.5">
                            {#if rawData?.performanceSinceInceptionPercentage >=0}
                            <span class="text-[#10DB06]">+{abbreviateNumber(rawData?.performanceSinceInceptionPercentage?.toFixed(2))}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{abbreviateNumber(rawData?.performanceSinceInceptionPercentage?.toFixed(2))}% </span> 
                          {/if}
                          </span>
                      </div>
                      <!-- Circular Progress -->
                        <div class="relative size-10 ml-auto">
                          <svg class="size-full w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rawData?.performanceSinceInceptionPercentage >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- rawData?.performanceSinceInceptionPercentage) >= 0 ? 100-(rawData?.performanceSinceInceptionPercentage)?.toFixed(2) : 0}></circle>
                            </g>
                          </svg>
                  </div>
                </div>
                  <!--End-->


                  </div>
                </div>
                
                <div class="sm:p-3 bg-[#09090B] sm:bg-[#09090B] sm:min-h-[430px] pt-6">
                  <div class="h-auto w-full sm:w-11/12 ">
                    
                    
                      <span class="text-[#F5F5F5] font-bold text-2xl">
                        {numOfAssets} Assets
                      </span>
                      
                      <div class="w-64 mt-5">
                        <div class="relative right-0 bg-[#141417] rounded-lg">
                
                          <div class="relative flex flex-row items-center p-1 list-none rounded-lg">
                          {#each tabs as item, i}
                            <button
                              on:click={() => changeTab(i)}
                              class="group relative z-[1] rounded-lg px-6 py-1 border z-30 flex items-center justify-center w-full px-0 py-1 mb-0 border-0 bg-inherit {activeIdx === i
                                ? 'z-0'
                                : ''} "
                              >
                              {#if activeIdx === i}
                                  <div
                                    class="absolute inset-0 rounded-lg sm:rounded-lg {[0,1]?.includes(activeIdx) ? 'bg-[#00C806]' : 'bg-[#E02424]'}"
                                  ></div>
                              {/if}
                              
                              {#if item?.title === 'Stocks'}
                              <span
                                class="relative block font-medium duration-200 {changeAssetType === 'Stocks' ? 'text-black' : 'text-white'}">
                                {item?.title}
                              </span>
                              {:else if item?.title === 'Options'}
                              <span
                                class="relative block font-medium duration-200 {changeAssetType === 'Options' ? 'text-black' : 'text-white'}">
                                {item?.title}
                              </span>
                              {/if}
            
                            </button>
                          {/each}
                      </div>
                      </div>
                      </div>

     
                    {#if rawList?.length !== 0}
                    <div class="hidden sm:block sm:overflow-hidden sm:overflow-y-scroll scroller w-full m-auto h-auto sm:max-h-[700px]">

                      <table class=" table table-sm table-compact table-pin-rows table-pin-cols rounded-none sm:rounded-md w-full bg-[#09090B] m-auto mt-5 ">
                        <!-- head -->
                        <thead>
                          <tr class="bg-[#09090B]">
                            <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                              Name
                            </th>
                            <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                              Portfolio
                            </th>
                            {#if changeAssetType === 'Stocks'}
                            <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                              Change of Shares
                            </th>
                            <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                             Shares Owned
                            </th>
                            {/if}
                            <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                              Value Owned
                            </th>
                            <th class="shadow-md text-ednd bg-[#09090B]  text-white text-sm font-semibold">
                              Avg. Buy Price
                            </th>
                            {#if changeAssetType === 'Options'}
                            <th class="shadow-md text-end bg-[#09090B]  text-white text-sm font-semibold">
                              Type
                            </th>
                            {/if}
                          </tr>
                        </thead>
                        <tbody class="p-0">
                          {#each displayList as item}
                              <tr on:click={() => goto(`/${item?.type}/${item?.symbol}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#27272A] cursor-pointer">
      
                                <td class="pb-3 border-b border-b-[#27272A] text-sm sm:text-[1rem] whitespace-nowrap">
                                  <div class="flex flex-row items-center">
                                    <div class="flex flex-col">
                                      <span class="text-blue-400">{item?.symbol?.replace('_',' ')}</span>
                                      <span class="text-white">{formatString(item?.securityName)}</span>
                                    </div>
                                  </div>
                                  <!--{item?.firstName} {item?.lastName}-->
                                </td>
      
                                  <td class="text-center text-sm sm:text-[1rem] whitespace-nowrap font-semibold text-white border-b border-b-[#27272A]">
                                      {item?.weight >= 0.01 ? item?.weight?.toFixed(2) : '< 0.01'}%
                                  </td>

                                  {#if changeAssetType === 'Stocks'}
                                  <td class="text-center text-sm sm:text-[1rem] whitespace-nowrap font-semibold border-b border-b-[#27272A] {item?.changeInSharesNumberPercentage > 0 ? 'text-[#00FC50]' : item?.changeInSharesNumberPercentage < 0 ? 'text-[#FC2120]' : 'text-white'}">
                                    {item?.changeInSharesNumberPercentage !== 0 ? abbreviateNumber(item?.changeInSharesNumberPercentage?.toFixed(2))+'%' : '-'}
                                  </td>

                                  <td class="text-center text-sm sm:text-[1rem] whitespace-nowrap font-semibold border-b border-b-[#27272A] text-white">
                                    {item?.sharesNumber !== 0 ? abbreviateNumber(item?.sharesNumber?.toFixed(2)) : '-'}
                                  </td>

                                  {/if}
  
                                  <td class="text-center text-sm sm:text-[1rem] whitespace-nowrap font-semibold text-white border-b border-b-[#27272A]">
                                    {abbreviateNumber(item?.marketValue,true)}
                                </td>
  
                                  <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold text-white border-b border-b-[#27272A]">
                                      ${item?.avgPricePaid}
                                  </td>
                                  {#if changeAssetType === 'Options'}
                                  <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold border-b border-b-[#27272A] {item?.putCallShare === 'CALL' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">
                                    {formatString(item?.putCallShare)}
                                  </td>
                                  {/if}
                              </tr>
                            {/each}
                        </tbody>
                      </table>
                    </div>


                    <div class="hidden sm:flex flex-col items-center mt-10">
                      <!-- Help text -->
                      <span class="text-sm text-gray-200">
                          Showing <span class="font-semibold text-white">{currentPage}</span> of <span class="font-semibold text-white">{totalPages}</span> Pages
                      </span>
                      <!-- Buttons -->
                      <div class="inline-flex mt-2 xs:mt-0">
                          <button on:click={prevPage} class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-[#313131] {currentPage === 1 ? 'opacity-60' : ''} rounded-s" disabled={currentPage === 1}>
                              Prev
                          </button>
                          <button on:click={nextPage} class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-[#313131] border-0 border-s border-gray-700 {currentPage === totalPages ? 'opacity-60' : ''} rounded-e" disabled={currentPage === totalPages}>
                              Next
                          </button>
                      </div>
                    </div>

                    
                    
  
                    <div class="sm:hidden flex flex-col justify-center w-full m-auto h-full overflow-hidden">
        

                      
  
                      <!-- Content area -->
                      <div class="mt-4 w-full overflow-x-auto scroller">
                        
  
                        <table class="-ml-1 table table-sm table-compact mt-3 w-screen">
                          <thead>
                            <tr class="bg-[#09090B]">
                              <td class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                                Name
                              </td>
                              <td class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                % of Portfolio
                              </td>
                              {#if changeAssetType === 'Stocks'}
                              <td class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                Change of Shares
                              </td>
                              <th class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                Shares Owned
                               </th>
                              {/if}
                              <td class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                Value Owned
                              </td>
                              <td class="shadow-md text-end bg-[#09090B]  text-white text-sm font-semibold">
                                Avg. Buy Price
                              </td>
                              {#if changeAssetType === 'Options'}
                              <td class="shadow-md text-end bg-[#09090B]  text-white text-sm font-semibold">
                                Type
                              </td>
                              {/if}
                            </tr>
                          </thead>
                            <tbody>
                              {#each displayList as item,index}
                              <!-- row -->
                              <tr on:click={() => goto(`/${item?.type}/${item?.symbol}`)} class="odd:bg-[#27272A] cursor-pointer">
                                
                                <td class="text-white border-b border-b-[#09090B] whitespace-nowrap">
                                  <div class="flex flex-row items-center">
                                    <div class="flex flex-col">
                                      <span class="text-blue-400 font-medium">{item?.symbol?.replace('_',' ')}</span>
                                      <span class="">{item?.securityName?.length > charNumber ? formatString(item?.securityName?.slice(0,charNumber)) + '...' : formatString(item?.securityName)}</span>
                                    </div>
                                  </div>
                                  <!--{item?.firstName} {item?.lastName}-->
                                </td>


                              <td class="text-end text-sm font-semibold text-white border-b border-b-[#09090B]">
                                {item?.weight >= 0.01 ? item?.weight?.toFixed(2) : '< 0.01'}%
                              </td>

                              {#if changeAssetType === 'Stocks'}
                              <td class="text-end text-sm font-semibold border-b border-b-[#09090B] {item?.changeInSharesNumberPercentage > 0 ? 'text-[#00FC50]' : item?.changeInSharesNumberPercentage < 0 ? 'text-[#FC2120]' : 'text-white'}">
                                {item?.changeInSharesNumberPercentage !== 0 ? abbreviateNumber(item?.changeInSharesNumberPercentage?.toFixed(2))+'%' : '-'}
                              </td>
                              <td class="text-end text-sm font-semibold border-b border-b-[#09090B] text-white">
                                {item?.sharesNumber !== 0 ? abbreviateNumber(item?.sharesNumber?.toFixed(2)) : '-'}
                              </td>
                              {/if}

                              <td class="text-end text-sm text-white border-b border-b-[#09090B]">
                                {abbreviateNumber(item?.marketValue,true)}
                            </td>

                              <td class="text-end text-sm text-white font-semibold border-b border-b-[#09090B]">
                                  ${item?.avgPricePaid}
                              </td>
                              {#if changeAssetType === 'Options'}
                              <td class="text-end text-sm font-semibold border-b border-b-[#09090B] {item?.putCallShare === 'CALL' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">
                                {formatString(item?.putCallShare)}
                              </td>
                              {/if}
                        
                
                
                              </tr>
                              
                          
                              {/each}
                            </tbody>
                          </table>
                        </div>


                        <div class="sm:hidden flex flex-col items-center mt-10">
                          <!-- Help text -->
                          <span class="text-[1rem] text-gray-200">
                              Showing <span class="font-semibold text-white">{currentPage}</span> of <span class="font-semibold text-white">{totalPages}</span> Pages
                          </span>
                          <!-- Buttons -->
                          <div class="inline-flex mt-2 xs:mt-0">
                              <button on:click={prevPage} class="flex items-center justify-center px-5 h-8 text-sm font-medium text-white bg-[#313131] {currentPage === 1 ? 'opacity-60' : ''} rounded-s" disabled={currentPage === 1}>
                                  Prev
                              </button>
                              <button on:click={nextPage} class="flex items-center justify-center px-5 h-8 text-sm font-medium text-white bg-[#313131] border-0 border-s border-gray-700 {currentPage === totalPages ? 'opacity-60' : ''} rounded-e" disabled={currentPage === totalPages}>
                                  Next
                              </button>
                          </div>
                        </div>
          
            
            
                   </div>

                  
                  
  
  
                      {:else} 
                      <div class="flex justify-center items-center m-auto sm:mt-24 mt-32 mb-6">
                        <div class="text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-gray-800 p-4">
                          <svg class="w-5 h-5 inline-block mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
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
          height: 400px;
          width: 100%;
      }
      
      @media (max-width: 560px) {
          .app {
              width: 100%;
              height: 300px;
          }
      }
  
      .chart {
          width: 100%;
      }

.hedge-fund-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #A77120,
        #A77120 10px,
        #90621C 10px,
        #90621C 20px
    );
  }

</style>