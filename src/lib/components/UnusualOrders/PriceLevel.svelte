<script lang="ts">
  import { displayCompanyName } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let data;
  export let rawData = [];
  export let metrics = {};

  let currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));
  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
  let config;

  // Data freshness
  let dataDate = "";
  let isToday = false;

  function checkDataFreshness() {
    if (hottestTrades?.length > 0) {
      const latestDate = new Date(hottestTrades[0]?.date);
      const today = new Date();
      dataDate = latestDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      });
      isToday = latestDate.toDateString() === today.toDateString();
    }
  }

  // Support/Resistance Analysis with Volume Weighting
  interface SRZone {
    priceMin: number;
    priceMax: number;
    priceAvg: number;
    totalSize: number;
    significance: number; // % of total unusual volume at this zone
    type: "support" | "resistance";
    distancePercent: number;
  }

  let keySupport: SRZone | null = null;
  let keyResistance: SRZone | null = null;
  let totalUnusualVolume = 0;
  let highestVolumeLevel = { price: 0, size: 0 };

  function analyzeSupportResistance() {
    if (!rawData || rawData.length === 0 || !currentPrice) return;

    // Calculate total volume for significance
    totalUnusualVolume = rawData.reduce((sum, item) => sum + item.size, 0);

    // Find highest volume level
    const sorted = [...rawData].sort((a, b) => b.size - a.size);
    highestVolumeLevel = { price: sorted[0]?.price_level, size: sorted[0]?.size };

    // Cluster nearby prices (within 1% of each other) into zones
    const supportLevels: any[] = [];
    const resistanceLevels: any[] = [];

    rawData.forEach((item) => {
      const price = item.price_level;
      const size = item.size;

      if (price < currentPrice) {
        supportLevels.push({ price, size });
      } else if (price > currentPrice) {
        resistanceLevels.push({ price, size });
      }
    });

    // Find key support: highest volume below current price
    if (supportLevels.length > 0) {
      const strongest = supportLevels.sort((a, b) => b.size - a.size)[0];
      const distancePercent = Math.abs(((strongest.price - currentPrice) / currentPrice) * 100);
      const significance = (strongest.size / totalUnusualVolume) * 100;

      keySupport = {
        priceMin: strongest.price,
        priceMax: strongest.price,
        priceAvg: strongest.price,
        totalSize: strongest.size,
        significance,
        type: "support",
        distancePercent,
      };
    }

    // Find key resistance: highest volume above current price
    if (resistanceLevels.length > 0) {
      const strongest = resistanceLevels.sort((a, b) => b.size - a.size)[0];
      const distancePercent = Math.abs(((strongest.price - currentPrice) / currentPrice) * 100);
      const significance = (strongest.size / totalUnusualVolume) * 100;

      keyResistance = {
        priceMin: strongest.price,
        priceMax: strongest.price,
        priceAvg: strongest.price,
        totalSize: strongest.size,
        significance,
        type: "resistance",
        distancePercent,
      };
    }
  }

  function getVolumeChart() {
    const priceSizeMap = new Map();
    rawData?.forEach((item) => priceSizeMap.set(item?.price_level, item?.size));

    let priceLevel = rawData?.map((item) => item?.price_level || 0);
    priceLevel = Array.from(new Set([...priceLevel, currentPrice]))?.sort((a, b) => a - b);

    const sizes = priceLevel?.map((price) => {
      if (price === currentPrice && !priceSizeMap.has(currentPrice)) return 0;
      return priceSizeMap.get(price) || 0;
    });

    const maxSize = Math.max(...sizes);

    // Color based on position relative to current price
    const colors = priceLevel?.map((price, index) => {
      const size = sizes[index];
      if (size === 0) return "transparent";

      const isMax = size === maxSize;
      const isSupport = price < currentPrice;
      const isResistance = price > currentPrice;

      // Brighter = more volume significance
      const intensity = Math.min(size / maxSize, 1);

      if (isMax) return isSupport ? "#16a34a" : isResistance ? "#dc2626" : "#6b7280";
      if (isSupport) return intensity > 0.5 ? "#22c55e" : $mode === "light" ? "#86efac" : "#166534";
      if (isResistance) return intensity > 0.5 ? "#ef4444" : $mode === "light" ? "#fca5a5" : "#991b1b";
      return $mode === "light" ? "#6b7280" : "#9ca3af";
    });

    const currentPriceIndex = priceLevel?.findIndex((s) => s === currentPrice);

    return {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 340,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: $mode === "light" ? "#f3f4f6" : "#27272a",
            stroke: $mode === "light" ? "#d1d5db" : "#3f3f46",
            style: { color: $mode === "light" ? "#111827" : "#f4f4f5" },
            r: 8,
            states: { hover: { fill: $mode === "light" ? "#e5e7eb" : "#3f3f46" } },
          },
          position: { align: "right", x: -10, y: 10 },
        },
      },
      credits: { enabled: false },
      legend: { enabled: false },
      title: { text: null },
      xAxis: {
        categories: priceLevel,
        plotLines: [
          {
            value: currentPriceIndex,
            color: $mode === "light" ? "#2563eb" : "#60a5fa",
            dashStyle: "Dash",
            width: 2,
            label: {
              text: `Current $${currentPrice}`,
              style: { color: $mode === "light" ? "#2563eb" : "#60a5fa", fontWeight: "bold", fontSize: "11px" },
            },
            zIndex: 5,
          },
        ],
        crosshair: { color: $mode === "light" ? "#545454" : "white", width: 1 },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white", fontSize: "10px" },
          formatter: function () {
            return "$" + this.value;
          },
        },
      },
      yAxis: {
        title: { text: null },
        opposite: true,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          formatter: function () {
            return abbreviateNumber(this?.value);
          },
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
      },
      tooltip: {
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        style: { color: "#fff", fontSize: "14px" },
        borderRadius: 4,
        formatter: function () {
          const price = this?.x;
          const volume = this?.y || 0;
          const pctOfTotal = totalUnusualVolume > 0 ? ((volume / totalUnusualVolume) * 100).toFixed(1) : 0;
          const isSupport = price < currentPrice;
          const isResistance = price > currentPrice;
          const zone = isSupport ? "Support Zone" : isResistance ? "Resistance Zone" : "Current Price";
          const distPercent = price !== currentPrice ? (((price - currentPrice) / currentPrice) * 100).toFixed(2) : 0;

          return `
            <div class="p-1">
              <div class="font-bold text-base">$${price}</div>
              <div class="text-xs ${isSupport ? "text-green-400" : isResistance ? "text-red-400" : "text-gray-400"}">${zone}</div>
              <div class="mt-1 text-sm">Volume: <span class="font-semibold">${abbreviateNumber(volume)}</span></div>
              <div class="text-xs text-gray-400">${pctOfTotal}% of unusual activity</div>
              ${price !== currentPrice ? `<div class="text-xs text-gray-400">${distPercent}% from current</div>` : ""}
            </div>
          `;
        },
      },
      plotOptions: {
        column: {
          colorByPoint: true,
          colors,
          borderColor: colors,
          borderRadius: 2,
          pointPadding: 0.1,
          groupPadding: 0.1,
        },
      },
      series: [{ name: "Volume", data: sizes, animation: false }],
    };
  }

  $: {
    if (rawData?.length > 0 || $mode) {
      checkDataFreshness();
      analyzeSupportResistance();
      config = getVolumeChart() || null;
    }
  }
