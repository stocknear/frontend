<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber } from "$lib/utils";

  export let optionsFlowList;
</script>

<section class="text-gray-700 dark:text-zinc-200">
  <a
    href="/options-flow"
    class="inline-flex items-center gap-1 text-gray-900 dark:text-white group"
    ><h2
      class="mb-2 text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
    >
      Unusual Options Orders
    </h2>
    <svg
      class="h-5 w-5 text-gray-400 dark:text-zinc-500 transition group-hover:text-gray-700 dark:group-hover:text-zinc-200"
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
  {#if optionsFlowList?.length > 0}
    <table
      class="w-full text-sm sm:text-[0.95rem] border-t border-gray-300 dark:border-zinc-700"
    >
      <thead>
        <tr
          class="text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-500"
        >
          <th class="py-2 text-left font-semibold">Symbol</th>
          <th class="py-2 text-left font-semibold">Prem</th>
          <th class="py-2 text-left font-semibold">Strike</th>
          <th class="py-2 text-left font-semibold">C/P</th>
          <th class="py-2 text-left font-semibold">Type</th>
        </tr>
      </thead>
      <tbody>
        {#each optionsFlowList as item}
          <tr class="border-b border-gray-300 dark:border-zinc-700">
            <td class="py-3 text-left whitespace-nowrap">
              <a
                href={`/${item?.underlying_type === "stock" ? "stocks" : "etf"}/${item?.ticker}/options/unusual-activity`}
                class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400"
                >{item?.ticker}</a
              >
            </td>
            <td class="py-3 text-left text-gray-600 dark:text-zinc-300">
              {abbreviateNumber(item?.cost_basis)}
            </td>
            <td class="py-3 text-left text-gray-600 dark:text-zinc-300">
              {item?.strike_price}
            </td>
            <td class="py-3 text-left">
              {#if item?.put_call === "Calls"}
                <span
                  class="text-emerald-600 dark:text-emerald-400 font-semibold"
                  >{item?.put_call}</span
                >
              {:else}
                <span class="text-rose-600 dark:text-rose-400 font-semibold"
                  >{item?.put_call}
                </span>
              {/if}
            </td>
            <td class="py-3 text-left text-gray-600 dark:text-zinc-300">
              {item?.option_activity_type}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Infobox text="Currently, no unusual options flow data available." />
  {/if}
</section>
