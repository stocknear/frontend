<script lang="ts">
import {numberOfUnreadNotification, displayCompanyName, stockTicker} from '$lib/store';
import Chart from '$lib/components/Chart.svelte'
import { onMount } from 'svelte';
import Lazy from 'svelte-lazy';

export let data;

let dateDistance;
let stockDividends = data?.getStockDividend?.at(0);
let optionsDividend;
    
    
  
let exDividendDate = 'n/a';
let dividendYield = 'n/a';
let annualDividend = 'n/a';
let payoutFrequency = 'n/a';
let payoutRatio = 'n/a';
let dividendGrowth = 'n/a';
    
let dividendList = [];
let growthList = [];
let dateList = [];

let mode = false;


function toggleMode() {
    mode = !mode;
}
            
    

async function plotDividend(dividendList, growthList, dateList) {  
    const options = {
      xAxis: {
        data: dateList,
        type: 'category',
      },
      yAxis: [
        {
          type: 'value',
        },
        {
          type: 'value',
          splitLine: {
            show: false,
          },
        },
        {
          type: 'value',
          axisLabel: {
            formatter: '{value} %',
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: 'Dividend per Share',
          data: dividendList,
          type: 'line',
          smooth: true,
        },
        {
          name: 'Growth Rate (%)',
          data: growthList,
          type: 'bar',
          barWidth: '200%',
          smooth: true,
          yAxisIndex: 1,
          itemStyle: {
            color: (params) => {
              // Set color based on positive or negative value
              return params.data >= 0 ? '#076E0B' : '#F80102';
            },
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        
      },
    };
    
    
        return options;
}




let syncWorker: Worker | undefined = undefined;

// Handling messages from the worker
const handleMessage = async (event) => {
    const finalData = event.data?.finalData

    payoutFrequency = finalData?.payoutFrequency;
    exDividendDate = finalData?.exDividendDate;
    dividendYield = finalData?.dividendYield;
    dividendGrowth = finalData?.dividendGrowth;
    payoutRatio = finalData?.payoutRatio;
    dateDistance = finalData?.dateDistance;
    dividendList = finalData?.dividendList;
    growthList = finalData?.growthList;
    dateList = finalData?.dateList;
    annualDividend = finalData?.annualDividend;
    optionsDividend = await plotDividend(dividendList, growthList, dateList)
    //console.log('Message from worker:', chartData);

};

const loadWorker = async () => {
  const SyncWorker = await import('./workers/dividendWorker?worker');
  syncWorker = new SyncWorker.default();
  syncWorker.postMessage({ message: data?.getStockDividend});
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
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Dividend History, Dates & Yield · stocknear
  </title>

  <meta name="description" content={`Get the latest dividend data for ${$displayCompanyName} (${$stockTicker}) stock price quote with breaking news, financials, statistics, charts and more.`}>
  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Dividend History, Dates & Yield · stocknear`}/>
  <meta property="og:description" content={`Get the latest dividend data for ${$displayCompanyName} (${$stockTicker}), including dividend history, yield, key dates, growth and other metrics.`} />
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Dividend History, Dates & Yield · stocknear`}/>
  <meta name="twitter:description" content={`Get the latest dividend data for ${$displayCompanyName} (${$stockTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
  

          
    <section class="bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0">
        <div class="flex justify-center m-auto h-full overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden">
                  <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                        <div class="mb-6">
                            <h1 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                                Dividends
                            </h1>
    
                              
                        <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>

                          
                              {#if stockDividends?.length !== 0}
                              {#if !dateDistance}
                                  {$displayCompanyName} has an annual dividend of
                                    ${annualDividend}
                                  per share, with a forward yield of
                                    {dividendYield}%.
                                  The dividend is paid every
                                  {payoutFrequency === 4 ? '3 months' : payoutFrequency === 2 ? '6 months' : payoutFrequency === 1 ? '12 months' : 'n/a'} 
                                  and the last ex-dividend date was
                                    {new Date(exDividendDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                              {:else}
                                {$displayCompanyName} issued its most recent dividend on 
                                {new Date(stockDividends?.at(0)?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}. 
                                Since then, the company has not distributed any further dividends for over 12 months.
                              {/if}

                           
                            {:else}
                            No dividend history available for {$displayCompanyName}. Likely, the stock has never paid dividends.
                            {/if}
                          
                        </div>
    
                        </div>
    
                      {#if stockDividends?.length !== 0}
      
                          <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-5 bg-[#09090B] shadow-md rounded-xl p-5 flex justify-center items-center mb-2">
                              <!--Start Column Title-->
                              <div class="flex flex-col">
                                <div class="flex flex-row items-center">
                                  <span class="text-gray-300 font-medium text-[1rem]">
                                    Dividend Yield
                                  </span>
                                </div>
                              
                                <span class="text-white text-[1rem] font-semibold">
                                  {dividendYield !== '0.00' ? dividendYield : '0'}%
                                </span>
                              </div>
                              <!--End Column Title-->
                        
                              <!--Start Column Win Rate-->
                              <div class="flex flex-col">
                                <div class="flex flex-row items-center">
                                  <span class="text-gray-300 font-medium text-[1rem] ">
                                      Annual Dividend
                                  </span>
                                </div>
                                <span class="text-white text-[1rem] font-semibold">
                                  ${annualDividend !== '0.00' ? annualDividend : '0'}
                                </span>
                              </div>
                              <!--End Column Win Rate-->
                        
                              <!--Start Column Performance-->
                              <div class="flex flex-col">
                                  <div class="flex flex-row items-center">
                                    <span class="text-gray-300 font-medium text-[1rem]">
                                    Ex-Dividend Date
                                    </span>
                                  </div>
                                  <span class="text-white  text-[1rem] font-semibold">
                                    {new Date(exDividendDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                  </span>
                                </div>
                          <!--End Column-->
      
                            <!--Start Column-->
                            <div class="flex flex-col sm:mt-5">
                              <div class="flex flex-row items-center">
                                <span class="text-gray-300 font-medium text-[1rem]">
                                Payout Frequency
                                </span>
                              </div>
                              <span class="text-white text-[1rem] font-semibold">
                                  {payoutFrequency === 4 ? 'Quartely' : payoutFrequency === 2 ? 'Half-Yearly' : payoutFrequency === 1 ? 'Annually' : 'n/a'}
                              </span>
                            </div>
                            <!--End Column-->
      
                            <!--Start Column-->
                            <div class="flex flex-col sm:mt-5">
                              <div class="flex flex-row items-center">
                                <span class="text-gray-300 font-medium text-[1rem]">
                                Payout Ratio 
                                </span>
                              </div>
                              <span class="text-white text-[1rem] font-semibold">
                                  {payoutRatio !== '0.00' ? payoutRatio : '0'}%
                              </span>
                            </div>
                            <!--End Column-->
      
                            <!--Start Column-->
                            <div class="flex flex-col sm:mt-5">
                              <div class="flex flex-row items-center">
                                <span class="text-gray-300 font-medium text-[1rem]">
                                Dividend Growth
                                </span>
                              </div>
                              <span class="text-white text-[1rem] font-semibold">
                                  {dividendGrowth !== 'NaN' ? dividendGrowth+'%' : '-'}
                              </span>
                            </div>
                            <!--End Column-->
      
                          </div>
      
                          <div class="flex flex-col sm:flex-row items-start sm:items-center w-full mt-14 mb-8">
        
                            <h3 class="text-xl text-white font-semibold ">
                              Dividends History
                            </h3>
        
        
                            <label class="{stockDividends?.length === 0 ? 'hidden' : ''} inline-flex cursor-pointer relative ml-auto mt-5 sm:mt-0">
                              <input on:click={toggleMode} type="checkbox" value={mode} class="sr-only peer">
                              <div class="w-11 h-6 bg-gray-400 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1563F9]"></div>
                              {#if mode}
                              <span class="ml-2 text-sm font-medium text-gray-300">
                                  Cool Mode
                              </span>
                              {:else}
                              <span class="ml-2 text-sm font-medium text-gray-500">
                                  Boring Mode
                              </span>
                              {/if}
                            </label>
        
                          </div>
      
                        {#if stockDividends?.length !== 0}
      
      
                          {#if mode}
                          <Lazy height={300} fadeOption={{delay: 0, duration: 0}} keep={true}>
                            <div class="app w-full ">
                              <Chart options={optionsDividend} class="chart" />
                            </div>
                          </Lazy>
      
                            <span class="text-gray-200 text-sm italic">
                              * Dividend amounts are adjusted for stock splits when applicable.
                            </span>
                          
                          {:else}
                          
                            <div class="flex justify-start items-center w-full m-auto shadow-md rounded-none sm:rounded-lg mb-4">
                              <table class="table table-sm table-compact flex justify-start items-center w-full m-auto">
                                <thead>
                                  <tr class="bg-[#09090B] border-b-slate-600 shadow-md">
                                    <th class="text-start bg-[#09090B] border-b border-[#09090B] text-white text-sm font-semibold">
                                      Ex-Divid. Date
                                    </th>
                                    <th class="text-end bg-[#09090B] border-b border-[#09090B] text-white text-sm font-semibold">
                                      Cash Amount
                                    </th>
                                    <th class="text-end bg-[#09090B] border-b border-[#09090B] hidden sm:table-cell text-white text-sm font-semibold">
                                      Record Date
                                    </th>
                                    <th class="text-end bg-[#09090B] border-b border-[#09090B] text-white text-sm font-semibold">
                                      Pay Date
                                    </th>
                                  </tr>
                                </thead>
                                <tbody class="shadow-md">
                                  {#each stockDividends as item}
                                  <tr class="text-gray-200 odd:bg-[#27272A]">
                                    <td class="text-start text-xs sm:text-sm text-white font-medium border-b border-[#09090B]">
                                      {new Date(item?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                    </td>
                                    <td class="text-end text-xs sm:text-sm text-white border-b border-[#09090B]">
                                      ${item?.adjDividend?.toFixed(2)}
                                    </td>
                                    <td class="text-end text-xs sm:text-sm hidden sm:table-cell text-white border-b border-[#09090B]">
                                      {item?.recordDate?.length !== 0 ? new Date(item?.recordDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                                    </td>
                                    <td class="text-end text-xs sm:text-sm text-white border-b border-[#09090B]">
                                      {item?.paymentDate?.length !== 0 ? new Date(item?.paymentDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                                    </td>
                                  </tr>
                                {/each}
                                </tbody>
                              </table>
                            </div>
                            <span class="text-gray-200 text-sm italic">
                              * Dividend amounts are adjusted for stock splits when applicable.
                            </span>
                            {/if}
      
                        {:else}
                        <h1 class="text-xl m-auto flex justify-center text-gray-200 mb-4 mt-10">
                          No history found
                        </h1>
                        {/if}
      
      

                      {/if}
                    
                  
    
                  </div>
            </div>
        </div>
    
        
    </section>
    
    
    
        
<style>
    .app {
        height: 700px;
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