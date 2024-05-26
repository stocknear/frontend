<script lang="ts">
  import {stockTicker, etfTicker} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import Lazy from 'svelte-lazy';
  import { Chart } from 'svelte-echarts'

  export let pricePrediction;
  export let pastPriceList;
  export let lastPrice;
  export let assetType;



  let mode:boolean;
  let optionsPrediction;
  let rawData;

let timePeriod = '1W'
let timeFrame = 7;

function selectTimeInterval(interval) {
    timePeriod = interval;
  }





let lowPrice;
let meanPrice;
let highPrice;
let changeMin;
//let changeMean = ((meanPrice/lastPrice -1)*100) ?? 'n/a'
let changeMax;

let changeMean;



const plotPredictionChart = () => {

  if (typeof rawData !== 'undefined')
  {

    
    const pastDates = rawData.map(item => item.time);
    const pastPriceData = rawData.map(item => item.close);
    const nullList = Array.from({ length: pastPriceData.length -1}, () => null);
    


    const startDate = new Date(pastDates?.slice(-1));
    const futureDates = [];

    for (let i = 0; i < timeFrame; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      futureDates.push(formattedDate);
    }
    const futureNullList = Array.from({ length: futureDates.length -2}, () => null);

    const dates = [...new Set([...pastDates, ...futureDates]) ];

    const options = {
      grid: {
          left: '0%',
          right: '0%',
          top: '10%',
          bottom: '10%',
          containLabel: true,
      },
    
        xAxis: {
          type: 'category',
          // prettier-ignore
          data: dates,
          axisTick: {
              alignWithLabel: true,
          },
          
        },
        yAxis: [
          {
            scale: true,
            splitLine: {
                  show: false, // Disable y-axis grid lines
              },
              axisLabel: {
                  formatter: '${value}', // Display value with a percent sign
              },
          },
        ],
        series: [
          {
            name: 'Past Price',
            type: 'line',
            itemStyle: {
              color: 'white', // Set the color to green
            },
            lineStyle: {
              width: 1,
            },
            smooth: true,
            // prettier-ignore
            data: pastPriceData,
          },
          {
            name: 'Average',
            type: 'line',
            itemStyle: {
              color: 'orange' // Set the color to green
            },
            lineStyle: {
              width: 1.5,
              type: 'dashed',
            },
            smooth: true,
            connectNulls: true, // Connect null data points
            // prettier-ignore
            data: [...nullList, pastPriceData?.at(-1), ...futureNullList, meanPrice],
            markArea: {
              itemStyle: {
                color: 'rgb(31, 31, 35, 1)'
              },
              data: [
                [
                  {
                    name: '',
                    xAxis: pastDates?.at(-1),
                  },
                  {
                    xAxis: futureDates?.at(-1),
                  }
                ]
              ]
            }
          },
          {
            name: 'High',
            type: 'line',
            lineStyle: {
              color: 'green',
              width: 1.5,
              type: 'dashed',
            },
            smooth: true,
            connectNulls: true, // Connect null data points
            // prettier-ignore
            data: [...nullList, pastPriceData?.at(-1), ...futureNullList, highPrice],
          },
          {
            name: 'Low',
            type: 'line',
            lineStyle: {
              color: 'red',
              width: 1.5,
              type: 'dashed',
            },
            smooth: true,
            connectNulls: true, // Connect null data points
            // prettier-ignore
            data: [...nullList, pastPriceData?.at(-1), ...futureNullList, lowPrice],
          },
        ],
        
      };

      return options;
    }

    else {
      return {};
    }
    
}





