<script lang="ts">
  import { displayCompanyName, numberOfUnreadNotification, stockTicker } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
	import { formatString, abbreviateNumber } from '$lib/utils';
  import Chart from '$lib/components/Chart.svelte';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";

  import { onMount } from 'svelte';


  export let data;
  let isLoaded = false;
  let statistics = data?.getInsiderTradingStatistics ?? {};

  let buySellRatio = statistics?.purchases/statistics?.sales
  let buyShares = statistics?.totalBought
  let soldShares = statistics?.totalSold
  let buySharesPercentage = Math.floor(buyShares/(buyShares+soldShares)*100);
  let soldSharesPercentage = 100 - buySharesPercentage;

  let options = {};

  let rawData = [];
  let insiderTradingList = [];
  let dataPoints = [];
  let dates = [];
  let barChartData = [];
  let soldList = [];
  let boughtList = [];
  let grantList = [];
  let exerciseList = [];


  //Find Latest date to filter historicalPrice:
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function backToTop() {
    window.scrollTo({
        top: 0,
    });
}

function extractOfficeInfo(inputString) {
  const indexOfficer = inputString?.toLowerCase()?.indexOf("officer:");
    const indexOther = inputString?.toLowerCase()?.indexOf("other:");
    if (indexOfficer !== -1) {
        return inputString?.substring(indexOfficer + "officer:"?.length)?.trim();
    } 
    else if (indexOther !== -1) {
        return inputString?.substring(indexOther + "other:"?.length)?.trim();
    } else if (inputString?.toLowerCase()?.includes('director')) {
        return 'Director';
    } 
    else if (inputString?.toLowerCase()?.includes('percent owner')) {
      return inputString?.replace('percent owner', '% Owner');
    } 
    else {
        return "n/a";
    }
}



async function infiniteHandler({ detail: { loaded, complete } }) 
{
  if (insiderTradingList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = insiderTradingList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 20);
      insiderTradingList = [...insiderTradingList, ...newArticles];
      loaded();
    }
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


let syncWorker: Worker | undefined = undefined;

// Handling messages from the worker
const handleMessage = async (event) => {
    const finalData = event.data?.finalData

    rawData = finalData?.rawData;
    insiderTradingList = rawData?.slice(0,20) ?? [];
    dataPoints = finalData?.dataPoints;
    dates = finalData?.dates;
    soldList = finalData?.barChartData?.sold;
    grantList = finalData?.barChartData?.grant;
    exerciseList = finalData?.barChartData?.exercise;
    boughtList = finalData?.barChartData?.bought;

    if(dataPoints?.length !== 0 && dates?.length !==0) {

      const maxBought = Math.max(...boughtList) ?? 0;
      const maxSold = Math.max(...soldList) ?? 0;
      const maxGrant = Math.max(...grantList) ?? 0;
      const maxExercise = Math.max(...exerciseList) ?? 0;

      const maxAmongAll = Math.max(maxBought, maxSold, maxGrant, maxExercise);
      const { unit, denominator } = normalizer(maxAmongAll);


      options =  {
        silent: true,
      grid: {
        left: '0%',
        right: '0%',
        top: '10%',
        bottom: '10%',
        containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
              formatter: function (value) {
                  // Assuming dates are in the format 'yyyy-mm-dd'
                  const dateParts = value.split('-');
                  const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                  const year = parseInt(dateParts[0]);
                  return `${monthNames[monthIndex]} ${year}`;
              }
          }
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            formatter: '${value}',
          },
          splitLine: {
              show: false, // Disable x-axis grid lines
              },
          },
        {
            type: 'value',
            axisLabel: {
              formatter: function (value) {
                return (value / denominator)?.toFixed(0) + unit; // Format value in millions
                },
            },
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        {
            type: 'value',
            axisLabel: {
              formatter: '{value} %',
            },
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
      series: [
        {
          name: 'Price',
          type: 'line',
          smooth: true,
          // prettier-ignore
          data: dataPoints,
          itemStyle: {
            color: "#C40377"
          }
          /*
          markArea: {
            data: markAreaData
          }
          */
        },
        {
            name: '',
            data: soldList,
            type: 'bar',
            smooth: true,
            yAxisIndex: 1,
            barWidth: '1000%',
            itemStyle: {
            color: (params) => {
                // Set color based on positive or negative value
                return params.data >= 0 ? 'rgb(15, 192, 8)' : 'rgb(255, 47, 31)';
            },
            },
        },
        {
            name: '',
            data: boughtList,
            type: 'bar',
            smooth: true,
            yAxisIndex: 1,
            barWidth: '1000%',
            itemStyle: {
            color: (params) => {
                // Set color based on positive or negative value
                return params.data >= 0 ? '#10DB06' : '';
            },
            },
        },
        {
            name: '',
            data: grantList,
            type: 'bar',
            smooth: true,
            yAxisIndex: 1,
            barWidth: '1000%',
            itemStyle: {
            color: (params) => {
                // Set color based on positive or negative value
                return params.data >= 0 ? '#8f95a1' : '';
            },
            },
        },
        {
            name: '',
            data: exerciseList,
            type: 'bar',
            smooth: true,
            yAxisIndex: 1,
            barWidth: '1000%',
            itemStyle: {
            color: (params) => {
                // Set color based on positive or negative value
                return params.data >= 0 ? '#F8901E' : '';
            },
            },
        },
      ]
      };
    }
    isLoaded = true;

};

