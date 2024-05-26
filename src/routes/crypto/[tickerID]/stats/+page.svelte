<script lang="ts">

  import ReturnCard from '$lib/components/ReturnCard.svelte'
  import {numberOfUnreadNotification, displayCompanyName, screenWidth, cryptoTicker} from '$lib/store';
  import { abbreviateNumber } from '$lib/utils';
  
  export let data;
  
  
  let quantStats = {};
  let stockQuote;
  
  
  let marketCap = '-';
  let yearHigh = '-';
  let yearLow = '-';
  let dayHigh = '-';
  let dayLow = '-';
  
  let currentPrice = 0;
  let previousClose = '-';
  let volume = '-';
  let eps = '-';
  let pe = '-';
  let alpha = '-';
  let beta = '-';
      
  
// Function to check if a date is today or yesterday, adjusting for weekends
function ongoingDD(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Adjust today to Friday if it's Saturday or Sunday
  if (today.getDay() === 6) { // Saturday
    today.setDate(today.getDate() - 1); // Set to Friday
  } else if (today.getDay() === 0) { // Sunday
    today.setDate(today.getDate() - 2); // Set to Friday
  }

  return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear() ||
          date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear();
}

 
  marketCap = '-';
  yearHigh = '-';
  yearLow = '-';
  dayHigh = '-';
  dayLow = '-';
  
  currentPrice = '-';
  previousClose = '-';
  volume = '-';
  eps = '-';
  pe = '-';
  alpha = '-';
  beta = '-';
  
  stockQuote = data?.getStockQuote;
  quantStats = data?.getQuantStats ?? {};
  
  marketCap = abbreviateNumber(stockQuote?.marketCap);
  volume = abbreviateNumber(stockQuote?.volume);
  currentPrice = stockQuote?.price;
  previousClose = stockQuote?.previousClose;
  eps = stockQuote?.eps;
  pe = stockQuote?.pe;
  
  beta = stockQuote?.beta;
  
  dayLow = stockQuote?.dayLow?.toFixed(2);
  dayHigh = stockQuote?.dayHigh?.toFixed(2);
  yearLow = stockQuote?.yearLow?.toFixed(2);
  yearHigh = stockQuote?.yearHigh?.toFixed(2);
  
  alpha = quantStats[$cryptoTicker?.toUpperCase()]?.Alpha;
  
  /*
  updateDayRange()
  updateYearRange()
  */
  
  </script>
            
  
  <svelte:head>
  
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$cryptoTicker}) Statistics & Valuation Metrics · stocknear
    </title>
    <meta name="description" content={`Detailed statistics for ${$displayCompanyName} (${$cryptoTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$cryptoTicker}) Statistics & Valuation Metrics · stocknear`}/>
    <meta property="og:description" content={`Detailed statistics for ${$displayCompanyName} (${$cryptoTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$cryptoTicker}) Statistics & Valuation Metrics · stocknear`}/>
    <meta name="twitter:description" content={`Detailed statistics for ${$displayCompanyName} (${$cryptoTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
  
  <section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
    <div class="flex justify-center m-auto h-full overflow-hidden w-full">
        <div class="relative flex justify-center items-center overflow-hidden w-full">
              <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                    <div class="mb-6">
                        <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                            Fundamental Data
                        </h2>

  
          <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
            <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
            Get detailed Fundamental insights of {$displayCompanyName} and compare it to the S&P500.
          </div>
  
          {#if Object?.keys(quantStats)?.length !== 0}
          <div class="grid grid-cols-1 gap-2 mt-10">
            
                <div class="flex justify-start items-start w-full m-auto">
                  <table class="table table-sm table-pin-rows table-compact pb-2 text-start flex justify-start items-center w-full px-3 m-auto ">
                      <tbody class="shadow-md">
                      <!-- row 1 -->
                      <tr class="text-white">
                        {#if $screenWidth <= 550}
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium">
                          1-Day Range
                        </td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">
                          <div class="flex flex-col items-start">
                            <div class="flex justify-between w-full mb-1.5">
                              <span class="text-start">{dayLow}</span>
                              <span class="text-end">{dayHigh}</span>
                            </div>
                            <div class="flex justify-center w-full">
                              <progress class="progress [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600 w-full bg-white h-[4px]" min={dayLow} value={currentPrice} max={dayHigh} style="flex-direction: row-reverse" />
                            </div>
                          </div>
                        </td>
                        {:else}
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          1-Day Range
                        </td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">
                          {dayLow}
                        </td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">
                          <!--<span class="text-center flex justify-center items-center ">158.8</span>-->
                          <progress class="progress [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600 bg-white w-[200px] sm:w-full h-[4px]" min={dayLow} value={currentPrice} max={dayHigh} />
                        </td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F] ">
                          {dayHigh}
                        </td>
                        {/if}
                      </tr>
                      <!--2 row -->
                      <tr class="text-white bg-[#0F0F0F]">
                        {#if $screenWidth < 640}
                        <td class="text-start bg-[#0F0F0F] text-white font-medium">
                          1-Year Range
                        </td>
                        <td class="bg-[#0F0F0F]">
                          <div class="flex flex-col items-start">
                            <div class="flex justify-between w-full mb-1.5">
                              <span class="text-start">{yearLow}</span>
                              <span class="text-end">{yearHigh}</span>
                            </div>
                            <div class="flex justify-center w-full">
                              <progress class="progress [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600 bg-white w-[200px] sm:w-full h-[4px]" min={yearLow} value={currentPrice} max={yearHigh} style="flex-direction: row-reverse" />
                            </div>
                          </div>
                        </td>
                        {:else}
                        <td class="text-start bg-[#0F0F0F] text-white font-medium">
                          1-Year Range
                        </td>
                        <td class="bg-[#0F0F0F]">
                          {yearLow}
                        </td>
                        <td class="bg-[#0F0F0F]">
                          <progress class="progress [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600 w-full bg-white h-[4px]" min={yearLow} value={currentPrice} max={yearHigh} />
                        </td>
                        <td class="bg-[#0F0F0F]">
                          {yearHigh}
                        </td>
                        {/if}
                      </tr>
                    </tbody>
                  </table>
                </div>
            
                
  
                <h3 class="text-start ml-2 text-lg sm:text-2xl font-bold text-white mt-5 ">
                  Company Stats
                </h3>
                
          
                <div class="flex justify-start items-center w-full m-auto">
                  <table class="table table-sm table-compact text-start flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                      <!-- row 1 -->
                      <tr class="text-white">
                        <td class="text-start border-b border-[#0F0F0F] bg-[#0F0F0F] text-white font-medium">Market Cap</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]"> ${marketCap}</td>
                        <td class="text-start border-b border-[#0F0F0F] bg-[#0F0F0F] text-white font-medium">Volume</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">{volume}</td>
                      </tr>
                      <!-- row 2 -->
                      <tr class="text-white ">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium">Price</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]" >${currentPrice}</td>
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium">Prev. Close</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">${previousClose}</td>
                      </tr>
                      <!-- row 3 -->
                      
                      <tr class="text-white">
                        <td class="text-start border-b border-[#0F0F0F] bg-[#0F0F0F] text-white font-medium">Alpha</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">
                          {#if typeof alpha !== 'undefined'}
                            {alpha}
                          {:else}
                          -
                          {/if}
                        </td>
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium">Beta</td>
                        <td class="bg-[#0F0F0F] border-b border-[#0F0F0F]">
                          {#if typeof beta !== 'undefined' && !isNaN(beta)}
                            {beta?.toFixed(2)}
                          {:else}
                          -
                          {/if}
                        </td>
                      </tr>
                      
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium">EPS</td>
                        <td class="bg-[#0F0F0F]">{eps ?? '-'}</td>
                        <td class="text-start bg-[#0F0F0F] text-white font-medium">PE</td>
                        <td class="bg-[#0F0F0F]">{pe ?? '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
  
              
  
                {#if $cryptoTicker in quantStats && Object.keys(quantStats[$cryptoTicker]).length > 0}
  
                <h3 class="text-start w-full mt-8 mb-2 text-lg sm:text-2xl font-bold text-white">
                  Worst 10 Drawdowns of {$cryptoTicker}
                </h3>
                <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center m-auto">
                  <thead>
                    <tr class="bg-[#0F0F0F] border-slate-800 rounded shadow-md">
                      <th class="text-start bg-[#0F0F0F] text-white text-sm font-medium w-36 sm:w-56">Started</th>
                      <th class="bg-[#0F0F0F] text-white text-sm font-medium text-end">Recovered</th>
                      <th class="bg-[#0F0F0F] text-white text-sm text-end font-medium">Drawdown</th>
                      <th class="bg-[#0F0F0F] text-white text-sm font-medium text-end ">Days</th>
                    </tr>
                  </thead>
                  <tbody class="shadow-md">
                    {#each quantStats[$cryptoTicker?.toUpperCase()]['Worst 10 Drawdowns'] as item}
                      <tr class="text-white">
                        <td class="text-start border-b border-[#0F0F0F] text-xs sm:text-sm bg-[#0F0F0F] text-white w-36 sm:w-56">
                          {new Date(item['Started']).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                        </td>
                        <td class="border-b border-[#0F0F0F] text-xs sm:text-sm bg-[#0F0F0F] text-white text-end">
                          {#if ongoingDD(item['Recovered']) === true}
                            continuing
                          {:else}
                            {new Date(item['Recovered']).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                          {/if}
                        </td>
                        <td class="text-start border-b border-[#0F0F0F] bg-[#0F0F0F] text-white text-end">
                          {item['Drawdown']?.toFixed(2)}%
                        </td> 
                        <td class="text-end border-b border-[#0F0F0F] bg-[#0F0F0F] text-white">
                          {item['Days']}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
  
                
                <h2 class="text-start ml-2 text-lg sm:text-2xl font-bold text-white mt-8 ">
                  {$cryptoTicker} vs. 
                  S&P500
                </h2>
  
                <p class="ml-2 flex justify-start items-center m-auto text-white ">
                  Comparison of company stats against the S&P500 Index.                                  
                </p>
  
                <span class="ml-2 text-start italic text-xs sm:text-sm text-gray-300 mb-2 sm:mb-5">
                  Time Period between {new Date(quantStats[$cryptoTicker?.toUpperCase()]["Start Period"]).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} 
                  - 
                  {new Date(quantStats[$cryptoTicker?.toUpperCase()]["End Period"]).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                </span>
  
  
                  <ReturnCard quantData={quantStats} />
                
                <div class="ml-2 grid grid-cols-3 gap-10 text-lg font-medium sm:font-medium text-sm sm:text-[1rem]">
                  <span class="text-white ml-1 sm:ml-3 font-bold">
                    Metric
                  </span>
                  <span class="text-white ml-auto">
                    {$cryptoTicker}
                  </span>
                  <span class="text-white text-end mr-3">
                    S&P500
                  </span>
                </div>
  
  
  
  
                <div class="flex flex-col justify-center items-center w-full m-auto">
                  <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center w-full m-auto">
                    <tbody class="shadow-md">
                      <tr class="text-white ">
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium w-36 sm:w-56">
                          Cumulative Return
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Cumulative Return %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Cumulative Return %"]} %
                        </td>
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium">
                          Compound Annual Growth Rate (CAGR)
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["CAGR %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-end text-xs sm:text-sm">
                          {quantStats['SPY']["CAGR %"]}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
  
                  
                  <table class="table table-sm table-compact table-pin-rows w-full mt-4 flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md" >
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium w-36 sm:w-56">
                          Sharpe
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Sharpe"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Sharpe"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium ">
                          Sortino
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Sortino"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Sortino"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-compact table-pin-rows w-full mt-4 flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                      
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white font-medium w-36 sm:w-56">
                          Max Drawdown
                        </td>
                        <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-white text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Max Drawdown"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Max Drawdown"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Longest Drawdown Days
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Longest DD Days"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Longest DD Days"]}
                        </td>  
                      </tr>
                    
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Volatility (ann.)
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Volatility (ann.) %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Volatility (ann.) %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Correlation
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Correlation"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Correlation"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          R^2
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["R^2"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["R^2"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Calmar
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Calmar"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Calmar"]}
                        </td>  
                      </tr>
  
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Skew
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Skew"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Skew"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Kurtosis
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Kurtosis"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Kurtosis"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-pin-rows table-compact mt-4 text-start w-full flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Expected Daily
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Expected Daily %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Expected Daily %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Expected Monthly
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Expected Monthly %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Expected Monthly %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Expected Yearly
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Expected Yearly %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Expected Yearly %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Kelly Criterion
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Kelly Criterion %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Kelly Criterion %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Risk of Ruin
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Risk of Ruin %"]}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Risk of Ruin %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Daily Value-at-Risk
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Daily Value-at-Risk %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Daily Value-at-Risk %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F]">
                          Expected Shortfall (cVaR)
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Expected Shortfall (cVaR) %"]?.toFixed(2)}%
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-pin-rows table-compact text-start mt-4 w-full flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                        <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F] w-36 sm:w-56">
                          Max Consecutive Wins
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Max Consecutive Wins"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Max Consecutive Wins"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white font-medium border-b border-[#0F0F0F] w-36 sm:w-56">
                          Max Consecutive Losses
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Max Consecutive Losses"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Max Consecutive Losses"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Gain/Pain Ratio
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Gain/Pain Ratio"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Gain/Pain Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
                      
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Gain/Pain (1M)
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Gain/Pain (1M)"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Gain/Pain (1M)"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Payoff Ratio
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Payoff Ratio"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Payoff Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Profit Factor
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Profit Factor"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Profit Factor"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Outlier Win Ratio
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Outlier Win Ratio"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Outlier Win Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Outlier Loss Ratio
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Outlier Loss Ratio"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Outlier Loss Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-pin-rows table-compact text-start mt-4 w-full flex justify-start items-center w-full px-3 m-auto">    
                    <tbody class="shadow-md">
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          MTD
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["MTD %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["MTD %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          3M
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["3M %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["3M %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          6M
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["6M %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["6M %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          YTD
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["YTD %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["YTD %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          1Y
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["1Y %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["1Y %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          3Y (ann.)
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["3Y (ann.) %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["3Y (ann.) %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-pin-rows table-compact text-start mt-4 w-full flex justify-start items-center w-full px-3 m-auto">  
                    <tbody class="shadow-md">
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Best Day
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Best Day %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Best Day %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Worst Day
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Worst Day %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Best Month
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Best Month %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Best Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Worst Month
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Worst Month %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Worst Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Best Year
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Best Year %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Best Year %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Worst Year
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Worst Year %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Worst Year %"]?.toFixed(2)}%
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
  
                  <table class="table table-sm table-pin-rows table-compact mt-4 w-full flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Avg. Drawdown
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Avg. Drawdown"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Avg. Drawdown"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Avg. Drawdown Days
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Avg. Drawdown Days"]}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Avg. Drawdown Days"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Recovery Factor
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Recovery Factor"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Recovery Factor"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Ulcer Index
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Ulcer Index"]?.toFixed(2)}
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Ulcer Index"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
                  <table class="table table-sm table-pin-rows table-compact text-start w-full mt-4 flex justify-start items-center w-full px-3 m-auto">
                    <tbody class="shadow-md">
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium w-36 sm:w-56">
                          Avg. Up Month
                        </td>
                        <td class="bg-[#0F0F0F] text-white text-start border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Avg. Up Month %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Avg. Up Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Avg. Down Month
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Avg. Down Month %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Avg. Down Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Win Days
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Win Days %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Win Days %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Win Month
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Win Month %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Win Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Win Quarter
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Win Quarter %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Win Quarter %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white">
                        <td class="text-start bg-[#0F0F0F] text-white border-b border-[#0F0F0F] font-medium ">
                          Win Year
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats[$cryptoTicker?.toUpperCase()]["Win Year %"]?.toFixed(2)}%
                        </td>
                        <td class="bg-[#0F0F0F] text-white border-b border-[#0F0F0F] text-end text-xs sm:text-sm">
                          {quantStats['SPY']["Win Year %"]?.toFixed(2)}%
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
                </div>
  
              
                {:else}
  
                <h1 class="m-auto mt-10 text-slate-400 text-2xl font-medium">
                  <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
                </h1>
                {/if}
  
                
          </div>
          {:else}
            <h2 class=" mt-16 flex justify-center items-center text-3xl font-medium text-slate-700 mb-5 m-auto">
              No data available
          </h2>
          {/if}
          
        </div>
      </div>
      </section>