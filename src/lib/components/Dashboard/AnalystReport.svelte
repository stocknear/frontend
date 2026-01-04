<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";

  export let analystReport;
</script>

<section class="mx-auto lg:col-span-2 w-full text-gray-700 dark:text-zinc-200">
  <h2
    class="mb-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
  >
    Analyst Insight Report
  </h2>

  {#if Object?.keys(analystReport)?.length > 0}
    <div
      class="text-sm sm:text-base leading-6 text-gray-600 dark:text-zinc-300"
    >
      {analystReport?.insight}
    </div>

    <div class="mt-4 text-sm text-gray-700 dark:text-zinc-200">
      According to {analystReport?.numOfAnalyst} analyst ratings, the average rating
      for
      <a
        href={`/stocks/${analystReport?.symbol}/forecast`}
        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400"
        >{analystReport?.symbol}</a
      >
      is
      <strong class="text-gray-900 dark:text-white"
        >"{analystReport?.consensusRating}"</strong
      >. The 12-month stock price forecast is
      <strong class="text-gray-900 dark:text-white"
        >${analystReport?.highPriceTarget}</strong
      >, an {analystReport?.highPriceChange > 0 ? "increase" : "decrease"} of
      <strong
        class={analystReport?.highPriceChange > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"}
        >{Math.abs(analystReport?.highPriceChange ?? 0)}%</strong
      >
      from the latest price.
    </div>

    <table class="w-full text-right text-sm sm:text-base mt-5">
      <thead>
        <tr
          class="border-b border-gray-200 dark:border-zinc-800/80 text-gray-500 dark:text-zinc-500"
        >
          <th
            class="py-2 text-left font-semibold uppercase tracking-widest text-xs"
          >
            Target
          </th>
          <th class="font-semibold uppercase tracking-widest text-xs">Low</th>
          <th class="font-semibold uppercase tracking-widest text-xs">Avg</th>
          <th class="font-semibold uppercase tracking-widest text-xs">Median</th
          >
          <th class="font-semibold uppercase tracking-widest text-xs">High</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-200 dark:border-zinc-800/80">
          <td
            class="py-2 text-left font-semibold text-gray-700 dark:text-zinc-200"
          >
            Price
          </td>
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.lowPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.avgPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.medianPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.highPriceTarget}</td
          >
        </tr>
        <tr>
          <td
            class="py-2 text-left font-semibold text-gray-700 dark:text-zinc-200"
          >
            Change
          </td>
          <td
            class={analystReport?.lowPriceChange > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-rose-600 dark:text-rose-400 font-semibold"}
          >
            {analystReport?.lowPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.avgPriceChange > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-rose-600 dark:text-rose-400 font-semibold"}
          >
            {analystReport?.avgPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.medianPriceChange > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-rose-600 dark:text-rose-400 font-semibold"}
          >
            {analystReport?.medianPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.highPriceChange > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-rose-600 dark:text-rose-400 font-semibold"}
          >
            {analystReport?.highPriceChange ?? "0"}%
          </td>
        </tr>
      </tbody>
    </table>
  {:else}
    <Infobox text="Currently, there are no new analyst reports available." />
  {/if}
</section>
