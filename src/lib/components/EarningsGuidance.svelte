<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import { stock_detail_upgrade } from "$lib/paraglide/messages";

  export let data;

  let rawData = {};
  let periodLabel = "";
  let revenueGuidanceText = "n/a";
  let epsGuidanceText = "n/a";

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function centerAndDelta(minValue, maxValue, estimateValue) {
    const estimate = toNumber(estimateValue);
    const min = toNumber(minValue);
    const max = toNumber(maxValue);

    if (min !== null && max !== null) {
      return {
        center: (min + max) / 2,
        delta: Math.abs(max - min) / 2,
      };
    }

    if (estimate !== null) {
      return { center: estimate, delta: null };
    }

    return { center: null, delta: null };
  }

  function formatRevenueGuidance(center, delta) {
    if (center === null) return "n/a";
    const centerText = abbreviateNumber(center, true, true);
    if (delta === null || Math.abs(delta) < 1e-6) return centerText;
    return `${centerText} ± ${abbreviateNumber(delta, true, true)}`;
  }

  function formatEpsGuidance(center, delta) {
    if (center === null) return "n/a";
    const centerText = center?.toFixed(2);
    if (delta === null || Math.abs(delta) < 0.005) return centerText;
    const deltaText =
      Math.abs(delta) < 0.1 ? delta.toFixed(2) : delta.toFixed(1);
    return `${centerText} ± ${deltaText}`;
  }

  function formatPeriodLabel(periodValue, periodYearValue) {
    const period = (periodValue ?? "")?.toString()?.trim()?.toUpperCase();
    const year = toNumber(periodYearValue);
    const yearText =
      year !== null
        ? `FY${String(Math.trunc(year))?.slice(-2)?.padStart(2, "0")}`
        : "";

    if (period.startsWith("Q")) {
      return yearText ? `${period} ${yearText}` : period;
    }

    if (period.startsWith("FY")) {
      if (period === "FY" && yearText) return yearText;
      return period;
    }

    if (period.length > 0) {
      return yearText ? `${period} ${yearText}` : period;
    }

    return yearText || "latest period";
  }

  function pickLatestQuarterlyGuidanceRow(guidanceRows) {
    if (!Array.isArray(guidanceRows) || guidanceRows.length === 0) return {};

    const quarterly = guidanceRows?.find((item) => {
      const period = item?.period;
      return typeof period === "string" && /^Q[1-4]$/i?.test(period.trim());
    });

    return quarterly || guidanceRows[0] || {};
  }

  $: {
    if ($stockTicker) {
      const guidanceData = data?.getEarningsGuidance;
      rawData = Array.isArray(guidanceData)
        ? pickLatestQuarterlyGuidanceRow(guidanceData)
        : guidanceData || {};

      periodLabel = formatPeriodLabel(rawData?.period, rawData?.periodYear);

      const revenueCenterDelta =
        toNumber(rawData?.revenueGuidanceAvg) !== null
          ? {
              center: toNumber(rawData?.revenueGuidanceAvg),
              delta: toNumber(rawData?.revenueGuidanceDelta),
            }
          : centerAndDelta(
              rawData?.revenueGuidanceMin,
              rawData?.revenueGuidanceMax,
              rawData?.revenueGuidanceEst,
            );

      const epsCenterDelta =
        toNumber(rawData?.epsGuidanceAvg) !== null
          ? {
              center: toNumber(rawData?.epsGuidanceAvg),
              delta: toNumber(rawData?.epsGuidanceDelta),
            }
          : centerAndDelta(
              rawData?.epsGuidanceMin,
              rawData?.epsGuidanceMax,
              rawData?.epsGuidanceEst,
            );

      revenueGuidanceText = formatRevenueGuidance(
        revenueCenterDelta.center,
        revenueCenterDelta.delta,
      );
      epsGuidanceText = formatEpsGuidance(
        epsCenterDelta.center,
        epsCenterDelta.delta,
      );
    }
  }
</script>

{#if Object?.keys(rawData)?.length !== 0}
  <div class="space-y-3 overflow-hidden text-muted dark:text-zinc-200">
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between sm:border-t sm:border-b border-gray-300 dark:border-zinc-700 py-2"
    >
      <h2
        class="text-xl sm:text-2xl font-semibold tracking-tight text-muted dark:text-white"
      >
        Management Guidance
      </h2>
    </div>

    <div class="w-auto lg:w-full flex flex-col m-auto">
      <div class="text-sm text-muted dark:text-zinc-300">
        Latest management guidance for {$displayCompanyName} was published on
        <strong
          >{new Date(rawData?.date ?? null)?.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}</strong
        >.
        <br />

        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          Revenue and EPS guidance ranges are available for premium users.
          <a
            class="inline-block ml-0.5 text-muted dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400"
            href="/pricing"
            >{stock_detail_upgrade()}
            <svg
              class="w-4 h-4 mb-1 inline-block"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
              /></svg
            >
          </a>
        {:else}
          For <strong>{periodLabel}</strong>, management guides revenue to
          <strong>{revenueGuidanceText}</strong> and EPS guidance to
          <strong>{epsGuidanceText}</strong>.
        {/if}
      </div>
    </div>
  </div>
{/if}
