<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";

  export let userTier;
  export let rawData;

  let xData = [];

  let tableRevenue = [];
  let tableRevenueEst = [];
  let tableRevenueSurprise = [];
  let tableEPS = [];
  let tableEPSEst = [];
  let tableEPSSurprise = [];
  let tableVolatility = [];

  let averageVolatility = 0;
  let positiveRevenueSurprisePercentage = 0;
  let positiveEpsSurprisePercentage = 0;

  function prepareDataset() {
    xData = rawData?.map(({ year, quarter }) => {
      const shortYear = String(year).slice(2); // Get the last two digits of the year
      return `${quarter} '${shortYear}`;
    });

    tableRevenue = rawData?.map(({ revenue }) => revenue);
    tableRevenueEst = rawData?.map(({ revenueEst }) => revenueEst);
    tableRevenueSurprise = rawData?.map(
      ({ revenueSurprisePercent }) => revenueSurprisePercent,
    );

    tableEPS = rawData?.map(({ eps }) => eps);
    tableEPSEst = rawData?.map(({ epsEst }) => epsEst);
    tableEPSSurprise = rawData?.map(
      ({ epsSurprisePercent }) => epsSurprisePercent,
    );

    tableVolatility = rawData?.map(({ volatility }) => volatility);

    averageVolatility =
      rawData?.length > 0
        ? rawData.reduce((sum, item) => sum + (item?.volatility || 0), 0) /
          rawData?.length
        : 0;

    const countPositiveRevenueSurprise = rawData?.filter(
      (data) => data.revenueSurprisePercent > 0,
    )?.length;
    const countPositiveEpsSurprise = rawData.filter(
      (data) => data.epsSurprisePercent > 0,
    ).length;

    const totalDataCount = rawData?.length;

    positiveRevenueSurprisePercentage = Math.ceil(
      (countPositiveRevenueSurprise / totalDataCount) * 100,
    );
    positiveEpsSurprisePercentage = Math.ceil(
      (countPositiveEpsSurprise / totalDataCount) * 100,
    );
  }

  $: {
    if ($stockTicker) {
      prepareDataset();
    }
  }
</script>

<section class="overflow-hidden text-white h-full pb-8 sm:pb-2">
  <main class="overflow-hidden">
    <div class="w-full m-auto">
      {#if rawData?.length !== 0}
        <span class="">
          The average price volatility over this 3-day period is
          {#if userTier !== "Pro"}
            ... Unlock content with
            <a
              class="inline-block ml-0.5 text-blue-400 sm:hover:text-white"
              href="/pricing"
              >Pro Subscription <svg
                class="w-4 h-4 mb-1 inline-block text[#A3A3A3] sm:hover:text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                /></svg
              ></a
            >
          {:else}
            <span class="font-bold">±{averageVolatility?.toFixed(2)}%</span>.
            During this period, the reported revenue exceeded expectations
            <span class="font-bold">{positiveRevenueSurprisePercentage}%</span>
            of the time & the reported EPS surpassed analyst estimates
            <span class="font-bold">{positiveEpsSurprisePercentage}%</span> of the
            time.
          {/if}
        </span>
        <div
          class=" flex justify-start items-center w-screen sm:w-full mt-3 m-auto overflow-x-auto pr-5 sm:pr-0"
        >
          <table
            class="table table-sm table-pin-cols table-compact rounded-none sm:rounded w-full bg-table border border-gray-800"
          >
            <thead class="">
              <tr class="">
                <th
                  class="bg-primary border-b border-[#000] text-white font-semibold text-sm text-start"
                  >FY Date</th
                >
                {#each xData as item}
                  <td
                    class="z-20 bg-primary border-b border-[#000] text-white font-semibold text-sm text-end bg-default"
                    >{item}</td
                  >
                {/each}
              </tr>
            </thead>
            <tbody class="shadow">
              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Reported Revenue
                </th>
                {#each tableRevenue as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span>{@html abbreviateNumber(item, false, true)}</span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      {@html abbreviateNumber(item, false, true)}
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Est. Revenue
                </th>
                {#each tableRevenueEst as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span>{@html abbreviateNumber(item, false, true)}</span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      {@html abbreviateNumber(item, false, true)}
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Revenue Surprise
                </th>
                {#each tableRevenueSurprise as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end font-semibold bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap font-normal"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span
                          class={item > 0
                            ? "text-[#00FC50] before:content-['+']"
                            : item < 0
                              ? "text-[#FF2F1F]"
                              : ""}
                        >
                          {abbreviateNumber(item)}%
                        </span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      <span
                        class={item > 0
                          ? "text-[#00FC50] before:content-['+']"
                          : item < 0
                            ? "text-[#FF2F1F]"
                            : ""}
                      >
                        {abbreviateNumber(item)}%
                      </span>
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Reported EPS
                </th>
                {#each tableEPS as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span>{abbreviateNumber(item)}</span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      {abbreviateNumber(item)}
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Est. EPS
                </th>
                {#each tableEPSEst as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span>{abbreviateNumber(item)}</span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      {abbreviateNumber(item)}
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  EPS Surprise
                </th>
                {#each tableEPSSurprise as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end font-semibold bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap font-normal"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        <span
                          class={item > 0
                            ? "text-[#00FC50] before:content-['+']"
                            : item < 0
                              ? "text-[#FF2F1F]"
                              : ""}
                        >
                          {abbreviateNumber(item)}%
                        </span>
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      <span
                        class={item > 0
                          ? "text-[#00FC50] before:content-['+']"
                          : item < 0
                            ? "text-[#FF2F1F]"
                            : ""}
                      >
                        {abbreviateNumber(item)}%
                      </span>
                    {/if}
                  </td>
                {/each}
              </tr>

              <tr class="bg-primary border-b-[#27272A]">
                <th
                  class="bg-primary whitespace-nowrap text-sm sm:text-[1rem] text-white text-start border-b border-[#27272A]"
                >
                  Volatility
                </th>
                {#each tableVolatility as item, index}
                  <td
                    class="text-white text-sm sm:text-[1rem] text-end font-semibold bg-default"
                  >
                    {#if index !== 0}
                      {#if userTier !== "Pro"}
                        <a
                          class="inline-block ml-0.5 text-white whitespace-nowrap font-normal"
                          href="/pricing"
                        >
                          Pro
                          <svg
                            class="w-4 h-4 ml-0.5 mb-1 inline-block text-[#A3A3A3]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            />
                          </svg>
                        </a>
                      {:else if item !== undefined && item !== null}
                        ±{abbreviateNumber(item)}%
                      {:else}
                        n/a
                      {/if}
                    {:else}
                      ±{abbreviateNumber(item)}%
                    {/if}
                  </td>
                {/each}
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </main>
</section>
