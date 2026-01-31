<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import {
    calculateIntradayExportCredits,
    getIntradayExportBounds,
  } from "$lib/utils";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import DownloadIcon from "lucide-svelte/icons/download";
  import {
    stock_detail_balance,
    stock_detail_close,
    stock_detail_download_started,
    stock_detail_end_date,
    stock_detail_estimated_cost,
    stock_detail_export_credits_error,
    stock_detail_export_date_error,
    stock_detail_export_date_range_error,
    stock_detail_export_generating,
    stock_detail_export_intraday_desc,
    stock_detail_export_intraday_title,
    stock_detail_export_price,
    stock_detail_export_sign_in_error,
    stock_detail_export_upgrade_error,
    stock_detail_interval,
    stock_detail_interval_15min,
    stock_detail_interval_1hour,
    stock_detail_interval_1min,
    stock_detail_interval_30min,
    stock_detail_interval_5min,
    stock_detail_plus_pro_only,
    stock_detail_preparing,
    stock_detail_sign_in,
    stock_detail_start_date,
    stock_detail_start_export,
    stock_detail_to_use_credits,
  } from "$lib/paraglide/messages";

  export let ticker: string;
  export let user: any;
  export let className: string = "";

  let exportModalOpen = false;
  let startDate = "";
  let endDate = "";
  let selectedInterval = "15min";
  let maxDate = "";
  let isExporting = false;
  let errorMessage = "";
  let statusMessage = "";
  let availableCredits = 0;
  let creditCost = 10;
  let isEligible = false;
  let creditBounds = { min: 10, max: 50 };

  $: availableCredits = user?.credits ?? 0;
  $: isEligible = user && ["Plus", "Pro"]?.includes(user?.tier);
  $: creditBounds = getIntradayExportBounds(selectedInterval);
  $: creditCost = calculateIntradayExportCredits(
    startDate,
    endDate,
    selectedInterval,
  );

  const formatDateInput = (date: Date) => date.toISOString().split("T")[0];

  const openModal = () => {
    exportModalOpen = true;
    errorMessage = "";
    statusMessage = "";
  };

  const closeModal = () => {
    exportModalOpen = false;
  };

  const getFilename = (contentDisposition: string, fallback: string) => {
    if (!contentDisposition) return fallback;
    const match = /filename="?([^"]+)"?/.exec(contentDisposition);
    return match?.[1] ?? fallback;
  };

  const startExport = async () => {
    if (!user) {
      errorMessage = stock_detail_export_sign_in_error();
      return;
    }

    if (!isEligible) {
      errorMessage = stock_detail_export_upgrade_error();
      return;
    }

    if (!startDate || !endDate) {
      errorMessage = stock_detail_export_date_error();
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      errorMessage = stock_detail_export_date_range_error();
      return;
    }

    if (availableCredits < creditCost) {
      errorMessage = stock_detail_export_credits_error({
        balance: availableCredits.toString(),
      });
      return;
    }

    isExporting = true;
    errorMessage = "";
    statusMessage = stock_detail_export_generating();

    try {
      const response = await fetch("/api/historical-price-interval-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          startDate,
          endDate,
          interval: selectedInterval,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.error) {
            message = parsed.error;
          }
        } catch (e) {
          // Ignore JSON parse errors.
        }
        throw new Error(message || "Export failed.");
      }

      const blob = await response.blob();
      const fallbackName = `${ticker}_${selectedInterval}_${startDate}_to_${endDate}.csv`;
      const filename = getFilename(
        response.headers.get("Content-Disposition") ?? "",
        fallbackName,
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      statusMessage = stock_detail_download_started();
      availableCredits = Math.max(0, availableCredits - creditCost);
      if (user) {
        user.credits = availableCredits;
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Export failed.";
      statusMessage = "";
    } finally {
      isExporting = false;
    }
  };

  onMount(() => {
    if (!browser) return;
    const today = new Date();
    maxDate = formatDateInput(today);
    endDate = formatDateInput(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    startDate = formatDateInput(start);
  });
</script>

<div class={`flex items-center ${className}`}>
  <Button
    on:click={openModal}
    class="group shadow transition-all duration-500 ease-out border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex items-center p-2.5 rounded-full text-xs sm:text-sm"
  >
    <DownloadIcon class="size-5 flex-shrink-0" />
    <span class="overflow-hidden max-w-0 group-hover:max-w-32 group-hover:ml-1.5 transition-all duration-500 ease-out">{stock_detail_export_price()}</span>
  </Button>
</div>

<input
  type="checkbox"
  id={`intraday-export-${ticker}`}
  class="modal-toggle"
  bind:checked={exportModalOpen}
/>

<dialog id={`intraday-export-${ticker}`} class="modal p-3 sm:p-0">
  <label
    for={`intraday-export-${ticker}`}
    class="cursor-pointer modal-backdrop bg-black/30"
    on:click={closeModal}
  ></label>

  <div
    class="modal-box rounded-2xl border border-gray-300 dark:border-zinc-700 w-full max-w-lg bg-white/95 dark:bg-zinc-950/95 shadow-none"
  >
    <h3
      class="font-semibold text-lg sm:text-xl text-gray-900 dark:text-zinc-100"
    >
      {stock_detail_export_intraday_title()}
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
      {stock_detail_export_intraday_desc()}
    </p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <label class="text-sm text-gray-700 dark:text-zinc-200">
        {stock_detail_start_date()}
        <input
          type="date"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 text-sm"
          bind:value={startDate}
          max={maxDate}
          disabled={isExporting}
        />
      </label>
      <label class="text-sm text-gray-700 dark:text-zinc-200">
        {stock_detail_end_date()}
        <input
          type="date"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 text-sm"
          bind:value={endDate}
          max={maxDate}
          disabled={isExporting}
        />
      </label>
    </div>
    <div class="mt-3">
      <label class="text-sm text-gray-700 dark:text-zinc-200">
        {stock_detail_interval()}
        <select
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 text-sm"
          bind:value={selectedInterval}
          disabled={isExporting}
        >
          <option value="1hour">{stock_detail_interval_1hour()}</option>
          <option value="30min">{stock_detail_interval_30min()}</option>
          <option value="15min">{stock_detail_interval_15min()}</option>
          <option value="5min">{stock_detail_interval_5min()}</option>
          <option value="1min">{stock_detail_interval_1min()}</option>
        </select>
      </label>
    </div>

    <div class="mt-3 text-xs text-gray-500 dark:text-zinc-400">
      <div>
        {stock_detail_estimated_cost({
          cost: creditCost.toString(),
          min: creditBounds.min.toString(),
          max: creditBounds.max.toString(),
        })}
      </div>
      {#if user}
        <div>
          {stock_detail_balance({ balance: availableCredits.toString() })}
          {user?.tier ? `(${user?.tier})` : ""}
        </div>
        {#if !isEligible}
          <div class="text-rose-800 dark:text-rose-400">
            {stock_detail_plus_pro_only()}
          </div>
        {/if}
      {:else}
        <div class="text-rose-800 dark:text-rose-400">
          {stock_detail_plus_pro_only()}
        </div>
        <div>
          <a
            href="/register"
            class="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >{stock_detail_sign_in()}</a
          >
          {stock_detail_to_use_credits()}
        </div>
      {/if}
    </div>

    {#if statusMessage}
      <div class="mt-3 text-sm text-gray-600 dark:text-zinc-300">
        {statusMessage}
      </div>
    {/if}
    {#if errorMessage}
      <div class="mt-3 text-sm text-rose-800 dark:text-rose-400">
        {errorMessage}
      </div>
    {/if}

    <div class="mt-5 flex flex-row items-center justify-end gap-2">
      <Button
        on:click={closeModal}
        class=" border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 px-3 py-2 rounded-full shadow text-sm"
        disabled={isExporting}
      >
        {stock_detail_close()}
      </Button>
      <Button
        on:click={startExport}
        class="border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 px-4 py-2 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isExporting || !isEligible}
      >
        {isExporting ? stock_detail_preparing() : stock_detail_start_export()}
      </Button>
    </div>
  </div>
</dialog>
