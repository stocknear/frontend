<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import {
    common_bulk_download,
    common_credit_cost_total,
    common_credits_cost,
    common_credits_left,
    common_download,
    common_download_csv,
    common_download_excel,
    common_toast_add_tickers,
    common_toast_download_abusive,
    common_toast_download_complete,
    common_toast_download_failed,
    common_toast_download_no_data,
    common_toast_download_preparing,
    common_toast_downloading,
    common_toast_not_enough_credits,
    common_toast_select_bulk,
  } from "$lib/paraglide/messages";

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
      toast.error(common_toast_download_preparing(), {
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

    if (data?.user?.downloadCredits > 500) {
      toast.error(common_toast_download_abusive(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    toast.promise(
      (async () => {
        const response = await fetch("/api/download-checker", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Download request failed");
        }

        const dataset = await ensureDownloadData();

        if (!dataset?.length) {
          toast.error(common_toast_download_no_data(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          return;
        }

        if (format === "csv") {
          exportCSV(dataset);
        } else if (format === "excel") {
          exportExcel(dataset);
        }
      })(),
      {
        loading: common_toast_downloading(),
        success: common_toast_download_complete(),
        error: common_toast_download_failed(),
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      },
    );
  };

  const normalizeExportRows = (dataset: any[]) => {
    const normalizedRows = [];

    // Expand symbolList arrays into individual rows and remove UI-only fields.
    for (const row of dataset) {
      if (row.symbolList && Array.isArray(row.symbolList)) {
        for (const symbol of row.symbolList) {
          const newRow = { ...row, symbol };
          delete newRow.symbolList;
          delete newRow.hasNote;
          normalizedRows.push(newRow);
        }
      } else {
        const newRow = { ...row };
        delete newRow.hasNote;
        normalizedRows.push(newRow);
      }
    }

    return normalizedRows;
  };

  const generateCSVContent = (dataset: any[]) => {
    const csvRows: string[] = [];
    const normalizedRows = normalizeExportRows(dataset);

    // Clean data first
    const cleanedData = normalizedRows.map((row) => {
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
    const normalizedRows = normalizeExportRows(dataset);
    const worksheet = utils.json_to_sheet(normalizedRows);
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
      credit: 1,
    },
    {
      name: "Dark Pool",
      selected: true,
      credit: 1,
    },
  ];

  let totalCreditCost = 0;
  let showBulkOptions = false;

  async function handleBulkDownload() {
    const dataset = await ensureDownloadData();
    const tickers = dataset?.map((item) => item?.symbol);

    if (totalCreditCost === 0 || tickers?.length === 0) {
      toast.error(
        common_toast_select_bulk({
          type: tickers?.length === 0 ? "symbol" : "bulk data",
        }),
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
          loading: common_toast_downloading(),
          success: common_toast_download_complete(),
          error: common_toast_download_failed(),
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
    } else if (tickers?.length === 0) {
      toast.error(common_toast_add_tickers(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      toast.error(common_toast_not_enough_credits(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  $: {
    if (bulkDownload && bulkData) {
      const tickers = rawData?.map((item) => item?.symbol); // example tickers

      totalCreditCost =
        tickers?.length *
        bulkData?.reduce((sum, item) => {
          return item.selected ? sum + item.credit : sum;
        }, 0);
    } else {
      totalCreditCost = 0;
    }
  }
</script>

<div class="flex flex-row items-center space-x-2 w-fit">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        on:click={() => (showBulkOptions = false)}
        class="shadow-sm transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center w-full sm:w-auto px-3 py-2 rounded-full truncate"
      >
        <span class="truncate text-[0.85rem] sm:text-sm">
          {common_download()}
        </span>
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
      class="{showBulkOptions && bulkDownload
        ? 'w-auto min-w-64 max-w-80'
        : 'min-w-36 w-auto max-w-60'} max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 shadow-lg shadow-black/5 p-2"
    >
      {#if showBulkOptions && bulkDownload}
        <DropdownMenu.Label
          class="text-gray-500 dark:text-zinc-400 font-semibold dark:font-normal text-xs"
        >
          {common_credits_left({ count: data?.user?.credits })}
        </DropdownMenu.Label>
        <DropdownMenu.Group class="pb-2">
          <div class="w-full p-1 flex items-stretch gap-1">
            <button
              type="button"
              on:click|capture={(event) => {
                event.preventDefault();
                showBulkOptions = false;
              }}
              class="aspect-square flex items-center cursor-pointer"
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg
              >
            </button>
          </div>

          {#each bulkData as item}
            <DropdownMenu.Item
              class="cursor-pointer sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
                  >{common_credits_cost({ count: item?.credit })}</span
                >
                <div class="relative ml-auto">
                  <input
                    type="checkbox"
                    checked={item?.selected}
                    class="sr-only peer"
                  />
                  <div
                    class="w-9 h-5 bg-gray-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-gray-900 dark:peer-checked:bg-white
      after:content-[''] after:absolute after:top-0.5 after:left-[2px]
      after:bg-white dark:after:bg-zinc-200 after:border-gray-300 dark:after:border-zinc-600 dark:peer-checked:after:bg-zinc-900 dark:peer-checked:after:border-zinc-800 after:border
      after:rounded-full after:h-4 after:w-4 after:transition-all
      peer-checked:after:translate-x-full"
                  ></div>
                </div></label
              >
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>

        <div
          class="sticky -bottom-1 bg-white/90 dark:bg-zinc-950/90 z-50 p-2 border-t border-gray-300 dark:border-zinc-700 w-full flex justify-between items-center"
        >
          <span
            class="w-full text-gray-500 dark:text-zinc-400 bg-white/0 font-semibold dark:font-normal text-start text-xs select-none"
          >
            {common_credit_cost_total({ count: totalCreditCost })}
          </span>
          <button
            on:click={handleBulkDownload}
            class="whitespace-nowrap w-full flex justify-end text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-zinc-200 text-start text-sm cursor-pointer"
          >
            {common_bulk_download()}
          </button>
        </div>
      {:else}
        <DropdownMenu.Group>
          <DropdownMenu.Item
            on:click={() => download("csv")}
            class="cursor-pointer sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
          >
            <span>{common_download_csv()}</span>
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
            class="cursor-pointer sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
          >
            <span>{common_download_excel()}</span>
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

          {#if bulkDownload}
            <DropdownMenu.Item
              on:click={(event) => {
                event.preventDefault();
                showBulkOptions = true;
              }}
              class="cursor-pointer sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
            >
              <div class="flex flex-row items-center w-full">
                <span>{common_bulk_download()}</span>
                <svg
                  class="ml-auto h-5 w-5 inline-block rotate-270"
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
              </div>
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Group>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
