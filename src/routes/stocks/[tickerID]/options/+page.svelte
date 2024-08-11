<script lang="ts">

  import {numberOfUnreadNotification, displayCompanyName, screenWidth, stockTicker} from '$lib/store';
  import { Chart } from 'svelte-echarts'
  import { abbreviateNumber } from '$lib/utils';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { onMount } from 'svelte'
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import { init, use } from 'echarts/core'
  import { BarChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'
  use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])
  
  
    export let data;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let optionsPlotData = data?.getOptionsPlotData?.plot;
    let displayData = 'volume';
    let options;
    let rawData = data?.getOptionsFlowData
    let optionList = rawData?.slice(0,30);
    let flowSentiment = 'n/a';
    let callPercentage; 
    let putPercentage;
    let displayCallVolume;
    let displayPutVolume;
    let latestPutCallRatio;
    let displayOTMRatio;
    
    const totalPutCallRatio = data?.getOptionsPlotData?.putCallRatio;
    
    
    const totalVolume = data?.getOptionsPlotData?.totalVolume;
    
    const totalOpenInterest = data?.getOptionsPlotData?.totalOpenInterest;
    
    
    // Computing the put-call ratio for open interest
    const putCallOpenInterestRatio = data?.getOptionsPlotData?.putCallOpenInterestRatio;
    
    const displayTotalVolume = new Intl.NumberFormat("en", {minimumFractionDigits: 0, maximumFractionDigits: 0})?.format(totalVolume);
    const displayTotalOpenInterest = new Intl.NumberFormat("en", {minimumFractionDigits: 0, maximumFractionDigits: 0})?.format(totalOpenInterest);
    
    const dateList = data?.getOptionsPlotData?.dateList;
    
    const callVolumeList = data?.getOptionsPlotData?.callVolumeList;
    const putVolumeList = data?.getOptionsPlotData?.putVolumeList;
    const callOpenInterestList = data?.getOptionsPlotData?.callOpenInterestList;
    const putOpenInterestList = data?.getOptionsPlotData?.putOpenInterestList;
    
    
    
    
    function formatDate(dateStr) {
      // Parse the input date string (YYYY-mm-dd)
      var date = new Date(dateStr);
    
      // Get month, day, and year
      var month = date.getMonth() + 1; // Month starts from 0
      var day = date.getDate();
      var year = date.getFullYear();
    
      // Extract the last two digits of the year
      var shortYear = year.toString().slice(-2);
    
      // Add leading zeros if necessary
      month = (month < 10 ? "0" : "") + month;
      day = (day < 10 ? "0" : "") + day;
    
      var formattedDate = month + "/" + day + "/" + year;
    
      return formattedDate;
    }
    
    function formatTime(timeString) {
      // Split the time string into components
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
    
      // Determine AM or PM
      const period = hours >= 12 ? 'PM' : 'AM';
    
      // Convert hours from 24-hour to 12-hour format
      const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight
    
      // Format the time string
      const formattedTimeString = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
    
      return formattedTimeString;
    }
    
    function changeStatement(event)
    {
      displayData = event.target.value;
    }
    
    
    
    function plotData(callData, putData) {
        const options = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                type: 'shadow'
                }
            },
            silent: true,
            grid: {
                left: $screenWidth < 640 ? '5%' : '2%',
                right: $screenWidth < 640 ? '5%' : '2%',
                bottom: '20%',
                containLabel: true
            },
            xAxis: [
                {
                type: 'category',
                data: dateList,
                axisLabel: {
                  formatter: function (value) {
                      // Assuming dates are in the format 'yyyy-mm-dd'
                      const dateParts = value.split('-');
                      const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                      const year = parseInt(dateParts[0]);
                      const day = parseInt(dateParts[2])
                      return `${day} ${monthNames[monthIndex]} ${year}`;
                  }
              }
                }
            ],
            yAxis: [
            {
                type: 'value',
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    show: false // Hide the y-axis label
                }
            }
        ],
            series: [
                {
                name: 'Call',
                type: 'bar',
                stack: 'Put-Call Ratio',
                emphasis: {
                    focus: 'series'
                },
                data: callData,
                itemStyle: {
                    color: '#00FC50'
                    },
                },
                {
                name: 'Put',
                type: 'bar',
                stack: 'Put-Call Ratio',
                emphasis: {
                    focus: 'series'
                },
                data: putData,
                itemStyle: {
                    color: '#EE5365' //'#7A1C16'
                    },
                },
            ]
        };
        return options;
    }
    
    function calculateStats() {
        const currentPrice = parseFloat(data?.getStockQuote?.price);
        
        const { callVolumeSum, putVolumeSum, bullishCount, bearishCount, otmVolume, itmVolume } = rawData?.reduce((acc, item) => {
            const volume = parseInt(item?.volume);
            const strikePrice = parseFloat(item?.strike_price);
    
            if (item?.put_call === "Calls") {
                acc.callVolumeSum += volume;
                if (strikePrice > currentPrice) {
                    acc.otmVolume += volume;
                } else {
                    acc.itmVolume += volume;
                }
            } else if (item?.put_call === "Puts") {
                acc.putVolumeSum += volume;
                if (strikePrice < currentPrice) {
                    acc.itmVolume += volume;
                } else {
                    acc.otmVolume += volume;
                }
            }
    
            if (item?.sentiment === "Bullish") {
                acc.bullishCount += 1;
            } else if (item?.sentiment === "Bearish") {
                acc.bearishCount += 1;
            }
    
            return acc;
        }, { callVolumeSum: 0, putVolumeSum: 0, bullishCount: 0, bearishCount: 0, otmVolume: 0, itmVolume: 0 });
    
        if (bullishCount > bearishCount) {
            flowSentiment = 'Bullish';
        } else if (bullishCount < bearishCount) {
            flowSentiment = 'Bearish';
        } else {
            flowSentiment = 'Neutral';
        }
    
        latestPutCallRatio = (putVolumeSum / callVolumeSum);
        callPercentage = Math.floor((callVolumeSum) / (callVolumeSum + putVolumeSum) * 100);
        putPercentage = (100 - callPercentage);
        displayCallVolume = callVolumeSum;
        displayPutVolume = putVolumeSum;
        
        // Calculate OTM/ITM ratio
        displayOTMRatio = otmVolume / (itmVolume+otmVolume) ?? 0;
    }
    
    async function handleScroll() {
        const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
        const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
        if (isBottom && optionList?.length !== rawData?.length) {
            const nextIndex = optionList?.length;
            const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 25);
            optionList = [...optionList, ...filteredNewResults];
        }
      }
    
    
    
    onMount(async () => {
      calculateStats();
      
      if(data?.user?.tier === 'Pro') {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
      }
    })
    
    
    $: {
        if(displayData && optionsPlotData?.length !== 0 && typeof window !== 'undefined') {
            if (displayData === 'volume') {
                options = plotData(callVolumeList, putVolumeList)
            }
            else if (displayData === 'openInterest') {
                options = plotData(callOpenInterestList, putOpenInterestList)
            }
        }
    }
    
    
    
    </script>
    
    
      
    <svelte:head>
    
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Options Activity · stocknear
    </title>
    <meta name="description" content={`Detailed informaton of unusual options activity for ${$displayCompanyName} (${$stockTicker}).`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Options Activity · stocknear`}/>
    <meta property="og:description" content={`Detailed informaton of unusual options activity for ${$displayCompanyName} (${$stockTicker}).`} />
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
    
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Options Activity · stocknear`}/>
    <meta name="twitter:description" content={`Detailed informaton of unusual options activity for ${$displayCompanyName} (${$stockTicker}).`} />
    <!-- Add more Twitter meta tags as needed -->
    
    </svelte:head>
    
    
                  
        <section class="bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
            <div class="flex justify-center m-auto h-full overflow-hidden w-full">
                <div class="relative flex justify-center items-center overflow-hidden w-full">
                      <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                            <div class="mb-6">
                                <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                                    Unsual Options Activity
                                </h2>
        
                                <div class="w-fit text-white p-3 sm:p-5 mb-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                                  <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                                  
                                  {#if optionsPlotData?.length !== 0}
                                    Last 3 months of options activity involving {$displayCompanyName} by major institutional traders and hedge funds.
                                    {:else}
                                    There's no data available, indicating that major traders may not be actively betting on {$displayCompanyName}.
                                  {/if}
    
                              </div>
        
                            </div>
    
                    
                        {#if optionsPlotData?.length !== 0}
    
                        <div class="stats stats-horizontal bg-[#27272A] w-full rounded-lg">
                
                          <div class="grid grid-cols-2">
              
                            <div class="stat">
                              <div class="flex flex-row items-center">
                                <label for="totalVolume" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                                  Total Volume
                                </label>
                                <InfoModal
                                  title={"Total Volume"}
                                  content={"The total volume is the combined number of puts and calls traded over the past three months in options trading."}
                                  id={"totalVolume"}
                                />
                                </div>
                              <div class="stat-value font-semibold mt-1 text-lg text-gray-200">{displayTotalVolume}</div>
                            </div>
                            
              
              
                            <div class="stat">
                              <div class="flex flex-row items-center">
                              <label for="totalOpenInterestModal" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                                Total OI
                              </label>
                              <InfoModal
                                    title={"Total Open Interest"}
                                    content={"The total open interest reflects the aggregate number of outstanding options contracts in options trading."}
                                    id={"totalOpenInterestModal"}
                                  />
                              </div>
                              
                              <div class="stat-value font-semibold mt-1 text-lg text-gray-200">{displayTotalOpenInterest}</div>
                            </div>
                            
                            <div class="stat">
                              <div class="flex flex-row items-center">
                              <label for="revenueInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                                P/C Ratio
                              </label>
                              <InfoModal
                                title={"Put-Call Ratio"}
                                content={"The put-call ratio assesses market sentiment and potential movements by comparing traded put options to call options."}
                                  id={"revenueInfo"}
                                  />
                                </div>
                              <div class="stat-value font-semibold mt-1 text-lg text-gray-200">
                                {totalPutCallRatio !== 'Infinity' ? totalPutCallRatio : '> 1'}
                              </div>
                            </div>
              
                            <div class="stat">
                              <div class="flex flex-row items-center">
                                <label for="profitsInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                                  OI P/C Ratio
                                </label>
                                <InfoModal
                                  title={"Open Interest Put-Call Ratio"}
                                  content={"The open interest put-call ratio measures market sentiment in options trading by comparing the total number of outstanding put options contracts to outstanding call options contracts. A higher ratio suggests bearish sentiment, while a lower ratio indicates bullish sentiment."}
                                  id={"profitsInfo"}
                                  />
                                  </div>
                              <div class="stat-value font-semibold mt-1 text-lg text-gray-200">{putCallOpenInterestRatio !== 'Infinity' ? putCallOpenInterestRatio : '> 1'}</div>
                            </div>
              
                            </div>
                          
                        </div>
    
    
                              
    
                                <div class="flex flex-row items-center w-full mt-5">
                                    <select class="mt-5 sm:mb-0 ml-1 w-40 select select-bordered select-sm p-0 pl-5  bg-[#2A303C]" on:change={changeStatement}>
                                        <option disabled>Choose a category</option>
                                        <option value="volume" selected>Volume</option>
                                        <option value="openInterest">Open Interest</option>
                                    </select>
                                </div>
                            
                                
                                <div class="app w-full bg-[#09090B] rounded-xl">
                                    <Chart {init} options={options} class="chart" />
                                </div>
                                
    
                                
                                <h3 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4 text-center sm:text-start">
                                    Latest Options Activity 
                                </h3>
    
    
    
                                {#if optionList?.length !== 0}
                                <!--Start Widget-->
    
                                <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center">
                                  <div class="w-full grid grid-cols-2 xl:grid-cols-3 gap-y-3 lg:gap-y-3 gap-x-3 ">
                                    <!--Start Flow Sentiment-->  
                                    <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-md h-20">
                                        <div class="flex flex-col items-start">
                                            <span class="font-medium text-gray-200 text-[1rem] ">Flow Sentiment</span>
                                            <span class="text-start text-[1rem] font-medium {flowSentiment === 'Bullish' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">{flowSentiment}</span>
                                        </div>
                                        
                                    </div>
                                    <!--End Flow Sentiment-->
                                    <!--Start Put/Call-->  
                                    <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-md h-20">
                                      <div class="flex flex-col items-start">
                                          <span class="font-medium text-gray-200 text-[1rem] ">Put/Call</span>
                                          <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                            {latestPutCallRatio?.toFixed(3)}
                                          </span>
                                      </div>
                                      <!-- Circular Progress -->
                                        <div class="relative size-14 ml-auto">
                                          <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                            <!-- Background Circle -->
                                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                            <!-- Progress Circle inside a group with rotation -->
                                            <g class="origin-center -rotate-90 transform">
                                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-blue-500" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={latestPutCallRatio >=1 ? 0 : 100-(latestPutCallRatio*100)?.toFixed(2)}></circle>
                                            </g>
                                          </svg>
                                          <!-- Percentage Text -->
                                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                            <span class="text-center text-white text-sm">{latestPutCallRatio?.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      <!-- End Circular Progress -->
                            
                                  </div>
                                  <!--End Put/Call-->
                                  <!--Start Call Flow-->  
                                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-md h-20">
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium text-gray-200 text-[1rem] ">Call Flow</span>
                                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                          {new Intl.NumberFormat("en", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(displayCallVolume)}
                                        </span>
                                    </div>
                                    <!-- Circular Progress -->
                                    <div class="relative size-14 ml-auto">
                                      <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                        <!-- Background Circle -->
                                        <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                        <!-- Progress Circle inside a group with rotation -->
                                        <g class="origin-center -rotate-90 transform">
                                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#00FC50]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-callPercentage?.toFixed(2)}></circle>
                                        </g>
                                      </svg>
                                      <!-- Percentage Text -->
                                      <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                        <span class="text-center text-white text-sm">{callPercentage}%</span>
                                      </div>
                                    </div>
                                    <!-- End Circular Progress -->
                                  </div>
                                  <!--End Call Flow-->
                                  <!--Start Put Flow-->  
                                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-md h-20">
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium text-gray-200 text-[1rem] ">Put Flow</span>
                                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                          {new Intl.NumberFormat("en", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(displayPutVolume)}
                                        </span>
                                    </div>
                                    <!-- Circular Progress -->
                                    <div class="relative size-14 ml-auto">
                                      <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                        <!-- Background Circle -->
                                        <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                        <!-- Progress Circle inside a group with rotation -->
                                        <g class="origin-center -rotate-90 transform">
                                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#EE5365]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-putPercentage?.toFixed(2)}></circle>
                                        </g>
                                      </svg>
                                      <!-- Percentage Text -->
                                      <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                        <span class="text-center text-white text-sm">{putPercentage}%</span>
                                      </div>
                                    </div>
                                    <!-- End Circular Progress -->
                                    
                                  </div>
                                  <!--End Put Flow-->
    
                                    <!--Start Put/Call-->  
                                    <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-md h-20">
                                      <div class="flex flex-col items-start">
                                          <span class="font-medium text-gray-200 text-[1rem] ">OTM Ratio</span>
                                          <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                            Volume in %
                                          </span>
                                      </div>
                                      <!-- Circular Progress -->
                                        <div class="relative size-14 ml-auto">
                                          <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                            <!-- Background Circle -->
                                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                            <!-- Progress Circle inside a group with rotation -->
                                            <g class="origin-center -rotate-90 transform">
                                              <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#EE5365]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={displayOTMRatio >=1 ? 0 : 100-(displayOTMRatio*100)?.toFixed(2)}></circle>
                                            </g>
                                          </svg>
                                          <!-- Percentage Text -->
                                          <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                            <span class="text-center text-white text-sm">{(displayOTMRatio*100)?.toFixed(0)}%</span>
                                          </div>
                                        </div>
                                      <!-- End Circular Progress -->
                            
                                  </div>
                                  <!--End Put/Call-->
                            
                            
                                    </div>
                                </div>
                              <!--End Widget-->
    
    
    
    
                                <div class="flex justify-start items-center m-auto overflow-x-auto">
                                    
                                    
                                    <table class="table table-pin-cols table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 overflow-x-auto">
                                        <thead>
                                          <tr class="">
                                            <td class="text-slate-200 font-semibold text-sm text-start">Time</td>
                                            <td class="text-slate-200 font-semibold text-sm text-start">Date</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Expiry</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Strike</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">C/P</td>
                                            <td class="text-slate-200 font-semibold text-sm text-start">Sent.</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Spot</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Price</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Prem.</td>
                                            <td class="text-slate-200 font-semibold text-sm text-start">Type</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">Vol.</td>
                                            <td class="text-slate-200 font-semibold text-sm text-end">OI</td>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {#each (data?.user?.tier === 'Pro' ? optionList : optionList?.slice(0,3)) as item, index}
                                          <!-- row -->
                                          <tr class="odd:bg-[#27272A] border-b-[#09090B] {index+1 === optionList?.slice(0,3)?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                                            
                                            <td class="text-white text-sm sm:text-[1rem] text-start whitespace-nowrap">
                                              {formatTime(item?.time)}
                                            </td>
    
                                            <td class="text-white text-sm sm:text-[1rem] text-start">
                                              {formatDate(item?.date)}
                                            </td>
    
                                            <td class="text-white text-sm sm:text-[1rem] text-end">
                                              {item?.dte < 0 ? 'expired' : item?.dte +'d'}
                                            </td>
                                            
                                            <td class="text-sm sm:text-[1rem] text-end text-white">
                                              {item?.strike_price}
                                            </td>
    
                                            <td class="{item?.put_call === 'Calls' ? 'text-[#00FC50]' : 'text-[#FC2120]'} text-start">
                                              {item?.put_call}
                                            </td>
    
                                            <td class="{item?.sentiment === 'Bullish' ? 'text-[#00FC50]' : item?.sentiment === 'Bearish' ? 'text-[#FC2120]' : 'text-[#C6A755]'} text-start">
                                              {item?.sentiment}
                                            </td>
    
                                            <td class="text-sm sm:text-[1rem] text-end text-white">
                                              {item?.underlying_price}
                                            </td>
                                          
                                          <td class="text-sm sm:text-[1rem] text-end text-white">
                                            {item?.price}
                                          </td>
                                          
                                          <td class="text-sm sm:text-[1rem] text-end font-medium {item?.put_call === 'Puts' ? 'text-[#CB281C]' : 'text-[#0FB307]'} ">
                                            {abbreviateNumber(item?.cost_basis)}
                                          </td>
                      
                                          <td class="text-sm sm:text-[1rem] text-start {item?.type === 'Sweep' ? 'text-[#C6A755]' : 'text-[#976DB7]'}">
                                            {item?.type}
                                          </td>
                          
                            
                          
                                          <td class="text-white text-end">
                                              {new Intl.NumberFormat("en", {
                                                  minimumFractionDigits: 0,
                                                  maximumFractionDigits: 0
                                              }).format(item?.volume)}
                                          </td>
                          
                                          <td class="text-white text-end">
                                            {new Intl.NumberFormat("en", {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0
                                          }).format(item?.open_interest)}
                                          </td>
                      
                      
                                    
                            
                                          </tr>
                                          
                                      
                                          {/each}
    
                                        </tbody>
                                    </table>
                                    
                                </div>
    
                                <UpgradeToPro data={data} title="Get the recent Options Flow Data from Hedge Funds and major institutional traders to never miss out"/>
    
                                {:else}
                                <div class="flex justify-center items-center m-auto mt-16 mb-6">
                                    <div class="text-gray-100 text-sm sm:text-[1rem] rounded-lg h-auto border border-slate-800 p-4">
                                    <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                                    No Options activity found
                                    </div>
                                </div>
                                {/if}
    
                            {/if}
            
                      
    
    
                      </div>
    
                      
                </div>
            </div>
        
            
        </section>
        
        
    
            
        <style>
          .app {
              height: 420px;
              max-width: 1500px;
          }
          
          @media (max-width: 560px) {
              .app {
                  max-width: 520px;
                  height: 420px;
              }
          }
        
          .chart {
              width: 100%;
          }
        </style>