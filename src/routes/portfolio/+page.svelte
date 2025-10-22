<script lang="ts">
  import highcharts from "$lib/highcharts";

  // --- Demo data (replace with your real data) ---
  const netWorth = 557383;
  const deltaToday = 1994;

  const seriesPerformance = [
    { name: "E-Trade", data: [10, 12, 13, 15, 21, 29, 35, 42, 51.8] },
    { name: "Robinhood", data: [5, 6, 7, 8, 9, 12, 14, 15.2, 16.9] },
    { name: "S&P 500", data: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 3.1] },
  ];
  const perfCategories = [
    "Aug 25",
    "Aug 29",
    "Sep 2",
    "Sep 5",
    "Sep 8",
    "Sep 12",
    "Sep 16",
    "Sep 20",
    "Sep 28",
  ];

  type Holding = {
    symbol: string;
    price: number;
    change: number;
    shares: number;
    value: number;
    gain: number;
  };
  const holdings: Holding[] = [
    {
      symbol: "QQQ",
      price: 596.2,
      change: 0.49,
      shares: 15,
      value: 8579.6,
      gain: 74.28,
    },
    {
      symbol: "TSLL",
      price: 20.7,
      change: 7.71,
      shares: 500,
      value: 6400.0,
      gain: 1.91,
    },
    {
      symbol: "SPY",
      price: 662.1,
      change: 0.57,
      shares: 6,
      value: 3871.9,
      gain: 55.82,
    },
    {
      symbol: "QQQM",
      price: 245.3,
      change: 0.41,
      shares: 7,
      value: 1648.3,
      gain: 66.55,
    },
    {
      symbol: "EBAY",
      price: 91.2,
      change: -2.14,
      shares: 10,
      value: 992.2,
      gain: 111.56,
    },
    {
      symbol: "TQQQ",
      price: 101.3,
      change: 1.33,
      shares: 10,
      value: 903.8,
      gain: 192.59,
    },
    {
      symbol: "NIO",
      price: 7.1,
      change: -5.49,
      shares: 19,
      value: 120.5,
      gain: -84.12,
    },
  ];

  // Radar values (0-100)
  const radar = {
    categories: ["Moat", "Trend", "Growth", "Fundamentals", "Volatility"],
    values: [62, 70, 60, 40, 58],
  };

  // Helpers
  const usd = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const pct = (n: number) => `${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(2)}%`;

  // --- Charts (reactive configs) ---
  let perfConfig: Highcharts.Options | null = null;
  let radarConfig: Highcharts.Options | null = null;

  function buildPerf() {
    perfConfig = {
      credits: { enabled: false },
      chart: {
        type: "line",
        backgroundColor: "transparent",
        height: 260,
        spacing: [10, 10, 10, 10],
      },
      title: { text: undefined },
      xAxis: {
        categories: perfCategories,
        lineColor: "#222",
        tickColor: "#333",
        labels: { style: { color: "#9CA3AF" } },
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: "#1f2937",
        labels: { style: { color: "#9CA3AF" } },
      },
      legend: { enabled: true, itemStyle: { color: "#E5E7EB" } },
      tooltip: {
        shared: true,
        valueSuffix: "%",
        backgroundColor: "rgba(0,0,0,.85)",
        borderWidth: 0,
        style: { color: "#fff" },
      },
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          lineWidth: 2,
          states: { hover: { lineWidthPlus: 0 } },
        },
      },
      series: seriesPerformance.map((s) => ({ ...s, type: "line" })),
    };
  }

  function buildRadar() {
    radarConfig = {
      credits: { enabled: false },
      chart: {
        polar: true,
        type: "area",
        backgroundColor: "transparent",
        height: 280,
      },
      title: { text: undefined },
      pane: { size: "80%" },
      xAxis: {
        categories: radar.categories,
        tickmarkPlacement: "on",
        lineWidth: 0,
        labels: { style: { color: "#E5E7EB" } },
      },
      yAxis: {
        gridLineInterpolation: "polygon",
        min: 0,
        max: 100,
        tickInterval: 20,
        labels: { enabled: false },
      },
      legend: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        series: { marker: { enabled: false }, animation: false },
      },
      series: [
        {
          type: "area",
          data: radar.values,
          fillOpacity: 0.25,
        },
      ],
    };
  }

  // init
  buildPerf();
  buildRadar();
</script>