</script>

<section class="overflow-hidden h-full pb-8 pt-3">
  <main class="overflow-hidden">
    {#if rawData?.length !== 0 && Object?.keys(metrics)?.length > 0}

      <!-- Header with Data Freshness -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg sm:text-xl font-bold">Key Price Levels</h3>
          <InfoModal
            title="Key Price Levels"
            content="These levels show where large institutional orders (block trades & dark pool) are concentrated. High volume at a price level suggests institutions are actively trading there, which can act as support (below current price) or resistance (above). Note: We cannot determine if these are buy or sell orders."
            id="keyPriceLevelsInfo"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-1 rounded-full {isToday ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}">
            {isToday ? "Live Today" : dataDate}
          </span>
        </div>
      </div>

      <!-- Key Levels Cards -->
      {#if keySupport || keyResistance}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <!-- Support Card -->
          <div class="border border-green-500/30 bg-green-500/5 dark:bg-green-900/20 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Support</span>
              </div>
              {#if keySupport}
                <span class="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400">
                  {keySupport.significance?.toFixed(1)}% of volume
                </span>
              {/if}
            </div>
            {#if keySupport}
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                ${keySupport.priceAvg?.toFixed(2)}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {keySupport.distancePercent?.toFixed(1)}% below current price
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {abbreviateNumber(keySupport.totalSize)} shares traded here
              </div>
            {:else}
              <div class="text-sm text-gray-500 dark:text-gray-400">No significant support detected</div>
            {/if}
          </div>

          <!-- Resistance Card -->
          <div class="border border-red-500/30 bg-red-500/5 dark:bg-red-900/20 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Resistance</span>
              </div>
              {#if keyResistance}
                <span class="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                  {keyResistance.significance?.toFixed(1)}% of volume
                </span>
              {/if}
            </div>
            {#if keyResistance}
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                ${keyResistance.priceAvg?.toFixed(2)}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {keyResistance.distancePercent?.toFixed(1)}% above current price
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {abbreviateNumber(keyResistance.totalSize)} shares traded here
              </div>
            {:else}
              <div class="text-sm text-gray-500 dark:text-gray-400">No significant resistance detected</div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- How to Use This Data -->
      <div class="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 mb-4">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">How to use this data:</div>
        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong class="text-green-600 dark:text-green-400">Support levels</strong> may hold if price drops — watch for bounces</li>
          <li>• <strong class="text-red-600 dark:text-red-400">Resistance levels</strong> may reject price — watch for breakouts or rejections</li>
          <li>• Higher volume = stronger level. Combine with other analysis (options, technicals) for best results</li>
        </ul>
      </div>

      <!-- Chart -->
      <div class="border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-zinc-800/50 px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Volume Distribution</span>
            <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded" style="background-color: {$mode === 'light' ? '#86efac' : '#166534'}"></span>
                Support
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded" style="background-color: {$mode === 'light' ? '#fca5a5' : '#991b1b'}"></span>
                Resistance
              </span>
            </div>
          </div>
        </div>
        <div use:highcharts={config}></div>
      </div>

      <!-- Important Disclaimer -->
      <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        <strong>Important:</strong> This data shows WHERE large orders occurred, not whether they were buys or sells.
        Use as one input among many — not as sole trading signal.
      </div>

    {/if}
  </main>
</section>
