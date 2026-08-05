<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber } from "$lib/utils";
  import {
    dashboard_options_flow_calls,
    dashboard_options_flow_empty,
    dashboard_options_flow_header_cp,
    dashboard_options_flow_header_prem,
    dashboard_options_flow_header_strike,
    dashboard_options_flow_header_type,
    dashboard_options_flow_puts,
    dashboard_options_flow_title,
    dashboard_table_symbol,
  } from "$lib/paraglide/messages.js";

  export let optionsFlowList;
</script>

<section class="text-fg">
  <a
    href="/options-flow"
    class="inline-flex items-center gap-1 text-fg group"
    ><h2
      class="mb-2 text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
    >
      {dashboard_options_flow_title()}
    </h2>
    <svg
      class="h-5 w-5 text-fg-muted transition group-hover:text-muted dark:group-hover:text-zinc-200"
      viewBox="0 0 20 20"
      fill="currentColor"
      style="max-width:40px"
      aria-hidden="true"
      ><path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      ></path></svg
    >
  </a>
  {#if optionsFlowList?.length > 0}
    <table
      class="w-full text-sm sm:text-[0.95rem] border-t border-line"
    >
      <thead>
        <tr
          class="text-xs uppercase tracking-widest text-fg-muted"
        >
          <th class="py-2 text-left font-semibold">
            {dashboard_table_symbol()}
          </th>
          <th class="py-2 text-left font-semibold">
            {dashboard_options_flow_header_prem()}
          </th>
          <th class="py-2 text-left font-semibold">
            {dashboard_options_flow_header_strike()}
          </th>
          <th class="py-2 text-left font-semibold">
            {dashboard_options_flow_header_cp()}
          </th>
          <th class="py-2 text-left font-semibold">
            {dashboard_options_flow_header_type()}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each optionsFlowList as item}
          <tr class="border-b border-line">
            <td class="py-3 text-left whitespace-nowrap">
              <a
                href={`/${item?.underlying_type === "stock" ? "stocks" : "etf"}/${item?.ticker}/options/unusual-activity`}
                class="font-medium text-fg transition-colors hover:text-accent"
                >{item?.ticker}</a
              >
            </td>
            <td class="py-3 text-left text-fg-muted">
              {abbreviateNumber(item?.cost_basis)}
            </td>
            <td class="py-3 text-left text-fg-muted">
              {item?.strike_price}
            </td>
            <td class="py-3 text-left">
              {#if item?.put_call === "Calls"}
                <span
                  class="text-up font-semibold"
                  >{dashboard_options_flow_calls()}</span
                >
              {:else if item?.put_call === "Puts"}
                <span class="text-down font-semibold"
                  >{dashboard_options_flow_puts()}
                </span>
              {:else}
                <span class="text-down font-semibold"
                  >{item?.put_call}
                </span>
              {/if}
            </td>
            <td class="py-3 text-left text-fg-muted">
              {item?.option_activity_type}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Infobox text={dashboard_options_flow_empty()} />
  {/if}
</section>