<!-- Page -->
<section class="min-h-screen w-full bg-zinc-950 text-zinc-100">
  <div class="mx-auto max-w-7xl py-6">
    <!-- Top Nav Mimic -->
    <div class="flex items-center gap-2 text-sm text-zinc-300/80">
      <span class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800"
        >Overview</span
      >
      <span class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800"
        >AI Brief</span
      >
      <span
        class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800 ring-1 ring-zinc-700/50"
        >Analysis</span
      >
      <span class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800"
        >Insights</span
      >
      <span class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800"
        >Behavior</span
      >
      <span class="px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800"
        >Ideas</span
      >
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- LEFT -->
      <div class="space-y-5">
        <!-- Net worth + line chart card -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div class="flex items-end justify-between">
            <div>
              <h2 class="text-zinc-400 text-sm">Net Worth</h2>
              <div class="text-4xl font-extrabold tracking-tight">
                ${usd(netWorth)}
              </div>
              <div class="text-emerald-400 text-sm mt-1">
                + ${deltaToday.toLocaleString()} today
              </div>
            </div>
            <button
              class="hidden sm:inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
              >Connect Broker</button
            >
          </div>
          <div
            class="mt-4 rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-2"
          >
            <div class="h-[260px]" use:highcharts={perfConfig}></div>
          </div>

          <!-- Legend badges -->
          <div class="mt-3 flex items-center gap-3 text-xs">
            <span class="inline-flex items-center gap-2"
              ><span class="h-2 w-2 rounded-full bg-current"></span>S&P 500</span
            >
            <span class="inline-flex items-center gap-2"
              ><span class="h-2 w-2 rounded-full bg-current"
              ></span>E-Trade</span
            >
            <span class="inline-flex items-center gap-2"
              ><span class="h-2 w-2 rounded-full bg-current"
              ></span>Robinhood</span
            >
          </div>
        </div>

        <!-- Holdings table -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div class="px-5 pt-4 pb-3 flex items-center gap-3 text-sm">
            <span class="inline-flex items-center gap-2 text-emerald-400"
              ><span class="h-2 w-2 rounded-full bg-emerald-400"
              ></span>E-Trade</span
            >
            <span class="inline-flex items-center gap-2 text-lime-400"
              ><span class="h-2 w-2 rounded-full bg-lime-400"
              ></span>Robinhood</span
            >
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-zinc-400 border-y border-zinc-800">
                  <th class="text-left font-medium px-5 py-2">Symbol</th>
                  <th class="text-left font-medium px-5 py-2">Price</th>
                  <th class="text-left font-medium px-5 py-2">Change</th>
                  <th class="text-left font-medium px-5 py-2">Shares</th>
                  <th class="text-left font-medium px-5 py-2">Value</th>
                  <th class="text-left font-medium px-5 py-2">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {#each holdings as h, i}
                  <tr class="border-b border-zinc-900/80 odd:bg-zinc-900/30">
                    <td class="px-5 py-2 font-medium">{h.symbol}</td>
                    <td class="px-5 py-2">${h.price.toFixed(1)}</td>
                    <td class="px-5 py-2">
                      <span
                        class={h.change >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"}>{pct(h.change)}</span
                      >
                    </td>
                    <td class="px-5 py-2">{h.shares}</td>
                    <td class="px-5 py-2">${h.value.toLocaleString()}</td>
                    <td class="px-5 py-2">
                      <span
                        class={h.gain >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"}
                        >{h.gain >= 0 ? "↑" : "↓"}
                        {Math.abs(h.gain).toFixed(2)}%</span
                      >
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="space-y-5">
        <!-- Health + Radar -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 class="text-xl font-semibold">Your portfolio is healthy</h3>
          <p class="text-sm text-zinc-400 mt-1">
            Your best strength is <span class="text-emerald-400 font-medium"
              >Growth</span
            >
            and your biggest risk is
            <span class="text-fuchsia-300 font-medium">Fundamentals</span>
          </p>
          <div
            class="mt-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-2"
          >
            <div class="h-[280px]" use:highcharts={radarConfig}></div>
          </div>
        </div>

        <!-- Bull / Bear cases -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 class="text-emerald-400 font-semibold mb-2">Bull Case</h4>
            <p class="text-sm text-zinc-300 leading-6">
              This portfolio demonstrates strong exposure to high-growth
              technology and consumer cyclical sectors. Major allocations to
              QQQ, QQQM, SPY, and leveraged ETFs like TQQQ and TSLL provide
              access to leading tech companies driving recent market
              outperformance…
            </p>
          </div>
          <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 class="text-rose-400 font-semibold mb-2">Bear Case</h4>
            <p class="text-sm text-zinc-300 leading-6">
              Portfolio concentration in technology and growth-leveraged ETFs
              creates substantial sector risk and high volatility, with limited
              exposure to defensive sectors. Significant use of leveraged ETFs
              exposes the portfolio to amplified losses during downturns…
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* optional: smooth font rendering for dark UIs */
  :global(html) {
    color-scheme: dark;
  }
</style>
