<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { mode } from "mode-watcher";
  import { displayCompanyName } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";

  export let data;
  export let rawData: Array<Record<string, any>> = [];

  const MAX_ON_EXCHANGES = 4; // Off-Exchange + top N + Other

  function parsePct(value: any): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatDateShort(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });
  }

  function formatDateLong(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  function pctText(value: number): string {
    return value === 0 ? "< 0.01%" : `${value.toFixed(1)}%`;
  }

  function buildChart(rows: Array<Record<string, any>>) {
    const sorted = [...(rows || [])]
      .filter((r) => typeof r?.date === "string" && r.date.length >= 10)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return null;

    const allKeys = new Set<string>();
    for (const row of sorted) {
      for (const key of Object.keys(row)) {
        if (key !== "date") allKeys.add(key);
      }
    }

    const keys = [...allKeys];
    if (keys.length === 0) return null;

    const hasOffExchange = allKeys.has("Off-Exchange");

    const scores = keys
      .filter((k) => k !== "Off-Exchange")
      .map((k) => ({
        key: k,
        score: sorted.reduce((acc, row) => acc + parsePct(row[k]), 0),
      }))
      .sort((a, b) => b.score - a.score);

    const selectedKeys: string[] = [];
    if (hasOffExchange) selectedKeys.push("Off-Exchange");
    for (const { key } of scores) {
      if (selectedKeys.length - (hasOffExchange ? 1 : 0) >= MAX_ON_EXCHANGES)
        break;
      selectedKeys.push(key);
    }

    const selectedKeySet = new Set(selectedKeys);
    const needsOther = keys.some((k) => !selectedKeySet.has(k));

    const fullDates = sorted.map((r) => r.date.slice(0, 10));
    const categories = fullDates.map(formatDateShort);

    const isLightMode = $mode === "light";
    const isDarkMode = !isLightMode;

    function seriesColor(name: string, fallbackIndex: number): string {
      // Professional, high-contrast palette (Tableau-like)
      if (name === "Off-Exchange") return "#E15759"; // muted red
      if (name.startsWith("Nasdaq")) return "#76B7B2"; // muted teal
      if (name.startsWith("NYSE")) return "#4E79A7"; // muted blue
      if (name === "Other") return isDarkMode ? "#94A3B8" : "#BAB0AC"; // gray

      const palette = [
        "#F28E2B", // orange
        "#59A14F", // green
        "#B07AA1", // purple
        "#9C755F", // brown
        "#EDC948", // gold
      ];
      return palette[fallbackIndex % palette.length];
    }

    const seriesKeys = [...selectedKeys, ...(needsOther ? ["Other"] : [])];
    const series = seriesKeys.map((name, index) => {
      const data = sorted.map((row) => {
        if (name === "Other") {
          let other = 0;
          for (const k of keys) {
            if (!selectedKeySet.has(k)) other += parsePct(row[k]);
          }
          return other;
        }
        return parsePct(row[name]);
      });

      return {
        name,
        type: "column",
        data,
        color: seriesColor(name, index),
        animation: false,
        borderRadius: "4px",
      };
    });

    return {
      credits: { enabled: false },
      chart: {
        type: "column",
        backgroundColor: isLightMode ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem]  sm:text-lg">Exchange Breakdown (30D)</h3>`,
        useHTML: true,
        zIndex: 0,
        style: { color: isLightMode ? "black" : "white" },
      },
      legend: {
        enabled: true,
        itemStyle: { color: isLightMode ? "black" : "white" },
      },
      xAxis: {
        categories,
        crosshair: {
          color: isLightMode ? "#000" : "#fff",
          width: 1,
          dashStyle: "Solid",
        },
        labels: { style: { color: isLightMode ? "#000" : "#fff" } },
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: null },
        gridLineColor: isLightMode ? "#e5e7eb" : "#1f2937",
        labels: {
          style: { color: isLightMode ? "#545454" : "#fff" },
          formatter: function () {
            return this.value.toFixed(0) + "%";
          },
        },
      },
      tooltip: {
        zIndex: 20,
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "10px", zIndex: 20 },
        borderRadius: 4,
        formatter: function () {
          const idx = this.points?.[0]?.point?.index ?? 0;
          const date = fullDates[idx] || "";
          let html = `<span class=\"m-auto text-sm font-[501]\">${date}</span><br>`;
          const points = [...(this.points || [])].sort(
            (a, b) => (Number(b.y) || 0) - (Number(a.y) || 0),
          );
          for (const p of points) {
            const y = Number(p.y) || 0;
            const pctText = y === 0 ? "&lt; 0.01%" : `${y.toFixed(1)}%`;
            html += `<span style=\"display:inline-block;width:10px;height:10px;background-color:${p.color};border-radius:50%;margin-right:6px;\"></span>`;
            html += `<span class=\"font-semibold text-sm\">${p.series.name}:</span> `;
            html += `<span class=\"font-normal text-sm\">${pctText}</span><br>`;
          }
          return html;
        },
      },
      plotOptions: {
        column: {
          stacking: "normal",
          groupPadding: 0.08,
          pointPadding: 0.04,
          borderWidth: 0,
        },
        series: {
          animation: false,
          states: { hover: { enabled: true } },
        },
      },
      series,
    };
  }

  $: config = buildChart(rawData) || null;

  $: sortedRows =
    rawData
      ?.filter((r) => typeof r?.date === "string" && r.date.length >= 10)
      ?.sort((a, b) => a.date.localeCompare(b.date)) ?? [];

  $: latestRow =
    sortedRows.length > 0 ? sortedRows[sortedRows.length - 1] : null;
  $: latestDateStr = latestRow?.date?.slice(0, 10) || "";
  $: latestOffExchange = latestRow ? parsePct(latestRow["Off-Exchange"]) : 0;
  $: latestTotalPct = latestRow
    ? Object.keys(latestRow)
        .filter((k) => k !== "date")
        .reduce((acc, k) => acc + parsePct(latestRow[k]), 0)
    : 0;
  $: latestOnExchange =
    latestTotalPct > 0 ? Math.max(0, latestTotalPct - latestOffExchange) : 0;
  $: latestTopVenue = (() => {
    if (!latestRow) return { name: "", pct: 0 };
    let bestName = "";
    let bestPct = 0;
    for (const k of Object.keys(latestRow)) {
      if (k === "date" || k === "Off-Exchange") continue;
      const v = parsePct(latestRow[k]);
      if (v > bestPct) {
        bestPct = v;
        bestName = k;
      }
    }
    return { name: bestName, pct: bestPct };
  })();

  $: avgOffExchange = (() => {
    if (!sortedRows?.length) return 0;
    let sum = 0;
    let n = 0;
    for (const row of sortedRows) {
      const total = Object.keys(row)
        .filter((k) => k !== "date")
        .reduce((acc, k) => acc + parsePct(row[k]), 0);
      if (total <= 0) continue;
      sum += parsePct(row["Off-Exchange"]);
      n += 1;
    }
    return n > 0 ? sum / n : 0;
  })();
