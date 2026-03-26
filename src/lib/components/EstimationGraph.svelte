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

  const thisYear = new Date().getFullYear() % 100;
</script>

{#if graphType !== "growth"}
  <div class="shadow">
    <h2 class="mb-2 text-xl font-bold">{title} Forecast</h2>
    <div class="p-2">
      <div class="relative w-full">
        {#if config !== null}
          <div use:highcharts={config}></div>
        {/if}
        {#if !["Pro", "Plus"]?.includes(userTier)}
          {@const lockedPct = Math.min(
            (2 / (tableDataList?.length || 1)) * 100,
            60,
          )}
          <div
            class="absolute top-0 right-0 bottom-0 rounded-r-lg"
            style="width: {lockedPct}%; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);"
          >
            <div
              class="absolute inset-0 bg-white/30 dark:bg-zinc-950/30 rounded-r-lg pointer-events-none"
            ></div>
            <a
              href="/pricing"
              class="absolute inset-0 flex items-center justify-center z-10"
            >
              <div
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/90 dark:bg-[#131315] border border-gray-300 dark:border-gray-700 shadow-lg cursor-pointer hover:scale-105"
              >
                <svg
                  class="w-4 h-4 text-muted dark:text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span
                  class="text-[9px] font-semibold text-muted dark:text-white"
                  >Upgrade</span
                >
              </div>
            </a>
          </div>
        {/if}
      </div>
      <div class="mt-3 overflow-x-auto p-0 text-center sm:p-0.5 lg:mt-3.5">
        <table class="w-full text-right">
          <thead
            ><tr
              class="border-b border-gray-300 dark:border-zinc-700 align-bottom font-normal"
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
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
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
                        >
                      </a>
                    {:else}
                      {abbreviateNumber(item?.val)}
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
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
                        >
                      </a>
                    {:else}
                      {abbreviateNumber(item?.val)}
                    {/if}
                  {/if}
                </td>
              {/each}
            </tr><tr
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
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
                        >
                      </a>
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
      <div class="relative w-full">
        {#if config !== null}
          <div use:highcharts={config}></div>
        {/if}
        {#if !["Pro", "Plus"]?.includes(userTier)}
          {@const lockedPct = Math.min(
            (2 / (tableDataList?.length || 1)) * 100,
            60,
          )}
          <div
            class="absolute top-0 right-0 bottom-0 rounded-r-lg"
            style="width: {lockedPct}%; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);"
          >
            <div
              class="absolute inset-0 bg-white/30 dark:bg-zinc-950/30 rounded-r-lg pointer-events-none"
            ></div>
            <a
              href="/pricing"
              class="absolute inset-0 flex items-center justify-center z-10"
            >
              <div
                class="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/90 dark:bg-[#131315] border border-gray-300 dark:border-gray-700 shadow-lg cursor-pointer hover:scale-105"
              >
                <svg
                  class="w-4 h-4 text-muted dark:text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span
                  class="text-[9px] font-semibold text-muted dark:text-white"
                  >Upgrade</span
                >
              </div>
            </a>
          </div>
        {/if}
      </div>
      <div class="mt-3 overflow-x-auto p-0 text-center sm:p-0.5 lg:mt-3.5">
        <table class="w-full text-right">
          <thead
            ><tr
              class="border-b border-gray-300 dark:border-zinc-700 align-bottom font-normal whitespace-nowrap"
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
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
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
                        >
                      </a>
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-800 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-800 dark:text-rose-400"
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
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
              ><td class="whitespace-nowrap px-1 py-[3px] text-left">Avg</td>
              {#each avgGrowthList?.filter((item) => item?.FY >= thisYear) as item, index}
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
                        >
                      </a>
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-800 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-800 dark:text-rose-400"
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
              class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
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
                        >
                      </a>
                    {:else}
                      <span
                        class={item?.growth !== null && item?.growth > 0
                          ? "text-emerald-800 dark:text-emerald-400 before:content-['+']"
                          : item?.growth < 0
                            ? "text-rose-800 dark:text-rose-400"
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
