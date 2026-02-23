<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import DownloadIcon from "lucide-svelte/icons/download";

  export let data: any;
  export let displayedData: any[] = [];
  export let screener: string;
  export let title = "screener_data";
  export let creditCost = 5;
  export let fetchAllData: (() => Promise<any[]>) | undefined = undefined;
  export let modalTitle = "Export screener data";
  export let itemLabel = "rows";
  export let allowedTiers: string[] = ["Pro"];

  let exportModalOpen = false;
  let isExporting = false;
  let errorMessage = "";
  let statusMessage = "";
  let fetchedData: any[] | null = null;

  $: availableCredits = data?.user?.credits ?? 0;
  $: isEligible = data?.user && allowedTiers.includes(data?.user?.tier);
  $: displayedCount = fetchedData
    ? fetchedData.length
    : (displayedData?.length ?? 0);
  $: hasEnoughCredits = availableCredits >= creditCost;

  const openModal = () => {
    if (!data?.user) {
      goto("/pricing");
      return;
    }
    exportModalOpen = true;
    errorMessage = "";
    statusMessage = "";
    fetchedData = null;
  };

  const closeModal = () => {
    exportModalOpen = false;
    fetchedData = null;
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
      errorMessage = "Sign in to export data.";
      return;
    }

    if (!isEligible) {
      errorMessage = "Upgrade to Pro to export data.";
      return;
    }

    if (!hasEnoughCredits) {
      errorMessage = `Insufficient credits. This export costs ${creditCost} credits, but your balance is ${availableCredits}.`;
      return;
    }

    isExporting = true;
    errorMessage = "";
    statusMessage = "Validating export...";

    try {
      const response = await fetch("/api/screener-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screener }),
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

      let exportData: any[];
      if (fetchAllData) {
        statusMessage = "Fetching all filtered data...";
        exportData = await fetchAllData();
      } else {
        exportData = displayedData ?? [];
      }

      if (!exportData || exportData.length === 0) {
        errorMessage = "No data available to export.";
        statusMessage = "";
        return;
      }

      fetchedData = exportData;

      const csvContent = generateCSVContent(exportData);
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

      statusMessage = `Exported ${exportData.length.toLocaleString("en-US")} ${itemLabel} successfully.`;

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
  title="Download screener data"
>
  <DownloadIcon class="w-4 h-4" />
</Button>

<input
  type="checkbox"
  id="screener-export-modal-{screener}"
  class="modal-toggle"
  bind:checked={exportModalOpen}
/>

<dialog id="screener-export-modal-{screener}" class="modal p-3 sm:p-0">
  <label
    for="screener-export-modal-{screener}"
    class="cursor-pointer modal-backdrop bg-black/30"
    on:click={closeModal}
  ></label>

  <div
    class="modal-box w-full max-w-lg relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="screener-export-modal-{screener}"
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
        /></svg
      >
    </label>

    <h3
      class="font-semibold text-lg sm:text-xl text-gray-900 dark:text-zinc-100"
    >
      {modalTitle}
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
      {#if fetchAllData}
        Export all filtered {itemLabel} as a CSV file.
      {:else}
        Export {displayedCount.toLocaleString("en-US")} currently displayed {itemLabel}
        as a CSV file.
      {/if}
    </p>

    <div class="mt-3 text-xs text-gray-500 dark:text-zinc-400">
      <div>
        Export cost: {creditCost} credits.
      </div>
      {#if data?.user}
        <div>
          Balance: {availableCredits}
          {data?.user?.tier ? `(${data?.user?.tier})` : ""}
        </div>
        {#if !isEligible}
          <div class="text-rose-800 dark:text-rose-400">
            Available for {allowedTiers.join(" and ")} only.
          </div>
        {/if}
      {:else}
        <div class="text-rose-800 dark:text-rose-400">
          Available for {allowedTiers.join(" and ")} only.
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