$: {
  if ((assetType === 'stock' ? $stockTicker : $etfTicker ) && typeof window !== 'undefined' && typeof pricePrediction !== 'undefined' && typeof pastPriceList !== 'undefined')
  {
    mode = false;
    if (timePeriod === '3M')
    {
      rawData = pastPriceList['6M']?.slice(-80,-1);
      timeFrame = 90;
    }
    else if (timePeriod === '1W') 
    {
      rawData = pastPriceList['6M']?.slice(-10);
      timeFrame = 7;
    }
    else if (timePeriod === '1M') 
    {
      rawData = pastPriceList['6M']?.slice(-20,-1);
      timeFrame = 30;
    }
    else if (timePeriod === '6M') 
    {
      rawData = pastPriceList['1Y'];
      timeFrame = 180;
    }


    lowPrice = pricePrediction[timePeriod]['min'] ?? 'n/a';
    meanPrice = pricePrediction[timePeriod]['mean'] ?? 'n/a'
    highPrice = pricePrediction[timePeriod]['max'] ?? 'n/a'
    changeMin = ((lowPrice/lastPrice -1)*100) ?? 'n/a'
    //changeMean = ((meanPrice/lastPrice -1)*100) ?? 'n/a'
    changeMax = ((highPrice/lastPrice -1)*100) ?? 'n/a'

    changeMean = ((changeMax+changeMin)/2) ?? 'n/a';

    optionsPrediction = plotPredictionChart()

    mode = true;

  }
}

  
</script>


<!--Start Copilot Card -->