</script>

{#if rawData?.length > 0 && config}
  <section class="overflow-hidden h-full pb-8 pt-3">
    <main class="overflow-hidden">
      <div class="flex flex-row items-center">
        <label
          for="unusualOrdersExchangeInfo"
          class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
        >
          Exchange Breakdown
        </label>
        <InfoModal
          title={"Exchange Breakdown"}
          content={"Shows how unusual order size is distributed across exchanges over the last 30 days. Trades with transactionType 'Dark Pool' are treated as Off-Exchange."}
          id={"unusualOrdersExchangeInfo"}
        />
      </div>

      {#if latestRow && latestDateStr}
        <div class="w-full flex flex-col items-start">
          <p class="text-[1rem] mt-2 w-full sm:mb-4">
            As of {formatDateLong(latestDateStr)},{" "}
            {removeCompanyStrings($displayCompanyName)} unusual order size was
            <strong> {pctText(latestOffExchange)} </strong>Off-Exchange (Dark
            Pool) and
            <strong> {pctText(latestOnExchange)} </strong>On-Exchange. Over the
            last 30 days, Off-Exchange averaged
            <strong> {pctText(avgOffExchange)} </strong>
            {#if latestTopVenue?.name}
              , with {latestTopVenue.name} the largest on-exchange venue at
              <strong> {pctText(latestTopVenue.pct)} </strong>.
            {/if}
          </p>
        </div>
      {/if}

      <div class="rounded mt-5 sm:mt-0">
        <div
          class="border border-gray-300 dark:border-gray-800 rounded w-full"
          use:highcharts={config}
        ></div>
      </div>
    </main>
  </section>
{/if}
