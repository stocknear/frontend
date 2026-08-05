<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    dashboard_analyst_report_change_prefix,
    dashboard_analyst_report_change_suffix,
    dashboard_analyst_report_empty,
    dashboard_analyst_report_forecast_prefix,
    dashboard_analyst_report_prefix,
    dashboard_analyst_report_rating,
    dashboard_analyst_report_row_change,
    dashboard_analyst_report_row_price,
    dashboard_analyst_report_table_avg,
    dashboard_analyst_report_table_high,
    dashboard_analyst_report_table_low,
    dashboard_analyst_report_table_median,
    dashboard_analyst_report_table_target,
    dashboard_analyst_report_title,
    dashboard_direction_decrease,
    dashboard_direction_increase,
  } from "$lib/paraglide/messages.js";

  export let analystReport;

  $: changeDirection =
    analystReport?.highPriceChange > 0
      ? dashboard_direction_increase()
      : dashboard_direction_decrease();
</script>

<section class="mx-auto lg:col-span-2 w-full text-fg">
  <h2
    class="mb-2 type-h2 text-fg tracking-tight text-fg"
  >
    {dashboard_analyst_report_title()}
  </h2>

  {#if Object?.keys(analystReport)?.length > 0}
    <div class="text-sm sm:text-base leading-6 text-fg-muted">
      {analystReport?.insight}
    </div>

    <div class="mt-4 text-sm text-fg">
      {dashboard_analyst_report_prefix({
        count: analystReport?.numOfAnalyst,
      })}
      <a
        href={`/stocks/${analystReport?.symbol}/forecast`}
        class="font-medium text-fg transition-colors hover:text-accent"
        >{analystReport?.symbol}</a
      >
      {dashboard_analyst_report_rating({
        rating: analystReport?.consensusRating,
      })}
      {dashboard_analyst_report_forecast_prefix()}
      <strong class="text-fg"
        >${analystReport?.highPriceTarget}</strong
      >, {dashboard_analyst_report_change_prefix({
        direction: changeDirection,
      })}
      <strong
        class={analystReport?.highPriceChange > 0
          ? "text-up"
          : "text-down"}
        >{Math.abs(analystReport?.highPriceChange ?? 0)}%</strong
      >
      {dashboard_analyst_report_change_suffix()}
    </div>

    <table class="w-full text-right text-sm mt-5">
      <thead class="">
        <tr
          class="border-b border-line text-fg-muted"
        >
          <th class="py-2 text-left uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_target()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_low()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_avg()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_median()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_high()}
          </th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr class="border-b border-line">
          <td class="py-2 text-left text-fg">
            {dashboard_analyst_report_row_price()}
          </td>
          <td class="text-fg-muted"
            >${analystReport?.lowPriceTarget}</td
          >
          <td class="text-fg-muted"
            >${analystReport?.avgPriceTarget}</td
          >
          <td class="text-fg-muted"
            >${analystReport?.medianPriceTarget}</td
          >
          <td class="text-fg-muted"
            >${analystReport?.highPriceTarget}</td
          >
        </tr>
        <tr>
          <td class="py-2 text-left text-fg">
            {dashboard_analyst_report_row_change()}
          </td>
          <td
            class={analystReport?.lowPriceChange > 0
              ? "before:content-['+'] text-up "
              : "text-down "}
          >
            {analystReport?.lowPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.avgPriceChange > 0
              ? "before:content-['+'] text-up "
              : "text-down "}
          >
            {analystReport?.avgPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.medianPriceChange > 0
              ? "before:content-['+'] text-up "
              : "text-down "}
          >
            {analystReport?.medianPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.highPriceChange > 0
              ? "before:content-['+'] text-up "
              : "text-down "}
          >
            {analystReport?.highPriceChange ?? "0"}%
          </td>
        </tr>
      </tbody>
    </table>
  {:else}
    <Infobox text={dashboard_analyst_report_empty()} />
  {/if}
</section>
