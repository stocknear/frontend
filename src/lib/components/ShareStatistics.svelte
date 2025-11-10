<script lang 'ts'></script>

<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="shareStatisticsInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
      >
        Share Statistics
      </label>
      <InfoModal
        title={"Share Statistics"}
        content={"Shares outstanding refer to a company's stock currently held by all its shareholders. Floating shares refer to the number of a company's shares that are actively traded and available for public trading on the stock market."}
        id={"shareStatisticsInfo"}
      />
    </div>

    {#if isLoaded}
      {#if Object?.keys(rawData)?.length !== 0}
        {#if rawData?.historicalShares?.length !== 0}
          <div class="mt-2 pb-4 bg-default">
            <div class="w-full flex flex-col items-start">
              <div class="text-white text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                {$displayCompanyName}'s' has
                <span class="font-semibold"
                  >{abbreviateNumber(rawData?.latestOutstandingShares)}</span
                >
                shares outstanding with
                <span class="font-semibold"
                  >{abbreviateNumber(rawData?.latestFloatShares)}</span
                > of those shares currently floating.
              </div>
            </div>

            <div class="app w-full h-[300px] mt-6">
              <Chart {init} options={optionsData} class="chart" />
            </div>

            <div
              class="flex flex-row items-center justify-between mx-auto mt-8 w-full sm:w-11/12"
            >
              <div
                class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center"
              >
                <div
                  class="h-full transform -translate-x-1/2"
                  aria-hidden="true"
                ></div>
                <div
                  class="w-3 h-3 bg-[#5470C6] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2"
                  aria-hidden="true"
                ></div>
                <span
                  class="mt-2 sm:mt-0 text-white text-center sm:text-start text-sm sm:font-semibold inline-block"
                >
                  Floating Shares
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
                  class="w-3 h-3 bg-[#C12F23] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2"
                  aria-hidden="true"
                ></div>
                <span
                  class="mt-2 sm:mt-0 text-white text-sm sm:font-semibold inline-block"
                >
                  Outstanding Shares
                </span>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="mt-5 text-gray-100 text-sm sm:text-[1rem] sm:rounded h-auto border border-gray-600 p-4"
          >
            <svg
              class="w-5 h-5 inline-block mr-0.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              ><path
                fill="#fff"
                d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"
              /></svg
            >
            Historical Shares are not available yet for {$displayCompanyName}
          </div>
        {/if}

        {#if rawData?.sharesShort !== 0}
          <h2
            class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3"
          >
            Short Selling Information
          </h2>
          <span class="text-white">
            The latest short interest is <span class="font-semibold">
              {abbreviateNumber(rawData?.sharesShort)}</span
            >, so
            <span class="font-semibold"
              >{rawData?.shortOutstandingPercent}%</span
            > of the outstanding shares have been sold short.
          </span>

          <div class="flex justify-start items-center w-full m-auto mt-6">
            <table class="w-full" data-test="statistics-table">
              <tbody>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Short Interest</span>
                  </td>
                  <td
                    class="whitespace-nowrap px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {abbreviateNumber(rawData?.sharesShort)}
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Short Previous Month</span>
                  </td>
                  <td
                    class="whitespace-nowrap px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {abbreviateNumber(rawData?.sharesShortPriorMonth)}
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Short % of Shares Out</span>
                  </td>
                  <td
                    class="whitespace-nowrap px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {rawData?.shortOutstandingPercent}%
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-odd">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Short % of Float</span>
                  </td>
                  <td
                    class="whitespace-nowrap px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {rawData?.shortFloatPercent}%
                  </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-secondary">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                    <span>Short Ratio (days to cover)</span>
                  </td>
                  <td
                    class="whitespace-nowrap px-[5px] py-1.5 text-right  xs:px-2.5 xs:py-2"
                  >
                    {rawData?.shortRatio}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
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
  </main>
</section>

<style>
  .app {
    height: 300px;
    max-width: 100%; /* Ensure chart width doesn't exceed the container */
  }

  @media (max-width: 640px) {
    .app {
      height: 230px;
    }
  }

  .chart {
    width: 100%;
  }
</style>
