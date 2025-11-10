<script lang 'ts'></script>

<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="impliedVolatilityInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
      >
        Implied Volatility
      </label>
      <InfoModal
        title={"Implied Volatility"}
        content={"An implied volatility of XY% means the market expects significant price fluctuations for the stock, with an annualized potential range of ±XY% from its current price. This indicates high uncertainty and risk, leading to more expensive options but doesn't predict price direction."}
        id={"impliedVolatilityInfo"}
      />
    </div>

    {#if data?.user?.tier === "Pro"}
      {#if isLoaded}
        {#if rawData?.length !== 0}
          <div class="w-full flex flex-col items-start mb-2">
            <div class="text-white text-[1rem] mt-2 mb-2 w-full">
              Based on the past 12 months of historical data, {$displayCompanyName}
              has an IV Rank of <span class="font-semibold">{ivRank}%</span>,
              with the current implied volatility standing at
              <span class="font-semibold"
                >{rawData?.slice(-1)?.at(0)?.iv60}%</span
              >.
            </div>
          </div>

          <select
            class="mt-5 mb-5 sm:mb-0 sm:mt-3 ml-1 w-44 select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-secondary"
            on:change={changeStatement}
          >
            <option disabled>Choose IV Period</option>
            <option selected value="iv60"> 60 Day IV </option>
            <option value="iv90"> 90 Day IV </option>
            <option value="252dclshv"> 1 Year historical volatility </option>
          </select>

          <div class="pb-2 rounded bg-default">
            <div class="app w-full h-[300px] mt-5">
              <Chart {init} options={optionsData} class="chart" />
            </div>
          </div>

          <div
            class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12"
          >
            <div
              class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center"
            >
              <div
                class="h-full transform -translate-x-1/2"
                aria-hidden="true"
              ></div>
              <div
                class="w-3 h-3 bg-[#fff] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2"
                aria-hidden="true"
              ></div>
              <span
                class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block"
              >
                Price
              </span>
            </div>
            <div
              class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center"
            >
              <div
                class="h-full transform -translate-x-1/2"
                aria-hidden="true"
              ></div>
              <div
                class="w-3 h-3 bg-[#F03500] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2"
                aria-hidden="true"
              ></div>
              <span
                class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm: inline-block"
              >
                Implied Volatility
              </span>
            </div>

            <div
              class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center"
            >
              <div
                class="h-full transform -translate-x-1/2"
                aria-hidden="true"
              ></div>
              <div
                class="w-3 h-3 bg-[#3B82F6] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2"
                aria-hidden="true"
              ></div>
              <span
                class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm: inline-block"
              >
                Realized Volatility
              </span>
            </div>
          </div>

          <h2
            class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3"
          >
            Latest Information
          </h2>

          <div class="flex justify-start items-center w-full m-auto">
            <table class="w-full" data-test="statistics-table">
              <tbody>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Date</span>
                  </td>
                  <td
                    class="px-[5px] py-1.5 text-right text-sm sm:text-[1rem]  xs:px-2.5 xs:py-2"
                  >
                    {formatDateRange(rawData?.slice(-1)?.at(0)?.date)}
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>IV Range</span>
                  </td>
                  <td
                    class="px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {lowestIV + "%" + "-" + highestIV + "%"}
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>RV Range</span>
                  </td>
                  <td
                    class="px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {lowestRV + "%" + "-" + highestRV + "%"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
      {:else}
        <div class="flex justify-center items-center h-80">
           <div class="relative">
                    <label
                      class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    >
                      <span
                        class="loading loading-spinner loading-md text-white dark:text-white"
                      ></span>
                    </label>
                  </div>
        </div>
      {/if}
    {:else}
      <div
        class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold"
      >
        <svg
          class="mr-1.5 w-5 h-5 inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="#A3A3A3"
            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
          /></svg
        >
        Unlock content with
        <a
          class="inline-block ml-2 text-blue-400 sm:hover:text-white"
          href="/pricing">Pro Subscription</a
        >
      </div>
    {/if}
  </main>
</section>

<style>
  .app {
    height: 300px;
    max-width: 100%; /* Ensure chart width doesn't exceed the container */
  }

  @media (max-width: 640px) {
    .app {
      height: 210px;
    }
  }

  .chart {
    width: 100%;
  }
</style>
