<script lang="ts">
  import highcharts from "$lib/highcharts";
  import Sector from "$lib/components/Portfolio/Sector.svelte";
  import Table from "$lib/components/Table/Table.svelte";

  export let data;

  let rawData = [
    {
      symbol: "SAP",
      name: "Sap Se",
      price: 272.89,
      changesPercentage: 1.17,
      marketCap: 318194271838,
      revenue: 34176000000,
      rank: 1,
    },
    {
      symbol: "DB",
      name: "Deutsche Bank AG",
      price: 33.58,
      changesPercentage: -4.33,
      marketCap: 64680213878,
      revenue: 28263000000,
      rank: 2,
    },
    {
      symbol: "BNTX",
      name: "BioNTech SE",
      price: 105.14,
      changesPercentage: 0.06,
      marketCap: 25275521841,
      revenue: 2751100000,
      rank: 3,
    },
    {
      symbol: "FMS",
      name: "Fresenius Medical Care AG & Co. KGaA",
      price: 27.14,
      changesPercentage: 0.37,
      marketCap: 15926482229,
      revenue: 19335909000,
      rank: 4,
    },
    {
      symbol: "ATAI",
      name: "Atai Life Sciences N.V.",
      price: 6.45,
      changesPercentage: 17.7,
      marketCap: 1381322209,
      revenue: 308000,
      rank: 5,
    },
    {
      symbol: "EVO",
      name: "Evotec SE",
      price: 3.88,
      changesPercentage: -3,
      marketCap: 1377799846,
      revenue: 796967000,
      rank: 6,
    },
    {
      symbol: "NNNN",
      name: "Anbio Biotechnology Class A Ordinary Shares",
      price: 29,
      changesPercentage: 4.62,
      marketCap: 1272844800,
      revenue: 8185146,
      rank: 7,
    },
    {
      symbol: "CVAC",
      name: "CureVac N.V.",
      price: 5.36,
      changesPercentage: -0.19,
      marketCap: 1206925935,
      revenue: 535180000,
      rank: 8,
    },
    {
      symbol: "IMTX",
      name: "Immatics N.V.",
      price: 9.87,
      changesPercentage: -3.24,
      marketCap: 1199719276,
      revenue: 155835000,
      rank: 9,
    },
    {
      symbol: "LUXE",
      name: "LuxExperience B.V.",
      price: 8.34,
      changesPercentage: 2.08,
      marketCap: 711118123,
      revenue: 1255000000,
      rank: 10,
    },
    {
      symbol: "JMIA",
      name: "Jumia Technologies AG",
      price: 10.74,
      changesPercentage: -9.6,
      marketCap: 657625365,
      revenue: 167486000,
      rank: 11,
    },
    {
      symbol: "TRVG",
      name: "trivago N.V.",
      price: 3.07,
      changesPercentage: -0.32,
      marketCap: 216149373,
      revenue: 460849000,
      rank: 12,
    },
    {
      symbol: "IFRX",
      name: "InflaRx N.V.",
      price: 1.18,
      changesPercentage: -4.84,
      marketCap: 79941613,
      revenue: 165789,
      rank: 13,
    },
    {
      symbol: "MYNZ",
      name: "Mainz Biomed B.V.",
      price: 1.49,
      changesPercentage: 5.67,
      marketCap: 6097414,
      revenue: 893991,
      rank: 14,
    },
  ];

  const seriesPerformance = [
    { name: "Portfolio", data: [10, 12, 13, 15, 21, 29, 35, 42, 51.8] },
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
  let perfConfig = null;
  let radarConfig = null;

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
        height: 240,
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
      <span class="px-3 py-1 rounded-full border border-zinc-800">Overview</span
      >
      <span class="px-3 py-1 rounded-full border border-zinc-800">Returns</span>
      <span
        class="px-3 py-1 rounded-full border border-zinc-800 ring-1 ring-zinc-700/50"
        >Analysis</span
      >
      <span class="px-3 py-1 rounded-full border border-zinc-800">Updates</span>
      <span class="px-3 py-1 rounded-full border border-zinc-800"
        >Dividends</span
      >
      <span class="px-3 py-1 rounded-full border border-zinc-800">Analysis</span
      >
    </div>

    <div class="flex flex-row items-start w-full space-x-3 mt-6">
      <!-- LEFT -->
      <div class=" w-[70%]">
        <!-- Header -->
        <div class="rounded-lg border border-zinc-800 p-5">
          <div class="w-full overflow-hidden">
            <header class="relative">
              <!-- soft top gradient -->

              <h2 class="relative m-0 text-[1rem] font-semibold">
                Performance vs US Market
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

          <div class="mt-4">
            <div use:highcharts={perfConfig}></div>
          </div>
        </div>

        <!-- Holdings table -->
        <Table
          {data}
          {rawData}
          title={rawData?.length?.toLocaleString("en-US") + " " + "Stocks"}
        />
      </div>

      <!-- RIGHT -->
      <div class="space-y-5 w-[30%]">
        <!-- Health + Radar -->
        <div class="rounded-lg border border-zinc-800 p-5">
          <h3 class="text-[1rem] font-semibold">
            Status: <span class="dark:text-green-400">Healthy</span>
          </h3>
          <p class="text-sm mt-1">
            Your best strength is <span class=" font-semibold">Growth</span>
            and your biggest risk is
            <span class="font-semibold">Fundamentals</span>.
          </p>
          <div class="mt-3">
            <div use:highcharts={radarConfig}></div>
          </div>
        </div>

        <!-- Bull / Bear cases -->
        <Sector />
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
