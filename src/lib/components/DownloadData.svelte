<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  export let data;
  export let rawData;
  export let title;
  export let bulkDownload = false;
  export let fetchRawData: (() => Promise<any[]>) | undefined;

  let isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier) ?? false;
  let isFetchingDownload = false;

  const ensureDownloadData = async () => {
    if (!fetchRawData) {
      return rawData;
    }

    if (isFetchingDownload) {
      return rawData;
    }

    try {
      isFetchingDownload = true;
      const result = await fetchRawData();
      if (Array.isArray(result)) {
        return result;
      }
      return rawData;
    } catch (error) {
      console.error("Failed to prepare download", error);
      toast.error("Unable to prepare download", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return rawData;
    } finally {
      isFetchingDownload = false;
    }
  };

  const download = async (format: string) => {
    if (!["Pro", "Plus"].includes(data?.user?.tier)) {
      goto("/pricing");
      return;
    }

    const dataset = await ensureDownloadData();

    if (!dataset?.length) {
      toast.error("No data available to download", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    if (format === "csv") {
      exportCSV(dataset);
    } else if (format === "excel") {
      exportExcel(dataset);
    }
  };

  const generateCSVContent = (dataset: any[]) => {
    const csvRows: string[] = [];

    // Expand symbolList arrays into individual rows
    const expandedData = [];
    for (const row of dataset) {
      if (row.symbolList && Array.isArray(row.symbolList)) {
        // Create a row for each symbol in symbolList
        for (const symbol of row.symbolList) {
          const newRow = { ...row };
          delete newRow.symbolList;
          newRow.symbol = symbol;
          expandedData.push(newRow);
        }
      } else {
        // Keep row as-is if no symbolList
        expandedData.push(row);
      }
    }

    // Clean data first
    const cleanedData = expandedData.map((row) => {
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
        ?.map((header) => {
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

  const exportCSV = (dataset: any[]) => {
    const csv = generateCSVContent(dataset);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${title}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = async (dataset: any[]) => {
    const { utils, writeFile } = await import("xlsx");

    // Expand symbolList arrays into individual rows
    const expandedData = [];
    for (const row of dataset) {
      if (row.symbolList && Array.isArray(row.symbolList)) {
        // Create a row for each symbol in symbolList
        for (const symbol of row.symbolList) {
          const newRow = { ...row };
          delete newRow.symbolList;
          newRow.symbol = symbol;
          expandedData.push(newRow);
        }
      } else {
        // Keep row as-is if no symbolList
        expandedData.push(row);
      }
    }

    const worksheet = utils.json_to_sheet(expandedData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sheet1");
    writeFile(workbook, `${title}.xlsx`);
  };

  let bulkData = [
    {
      name: "Stock Price",
      selected: true,
      credit: 1,
    },
    {
      name: "Dividends",
      selected: true,
      credit: 1,
    },
    {
      name: "Options",
      selected: true,
      credit: 3,
    },
    {
      name: "Dark Pool",
      selected: true,
      credit: 2,
    },
  ];

  let totalCreditCost = 0;

  async function handleBulkDownload() {
    const dataset = await ensureDownloadData();
    const tickers = dataset?.map((item) => item?.symbol);

    if (totalCreditCost === 0 || tickers?.length === 0) {
      toast.error(
        `Select at least one ${tickers?.length === 0 ? "symbol" : "bulk data"} to download`,
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
      return;
    }

    if (data?.user?.credits > totalCreditCost && tickers?.length > 0) {
      toast.promise(
        (async () => {
          data.user.credits = data.user.credits - totalCreditCost;

          const response = await fetch("/api/bulk-download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tickers: tickers, bulkData: bulkData }),
          });

          if (!response.ok) {
            throw new Error("Download request failed");
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "historical_data.zip";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        })(),
        {
          loading: "Downloading data...",
          success: "Download complete!",
          error: "Download failed. Try again.",
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
    } else if (tickers?.length === 0) {
      toast.error("Add tickers first to your watchlist", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      toast.error("Not enough credits", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  $: {
    if (bulkData) {
      const tickers = rawData?.map((item) => item?.symbol); // example tickers

      totalCreditCost =
        tickers?.length *
        bulkData?.reduce((sum, item) => {
          return item.selected ? sum + item.credit : sum;
        }, 0);
    }
  }
</script>

<div class="flex flex-row items-center space-x-2 w-full">
  {#if bulkDownload}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  w-full sm:w-auto px-3 rounded truncate"
        >
          <span class="truncate text-[0.85rem] sm:text-sm">Bulk Download</span>
          <svg
            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="bottom"
        align="end"
        sideOffset={10}
        alignOffset={0}
        class="w-auto min-w-64 max-w-80 max-h-[400px] overflow-y-auto scroller relative"
      >
        <DropdownMenu.Label
          class="text-muted dark:text-gray-400 font-semibold dark:font-normal text-xs"
        >
          {data?.user?.credits} Credits left
        </DropdownMenu.Label>
        <!-- Dropdown items -->
        <DropdownMenu.Group class="pb-2">
          {#each bulkData as item}
            <DropdownMenu.Item
              class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
            >
              <label
                on:click|capture={(event) => {
                  event.preventDefault();
                  item.selected = !item?.selected;
                }}
                class="inline-flex justify-between w-full items-center cursor-pointer"
              >
                <span class="mr-1 text-sm">{item?.name}</span>
                <span class="mr-2 text-xs inline-block"
                  >({item?.credit} Credits)</span
                >
                <div class="relative ml-auto">
                  <input
                    type="checkbox"
                    checked={item?.selected}
                    class="sr-only peer"
                  />
                  <div
                    class="w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-blue-600
      after:content-[''] after:absolute after:top-0.5 after:left-[2px]
      after:bg-white after:border-gray-300 after:border
      after:rounded-full after:h-4 after:w-4 after:transition-all
      peer-checked:after:translate-x-full"
                  ></div>
                </div></label
              >
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
        <div
          class="sticky -bottom-1 bg-white dark:bg-default z-50 p-2 border-t border-gray-300 dark:border-gray-600 w-full flex justify-between items-center"
        >
          <span
            class="w-full text-muted dark:text-gray-300 bg-white dark:bg-default font-semibold dark:font-normal text-start text-xs select-none"
          >
            = Credit Cost {totalCreditCost}
          </span>
          <button
            on:click={handleBulkDownload}
            class="whitespace-nowrap w-full flex justify-end dark:sm:hover:text-white text-muted dark:text-gray-300 bg-white dark:bg-default text-start text-sm cursor-pointer"
          >
            Bulk Download
          </button>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  w-full sm:w-auto px-3 rounded truncate"
        >
          <span class="truncate text-[0.85rem] sm:text-sm"> Download </span>
          <svg
            class="-mr-1 ml-1 h-5 w-5 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="bottom"
        align="end"
        sideOffset={10}
        alignOffset={0}
        class="min-w-36 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
      >
        <DropdownMenu.Group>
          <DropdownMenu.Item
            on:click={() => download("csv")}
            class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary cursor-pointer flex flex-row items-center justify-between"
          >
            <span>Download to CSV</span>
            {#if !isSubscribed}
              <svg
                class="ml-1 size-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width: 40px;"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                >
                </path>
              </svg>
            {/if}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            on:click={() => download("excel")}
            class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary cursor-pointer flex flex-row items-center justify-between"
          >
            <span>Download to Excel</span>
            {#if !isSubscribed}
              <svg
                class="ml-1 size-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width: 40px;"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                >
                </path>
              </svg>
            {/if}
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
