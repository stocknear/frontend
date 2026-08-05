<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    abbreviateNumber,
    changeClass,
    changeSign,
    removeCompanyStrings,
  } from "$lib/utils";
  import {
    dashboard_market_mover_direction_gainers,
    dashboard_market_mover_direction_losers,
    dashboard_market_mover_no_gainers,
    dashboard_market_mover_no_losers,
    dashboard_market_mover_session_afterhours,
    dashboard_market_mover_session_pre_market,
    dashboard_market_mover_session_top,
    dashboard_market_mover_title,
    dashboard_table_change,
    dashboard_table_name,
    dashboard_table_price,
    dashboard_table_symbol,
  } from "$lib/paraglide/messages.js";

  export let marketStatus = 0;
  export let gainersList = [];
  export let losersList = [];

  $: marketSessionLabel =
    marketStatus === 0
      ? dashboard_market_mover_session_top()
      : marketStatus === 1
        ? dashboard_market_mover_session_pre_market()
        : dashboard_market_mover_session_afterhours();

  $: sessionSegment =
    marketStatus === 0 ? "" : marketStatus === 1 ? "premarket/" : "afterhours/";

  // One definition, two panels. This file previously held two near-identical
  // 60-line copies, so every fix had to be made twice.
  $: panels = [
    {
      key: "gainers",
      rows: gainersList,
      href: `/market-mover/${sessionSegment}gainers`,
      title: dashboard_market_mover_title({
        session: marketSessionLabel,
        direction: dashboard_market_mover_direction_gainers(),
      }),
      empty: dashboard_market_mover_no_gainers(),
    },
    {
      key: "losers",
      rows: losersList,
      href: `/market-mover/${sessionSegment}losers`,
      title: dashboard_market_mover_title({
        session: marketSessionLabel,
        direction: dashboard_market_mover_direction_losers(),
      }),
      empty: dashboard_market_mover_no_losers(),
    },
  ];

  const formatChange = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return Math.abs(value) >= 1000
      ? abbreviateNumber(value)
      : value?.toFixed(2);
  };
</script>

<section class="flex flex-col gap-8 lg:flex-row lg:gap-8">
  {#each panels as panel (panel.key)}
    <div class="grow lg:w-1/2">
      <a
        class="group mb-3 inline-flex items-center gap-1 text-fg"
        href={panel.href}
      >
        <h2 class="type-h2 transition-colors group-hover:text-accent">
          {panel.title}
        </h2>
        <svg
          class="h-4 w-4 text-fg-subtle transition-colors group-hover:text-accent"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path></svg
        >
      </a>

      {#if panel.rows?.length > 0}
        <div
          class="overflow-hidden rounded-container border border-line bg-surface-card"
        >
          <table class="table w-full">
            <thead>
              <tr class="bg-surface-sunken">
                <th class="type-th px-4 py-2 text-left"
                  >{dashboard_table_symbol()}</th
                >
                <th class="type-th px-4 py-2 text-left"
                  >{dashboard_table_name()}</th
                >
                <th class="type-th px-4 py-2 text-right"
                  >{dashboard_table_price()}</th
                >
                <th class="type-th px-4 py-2 text-right"
                  >{dashboard_table_change()}</th
                >
              </tr>
            </thead>
            <tbody>
              {#each panel.rows as item (item?.symbol)}
                <!-- The whole row is the target; previously only the 4-character
                     symbol was clickable, so ~90% of the row was dead. -->
                <tr
                  class="group relative cursor-pointer transition-colors hover:bg-surface-raised"
                >
                  <td class="type-data-em px-4 py-2.5 text-left">
                    <a
                      href={`/stocks/${item?.symbol}`}
                      class="text-fg after:absolute after:inset-0 after:content-[''] group-hover:text-accent group-hover:underline group-hover:underline-offset-2"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td
                    class="type-data max-w-[220px] truncate px-4 py-2.5 text-fg-muted"
                    title={removeCompanyStrings(item?.name)}
                  >
                    <!-- CSS truncation only. A JS slice(0, 30) used to cut the
                         string first, so the ellipsis landed unrelated to the
                         column width and the full name was unrecoverable. -->
                    {removeCompanyStrings(item?.name)}
                  </td>
                  <td class="type-data px-4 py-2.5 text-right text-fg">
                    {typeof item?.price === "number"
                      ? item?.price?.toFixed(2)
                      : "-"}
                  </td>
                  <td
                    class="type-data-em px-4 py-2.5 text-right {changeClass(
                      item?.changesPercentage,
                    )}"
                  >
                    {changeSign(item?.changesPercentage)}{formatChange(
                      item?.changesPercentage,
                    )}%
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <Infobox text={panel.empty} />
      {/if}
    </div>
  {/each}
</section>
