<script lang="ts">
  import Lazy from "$lib/components/Lazy.svelte";
  import ReturnCard from "$lib/components/ReturnCard.svelte";
  import { numberOfUnreadNotification, displayCompanyName, screenWidth, stockTicker, revenueSegmentationComponent } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import RevenueSegmentation from "$lib/components/RevenueSegmentation.svelte";

  export let data;

  let quantStats = {};


  // Function to check if a date is today or yesterday, adjusting for weekends
  function ongoingDD(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Adjust today to Friday if it's Saturday or Sunday
    if (today.getDay() === 6) {
      // Saturday
      today.setDate(today.getDate() - 1); // Set to Friday
    } else if (today.getDay() === 0) {
      // Sunday
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
        


  quantStats = data?.getQuantStats ?? {};



  /*
updateDayRange()
updateYearRange()
*/
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ""}
    {$displayCompanyName} ({$stockTicker}) Statistics & Valuation Metrics · stocknear
  </title>
  <meta name="description" content={`Detailed statistics for ${$displayCompanyName} (${$stockTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />

  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Statistics & Valuation Metrics · stocknear`} />
  <meta property="og:description" content={`Detailed statistics for ${$displayCompanyName} (${$stockTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
  <meta property="og:type" content="website" />
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Statistics & Valuation Metrics · stocknear`} />
  <meta name="twitter:description" content={`Detailed statistics for ${$displayCompanyName} (${$stockTicker}) stock, including valuation, metrics, financial numbers, share information and more.`} />
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

<section class="text-white w-full">
  <div class="sm:p-7 m-auto">
    <div class="mb-6">
      <h1 class="text-2xl sm:text-3xl text-white font-bold mb-5">Fundamental Data</h1>

      <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
        <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
          ><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16" /></svg
        >
        Get detailed Fundamental insights of {$displayCompanyName} and compare it to the S&P500.
      </div>

      {#if Object?.keys(quantStats)?.length !== 0}
        <!--Start Widget-->
        <div class="w-full mt-5 mb-5 flex justify-center items-center">
          <div class="w-full grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-y-3 gap-x-3">
            <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#09090B] border border-gray-800 rounded-lg h-auto">
              <div class="flex flex-col items-center w-full p-3">
                <span class="font-medium text-white text-xl font-semibold">YTD Return</span>
                <div class="grid grid-cols-3 w-full mt-2">
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">{$stockTicker}</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats[$stockTicker?.toUpperCase()]["YTD %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["YTD %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats[$stockTicker?.toUpperCase()]["YTD %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                  <div class="text-center text-white">vs.</div>
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">SPY</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats["SPY"]["YTD %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["YTD %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats["SPY"]["YTD %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#09090B] border border-gray-800 rounded-lg h-auto">
              <div class="flex flex-col items-center w-full p-3">
                <span class="font-medium text-white text-xl font-semibold">1-Year Return</span>
                <div class="grid grid-cols-3 w-full mt-2">
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">{$stockTicker}</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats[$stockTicker?.toUpperCase()]["1Y %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["1Y %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats[$stockTicker?.toUpperCase()]["1Y %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                  <div class="text-center text-white">vs.</div>
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">SPY</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats["SPY"]["1Y %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["1Y %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats["SPY"]["1Y %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#09090B] border border-gray-800 rounded-lg h-auto">
              <div class="flex flex-col items-center w-full p-3">
                <span class="font-medium text-white text-xl font-semibold">3-Year Return</span>
                <div class="grid grid-cols-3 w-full mt-2">
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">{$stockTicker}</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats[$stockTicker?.toUpperCase()]["3Y (ann.) %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["3Y (ann.) %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats[$stockTicker?.toUpperCase()]["3Y (ann.) %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                  <div class="text-center text-white">vs.</div>
                  <div class="flex flex-col items-center">
                    <span class="text-center text-white font-semibold">SPY</span>
                    <span class="text-center text-[1rem] sm:text-lg font-semibold mt-1">
                      {#if quantStats["SPY"]["3Y (ann.) %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["3Y (ann.) %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#F71F4F]">{quantStats["SPY"]["3Y (ann.) %"]?.toFixed(2)}% </span>
                      {/if}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!--End Widget-->

        <!--Start RevenueSegmentation-->
        <Lazy>
          <div class="w-full pt-10 sm:pb-6 sm:pt-6 m-auto {!$revenueSegmentationComponent ? 'hidden' : ''}">
              <RevenueSegmentation apiURL={data?.apiURL} apiKey={data?.apiKey} userTier={data?.user?.tier} />
          </div>
        </Lazy>
        <!--End RevenueSegmentation-->

        <div class="grid grid-cols-1 gap-2 mt-10">
          
             

          {#if $stockTicker in quantStats && Object.keys(quantStats[$stockTicker]).length > 0}
            <h3 class="text-start w-full mb-2 text-lg sm:text-2xl font-bold text-white">
              Worst 10 Drawdowns of {$stockTicker}
            </h3>
            <div class="w-full overflow-x-scroll">
              <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center m-auto">
                <thead>
                  <tr class="bg-[#09090B] border-slate-800 rounded text-white font-semibold">
                    <th class="text-start text-sm sm:text-[1rem]">Started</th>
                    <th class="text-sm sm:text-[1rem] text-end">Recovered</th>
                    <th class="text-sm sm:text-[1rem] text-end">Drawdown</th>
                    <th class="text-sm sm:text-[1rem] text-end">Days</th>
                  </tr>
                </thead>
                <tbody class="shadow-md">
                  {#each quantStats[$stockTicker?.toUpperCase()]["Worst 10 Drawdowns"] as item}
                    <tr class="text-white border-y border-gray-800 odd:bg-[#27272A]">
                      <td class="text-start text-sm sm:text-[1rem] text-white whitespace-nowrap">
                        {new Date(item["Started"]).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", daySuffix: "2-digit" })}
                      </td>
                      <td class="text-sm sm:text-[1rem] text-white text-end whitespace-nowrap">
                        {#if ongoingDD(item["Recovered"]) === true}
                          continuing
                        {:else}
                          {new Date(item["Recovered"]).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", daySuffix: "2-digit" })}
                        {/if}
                      </td>
                      <td class="text-start font-semibold text-white text-end text-sm sm:text-[1rem]">
                        {item["Drawdown"]?.toFixed(2)}%
                      </td>
                      <td class="text-end font-semibold text-white text-sm sm:text-[1rem]">
                        {item["Days"]}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <h2 class="text-start ml-2 text-lg sm:text-2xl font-bold text-white mt-8">
              {$stockTicker} vs. S&P500
            </h2>

            <p class="ml-2 text-[1rem] flex justify-start items-center m-auto text-white">Comparison of company stats against the S&P500 Index.</p>

            <span class="ml-2 text-start italic text-sm text-gray-300 mt-5 mb-2 sm:mb-5">
              Time Period between {new Date(quantStats[$stockTicker?.toUpperCase()]["Start Period"]).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", daySuffix: "2-digit" })}
              -
              {new Date(quantStats[$stockTicker?.toUpperCase()]["End Period"]).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", daySuffix: "2-digit" })}
            </span>

            <ReturnCard quantData={quantStats} />

            <div class="flex flex-col justify-center items-center w-full m-auto overflow-x-scroll no-scrollbar">
              <table class="table table-sm table-pin-rows table-compact text-start w-full flex justify-start items-center w-full m-auto">
                <thead>
                  <tr class="bg-[#09090B] text-white text-sm">
                    <th class="text-start text-sm sm:text-[1rem] font-semibold"> Metric </th>
                    <th class="text-end bg-[#09090B] text-sm sm:text-[1rem] font-semibold">
                      {$stockTicker}
                    </th>
                    <th class="text-end text-sm sm:text-[1rem] font-semibold"> S&P500 </th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Cumulative Return </td>
                    <td class="text-white text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Cumulative Return %"] >= 0}
                        <span class="text-[#22C55E]">+{abbreviateNumber(quantStats[$stockTicker?.toUpperCase()]["Cumulative Return %"])}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{abbreviateNumber(quantStats[$stockTicker?.toUpperCase()]["Cumulative Return %"])}% </span>
                      {/if}
                    </td>
                    <td class="text-white text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Cumulative Return %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Cumulative Return %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Cumulative Return %"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Compound Annual Growth Rate (CAGR) </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["CAGR %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["CAGR %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["CAGR %"]}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["CAGR %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["CAGR %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["CAGR %"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Sharpe </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Sharpe"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Sharpe"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A]">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Sortino </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Sortino"]?.toFixed(2)}
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Sortino"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Max Drawdown </td>
                    <td class="text-start text-white text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Max Drawdown"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Max Drawdown"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Max Drawdown"]}% </span>
                      {/if}
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Max Drawdown"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Max Drawdown"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Max Drawdown"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Longest Drawdown Days </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Longest DD Days"]}
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Longest DD Days"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Volatility (ann.) </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Volatility (ann.) %"]}%
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Volatility (ann.) %"]}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Correlation </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Correlation"]}%
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Correlation"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> R^2 </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["R^2"]}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["R^2"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Calmar </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Calmar"]}
                    </td>
                    <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Calmar"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Skew </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Skew"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Skew"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Kurtosis </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Kurtosis"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Kurtosis"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-starttext-sm sm:text-[1rem] whitespace-nowrap"> Expected Daily </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Expected Daily %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Expected Daily %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Expected Daily %"]}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Expected Daily %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Expected Daily %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Expected Daily %"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Expected Monthly </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Expected Monthly %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Expected Monthly %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Expected Monthly %"]}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Expected Monthly %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Expected Monthly %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Expected Monthly %"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Expected Yearly </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Expected Yearly %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Expected Yearly %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Expected Yearly %"]}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Expected Yearly %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Expected Yearly %"]}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Expected Yearly %"]}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Kelly Criterion </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Kelly Criterion %"]}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Kelly Criterion %"]}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Risk of Ruin </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Risk of Ruin %"]}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Risk of Ruin %"]}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Daily Value-at-Risk </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Daily Value-at-Risk %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Daily Value-at-Risk %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Daily Value-at-Risk %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Daily Value-at-Risk %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Daily Value-at-Risk %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Daily Value-at-Risk %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Expected Shortfall (cVaR) </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Expected Shortfall (cVaR) %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Expected Shortfall (cVaR) %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Expected Shortfall (cVaR) %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Expected Shortfall (cVaR) %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Max Consecutive Wins </td>
                    <td class="text-start text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Max Consecutive Wins"]}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Max Consecutive Wins"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-white text-sm sm:text-[1rem] whitespace-nowrap"> Max Consecutive Losses </td>
                    <td class="text-start text-end text-sm sm:text-[1rem]">
                      {quantStats[$stockTicker?.toUpperCase()]["Max Consecutive Losses"]}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Max Consecutive Losses"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-starttext-sm sm:text-[1rem] whitespace-nowrap"> Gain/Pain Ratio </td>
                    <td class="text-start text-end text-sm sm:text-[1rem]">
                      {quantStats[$stockTicker?.toUpperCase()]["Gain/Pain Ratio"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Gain/Pain Ratio"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Gain/Pain (1M) </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Gain/Pain (1M)"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Gain/Pain (1M)"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Payoff Ratio </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Payoff Ratio"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Payoff Ratio"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Profit Factor </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Profit Factor"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Profit Factor"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Outlier Win Ratio </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Outlier Win Ratio"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Outlier Win Ratio"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Outlier Loss Ratio </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Outlier Loss Ratio"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Outlier Loss Ratio"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> MTD </td>
                    <td class="text-start text-end text-sm sm:text-[1rem]">
                      {#if quantStats[$stockTicker?.toUpperCase()]["MTD %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["MTD %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["MTD %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["MTD %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["MTD %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["MTD %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> 3M </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["3M %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["3M %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["3M %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["3M %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["3M %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["3M %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> 6M </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["6M %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["6M %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["6M %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["6M %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["6M %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["6M %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-starttext-sm sm:text-[1rem] whitespace-nowrap"> Best Day </td>
                    <td class="text-start text-end text-sm">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Best Day %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Best Day %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Best Day %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Best Day %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Best Day %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Best Day %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Worst Day </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Worst Day %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Worst Day %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Worst Day %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Worst Day %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Worst Day %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Best Month </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Best Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Best Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Best Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Best Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Best Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Best Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Worst Month </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Worst Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Worst Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Worst Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Worst Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Worst Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Worst Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Best Year </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Best Year %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Best Year %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Best Year %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Best Year %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Best Year %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Best Year %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Worst Year </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Worst Year %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Worst Year %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Worst Year %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Worst Year %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Worst Year %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Worst Year %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Avg. Drawdown </td>
                    <td class="text-start text-end ttext-sm sm:text-[1rem]">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Avg. Drawdown"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Avg. Drawdown"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Avg. Drawdown"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Avg. Drawdown"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Avg. Drawdown"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Avg. Drawdown"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Avg. Drawdown Days </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Avg. Drawdown Days"]}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Avg. Drawdown Days"]}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Recovery Factor </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Recovery Factor"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Recovery Factor"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Ulcer Index </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Ulcer Index"]?.toFixed(2)}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Ulcer Index"]?.toFixed(2)}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Avg. Up Month </td>
                    <td class="text-start text-end text-sm sm:text-[1rem]">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Avg. Up Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Avg. Up Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Avg. Up Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Avg. Up Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Avg. Up Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Avg. Up Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Avg. Down Month </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats[$stockTicker?.toUpperCase()]["Avg. Down Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats[$stockTicker?.toUpperCase()]["Avg. Down Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats[$stockTicker?.toUpperCase()]["Avg. Down Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {#if quantStats["SPY"]["Avg. Down Month %"] >= 0}
                        <span class="text-[#22C55E]">+{quantStats["SPY"]["Avg. Down Month %"]?.toFixed(2)}%</span>
                      {:else}
                        <span class="text-[#FF2F1F]">{quantStats["SPY"]["Avg. Down Month %"]?.toFixed(2)}% </span>
                      {/if}
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Win Days </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Win Days %"]?.toFixed(2)}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Win Days %"]?.toFixed(2)}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Win Month </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Win Month %"]?.toFixed(2)}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Win Month %"]?.toFixed(2)}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Win Quarter </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Win Quarter %"]?.toFixed(2)}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Win Quarter %"]?.toFixed(2)}%
                    </td>
                  </tr>

                  <tr class="text-white odd:bg-[#27272A] font-semibold">
                    <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap"> Win Year </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats[$stockTicker?.toUpperCase()]["Win Year %"]?.toFixed(2)}%
                    </td>
                    <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
                      {quantStats["SPY"]["Win Year %"]?.toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          {:else}
            <h1 class="m-auto mt-10 text-slate-400 text-2xl">
              <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                ><path
                  fill="#334155"
                  d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"
                /></svg
              >
            </h1>
          {/if}
        </div>
      {:else}
        <h2 class=" mt-16 flex justify-center items-center text-3xl font-medium text-slate-700 mb-5 m-auto">No data available</h2>
      {/if}
    </div>
  </div>
</section>
