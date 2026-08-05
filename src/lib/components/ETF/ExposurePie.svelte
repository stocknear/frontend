<script context="module" lang="ts">
  type ModuleHolding = { symbol?: string; name?: string; weightPercentage?: number | null };
  type ModuleFundHoldings = { lastUpdate?: string; holdings: ModuleHolding[] };

  // Module scope, not instance scope: collapsing a row destroys the component,
  // so an instance-level cache would refetch on every re-expand.
  const holdingsCache = new Map<string, Promise<ModuleFundHoldings>>();
</script>

<script lang="ts">
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts";
  import { getLocale } from "$lib/paraglide/runtime";
  import {
    etf_reverse_lookup_pie_as_of,
    etf_reverse_lookup_pie_error,
    etf_reverse_lookup_pie_loading,
    etf_reverse_lookup_pie_others,
    etf_reverse_lookup_pie_title,
  } from "$lib/paraglide/messages";

  /** The fund whose holdings are charted. */
  export let etfSymbol: string;
  /** The stock the user searched for; drawn in red and pulled out of the pie. */
  export let highlightSymbol: string = "";

  const TOP_HOLDINGS = 10;
  const HIGHLIGHT_COLOR = "#DC2626";

  // Same palette as the ETF holdings allocation chart, minus red so the
  // highlighted slice stays unambiguous.
  const SLICE_COLORS = [
    "#4A7BA7",
    "#8B5A9B",
    "#C85A9B",
    "#E85A85",
    "#F5756B",
    "#F9A05C",
    "#FFC04D",
    "#FFD93D",
    "#4A6B8A",
    "#7C8797",
  ];
  const OTHERS_COLOR = "#5B6EA8";

  type Holding = ModuleHolding;
  type FundHoldings = ModuleFundHoldings;

  function fetchHoldings(symbol: string): Promise<FundHoldings> {
    // The trimmed result depends on which stock is highlighted, so that is part
    // of the key rather than an assumption about the caller.
    const cacheKey = `${symbol}|${highlightSymbol?.toUpperCase() ?? ""}`;
    const cached = holdingsCache.get(cacheKey);
    if (cached) return cached;

    const request = fetch("/api/etf-holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: symbol }),
    })
      .then(async (response) => {
        // 429 is our own rate limit, not a problem with the fund; surface it
        // separately so the caption does not blame the data.
        if (response?.status === 429) throw new Error("rate-limited");
        if (!response?.ok) throw new Error(`etf-holdings ${response?.status}`);
        const payload = await response.json();
        const holdings = Array.isArray(payload?.holdings) ? payload.holdings : [];
        // Only ten slices are ever drawn, so drop the rest immediately rather
        // than holding a 1 MB holdings list per expanded fund.
        return {
          lastUpdate: payload?.lastUpdate,
          holdings: trimHoldings(holdings),
        } satisfies FundHoldings;
      })
      .catch((error) => {
        // Do not cache a failure; the next expand should retry.
        holdingsCache.delete(cacheKey);
        throw error;
      });

    holdingsCache.set(cacheKey, request);
    return request;
  }

  function trimHoldings(holdings: Holding[]): Holding[] {
    const ranked = [...holdings]?.sort(
      (left, right) => (right?.weightPercentage ?? 0) - (left?.weightPercentage ?? 0),
    );
    const top = ranked?.slice(0, TOP_HOLDINGS) ?? [];

    // Keep the searched stock even when it sits outside the top ten, so the
    // chart always answers "how big is this position in this fund".
    const target = highlightSymbol?.toUpperCase();
    const alreadyShown = top?.some((item) => item?.symbol?.toUpperCase() === target);
    if (target && !alreadyShown) {
      const match = ranked?.find((item) => item?.symbol?.toUpperCase() === target);
      if (match) top.push(match);
    }

    const shownWeight = top?.reduce((total, item) => total + (item?.weightPercentage ?? 0), 0) ?? 0;
    const totalWeight = ranked?.reduce((total, item) => total + (item?.weightPercentage ?? 0), 0) ?? 0;
    const others = totalWeight - shownWeight;

    return others > 0.01 ? [...top, { symbol: "__OTHERS__", weightPercentage: others }] : top;
  }

  function formatDate(value?: string): string {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed?.getTime())) return value;
    try {
      return parsed.toLocaleDateString(getLocale(), {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return value;
    }
  }

  function buildConfig(fund: FundHoldings) {
    const target = highlightSymbol?.toUpperCase();
    let colorIndex = 0;

    const series = fund?.holdings?.map((item) => {
      const isOthers = item?.symbol === "__OTHERS__";
      const isHighlight = !isOthers && item?.symbol?.toUpperCase() === target;

      return {
        name: isOthers ? etf_reverse_lookup_pie_others() : (item?.symbol ?? ""),
        y: item?.weightPercentage ?? 0,
        color: isHighlight
          ? HIGHLIGHT_COLOR
          : isOthers
            ? OTHERS_COLOR
            : SLICE_COLORS[colorIndex++ % SLICE_COLORS.length],
        sliced: isHighlight,
        highlighted: isHighlight,
      };
    });

    return {
      credits: { enabled: false },
      chart: {
        backgroundColor: "transparent",
        plotBackgroundColor: "transparent",
        type: "pie",
        height: 340,
        animation: false,
      },
      title: { text: null },
      tooltip: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          cursor: "default",
          borderWidth: 0,
          size: "75%",
          innerSize: "0%",
          animation: false,
          enableMouseTracking: false,
          slicedOffset: 18,
          states: { hover: { enabled: false }, inactive: { enabled: false } },
          dataLabels: {
            enabled: true,
            distance: 20,
            connectorWidth: 1,
            style: {
              color: $mode === "light" ? "#4B5563" : "#A1A1AA",
              fontSize: "12px",
              fontWeight: "500",
              textOutline: "none",
            },
            formatter: function () {
              const weight = Number(this.y ?? 0).toFixed(2);
              const bold = this.point?.highlighted ? " color: #DC2626;" : "";
              return `<span style="font-weight: 700;${bold}">${this.point?.name}:</span> <span style="${bold}">${weight}%</span>`;
            },
          },
        },
      },
      series: [{ name: etfSymbol, data: series, animation: false }],
    };
  }
</script>

<div class="w-full px-2 pt-2 pb-4">
  {#await fetchHoldings(etfSymbol)}
    <div
      class="flex h-[340px] w-full items-center justify-center text-sm text-muted dark:text-zinc-400"
    >
      {etf_reverse_lookup_pie_loading()}
    </div>
  {:then fund}
    {#if fund?.holdings?.length}
      <div class="text-center">
        <div class="text-[0.95rem] font-semibold text-muted dark:text-zinc-100">
          {etf_reverse_lookup_pie_title({ symbol: etfSymbol })}
        </div>
        {#if fund?.lastUpdate}
          <div class="mt-0.5 text-xs text-muted dark:text-zinc-400">
            {etf_reverse_lookup_pie_as_of({ date: formatDate(fund?.lastUpdate) })}
          </div>
        {/if}
      </div>
      <div class="h-[340px] w-full" use:highcharts={buildConfig(fund)}></div>
    {:else}
      <div
        class="flex h-[120px] w-full items-center justify-center text-sm text-muted dark:text-zinc-400"
      >
        {etf_reverse_lookup_pie_error()}
      </div>
    {/if}
  {:catch}
    <div
      class="flex h-[120px] w-full items-center justify-center text-sm text-muted dark:text-zinc-400"
    >
      {etf_reverse_lookup_pie_error()}
    </div>
  {/await}
</div>
