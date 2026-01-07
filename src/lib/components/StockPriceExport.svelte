<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import {
    calculateIntradayExportCredits,
    getIntradayExportBounds,
  } from "$lib/utils";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import DownloadIcon from "lucide-svelte/icons/download";

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
      errorMessage = "Sign in to export intraday data.";
      return;
    }

    if (!isEligible) {
      errorMessage = "Upgrade to Plus or Pro to export intraday data.";
      return;
    }

    if (!startDate || !endDate) {
      errorMessage = "Select a start and end date.";
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      errorMessage = "Start date must be on or before end date.";
      return;
    }

    if (availableCredits < creditCost) {
      errorMessage = `Insufficient credits. Your balance is ${availableCredits}.`;
      return;
    }

    isExporting = true;
    errorMessage = "";
    statusMessage = "Generating export. This can take 2-3 minutes.";

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

      statusMessage = "Download started.";
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
    class="shadow transition-all  duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm"
  >
    <DownloadIcon class="size-4 mr-1" />
    Export Price
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
      Export intraday price data
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
      Choose a custom date range for intraday data. This export can take 2-3
      minutes. Keep this tab open and the download will start automatically.
    </p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <label class="text-sm text-gray-700 dark:text-zinc-200">
        Start date
        <input
          type="date"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 text-sm"
          bind:value={startDate}
          max={maxDate}
          disabled={isExporting}
        />
      </label>
      <label class="text-sm text-gray-700 dark:text-zinc-200">
        End date
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
        Interval
        <select
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/70 px-3 py-2 text-sm"
          bind:value={selectedInterval}
          disabled={isExporting}
        >
          <option value="1hour">1 Hour</option>
          <option value="30min">30 Min</option>
          <option value="15min">15 Min</option>
          <option value="5min">5 Min</option>
        </select>
      </label>
    </div>

    <div class="mt-3 text-xs text-gray-500 dark:text-zinc-400">
      <div>
        Estimated cost: {creditCost} credits (min {creditBounds.min}, max
        {creditBounds.max}).
      </div>
      {#if user}
        <div>
          Balance: {availableCredits}
          {user?.tier ? `(${user?.tier})` : ""}
        </div>
        {#if !isEligible}
          <div class="text-rose-800 dark:text-rose-400">
            Available for Plus and Pro only.
          </div>
        {/if}
      {:else}
        <div class="text-rose-800 dark:text-rose-400">
          Available for Plus and Pro only.
        </div>
        <div>
          <a
            href="/register"
            class="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >Sign in</a
          >
          to use credits.
        </div>
      {/if}
    </div>

    {#if statusMessage}
      <div class="mt-3 text-sm text-gray-600 dark:text-zinc-300">
        {statusMessage}
      </div>
    {/if}
    {#if errorMessage}
      <div class="mt-3 text-sm text-rose-600 dark:text-rose-400">
        {errorMessage}
      </div>
    {/if}

    <div class="mt-5 flex flex-row items-center justify-end gap-2">
      <Button
        on:click={closeModal}
        class=" border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 px-3 py-2 rounded-full shadow text-sm"
        disabled={isExporting}
      >
        Close
      </Button>
      <Button
        on:click={startExport}
        class="border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 px-4 py-2 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isExporting || !isEligible}
      >
        {isExporting ? "Preparing..." : "Start export"}
      </Button>
    </div>
  </div>
</dialog>
