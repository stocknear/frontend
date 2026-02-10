<script lang="ts">
  import { mode } from "mode-watcher";
  import { abbreviateNumber } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { screenWidth } from "$lib/store";

  import {
    covered_call_screener_chart_price_at_expiration,
    covered_call_screener_chart_last_price_label,
    covered_call_screener_chart_breakeven_label,
    covered_call_screener_chart_profit_loss,
    covered_call_screener_chart_tooltip_underlying,
    covered_call_screener_chart_tooltip_profit_loss,
    covered_call_screener_chart_modal_title,
    covered_call_screener_chart_trade_setup,
    covered_call_screener_chart_buy_stock,
    covered_call_screener_chart_sell_call,
    covered_call_screener_chart_net_credit_debit,
    covered_call_screener_chart_breakeven,
    covered_call_screener_chart_above,
    covered_call_screener_chart_last_price,
    covered_call_screener_chart_moneyness,
    covered_call_screener_chart_return_if_flat,
    covered_call_screener_chart_return_if_assigned,
    covered_call_screener_chart_probability_of_profit,
    covered_call_screener_chart_annualized_abbr,
  } from "$lib/paraglide/messages";

  export let item: any = null;
  export let isOpen = false;
  export let onClose: () => void = () => {};

  let chartConfig: any = null;

  const formatDate = (dateString: string): string => {
    if (!dateString) return "n/a";
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return "n/a";
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const yy = String(date.getUTCFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  function buildChartConfig(item: any) {
    const stockPrice = item.stockPrice;
    const strike = item.strike;
    const premium = item.bid;
    const breakeven = item.breakeven;

    const lowestKey = Math.min(breakeven, strike, stockPrice);
    const highestKey = Math.max(breakeven, strike, stockPrice);
    const padding = Math.max((highestKey - lowestKey) * 2, stockPrice * 0.25);
    const xMin = Math.floor(Math.max(0, lowestKey - padding));
    const xMax = Math.ceil(highestKey + padding);
    const step = (xMax - xMin) / 200;

    const dataPoints = [];
    for (let s = xMin; s <= xMax; s += step) {
      const payoff =
        s < strike
          ? (s - stockPrice + premium) * 100
          : (strike - stockPrice + premium) * 100;
      dataPoints.push([
        parseFloat(s.toFixed(2)),
        parseFloat(payoff.toFixed(2)),
      ]);
    }

    return {
      credits: { enabled: false },
      chart: {
        type: "area",
        backgroundColor: $mode === "light" ? "#fff" : "#18191a",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#18191a",
        height: $screenWidth < 640 ? 240 : 360,
        animation: false,
      },
      title: { text: "" },
      xAxis: {
        min: xMin,
        max: xMax,
        title: {
          text: covered_call_screener_chart_price_at_expiration(),
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        labels: { style: { color: $mode === "light" ? "#545454" : "white" } },
        plotLines: [
          {
            value: stockPrice,
            color: $mode === "light" ? "black" : "white",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `<span class="text-black dark:text-white text-sm">${covered_call_screener_chart_last_price_label({ price: stockPrice })}</span>`,
              style: { color: $mode === "light" ? "black" : "white" },
            },
            zIndex: 5,
          },
          {
            value: breakeven,
            color: "#10B981",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `<span class="hidden sm:block text-sm" style="color:#10B981">${covered_call_screener_chart_breakeven_label({ breakeven: breakeven?.toFixed(2) })}</span>`,
              style: { color: "#10B981" },
            },
            zIndex: 5,
          },
        ],
      },
      yAxis: {
        title: {
          text: `<span class='hidden sm:block'>${covered_call_screener_chart_profit_loss()}</span>`,
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value.toFixed(2));
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 2,
        formatter: function () {
          const underlyingPrice = this.x;
          const profitLoss = this.y;
          const pctChange = ((underlyingPrice - stockPrice) / stockPrice) * 100;
          return `
            <div class="flex flex-col items-start text-sm">
              <div>
                <span class="font-semibold">${covered_call_screener_chart_tooltip_underlying()}</span> $${underlyingPrice?.toFixed(2)}
                (<span>${pctChange?.toFixed(2)}%</span>)
              </div>
              <div>
                <span class="font-semibold">${covered_call_screener_chart_tooltip_profit_loss()}</span>
                ${profitLoss < 0 ? "-$" : "$"}${Math.abs(profitLoss)?.toLocaleString("en-US")}
              </div>
            </div>
          `;
        },
      },
      plotOptions: {
        area: {
          fillOpacity: 0.2,
          marker: { enabled: false },
          animation: false,
        },
        series: {
          zoneAxis: "y",
          zones: [
            { value: 0, color: "#E02424", fillColor: "rgba(224,36,36,0.5)" },
            { color: "#10B981", fillColor: "rgba(16,185,129,0.5)" },
          ],
        },
      },
      legend: { enabled: false },
      series: [{ name: "Payoff", data: dataPoints }],
    };
  }

  $: if (isOpen && item) {
    chartConfig = buildChartConfig(item);
  } else {
    chartConfig = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && item && chartConfig}
  <div
    class="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    on:click|self={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="relative w-full max-w-3xl max-h-[100vh] sm:max-h-[90vh] overflow-auto bg-white dark:bg-zinc-900 sm:rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div
        class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-start justify-between"
      >
        <div>
          <h3
            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {covered_call_screener_chart_modal_title({ symbol: item.symbol })}
          </h3>
          <span class="text-sm text-gray-600 dark:text-zinc-400">
            {item.symbol} @ {item.stockPrice?.toFixed(2)}
            &nbsp;&nbsp;{formatDate(item.expiration)} (DTE: {item.dte})
          </span>
        </div>
        <button
          on:click={onClose}
          class="cursor-pointer p-1 rounded-full text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Chart -->
      <div class="px-4 sm:px-6 py-4">
        <div
          use:highcharts={chartConfig}
          class=" bg-white/70 dark:bg-zinc-950/40"
        ></div>
      </div>

      <!-- Trade Info -->
      <div
        class="px-4 sm:px-6 pb-6 border-t border-gray-200 dark:border-zinc-800 pt-4"
      >
        <div class="mb-4">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <span class="text-sm font-semibold text-gray-900 dark:text-white"
                >{covered_call_screener_chart_trade_setup()}</span
              >
              <div class="text-sm text-gray-700 dark:text-zinc-300">
                {covered_call_screener_chart_buy_stock()} {item.stockPrice?.toFixed(2)}
                <span class="mx-1 text-gray-400">|</span>
                {covered_call_screener_chart_sell_call({ strike: item.strike })} {item.bid?.toFixed(2)}
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-semibold text-gray-900 dark:text-white"
                >{covered_call_screener_chart_net_credit_debit()}</span
              >
              <div class="text-sm text-gray-700 dark:text-zinc-300">
                ${(item.bid * 100)?.toFixed(0)} / ${(
                  (item.stockPrice - item.bid) *
                  100
                )?.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_breakeven()}</span
            >
            <div class="text-sm text-gray-700 dark:text-zinc-300">
              {covered_call_screener_chart_above()} {item.breakeven?.toFixed(2)}
              <span
                class={item.pctBeBid >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"}
              >
                ({item.pctBeBid?.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_last_price()}</span
            >
            <div class="text-sm text-gray-700 dark:text-zinc-300">
              {item.stockPrice?.toFixed(2)}
            </div>
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_moneyness()}</span
            >
            <div
              class="text-sm {item.moneynessPercent >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'}"
            >
              {item.moneynessPercent?.toFixed(2)}%
            </div>
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_return_if_flat()}</span
            >
            <div class="text-sm text-gray-700 dark:text-zinc-300">
              {item.returnVal}% ({covered_call_screener_chart_annualized_abbr()} {item.annualizedReturn}%)
            </div>
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_return_if_assigned()}</span
            >
            <div class="text-sm text-gray-700 dark:text-zinc-300">
              {item.ptnlRtn}% ({covered_call_screener_chart_annualized_abbr()} {item.ifCalledAnnualized}%)
            </div>
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white"
              >{covered_call_screener_chart_probability_of_profit()}</span
            >
            <div class="text-sm text-gray-700 dark:text-zinc-300">
              {item.profitProb}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
