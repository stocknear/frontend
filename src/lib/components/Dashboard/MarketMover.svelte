<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";

  export let marketStatus = 0;
  export let gainersList = [];
  export let losersList = [];
  export let charNumber = 30;
</script>

<section
  class="mx-auto flex flex-col space-y-6 px-3 xs:px-4 sm:px-5 text-gray-700 dark:text-zinc-200 lg:max-w-[1200px] lg:flex-row lg:justify-evenly lg:space-x-10 lg:space-y-0 xl:space-x-12 xxxl:space-x-14"
>
  <div class="grow">
    <div class="mb-2 flex flex-row items-end justify-between">
      <a
        class="inline-flex items-center gap-1 text-gray-900 dark:text-white group"
        href={`/market-mover/${marketStatus === 0 ? "gainers" : marketStatus === 1 ? "premarket/gainers" : "afterhours/gainers"}`}
        ><h2
          class="mb-0.5 text-lg sm:text-xl font-semibold tracking-tight transition sm:group-hover:underline sm:group-hover:underline-offset-4 group-hover:text-violet-600 dark:group-hover:text-violet-400"
        >
          {marketStatus === 0
            ? "Top"
            : marketStatus === 1
              ? "Pre-Market"
              : "Afterhours"} Gainers
        </h2>
        <svg
          class="h-5 w-5 text-gray-400 dark:text-zinc-500 transition group-hover:text-violet-500 dark:group-hover:text-violet-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path></svg
        ></a
      >
    </div>
    {#if gainersList?.length > 0}
      <div
        class="overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40"
      >
        <table class="w-full text-sm sm:text-[0.95rem]">
          <thead>
            <tr
              class="text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-500"
            >
              <th class="py-2.5 px-3 sm:px-4 text-left font-semibold">
                Symbol
              </th>
              <th
                class="py-2.5 px-3 sm:px-4 text-left font-semibold lg:max-w-[210px] lg:truncate xxxl:max-w-[250px]"
              >
                Name
              </th>
              <th class="py-2.5 px-3 sm:px-4 text-right font-semibold">
                Price
              </th>
              <th class="py-2.5 px-3 sm:px-4 text-right font-semibold">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {#each gainersList as item}
              <tr class="border-t border-gray-200/70 dark:border-zinc-800/80">
                <td class="py-3 px-3 sm:px-4 text-left">
                  <a
                    href={`/stocks/${item?.symbol}`}
                    class="font-semibold text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
                    >{item?.symbol}</a
                  >
                </td>
                <td
                  class="py-3 px-3 sm:px-4 text-gray-600 dark:text-zinc-300 lg:max-w-[210px] lg:truncate xxxl:max-w-[250px]"
                >
                  {removeCompanyStrings(item?.name)?.length > charNumber
                    ? removeCompanyStrings(item?.name)?.slice(0, charNumber) +
                      "..."
                    : removeCompanyStrings(item?.name)}
                </td>
                <td
                  class="py-3 px-3 sm:px-4 text-right tabular-nums text-gray-600 dark:text-zinc-300"
                >
                  ${item?.price?.toFixed(2)}
                </td>
                <td class="py-3 px-3 sm:px-4 text-right tabular-nums">
                  {#if item?.changesPercentage >= 0}
                    <span class="text-emerald-600 dark:text-emerald-400"
                      >+{item?.changesPercentage >= 1000
                        ? abbreviateNumber(item?.changesPercentage)
                        : item?.changesPercentage?.toFixed(2)}%</span
                    >
                  {:else}
                    <span class="text-rose-600 dark:text-rose-400"
                      >{item?.changesPercentage <= -1000
                        ? abbreviateNumber(item?.changesPercentage)
                        : item?.changesPercentage?.toFixed(2)}%
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <Infobox text="Currently, no market gainers data is available." />
    {/if}
  </div>
  <div class="grow">
    <div class="mb-2 flex flex-row items-end justify-between">
      <a
        class="inline-flex items-center gap-1 text-gray-900 dark:text-white group"
        href={`/market-mover/${marketStatus === 0 ? "losers" : marketStatus === 1 ? "premarket/losers" : "afterhours/losers"}`}
        ><h2
          class="mb-0.5 text-lg sm:text-xl font-semibold tracking-tight transition sm:group-hover:underline sm:group-hover:underline-offset-4 group-hover:text-violet-600 dark:group-hover:text-violet-400"
        >
          {marketStatus === 0
            ? "Top"
            : marketStatus === 1
              ? "Pre-Market"
              : "Afterhours"} Losers
        </h2>
        <svg
          class="h-5 w-5 text-gray-400 dark:text-zinc-500 transition group-hover:text-violet-500 dark:group-hover:text-violet-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path></svg
        ></a
      >
    </div>
    {#if losersList?.length > 0}
      <div
        class="overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40"
      >
        <table class="w-full text-sm sm:text-[0.95rem]">
          <thead>
            <tr
              class="text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-500"
            >
              <th class="py-2.5 px-3 sm:px-4 text-left font-semibold">
                Symbol
              </th>
              <th
                class="py-2.5 px-3 sm:px-4 text-left font-semibold lg:max-w-[210px] lg:truncate xxxl:max-w-[250px]"
              >
                Name
              </th>
              <th class="py-2.5 px-3 sm:px-4 text-right font-semibold">
                Price
              </th>
              <th class="py-2.5 px-3 sm:px-4 text-right font-semibold">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {#each losersList as item}
              <tr class="border-t border-gray-200/70 dark:border-zinc-800/80">
                <td class="py-3 px-3 sm:px-4 text-left">
                  <a
                    href={`/stocks/${item?.symbol}`}
                    class="font-semibold text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
                    >{item?.symbol}</a
                  >
                </td>
                <td
                  class="py-3 px-3 sm:px-4 text-gray-600 dark:text-zinc-300 lg:max-w-[210px] lg:truncate xxxl:max-w-[250px]"
                >
                  {removeCompanyStrings(item?.name)?.length > charNumber
                    ? removeCompanyStrings(item?.name)?.slice(0, charNumber) +
                      "..."
                    : removeCompanyStrings(item?.name)}
                </td>
                <td
                  class="py-3 px-3 sm:px-4 text-right tabular-nums text-gray-600 dark:text-zinc-300"
                >
                  ${item?.price ? item?.price?.toFixed(2) : item?.price}
                </td>
                <td class="py-3 px-3 sm:px-4 text-right tabular-nums">
                  {#if item?.changesPercentage >= 0}
                    <span class="text-emerald-600 dark:text-emerald-400"
                      >+{item?.changesPercentage >= 1000
                        ? abbreviateNumber(item?.changesPercentage)
                        : item?.changesPercentage?.toFixed(2)}%</span
                    >
                  {:else}
                    <span class="text-rose-600 dark:text-rose-400"
                      >{item?.changesPercentage <= -1000
                        ? abbreviateNumber(item?.changesPercentage)
                        : item?.changesPercentage?.toFixed(2)}%
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <Infobox text="Currently, no market loser data is available." />
    {/if}
  </div>
</section>