const loadWorker = async () => {
  const SyncWorker = await import('./workers/insiderWorker?worker');
  syncWorker = new SyncWorker.default();
  syncWorker.postMessage({ message: data?.getInsiderTrading, historicalPrice: data?.getHistoricalPrice});
  syncWorker.onmessage = handleMessage;


};

onMount(async() => {
  await loadWorker()
  
})




</script>



<svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) US Congress & Senate Trading · stocknear
  </title>
  <meta name="description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) US Congress & Senate Trading · stocknear`}/>
  <meta property="og:description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) US Congress & Senate Trading · stocknear`}/>
  <meta name="twitter:description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
  
     
                  
  
    
          
    <section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0">
        <div class="flex justify-center w-fit m-auto h-full overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden">
                  <div class="sm:p-7 sm:w-full sm:max-w-3xl m-auto mt-5 sm:mt-0">
                    <div class="mb-6">
                        <h1 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                            Insider Trading
                        </h1>
  

                        <div class="text-white p-3 sm:p-5 mb-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          Get detailed insights of Insiders who bought or sold {$displayCompanyName} and the amounts involved!
                        </div>
                        
                        {#if insiderTradingList?.length !== 0}
                        <div class="text-white text-md text-center m-auto w-full pb-3">
                          We can divide four types of insider transactions:
                        
                          <div class="flex flex-row items-center justify-center">
                            Buy, Sell, 
                            <label for="grantInfo" class="ml-1 cursor-pointer font-medium text-gray-300">
                              Grant
                            </label>
                            <InfoModal
                              title={"Stock Grant"}
                              content={"A stock grant occurs when a company compensates an employee by offering them equity, or when an insider gifts shares. In essence, the company grants ownership of shares, or an insider transfers shares. These grants may involve common stock shares, preferred shares, or another class of shares."}
                              id={"grantInfo"}
                            />,
                            <label for="exerciseInfo" class="ml-1 cursor-pointer font-medium text-gray-300">
                              Exercise
                            </label>
                            <InfoModal
                              title={"Exercise"}
                              content={`Exercising an option involves the owner granting themselves the right to buy or sell a specific number of shares at a future date. Essentially, the owner converts the options into shares, which they can subsequently trade. When the owner opts to buy or sell the underlying instrument rather than letting the contract expire unused or closing the position, they are said to be "exercising the option."`}
                              id={"exerciseInfo"}
                            />.
                            </div>
                        
                        </div>
                        {/if}

                    </div>
      
                    {#if isLoaded}

                      {#if insiderTradingList?.length !== 0}

                    {#if Object?.keys(options)?.length !== 0}
                      <div class="app w-full h-[400px] sm:h-[500px]">
                        <Chart options={options} class="chart" />
                      </div>

                      <div class="flex flex-row items-center justify-between mx-auto mb-10 w-full sm:w-5/6">
                        <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                          <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                          <div class="w-3 h-3 bg-[#0FC008] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                          <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                              Bought
                          </span>
                      </div>
                        <div class="flex flex-col sm:flex-row items-center  w-1/2 justify-center">
                            <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                            <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                            <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md sm:font-medium inline-block">
                                Sold
                            </span>
                        </div>
                        <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                          <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                          <div class="w-3 h-3 bg-[#8f95a1] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                          <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                              Grant
                          </span>
                      </div>
                      <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#F8901E] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                            Exercise
                        </span>
                    </div>
                    </div>

                    {/if}
                    
                    {#if JSON.stringify(statistics) !== JSON.stringify({ totalBought: 0, totalSold: 0, purchases: 0, sales: 0 }) }
                    <h3 class="text-white text-xl font-semibold pt-5">
                      Insider Statistics
                    </h3>
                     <!--Start Widget-->
                     <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center p-1">
                      <div class="w-full grid grid-cols-2 lg:grid-cols-3 gap-y-3 lg:gap-y-3 gap-x-3 ">
      
                        <!--Start Put/Call-->  
                        <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] shadow-lg rounded-md h-20">
                          <div class="flex flex-col items-start">
                              <span class="font-medium text-gray-200 text-xs sm:text-sm">Buy/Sell</span>
                              <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                {buySellRatio?.toFixed(3) }
                              </span>
                          </div>
                          <!-- Circular Progress -->
                            <div class="relative size-12 sm:size-14 ml-auto">
                              <svg class="size-full w-12 h-12 sm:w-14 sm:h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <!-- Background Circle -->
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                <!-- Progress Circle inside a group with rotation -->
                                <g class="origin-center -rotate-90 transform">
                                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-blue-500" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-(buySellRatio*100)?.toFixed(2)}></circle>
                                </g>
                              </svg>
                              <!-- Percentage Text -->
                              <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <span class="text-center text-white text-xs sm:text-sm">{buySellRatio?.toFixed(2)}</span>
                              </div>
                            </div>
                          <!-- End Circular Progress -->
                
                      </div>
                      <!--End Put/Call-->
                      <!--Start Call Flow-->  
                      <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] shadow-lg rounded-md h-20">
                        <div class="flex flex-col items-start">
                            <span class="font-medium text-gray-200 text-xs sm:text-sm">Bought Shares</span>
                            <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                              {new Intl.NumberFormat("en", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(buyShares)}
                            </span>
                        </div>
                        <!-- Circular Progress -->
                        <div class="relative size-12 sm:size-14 ml-auto">
                          <svg class="size-full w-12 h-12 sm:w-14 sm:h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#00FC50]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-buySharesPercentage}></circle>
                            </g>
                          </svg>
                          <!-- Percentage Text -->
                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            <span class="text-center text-white text-xs sm:text-sm">{buySharesPercentage}%</span>
                          </div>
                        </div>
                        <!-- End Circular Progress -->
                      </div>
                      <!--End Call Flow-->
                      <!--Start Put Flow-->  
                      <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] shadow-lg rounded-md h-20">
                        <div class="flex flex-col items-start">
                            <span class="font-medium text-gray-200 text-xs sm:text-sm">Sold Shares</span>
                            <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                              {new Intl.NumberFormat("en", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(soldShares)}
                            </span>
                        </div>
                        <!-- Circular Progress -->
                        <div class="relative size-12 sm:size-14 ml-auto">
                          <svg class="size-full w-12 h-12 sm:w-14 sm:h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#EE5365]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-soldSharesPercentage}></circle>
                            </g>
                          </svg>
                          <!-- Percentage Text -->
                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            <span class="text-center text-white text-xs sm:text-sm">{soldSharesPercentage}%</span>
                          </div>
                        </div>
                        <!-- End Circular Progress -->
                        
                      </div>
                      <!--End Put Flow-->
                
                
                        </div>
                      </div>
                    <!--End Widget-->
                    {/if}


                      <div class="hidden sm:flex justify-start items-center w-full m-auto rounded-none sm:rounded-lg mb-4">
                          <table class="table table-sm table-pin-rows table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
                            <thead>
                              <tr class="bg-[#0F0F0F] shadow-md">
                                <th class="text-start bg-[#0F0F0F] text-white text-sm sm:font-medium">
                                  Person
                                </th>
                                <th class="text-end bg-[#0F0F0F] hidden sm:table-cell text-white text-sm sm:font-medium">
                                  Transaction Date
                                </th>
                                <th class="text-end bg-[#0F0F0F]  text-white text-sm sm:font-medium">
                                  Shares
                                </th>
                                <th class="text-end bg-[#0F0F0F]  text-white text-sm sm:font-medium">
                                  Price
                                </th>
                                <th class="text-white sm:font-semibold text-end text-sm">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {#each (data?.user?.tier === 'Pro' ? insiderTradingList : insiderTradingList?.slice(0,3)) as item, index}
                              <tr class="text-gray-200 bg-[#0F0F0F] {index+1 === insiderTradingList?.slice(0,3)?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
      
                                <td class="text-gray-200 border-b border-[#0F0F0F]">
                                  <div class="flex flex-col">
                                    <span class="text-white">{formatString(item?.reportingName)?.replace('/de/','')}</span>
                                    <span class="text-white text-xs">{extractOfficeInfo(item?.typeOfOwner)}</span>
                                  </div>
                                </td>
      
                                  <td class="text-end hidden sm:table-cell text-xs sm:text-sm text-white border-b border-[#0F0F0F]">
                                      {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                  </td>

                                  <td class="text-end text-xs sm:text-sm text-white border-b border-[#0F0F0F]">
                                      {abbreviateNumber(item?.securitiesTransacted)}
                                  </td>
                                  <td class="text-end text-xs sm:text-sm text-white border-b border-[#0F0F0F]">
                                    ${item?.price?.toFixed(2)}
                                  </td>
                                  <td class="font-medium text-end sm:text-sm text-white border-b border-[#0F0F0F]">
                                    {#if item?.transactionType === 'Bought'}
                                      <span class="text-[#10DB06]">Bought</span>
                                    {:else if item?.transactionType === 'Grant'}
                                      <span class="text-[#8f95a1]">Grant</span>
                                    {:else if item?.transactionType === 'Sold'}
                                      <span class="text-[#FF2F1F]">Sold</span>
                                    {:else if item?.transactionType === 'Exercise'}
                                      <span class="text-[#F8901E]">Exercise</span>
                                    {:else if item?.transactionType === 'n/a'}
                                      <span class="text-gray-300">n/a</span>
                                    {/if}
                                  </td>
                              </tr>
                            {/each}
                            </tbody>
                          </table>
                      </div>

                      <div class="relative sm:hidden w-full">
                        {#each insiderTradingList as item}
                          <div class="bg-[#202020] border border-slate-800 shadow-lg rounded-lg h-auto pb-4 pl-2 pr-4 pt-4 mb-7">
                              <div class="flex flex-row items-center">
                                <label class="flex flex-col ml-2 w-40">
                                  <span class="text-white fónt-medium">Name</span>
                                  <span class="text-slate-300 text-sm">{formatString(item?.reportingName)?.replace('/de/','')}</span>
                                </label>
    
                                <div class="flex flex-col justify-end items-end ml-auto">
                                  <span class="font-medium text-slate-300 text-end">Position</span>
                                  <span class="text-white text-opacity-[0.8] text-sm text-end">
                                    {extractOfficeInfo(item?.typeOfOwner)}
                                  </span>
                                </div>
                              </div>
                              <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
    
                              <div class="flex flex-row items-center">
                                <div class="flex flex-col ml-3 w-40">
                                  <span class="font-medium text-slate-300">Transaction Date</span>
                                  <span class="text-slate-300 text-sm">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                  </span>
                                </div>
    
                                <div class="flex flex-col justify-end items-end ml-auto">
                                  <span class="font-medium text-slate-300 text-ends">Price</span>
                                  <span class="text-white text-sm text-end">
                                    ${item?.price?.toFixed(2)}
                                  </span>
                                </div>
                              </div>
    
                              <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
    
                              <div class="flex flex-row items-center">
                                <div class="flex flex-col ml-3 w-40">
                                  <span class="font-medium text-slate-300">Shares</span>
                                  <span class="text-slate-300 text-sm font-medium">
                                    {abbreviateNumber(item?.securitiesTransacted)}
                                  </span>
                                </div>
    
                                <div class="flex flex-col justify-end items-end ml-auto">
                                  <span class="font-medium text-slate-300 text-ends">Type</span>
                                  <span class="text-white text-end font-medium">
                                    {#if item?.transactionType === 'Bought'}
                                      <span class="text-[#10DB06]">Bought</span>
                                    {:else if item?.transactionType === 'Grant'}
                                      <span class="text-[#8f95a1]">Grant</span>
                                    {:else if item?.transactionType === 'Sold'}
                                      <span class="text-[#FF2F1F]">Sold</span>
                                    {:else if item?.transactionType === 'Exercise'}
                                      <span class="text-[#F8901E]">Exercise</span>
                                    {:else if item?.transactionType === 'n/a'}
                                      <span class="text-gray-300">n/a</span>
                                    {/if}
                                  </span>
                                </div>
                              </div>
    
    
                          </div>
                        {/each}

                      </div>

                      {#if rawData?.length >= 20 && data?.user?.tier === 'Pro'}
                      <label on:click={backToTop} class="w-32 py-1.5 mt-10 hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-slate-800 rounded-full">
                        Back to top
                      </label>
                      {/if}

                      {#if data?.user?.tier === 'Pro'}
                        <InfiniteLoading on:infinite={infiniteHandler} />
                      {/if}

                      <UpgradeToPro data={data} title="Access {$displayCompanyName}'s insider transactions to track executive selling and purchasing activity"/>


          
      
                      {:else} 
                      <h2 class="pl-4 pr-4 flex justify-center items-center text-md sm:text-lg text-center text-slate-200">
                        No trading history available for {$displayCompanyName}. Likely no insider trading has happened yet.
                      </h2>
                      {/if}


                  {:else}
                  <div class="flex justify-center items-center h-80">
                    <div class="relative">
                    <label class="bg-[#202020] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="loading loading-spinner loading-md"></span>
                    </label>
                    </div>
                </div>
              
                  {/if}
      

    
                </div>
            </div>
         </div>
    </section>



<style>
  .app {
      height: 500px;
      max-width: 1500px;
  }
  
  @media (max-width: 560px) {
      .app {
          max-width: 520px;
          height: 500px;
      }
  }

  .chart {
      width: 100%;
  }
</style>