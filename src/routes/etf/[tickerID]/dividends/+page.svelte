<script lang="ts">
  import {numberOfUnreadNotification, displayCompanyName, etfTicker} from '$lib/store';
  import Chart from '$lib/components/Chart.svelte'
  
  
  export let data;
  
  let dateDistance;
  
  
  
  let currentPrice;
  let eps;
          
  let stockDividends = [];
  let optionsDividend;
      
      
    
  let exDividendDate = 'n/a';
  let dividendYield = 'n/a';
  let annualDividend = 'n/a';
  let payoutFrequency = 'n/a';
  let payoutRatio = 'n/a';
  let dividendGrowth = 'n/a';
      
      
      
      let mode = false;
      
      
      function toggleMode() {
          mode = !mode;
      }
              
      
      export const sortDividendsByDate = (dividends) => {
          return dividends.sort(function(a, b) {
            return new Date(a.date) - new Date(b.date);
          });
        }
      
      function plotDividend() {
          
        let dateList = [];
        let dividendList = [];
        let growthList = [];
        let copyData = structuredClone(stockDividends);
        const reverseData = sortDividendsByDate(copyData);
      
        for (let i = 0; i < reverseData?.length; i++) {
            const currentDividend = reverseData[i]?.dividend;
            const previousDividend = i === 0 ? 0 : reverseData[i - 1]?.dividend;
      
            dateList.push(reverseData[i]?.paymentDate);
            dividendList.push(currentDividend);
      
      
            if (currentDividend !== null && previousDividend !== null && previousDividend !== 0) {
                const growthRate = (((currentDividend - previousDividend) / previousDividend) * 100 )?.toFixed(2);
                growthList.push(growthRate);
            } else {
                growthList.push(0); // Pushing null if the growth calculation is not possible
            }
      
            
        }
      
          
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
  
  
  
  
  const output = data?.getStockDividend;
  stockDividends = output[0];
  eps = output[1]
  currentPrice = output[2]
  
  if(stockDividends?.length !== 0)
  {
      payoutFrequency =  stockDividends?.filter(entry => entry.date.includes('2022'))?.length;
      const amount = stockDividends[0]?.adjDividend;
      annualDividend = amount * payoutFrequency 
      dividendYield = ((annualDividend / currentPrice )*100)?.toFixed(2)
      exDividendDate = stockDividends[0]?.date
      payoutRatio = ((1 - ( eps - annualDividend)/eps)*100)?.toFixed(2)
  
      const previousIndex = stockDividends?.findIndex(entry => entry.date.includes('2022'));
  
      const previousAnnualDividend = stockDividends[previousIndex]?.adjDividend * payoutFrequency;
  
      dividendGrowth= (( (annualDividend - previousAnnualDividend) / previousAnnualDividend ) *100)?.toFixed(2);
  
      optionsDividend = plotDividend()
      
      //Check if the last dividend is older than 12 months
      dateDistance = new Date(stockDividends?.at(0)?.date) < new Date(new Date().setFullYear(new Date().getFullYear() - 1)) ? true : false;
  }      
  
  
  
  
  </script>
  
   
  <svelte:head>
  
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$etfTicker}) Dividend History, Dates & Yield · stocknear
    </title>
  
    <meta name="description" content={`Get the latest dividend data for ${$displayCompanyName} (${$etfTicker}) stock price quote with breaking news, financials, statistics, charts and more.`}>
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$etfTicker}) Dividend History, Dates & Yield · stocknear`}/>
    <meta property="og:description" content={`Get the latest dividend data for ${$displayCompanyName} (${$etfTicker}), including dividend history, yield, key dates, growth and other metrics.`} />
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) Dividend History, Dates & Yield · stocknear`}/>
    <meta name="twitter:description" content={`Get the latest dividend data for ${$displayCompanyName} (${$etfTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
            
      <section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0">
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
                                      ${annualDividend?.toFixed(2)}
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
        
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-5 bg-[#202020] shadow-md rounded-xl p-5 flex justify-center items-center mb-2">
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
                              ${annualDividend !== '0.00' ? annualDividend?.toFixed(2) : '0'}
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
                              <div class="app w-full ">
                                <Chart options={optionsDividend} class="chart" />
                              </div>
        
                              <span class="text-gray-200 text-sm italic">
                                * Dividend amounts are adjusted for stock splits when applicable.
                              </span>
                            
                            {:else}
                            
                              <div class="flex justify-start items-center w-full m-auto shadow-md rounded-none sm:rounded-lg mb-4">
                                <table class="table table-sm table-compact flex justify-start items-center w-full m-auto">
                                  <thead>
                                    <tr class="bg-[#0F0F0F] border-b-slate-600 shadow-md">
                                      <th class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white text-sm font-semibold">
                                        Ex-Divid. Date
                                      </th>
                                      <th class="text-end bg-[#0F0F0F] border-b border-[#0F0F0F] text-white text-sm font-semibold">
                                        Cash Amount
                                      </th>
                                      <th class="text-end bg-[#0F0F0F] border-b border-[#0F0F0F] hidden sm:table-cell text-white text-sm font-semibold">
                                        Record Date
                                      </th>
                                      <th class="text-end bg-[#0F0F0F] border-b border-[#0F0F0F] text-white text-sm font-semibold">
                                        Pay Date
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody class="">
                                    {#each stockDividends as item}
                                    <tr class="text-gray-200 odd:bg-[#202020]">
                                      <td class="text-start text-xs sm:text-sm text-white font-medium border-b border-[#0F0F0F]">
                                        {new Date(item?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                      </td>
                                      <td class="text-end text-xs sm:text-sm text-white border-b border-[#0F0F0F]">
                                        ${item?.adjDividend?.toFixed(2)}
                                      </td>
                                      <td class="text-end text-xs sm:text-sm hidden sm:table-cell text-white border-b border-[#0F0F0F]">
                                        {item?.recordDate?.length !== 0 ? new Date(item?.recordDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                                      </td>
                                      <td class="text-end text-xs sm:text-sm text-white border-b border-[#0F0F0F]">
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