<div class="space-y-3 overflow-hidden">  
      <!--Start Content-->
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto">

        <div class="flex flex-col items-center w-full mb-6">
            <div class="flex flex-row justify-start mr-auto items-center">
              <!--<img class="h-10 inline-block mr-2" src={copilotIcon} />-->
              <div class="flex flex-row items-center">
                <label for="pricePredictionInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                  Price Prediction
                </label>
                <InfoModal
                  title={"Price Prediction"}
                  content={`The Algorithm forecasts the price for various time periods such as one week, one month, three months, and six months using historical data and various machine-learning techniques.`}
                  id={"pricePredictionInfo"}
                />
                </div>

            </div>
        </div>
        
        <!--          
        <p class="text-white text-md">
          Expect prices between ${lowPrice?.toFixed(2)} and ${highPrice?.toFixed(2)} for the next {timePeriod === '1W' ? '7 days' : timePeriod === '1M' ? '1 month' : timePeriod === '3M' ? '3 months' : timePeriod === '6M' ? '6 months' : 'n/a'}.
        </p>
        -->
          <div class="flex flex-row items-center sm:mt-3 mb-5">
              
            <span class="text-white text-md font-medium">
              Time Period
            </span>
            <div class="ml-auto text-white rounded">
              
              
              <label for="timePeriodModal" class="pl-3 pr-3 py-1 text-sm sm:text-sm cursor-pointer mr-1 flex flex-row ease-in-out duration-200 rounded-lg bg-[#1E1E1E] hover:bg-[#333333] normal-case cursor-pointer items-center">
                  <div class="flex flex-row">
                      <span class="m-auto mr-1 text-white">{timePeriod}</span>
                      <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                          <g transform="rotate(180 512 512)">
                              <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/>
                          </g>
                      </svg>
                  </div>
              </label>
              
            </div>

          </div>


          {#if mode}

          <div class="text-white flex flex-row items-center justify-between w-full font-medium text-md text-center mt-3">
            <span class="text-white text-sm m-auto">
              Past Price
            </span>
            <span class="text-white text-end text-sm">
              Future Price
            </span>
          </div>

          <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
            <div class="app w-[90vw] sm:w-[50vw] m-auto mb-5">
              <Chart options={optionsPrediction} class="chart w-full" />
            </div>
          </Lazy>

          <p class="text-white text-md mb-5">
            You can anticipate future returns in the next {timePeriod === '1W' ? '7 days' : timePeriod === '1M' ? '1 month' : timePeriod === '3M' ? '3 months' : timePeriod === '6M' ? '6 months' : 'n/a'}, based on the last price, with a 68% confidence level.
          </p>

            <table class="table table-pin-rows table-sm table-compact w-full mb-5">
              <!-- head -->
              <thead>
                <tr>
                  <th class="text-white text-sm font-medium bg-[#0F0F0F] shadow-md">Target</th>
                  <th class="text-white text-sm font-medium bg-[#0F0F0F] shadow-md">Lowest</th>
                  <th class="text-white text-sm font-medium bg-[#0F0F0F] shadow-md">Average</th>
                  <th class="text-white text-sm font-medium bg-[#0F0F0F] shadow-md">Highest</th>
                </tr>
              </thead>
              <tbody>
                <tr class="">
                  <td class="text-white border-b border-[#0F0F0F]">
                    <span class="text-white font-medium">Price</span>
                  </td>
                  <td class="text-white sm:font-medium text-[0.95rem] border-b border-[#0F0F0F]">
                      ${lowPrice?.toFixed(2)}
                  </td>
                  <td class="text-white sm:font-medium text-[0.95rem] border-b border-[#0F0F0F]">
                      ${meanPrice?.toFixed(2)}
                  </td>
                  <td class="text-white sm:font-medium text-[0.95rem] border-b border-[#0F0F0F]">
                    ${highPrice?.toFixed(2)}
                  </td>
                </tr>

                <tr class="border-[#0F0F0F]">
                  <td class="text-white">
                    <span class="text-white sm:font-medium">Change</span>
                  </td>
                  <td class="text-white">
                    <div class="flex flex-row items-center">
                      {#if changeMin >= 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#10DB06] sm:font-medium sm:text-[0.95rem]">+{changeMin?.toFixed(2)}%</span>
                      {:else if changeMin < 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF0000" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#FF2F1F] sm:font-medium text-[0.95rem]">{changeMin?.toFixed(2)}%</span>
                      {:else}
                      <span class="text-gray-300 sm:font-medium text-[0.95rem] m-auto pr-2">n/a</span>
                      {/if}
                      </div>
                  </td>
                  <td class="text-white">
                    <div class="flex flex-row items-center ">
                      {#if changeMean >= 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#10DB06] sm:font-medium text-[0.95rem]">+{changeMean?.toFixed(2)}%</span>
                      {:else if changeMean < 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF0000" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#FF2F1F] sm:font-medium text-[0.95rem]">{changeMean?.toFixed(2)}%</span>
                      {:else}
                      <span class="text-gray-300 sm:font-medium text-[0.95rem] m-auto pr-2">n/a</span>
                      {/if}
                    </div>
                  </td>
                  <td class="text-white">
                    <div class="flex flex-row items-center">
                      {#if changeMax >= 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#10DB06] sm:font-medium text-[0.95rem]">+{changeMax?.toFixed(2)}%</span>
                      {:else if changeMax < 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#FF0000" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#FF2F1F] sm:font-medium text-[0.95rem]">{changeMax?.toFixed(2)}%</span>
                      {:else}
                      <span class="text-gray-300 sm:font-medium text-[0.95rem] m-auto pr-2">n/a</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            {/if}
           


    </div>
  </div>
  
  <!--End Copilot Card-->







  <!--Start Time Period Modal-->
  <input type="checkbox" id="timePeriodModal" class="modal-toggle" />
      
  <dialog id="timePeriodModal" class="modal modal-bottom sm:modal-middle">
  
  
    <label id="timePeriodModal" for="timePeriodModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#191919] flex flex-col items-center">
      <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
  
  
  
      <div class="text-white w-full">
        <h3 class="font-medium text-lg sm:text-xl mb-6 ml-2">
          Forecast Time Period
        </h3>
  
  
        <div class="flex flex-col items-center w-full max-w-3xl bg-[#191919]">
  
  
          <label for="timePeriodModal" on:click={() => selectTimeInterval('1W')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timePeriod === '1W' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  1 Week
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if timePeriod === '1W'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
  
          <label for="timePeriodModal" on:click={() => selectTimeInterval('1M')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timePeriod === '1M' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                1 Month
              </span>
  
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if timePeriod === '1M'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
  
            </div>
           
          </label>
  
      
  
  
          <label for="timePeriodModal" on:click={() => selectTimeInterval('3M')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timePeriod === '3M' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                3 Months
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if timePeriod === '3M'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
            </div>
          </label>
  
          <label for="timePeriodModal" on:click={() => selectTimeInterval('6M')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timePeriod === '6M' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                6 Months
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if timePeriod === '6M'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
              </div>
  
            </div>
           
          </label>
  
  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End Time Period Modal-->
  
  

  <style>

    .app {
        height: 300px;
        max-width: 100%; /* Ensure chart width doesn't exceed the container */
    
        }
    
        @media (max-width: 640px) {
        .app {
            height: 180px;
        }
        }
    
        .chart {
        width: 100%;
        }
        
    </style>