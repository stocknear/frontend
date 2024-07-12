<script lang="ts">

  import ReturnCard from '$lib/components/ReturnCard.svelte'
  import {numberOfUnreadNotification, displayCompanyName, screenWidth, etfTicker} from '$lib/store';
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
  
  /*
  let progressDayPriceValue = 0;
  let progressYearPriceValue = 0;
  let totalDuration = 500;
             
  async function updateDayRange() {
  
  const interval = 10; // interval between each update in ms
  const increment = (currentPrice / (totalDuration / interval));
  
  if (progressDayPriceValue < currentPrice) {
      progressDayPriceValue = progressDayPriceValue + increment;
      setTimeout(updateDayRange, interval);
  }
  };
  
  
  async function updateYearRange() {
  
  const interval = 10; // interval between each update in ms
  const increment = (currentPrice / (totalDuration / interval));
  
  if (progressYearPriceValue < currentPrice) {
      progressYearPriceValue = progressYearPriceValue + increment;
      setTimeout(updateYearRange, interval);
  }
  };
          
  */
          
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
  
  alpha = quantStats[$etfTicker?.toUpperCase()]?.Alpha;
  
  /*
  updateDayRange()
  updateYearRange()
  */
  
  </script>
            
  
  <svelte:head>
  
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$etfTicker}) Statistics & Valuation Metrics · stocknear
    </title>
    <meta name="description" content={`Detailed statistics for ${$displayCompanyName} (${$etfTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$etfTicker}) Statistics & Valuation Metrics · stocknear`}/>
    <meta property="og:description" content={`Detailed statistics for ${$displayCompanyName} (${$etfTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) Statistics & Valuation Metrics · stocknear`}/>
    <meta name="twitter:description" content={`Detailed statistics for ${$displayCompanyName} (${$etfTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
  
  <section class="text-white w-full">
    <div class="sm:pl-7 m-auto pt-5">
      <div class="mb-6">
          <h1 class="text-2xl sm:text-3xl text-white font-bold mb-5">
            Fundamental Data
          </h1>
  
          <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
            <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
            Get detailed Fundamental insights of {$displayCompanyName} and compare it to the S&P500.
          </div>
  
          {#if Object?.keys(quantStats)?.length !== 0}
          <div class="grid grid-cols-1 gap-2 mt-10">
            
                <div class="flex justify-start items-start w-full m-auto">
                  <table class="table table-sm table-pin-rows table-compact pb-2 text-start flex justify-start items-center w-full px-3 m-auto ">
                      <tbody class="shadow-md">
                      <!-- row 1 -->
                      <tr class="text-white ">
                        {#if $screenWidth <= 550}
                        <td class="text-start text-white font-medium">
                          1-Day Range
                        </td>
                        <td class="bg-[#0F0F0F]">
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
                        <td class="text-start text-white font-medium">
                          1-Day Range
                        </td>
                        <td class="bg-[#0F0F0F]">
                          {dayLow}
                        </td>
                        <td class="bg-[#0F0F0F]">
                          <!--<span class="text-center flex justify-center items-center ">158.8</span>-->
                          <progress class="progress [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600 bg-white w-[200px] sm:w-full h-[4px]" min={dayLow} value={currentPrice} max={dayHigh} />
                        </td>
                        <td class="bg-[#0F0F0F] ">
                          {dayHigh}
                        </td>
                        {/if}
                      </tr>
                      <!--2 row -->
                      <tr class="text-white bg-[#0F0F0F]">
                        {#if $screenWidth < 640}
                        <td class="text-start text-white font-medium">
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
                        <td class="text-start text-white font-medium">
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
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">Mkt Cap</td>
                        <td class="text-end"> ${marketCap}</td>
                        <td class="text-end text-white ">Volume</td>
                        <td class="text-end">{volume}</td>
                      </tr>
                      <!-- row 2 -->
                      <tr class="text-white odd:bg-[#202020] ">
                        <td class="text-start">Price</td>
                        <td class="text-end" >${currentPrice}</td>
                        <td class="text-end text-white ">Prev. Close</td>
                        <td class="text-end">${previousClose}</td>
                      </tr>
                      <!-- row 3 -->
                      
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">Alpha</td>
                        <td class="text-end">
                          {typeof alpha !== 'undefined' ? alpha : '-'}
                        </td>
                        <td class="text-end text-white">Beta</td>
                        <td class="text-end">
                          {typeof beta !== 'undefined' && !isNaN(beta) ? beta?.toFixed(2) : '-'}
                        </td>
                      </tr>
                      
  
                      <tr class="text-white font-semibold">
                        <td class="text-start">EPS</td>
                        <td class="text-sm text-end">{eps}</td>
                        <td class="text-end">PE</td>
                        <td class="text-sm text-end">{pe}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
  
              
  
                {#if $etfTicker in quantStats && Object.keys(quantStats[$etfTicker]).length > 0}
  
                <h3 class="text-start w-full mt-8 mb-2 text-lg sm:text-2xl font-bold text-white">
                  Worst 10 Drawdowns of {$etfTicker}
                </h3>
                <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center m-auto">
                  <thead>
                    <tr class="bg-[#0F0F0F] border-slate-800 rounded text-white font-semibold">
                      <th class="text-start text-sm w-36 sm:w-56">Started</th>
                      <th class="text-sm text-end">Recovered</th>
                      <th class="text-sm text-end">Drawdown</th>
                      <th class="text-sm text-end ">Days</th>
                    </tr>
                  </thead>
                  <tbody class="shadow-md">
                    {#each quantStats[$etfTicker?.toUpperCase()]['Worst 10 Drawdowns'] as item}
                      <tr class="text-white border-y border-gray-800 odd:bg-[#202020]">
                        <td class="text-start text-sm text-white w-36 sm:w-56">
                          {new Date(item['Started']).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                        </td>
                        <td class="text-sm  text-white text-end">
                          {#if ongoingDD(item['Recovered']) === true}
                          continuing
                          {:else}
                          {new Date(item['Recovered']).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                          {/if}
                        </td>
                        <td class="text-start font-semibold text-white text-end">
                          {item['Drawdown']?.toFixed(2)}%
                        </td> 
                        <td class="text-end font-semibold text-white">
                          {item['Days']}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
  
                
                <h2 class="text-start ml-2 text-lg sm:text-2xl font-bold text-white mt-8 ">
                  {$etfTicker} vs. 
                  S&P500
                </h2>
  
                <p class="ml-2 flex justify-start items-center m-auto text-white ">
                  Comparison of company stats against the S&P500 Index.                                  
                </p>
  
                <span class="ml-2 text-start italic text-sm text-gray-300 mb-2 sm:mb-5">
                  Time Period between {new Date(quantStats[$etfTicker?.toUpperCase()]["Start Period"]).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} 
                  - 
                  {new Date(quantStats[$etfTicker?.toUpperCase()]["End Period"]).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                </span>
  
  
                <ReturnCard quantData={quantStats} />
                
  
  
                <div class="flex flex-col justify-center items-center w-full m-auto">
                  <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center w-full m-auto">
                    <thead>
                      <tr class="bg-[#0F0F0F] text-white text-sm font-medium">
                        <th class="text-start">
                          Metric
                        </th>
                        <th class="text-end bg-[#0F0F0F]">
                          {$etfTicker}
                        </th>
                        <th class="text-end">
                          S&P500
                        </th>
                      </tr>
                    </thead>
                    <tbody class="shadow-md">
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white  w-36 sm:w-56">
                          Cumulative Return
                        </td>
                        <td class="text-white text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Cumulative Return %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Cumulative Return %"]}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Cumulative Return %"]}% </span> 
                        {/if}
                        </td>
                        <td class="text-white text-end text-sm">
                        {#if quantStats['SPY']["Cumulative Return %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Cumulative Return %"]}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Cumulative Return %"]}% </span> 
                        {/if}
                        </td>
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start">
                          Compound Annual Growth Rate (CAGR)
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["CAGR %"] >=0}
                          <span class="text-[#10DB06]">+{quantStats[$etfTicker?.toUpperCase()]["CAGR %"]}%</span>
                        {:else}
                          <span class="text-[#FF2F1F]">{quantStats[$etfTicker?.toUpperCase()]["CAGR %"]}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["CAGR %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["CAGR %"]}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["CAGR %"]}% </span> 
                        {/if}
                        </td>
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start   w-36 sm:w-56">
                          Sharpe
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Sharpe"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Sharpe"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] ">
                        <td class="text-start  ">
                          Sortino
                        </td>
                        <td class=" text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Sortino"]?.toFixed(2)}
                        </td>
                        <td class=" text-end text-sm">
                          {quantStats['SPY']["Sortino"]?.toFixed(2)}
                        </td>  
                      </tr>
                      
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start text-white  w-36 sm:w-56">
                            Max Drawdown
                          </td>
                          <td class="text-start text-white text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Max Drawdown"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Max Drawdown"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Max Drawdown"]}% </span> 
                          {/if}
                          </td>
                          <td class=" text-end text-sm">
                            {#if quantStats['SPY']["Max Drawdown"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats['SPY']["Max Drawdown"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats['SPY']["Max Drawdown"]}% </span> 
                          {/if}
                          </td>  
                        </tr>
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start   ">
                            Longest Drawdown Days
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Longest DD Days"]}
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats['SPY']["Longest DD Days"]}
                          </td>  
                        </tr>
                      
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start   w-36 sm:w-56">
                            Volatility (ann.)
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Volatility (ann.) %"]}%
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats['SPY']["Volatility (ann.) %"]}%
                          </td>  
                        </tr>
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start   w-36 sm:w-56">
                            Correlation
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Correlation"]}%
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats['SPY']["Correlation"]}
                          </td>  
                        </tr>
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start text-white ">
                            R^2
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["R^2"]}
                          </td>
                          <td class="text-end text-sm">
                            {quantStats['SPY']["R^2"]}
                          </td>  
                        </tr>
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start text-white  ">
                            Calmar
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Calmar"]}
                          </td>
                          <td class=" text-end text-sm">
                            {quantStats['SPY']["Calmar"]}
                          </td>  
                        </tr>
    
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start text-white  ">
                            Skew
                          </td>
                          <td class="text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Skew"]?.toFixed(2)}
                          </td>
                          <td class="text-end text-sm">
                            {quantStats['SPY']["Skew"]?.toFixed(2)}
                          </td>  
                        </tr>
    
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                          <td class="text-start text-white  ">
                            Kurtosis
                          </td>
                          <td class="text-end text-sm">
                            {quantStats[$etfTicker?.toUpperCase()]["Kurtosis"]?.toFixed(2)}
                          </td>
                          <td class="text-end text-sm">
                            {quantStats['SPY']["Kurtosis"]?.toFixed(2)}
                          </td>  
                        </tr>
                          
  
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          Expected Daily
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Expected Daily %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Expected Daily %"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Expected Daily %"]}% </span> 
                          {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Expected Daily %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats['SPY']["Expected Daily %"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats['SPY']["Expected Daily %"]}% </span> 
                          {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">
                          Expected Monthly
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Expected Monthly %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Expected Monthly %"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Expected Monthly %"]}% </span> 
                          {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Expected Monthly %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats['SPY']["Expected Monthly %"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats['SPY']["Expected Monthly %"]}% </span> 
                          {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">
                          Expected Yearly
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Expected Yearly %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Expected Yearly %"]}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Expected Yearly %"]}% </span> 
                          {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Expected Yearly %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Expected Yearly %"]}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Expected Yearly %"]}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">
                          Kelly Criterion
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Kelly Criterion %"]}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Kelly Criterion %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">
                          Risk of Ruin
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Risk of Ruin %"]}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Risk of Ruin %"]}%
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Daily Value-at-Risk
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Daily Value-at-Risk %"] >=0}
                            <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Daily Value-at-Risk %"]?.toFixed(2)}%</span>
                          {:else}
                            <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Daily Value-at-Risk %"]?.toFixed(2)}% </span> 
                          {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Daily Value-at-Risk %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Daily Value-at-Risk %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Daily Value-at-Risk %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white ">
                          Expected Shortfall (cVaR)
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Expected Shortfall (cVaR) %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Expected Shortfall (cVaR) %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Expected Shortfall (cVaR) %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
                        
  
                        <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white  w-36 sm:w-56">
                          Max Consecutive Wins
                        </td>
                        <td class="text-start text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Max Consecutive Wins"]}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Max Consecutive Wins"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start text-white  w-36 sm:w-56">
                          Max Consecutive Losses
                        </td>
                        <td class="text-start text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Max Consecutive Losses"]}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Max Consecutive Losses"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          Gain/Pain Ratio
                        </td>
                        <td class="text-start text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Gain/Pain Ratio"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Gain/Pain Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
                      
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Gain/Pain (1M)
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Gain/Pain (1M)"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Gain/Pain (1M)"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Payoff Ratio
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Payoff Ratio"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Payoff Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Profit Factor
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Profit Factor"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Profit Factor"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Outlier Win Ratio
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Outlier Win Ratio"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Outlier Win Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Outlier Loss Ratio
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Outlier Loss Ratio"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Outlier Loss Ratio"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          MTD
                        </td>
                        <td class="text-start text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["MTD %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["MTD %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["MTD %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["MTD %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["MTD %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["MTD %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          3M
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["3M %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["3M %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["3M %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["3M %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["3M %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["3M %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          6M
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["6M %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["6M %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["6M %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["6M %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["6M %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["6M %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          YTD
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["YTD %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["YTD %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["YTD %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["YTD %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["YTD %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["YTD %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          1Y
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["1Y %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["1Y %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["1Y %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["1Y %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["1Y %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["1Y %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          3Y (ann.)
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["3Y (ann.) %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["3Y (ann.) %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["3Y (ann.) %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["3Y (ann.) %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["3Y (ann.) %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["3Y (ann.) %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          Best Day
                        </td>
                        <td class="text-start text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Best Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Best Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Best Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Best Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Best Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Best Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Worst Day
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Worst Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Worst Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Worst Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Worst Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Best Month
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Worst Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Worst Day %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Worst Day %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Worst Day %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Worst Month
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats[$etfTicker?.toUpperCase()]["Worst Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Worst Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Worst Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Worst Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Worst Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Worst Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Best Year
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Best Year %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Best Year %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Best Year %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Best Year %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Best Year %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Best Year %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Worst Year
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Worst Year %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Worst Year %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Worst Year %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                          {#if quantStats['SPY']["Worst Year %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Worst Year %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Worst Year %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
                        
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          Avg. Drawdown
                        </td>
                        <td class="text-start text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Avg. Drawdown"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Avg. Drawdown"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Avg. Drawdown"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Avg. Drawdown"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Avg. Drawdown"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Avg. Drawdown"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Avg. Drawdown Days
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Avg. Drawdown Days"]}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Avg. Drawdown Days"]}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Recovery Factor
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Recovery Factor"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Recovery Factor"]?.toFixed(2)}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Ulcer Index
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Ulcer Index"]?.toFixed(2)}
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Ulcer Index"]?.toFixed(2)}
                        </td>  
                      </tr>
                        
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  w-36 sm:w-56">
                          Avg. Up Month
                        </td>
                        <td class="text-start text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Avg. Up Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Avg. Up Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Avg. Up Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Avg. Up Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Avg. Up Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Avg. Up Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Avg. Down Month
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats[$etfTicker?.toUpperCase()]["Avg. Down Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats[$etfTicker?.toUpperCase()]["Avg. Down Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats[$etfTicker?.toUpperCase()]["Avg. Down Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>
                        <td class="text-end text-sm">
                        {#if quantStats['SPY']["Avg. Down Month %"] >=0}
                          <span class="text-[#10DB06] ">+{quantStats['SPY']["Avg. Down Month %"]?.toFixed(2)}%</span>
                        {:else}
                          <span class="text-[#FF2F1F] ">{quantStats['SPY']["Avg. Down Month %"]?.toFixed(2)}% </span> 
                        {/if}
                        </td>  
                      </tr>
  
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Win Days
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Win Days %"]?.toFixed(2)}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Win Days %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Win Month
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Win Month %"]?.toFixed(2)}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Win Month %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Win Quarter
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Win Quarter %"]?.toFixed(2)}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Win Quarter %"]?.toFixed(2)}%
                        </td>  
                      </tr>
  
                      <tr class="text-white odd:bg-[#202020] font-semibold">
                        <td class="text-start  ">
                          Win Year
                        </td>
                        <td class="text-end text-sm">
                          {quantStats[$etfTicker?.toUpperCase()]["Win Year %"]?.toFixed(2)}%
                        </td>
                        <td class="text-end text-sm">
                          {quantStats['SPY']["Win Year %"]?.toFixed(2)}%
                        </td>  
                      </tr>
                        
                    </tbody>
                  </table>
  
                </div>
  
              
                {:else}
  
                <h1 class="m-auto mt-10 text-slate-400 text-2xl ">
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
  </section>