<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import DownloadIcon from "lucide-svelte/icons/download";

  export let data: any;
  export let rawData: any[] = [];
  export let selectedDate: any = undefined; // For historical flow date

  const CREDIT_COST = 100;

  // Generate filename based on whether it's live or historical data
  const getExportFilename = (): string => {
    if (selectedDate) {
      // Historical data - use the selected date
      const date = selectedDate.toDate ? selectedDate.toDate() : new Date(selectedDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `options-flow-historical_${year}-${month}-${day}.csv`;
    } else {
      // Live data - use today's date
      const today = new Date().toISOString().split("T")[0];
      return `options-flow-live_${today}.csv`;
    }
  };

  let exportModalOpen = false;
  let isExporting = false;
  let errorMessage = "";
  let statusMessage = "";

  $: availableCredits = data?.user?.credits ?? 0;
  $: isEligible = data?.user && data?.user?.tier === "Pro";
  $: hasEnoughCredits = availableCredits >= CREDIT_COST;

  const openModal = () => {
    if (!data?.user) {
      goto("/pricing");
      return;
    }
    exportModalOpen = true;
    errorMessage = "";
    statusMessage = "";
  };

  const closeModal = () => {
    exportModalOpen = false;
  };

  const convertToCSV = (dataArray: any[]): string => {
    if (!dataArray || dataArray.length === 0) return "";

    // Define the columns we want to export
    const columns = [
      { key: "time", label: "Time" },
      { key: "ticker", label: "Symbol" },
      { key: "date_expiration", label: "Expiry" },
      { key: "dte", label: "DTE" },
      { key: "strike_price", label: "Strike" },
      { key: "put_call", label: "Call/Put" },
      { key: "sentiment", label: "Sentiment" },
      { key: "underlying_price", label: "Spot Price" },
      { key: "price", label: "Option Price" },
      { key: "cost_basis", label: "Premium" },
      { key: "option_activity_type", label: "Type" },
      { key: "trade_leg_type", label: "Leg" },
      { key: "execution_estimate", label: "Execution" },
      { key: "size", label: "Size" },
      { key: "volume", label: "Volume" },
      { key: "open_interest", label: "Open Interest" },
      { key: "option_symbol", label: "Option Symbol" },
    ];

    // Create header row
    const header = columns.map((col) => col.label).join(",");

    // Create data rows
    const rows = dataArray.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];
          // Handle null/undefined
          if (value === null || value === undefined) {
            value = "";
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",");
    });

    return [header, ...rows].join("\n");
  };

  const startExport = async () => {
    if (!data?.user) {
      errorMessage = "Sign in to export options flow data.";
      return;
    }

    if (!isEligible) {
      errorMessage = "Upgrade to Pro to export options flow data.";
      return;
    }

    if (!hasEnoughCredits) {
      errorMessage = `Insufficient credits. You need ${CREDIT_COST} credits but your balance is ${availableCredits}.`;
      return;
    }

    if (!rawData || rawData.length === 0) {
      errorMessage = "No data available to export.";
      return;
    }

    isExporting = true;
    errorMessage = "";
    statusMessage = "Preparing export...";

    try {
      // Deduct credits via API
      const response = await fetch("/api/options-flow-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          // Ignore JSON parse errors
        }
        throw new Error(message || "Failed to process export.");
      }

      // Generate CSV
      const csvContent = convertToCSV(rawData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Generate filename based on live or historical data
      const filename = getExportFilename();

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Update local credits
      availableCredits = Math.max(0, availableCredits - CREDIT_COST);
      if (data?.user) {
        data.user.credits = availableCredits;
      }

      statusMessage = "Download started successfully!";

      // Close modal after short delay
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Export failed.";
      statusMessage = "";
    } finally {
      isExporting = false;
    }
  };
</script>

<Button
  on:click={openModal}
  class="cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
  title="Download options flow data"
>
  <DownloadIcon class="w-4 h-4" />
</Button>

<input
  type="checkbox"
  id="options-flow-export-modal"
  class="modal-toggle"
  bind:checked={exportModalOpen}
/>

<dialog id="options-flow-export-modal" class="modal p-3 sm:p-0">
  <label
    for="options-flow-export-modal"
    class="cursor-pointer modal-backdrop bg-black/30"
    on:click={closeModal}
  ></label>

  <div
    class="modal-box rounded-2xl border border-gray-300 dark:border-zinc-700 w-full max-w-lg bg-white/95 dark:bg-zinc-950/95 shadow-none"
  >
    <h3
      class="font-semibold text-lg sm:text-xl text-gray-900 dark:text-zinc-100"
    >
      Export options flow data
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
      Download the current options flow table as a CSV file.
    </p>

    <div class="mt-3 text-xs text-gray-500 dark:text-zinc-400">
      <div>
        Export cost: {CREDIT_COST} credits.
      </div>
      {#if data?.user}
        <div>
          Balance: {availableCredits}
          {data?.user?.tier ? `(${data?.user?.tier})` : ""}
        </div>
        {#if !isEligible}
          <div class="text-rose-800 dark:text-rose-400">
            Available for Pro only.
          </div>
        {/if}
      {:else}
        <div class="text-rose-800 dark:text-rose-400">
          Available for Pro only.
        </div>
        <div>
          <a
            href="/login"
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
        disabled={isExporting || !isEligible || !hasEnoughCredits}
      >
        {isExporting ? "Preparing..." : "Start export"}
      </Button>
    </div>
  </div>
</dialog>
