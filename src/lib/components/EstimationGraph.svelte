<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber, computeGrowthSingleList } from "$lib/utils";

  export let userTier;
  export let title;
  export let config;
  export let tableDataList;
  export let highDataList;
  export let avgDataList;
  export let lowDataList;

  export let avgGrowthList = [];
  export let graphType = null;
</script>

{#if graphType !== "growth"}
  <div class="shadow">
    <h2 class="mb-2 text-xl font-bold">{title} Forecast</h2>
    <div class="p-2">
      <div class="w-full">
        {#if config !== null}
          <div use:highcharts={config}></div>
        {/if}
      </div>
      <div class="mt-3 overflow-x-auto p-0 text-center sm:p-0.5 lg:mt-3.5">
        <table class="w-full text-right">
          <thead
            ><tr
              class="border-b border-gray-300 dark:border-gray-800 align-bottom font-normal"
              ><th class="p-1 text-left font-semibold text-sm sm:text-[1rem]"
                >{title}</th
              >
              {#each tableDataList as date, index}
                <th class="p-1 font-semibold text-sm sm:text-[1rem]">
                  {#if index !== 0}{date}{/if}</th
                >
              {/each}
            </tr></thead
          >
          <tbody
            ><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">High</td>
              {#each highDataList as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= highDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      {abbreviateNumber(item?.val)}
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">Avg</td>
              {#each avgDataList as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= avgDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      {abbreviateNumber(item?.val)}
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">Low</td>
              {#each lowDataList as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= lowDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      {abbreviateNumber(item?.val)}
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr></tbody
          >
        </table>
      </div>
    </div>
  </div>
{:else}
  <div class="shadow">
    <h2 class="mb-2 text-xl font-bold">{title}</h2>
    <div class="p-2">
      <div class="w-full">
        {#if config !== null}
          <div use:highcharts={config}></div>
        {/if}
      </div>
      <div class="mt-3 overflow-x-auto p-0 text-center sm:p-0.5 lg:mt-3.5">
        <table class="w-full text-right">
          <thead
            ><tr
              class="border-b border-gray-300 dark:border-gray-800 align-bottom font-normal whitespace-nowrap"
              ><th class="p-1 text-left font-semibold text-sm sm:text-[1rem]"
                >{title}</th
              >
              {#each tableDataList as date, index}
                <th class="p-1 font-semibold text-sm sm:text-[1rem]"
                  >{#if index !== 0}{date}{/if}</th
                >
              {/each}
            </tr></thead
          >
          <tbody
            ><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">High</td>
              {#each computeGrowthSingleList(highDataList, avgDataList) as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= highDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-600 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : ""}
                      >
                        {item?.growth !== null && Math.abs(item?.growth - 0) > 0
                          ? abbreviateNumber(item?.growth) + "%"
                          : "-"}
                      </span>
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">Avg</td>
              {#each avgGrowthList?.filter((item) => item.FY >= 25) as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= avgDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-600 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : ""}
                      >
                        {item?.growth !== null && Math.abs(item?.growth - 0) > 0
                          ? abbreviateNumber(item?.growth) + "%"
                          : "-"}
                      </span>
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-gray-800 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">Low</td>
              {#each computeGrowthSingleList(lowDataList, avgDataList) as item, index}
                <td class="px-1 py-[3px] text-sm sm:text-[1rem]">
                  {#if index !== 0}
                    {#if !["Pro", "Plus"]?.includes(userTier) && index >= lowDataList?.length - 2}
                      <a class="inline-block ml-0.5" href="/pricing"
                        >Upgrade<svg
                          class="w-4 h-4 ml-0.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        ></a
                      >
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-600 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : ""}
                      >
                        {item?.growth !== null && Math.abs(item?.growth - 0) > 0
                          ? abbreviateNumber(item?.growth) + "%"
                          : "-"}
                      </span>
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr></tbody
          >
        </table>
      </div>
    </div>
  </div>
{/if}
