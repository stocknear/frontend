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
        type: "areaspline",
        backgroundColor: "transparent",
        height: 280,
        spacing: [0, 0, 0, 0],
        events: {
          load: function () {
            // ---- draw circular (arced) text labels ----
            const chart = this;
            const ax = chart.xAxis[0];
            const cats = ax.categories;
            const n = cats.length;

            // polar center & radius
            const [cx, cy, r] = chart.series[0].center; // [x, y, radius, innerR]
            const radius = r * 1.02; // just outside the grid
            const sweepFrac = 0.6; // how wide each arc is (0..1 of its sector)

            // ensure a <defs/> exists
            const defs =
              chart.renderer.defs || chart.renderer.createElement("defs").add();

            // hide default labels
            if (ax.labelGroup) ax.labelGroup.attr({ opacity: 0 });

            for (let i = 0; i < n; i++) {
              const mid = (i / n) * 2 * Math.PI; // center angle of the sector
              const halfSweep = ((Math.PI * 2) / n) * (sweepFrac / 2);
              const start = mid - halfSweep;
              const end = mid + halfSweep;

              const x1 = cx + radius * Math.cos(start);
              const y1 = cy + radius * Math.sin(start);
              const x2 = cx + radius * Math.cos(end);
              const y2 = cy + radius * Math.sin(end);

              // SVG arc path
              const d = [
                "M",
                x1,
                y1,
                "A",
                radius,
                radius,
                0,
                end - start > Math.PI ? 1 : 0,
                1,
                x2,
                y2,
              ];

              const id = `arc-${i}-${Date.now()}`;
              chart.renderer.createElement("path").attr({ id, d }).add(defs);

              const text = chart.renderer.text("").add(); // container for textPath
              chart.renderer
                .createElement("textPath")
                .attr({
                  href: `#${id}`,
                  startOffset: "50%",
                  "text-anchor": "middle",
                })
                .add(text)
                .element.appendChild(document.createTextNode(cats[i]));

              // style the text
              text.css({
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "1px",
                fill: "#E5E7EB",
              });
            }
          },
        },
      },
      title: { text: undefined },

      // faint bands; keep or remove as you like
      pane: {
        size: "80%",
        background: [
          { outerRadius: "100%", backgroundColor: "rgba(255,255,255,0.02)" },
          { outerRadius: "80%", backgroundColor: "rgba(255,255,255,0.00)" },
          { outerRadius: "60%", backgroundColor: "rgba(255,255,255,0.02)" },
          { outerRadius: "40%", backgroundColor: "rgba(255,255,255,0.00)" },
          { outerRadius: "20%", backgroundColor: "rgba(255,255,255,0.02)" },
        ],
      },

      xAxis: {
        categories: radar.categories,
        tickmarkPlacement: "on",
        lineWidth: 0,
        labels: { enabled: false }, // hide; we draw custom arced labels
        gridLineColor: "#2b323b",
        gridLineWidth: 1,
      },
      yAxis: {
        gridLineInterpolation: "circle",
        min: 0,
        max: 100,
        tickInterval: 20,
        labels: { enabled: false },
        gridLineColor: "#2b323b",
        gridLineWidth: 1,
      },
      legend: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        series: {
          marker: { enabled: false },
          animation: false,
          pointPlacement: "on",
          linecap: "round",
          states: { inactive: { opacity: 1 } },
        },
      },
      series: [
        {
          type: "areaspline",
          data: radar.values,
          color: "#F0E000",
          lineColor: "#FFE84A",
          lineWidth: 2,
          fillOpacity: 0.45,
        },
      ],
    };
  }

  // init
  buildPerf();
  buildRadar();
</script>

<!-- Page -->
<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 text-muted dark:text-white"
>
  <div class="mx-auto w-full">
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

    <div class="flex flex-row items-start w-full space-x-3 mt-6">
      <!-- LEFT -->
      <div class="space-y-5 w-[70%]">
        <!-- Header -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div class="w-full overflow-hidden">
            <header class="relative">
              <!-- soft top gradient -->

              <h2 class="relative m-0 text-[1rem] font-semibold">
                Performance vs Market
              </h2>
            </header>

            <div class=" pt-3">
              <!-- KPI strip -->
              <div class="min-h-[45px] lg:min-h-[50px]">
                <ul
                  role="list"
                  class="flex flex-row flex-wrap items-end gap-6 text-slate-900 dark:text-slate-100"
                >
                  <!-- Total Value -->
                  <li class="flex items-start gap-3">
                    <div>
                      <p
                        class="m-0 text-xl font-semibold tracking-tight"
                        data-testid="total-value"
                      >
                        $40,465
                      </p>
                      <p class="m-0 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          class="underline decoration-dotted underline-offset-2"
                          title="The total current value of your portfolio"
                        >
                          Total Value
                        </span>
                        • 1 holding
                      </p>
                    </div>
                  </li>

                  <!-- Unrealised Returns -->
                  <li class="flex items-start gap-3">
                    <div>
                      <p
                        class="m-0 text-xl font-semibold tracking-tight"
                        data-testid="roi-value"
                      >
                        $25,165
                      </p>
                      <p class="m-0 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          class="underline decoration-dotted underline-offset-2"
                          title="Unrealised gains/losses on open positions"
                        >
                          Unrealised Returns
                        </span>
                        <span aria-hidden="true"> • </span>
                        <span aria-label="Return percentage">164.5%</span>
                      </p>
                    </div>
                  </li>

                  <!-- Dividends -->
                  <li class="flex items-start gap-3">
                    <div>
                      <div class="flex items-baseline gap-2">
                        <p
                          class="m-0 text-xl font-semibold tracking-tight"
                          data-testid="dividend"
                        >
                          $0
                        </p>
                        <p
                          class="m-0 text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                          /yr
                        </p>
                      </div>
                      <p class="m-0 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          class="underline decoration-dotted underline-offset-2"
                          title="Estimated annual dividend income"
                        >
                          Est. Dividends
                        </span>
                        • 0% Yield
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
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
            <span class="inline-flex items-center gap-2"
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
                <tr class=" border-y border-zinc-800">
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
                      <span class={h.change >= 0 ? "" : "text-rose-400"}
                        >{pct(h.change)}</span
                      >
                    </td>
                    <td class="px-5 py-2">{h.shares}</td>
                    <td class="px-5 py-2">${h.value.toLocaleString()}</td>
                    <td class="px-5 py-2">
                      <span class={h.gain >= 0 ? "" : "text-rose-400"}
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
      <div class="space-y-5 w-[30%]">
        <!-- Health + Radar -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 class="text-[1rem] font-semibold">
            Status: <span class="dark:text-green-400">Healthy</span>
          </h3>
          <p class="text-sm mt-1">
            Your best strength is <span class=" font-semibold">Growth</span>
            and your biggest risk is
            <span class="font-semibold">Fundamentals</span>.
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
            <h4 class=" font-semibold mb-2">Bull Case</h4>
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
