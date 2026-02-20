<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import DownloadIcon from "lucide-svelte/icons/download";
  import {
    OPTIONS_SCREENER_EXPORT_CREDIT_MIN,
    OPTIONS_SCREENER_EXPORT_CREDIT_MAX,
    calculateOptionsScreenerExportCredits,
  } from "$lib/utils";

  export let data: any;
  export let totalItems: number = 0;
  export let fetchAllData: () => Promise<any[]> = async () => [];
  export let getExportPayload: () => Record<string, unknown> = () => ({});
  export let endpoint = "/api/options-screener-export";
  export let title = "options_screener_data";

  let exportModalOpen = false;
  let isExporting = false;
  let errorMessage = "";
  let statusMessage = "";

  $: availableCredits = data?.user?.credits ?? 0;
  $: isEligible = data?.user && data?.user?.tier === "Pro";
  $: estimatedCreditCost = calculateOptionsScreenerExportCredits(totalItems);
  $: hasEnoughCredits = availableCredits >= estimatedCreditCost;

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

  const generateCSVContent = (dataset: any[]) => {
    const csvRows: string[] = [];

    const cleanedData = dataset.map((row) => {
      const cleanedRow = { ...row };
      if (cleanedRow["name"]) {
        cleanedRow["name"] = cleanedRow["name"].replace(/,/g, "");
      }
      return cleanedRow;
    });

    if (cleanedData.length === 0) return "";

    let headers = Object.keys(cleanedData[0]);
    if (headers.includes("rank")) {
      headers = ["rank", ...headers.filter((h) => h !== "rank")];
    }

    csvRows.push(headers.join(","));

    for (const row of cleanedData) {
      const csvRow = headers
        .map((header) => {
          let value = row[header] ?? "";
          if (typeof value === "string" && /[",\n]/.test(value)) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
      csvRows.push(csvRow);
    }

    return csvRows.join("\n");
  };

  const getExportFilename = () => {
    const today = new Date().toISOString().split("T")[0];
    return `${title}_${today}.csv`;
  };

  const startExport = async () => {
    if (!data?.user) {
      errorMessage = "Sign in to export options screener data.";
      return;
    }

    if (!isEligible) {
      errorMessage = "Upgrade to Pro to export options screener data.";
      return;
    }

    if (!hasEnoughCredits) {
      errorMessage = `Insufficient credits. This export is estimated at ${estimatedCreditCost} credits, but your balance is ${availableCredits}.`;
      return;
    }

    if (totalItems === 0) {
      errorMessage = "No data available to export.";
      return;
    }

    isExporting = true;
    errorMessage = "";
    statusMessage = "Validating export...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getExportPayload?.() ?? {}),
      });

      let responseData: any = {};
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        throw new Error(
          responseData?.error ||
            responseData?.message ||
            "Failed to process export.",
        );
      }

      statusMessage = "Preparing export...";
      const allData = await fetchAllData();

      if (!allData || allData.length === 0) {
        throw new Error("No data returned from server.");
      }

      const csvContent = generateCSVContent(allData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const filename = getExportFilename();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (data?.user) {
        if (typeof responseData?.remainingCredits === "number") {
          data.user.credits = responseData.remainingCredits;
        } else if (typeof responseData?.creditsDeducted === "number") {
          data.user.credits = Math.max(
            0,
            (data?.user?.credits ?? 0) - responseData.creditsDeducted,
          );
        }

        if (typeof responseData?.downloadCredits === "number") {
          data.user.downloadCredits = responseData.downloadCredits;
        }
      }

      statusMessage = `Exported ${allData.length.toLocaleString("en-US")} contracts successfully.`;

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
  title="Download options screener data"
>
  <DownloadIcon class="w-4 h-4" />
</Button>

<input
  type="checkbox"
  id="options-screener-export-modal"
  class="modal-toggle"
  bind:checked={exportModalOpen}
/>

<dialog id="options-screener-export-modal" class="modal p-3 sm:p-0">
  <label
    for="options-screener-export-modal"
    class="cursor-pointer modal-backdrop bg-black/30"
    on:click={closeModal}
  ></label>

  <div
    class="modal-box w-full max-w-lg relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="options-screener-export-modal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg>
    </label>

    <h3
      class="font-semibold text-lg sm:text-xl text-gray-900 dark:text-zinc-100"
    >
      Export options screener data
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
      Export all {totalItems.toLocaleString("en-US")} matching contracts as a
      CSV file.
    </p>

    <div class="mt-3 text-xs text-gray-500 dark:text-zinc-400">
      <div>
        Estimated export cost: {estimatedCreditCost} credits.
      </div>
      <div>
        Cost range: {OPTIONS_SCREENER_EXPORT_CREDIT_MIN} - {OPTIONS_SCREENER_EXPORT_CREDIT_MAX}
        credits.
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
