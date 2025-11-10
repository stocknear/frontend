<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { onMount } from "svelte";
  import { indicatorData } from "$lib/store";

  export let data;
  export let checkedItems;
  export let ruleOfList;
  export let allRows;
  export let rawData;

  let searchQuery = "";
  let downloadWorker: Worker | undefined;
  let testList = [];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "eps",
  ]);
  const proOnlyItems = new Set(
    allRows
      ?.filter((item) => !excludedRules?.has(item?.rule)) // Exclude the items based on the rule
      ?.map((item) => item?.name), // Map the remaining items to their names
  );

  const handleDownloadMessage = (event) => {
    $indicatorData = event?.data?.rawData ?? [];
    console.log(event?.data?.rawData);
  };

  const updateStockScreenerData = async () => {
    console.log(rawData);
    downloadWorker.postMessage({
      ruleOfList: ruleOfList,
      tickerList: rawData?.map((item) => item?.symbol),
    });
  };

  async function handleResetAll() {
    searchQuery = "";
    ruleOfList = [
      { name: "Volume", rule: "volume", type: "int" },
      { name: "Market Cap", rule: "marketCap", type: "int" },
      { name: "Price", rule: "price", type: "float" },
      { name: "Change", rule: "changesPercentage", type: "percentSign" },
    ];
    ruleOfList = [...ruleOfList];
    checkedItems = new Set(ruleOfList.map((item) => item.name));
    allRows = sortIndicatorCheckMarks(allRows);
    await updateStockScreenerData();

    saveRules();
  }

  function handleInput(event) {
    searchQuery = event.target.value?.toLowerCase() || "";

    setTimeout(() => {
      testList = [];

      if (searchQuery.length > 0) {
        const rawList = allRows;
        testList =
          rawList?.filter((item) => {
            const index = item?.name?.toLowerCase();
            // Check if country starts with searchQuery
            return index?.startsWith(searchQuery);
          }) || [];
      }
    }, 50);
  }

  function isChecked(item) {
    return checkedItems?.has(item);
  }

  function sortIndicatorCheckMarks(allRows) {
    return allRows.sort((a, b) => {
      const isAChecked = checkedItems.has(a?.name);
      const isBChecked = checkedItems.has(b?.name);

      // Sort checked items first
      if (isAChecked !== isBChecked) return isAChecked ? -1 : 1;

      // Check if the user is not Pro
      if (!["Pro", "Plus"]?.includes(data?.user?.tier)) {
        const isAPriority = proOnlyItems.has(a?.name);
        const isBPriority = proOnlyItems.has(b?.name);

        // If both are priority items or both are not, sort alphabetically
        if (isAPriority === isBPriority) return a.name.localeCompare(b.name);

        // Move priority items to the bottom for non-Pro users
        return isAPriority ? 1 : -1;
      }

      // If the user is Pro, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  async function handleChangeValue(value) {
    if (checkedItems.has(value)) {
      checkedItems.delete(value); // Remove the value if it's already in the Set
    } else {
      checkedItems.add(value); // Add the value if it's not in the Set
      // Update ruleOfList based on checked items from indicatorList
    }
    ruleOfList = allRows.filter((item) => checkedItems.has(item.name)); // Assuming each item has a `value` property
    allRows = [...allRows];
    ruleOfList = [...ruleOfList];

    await updateStockScreenerData();
    allRows = sortIndicatorCheckMarks(allRows);
    saveRules();
  }

  function saveRules() {
    try {
      // Save the version along with the rules
      localStorage?.setItem(
        "watchlist-ruleOfList",
        JSON?.stringify(ruleOfList),
      );
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  onMount(async () => {
    try {
      allRows = sortIndicatorCheckMarks(allRows);

      //await getWatchlistData();

      // Initialize the download worker if not already done
      if (!downloadWorker) {
        const DownloadWorker = await import(
          "$lib/workers/downloadWorker?worker"
        );
        downloadWorker = new DownloadWorker.default();
        downloadWorker.onmessage = handleDownloadMessage;
        console.log("initialize");
      }
    } catch (e) {
      console.log(e);
    }
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      class="sm:ml-auto min-w-[110px] w-full sm:w-fit border-gray-600 border bg-default sm:hover:bg-primary ease-out flex flex-row justify-between items-center px-3 py-2.5 text-white rounded truncate"
    >
      <span class="truncate text-white text-sm sm:text-[1rem]">Indicators</span>
      <svg
        class="-mr-1 ml-2 h-5 w-5 inline-block"
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
    class="w-60 max-h-[400px] overflow-y-auto scroller relative"
  >
    <!-- Search Input -->
    <div
      class="sticky fixed -top-1 z-40 bg-default p-2 border-b border-gray-600"
    >
      <div class="relative w-full">
        <!-- Input Field -->
        <input
          bind:value={searchQuery}
          on:input={handleInput}
          autocomplete="off"
          autofocus=""
          class="text-sm w-full border-0 bg-default focus:border-gray-200 focus:ring-0 text-white placeholder:text-gray-300 pr-8"
          type="text"
          placeholder=""
        />

        <!-- Clear Button - Shown only when searchQuery has input -->
        {#if searchQuery?.length > 0}
          <button
            on:click={() => (searchQuery = "")}
            aria-label="Clear"
            title="Clear"
            tabindex="0"
            class="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <svg
              class="h-5 w-5 text-icon cursor-pointer"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        {/if}
      </div>
    </div>
    <!-- Dropdown items -->
    <DropdownMenu.Group class="pb-2">
      <!-- Added padding to avoid overlapping with Reset button -->
      {#each searchQuery?.length !== 0 ? testList : allRows as item}
        <DropdownMenu.Item class="sm:hover:bg-primary">
          <div class="flex items-center">
            {#if ["Pro", "Plus"]?.includes(data?.user?.tier) || excludedRules?.has(item?.rule)}
              <label
                on:click|capture={(event) => {
                  event.preventDefault();
                  handleChangeValue(item?.name);
                }}
                class="cursor-pointer text-white"
                for={item?.name}
              >
                <input
                  type="checkbox"
                  class="rounded"
                  checked={isChecked(item?.name)}
                />
                <span class="ml-2">{item?.name}</span>
              </label>
            {:else}
              <a href="/pricing" class="cursor-pointer text-white">
                <svg
                  class="h-[18px] w-[18px] inline-block text-icon group-hover:text-dark-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style="max-width:40px"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span class="ml-2">{item?.name}</span>
              </a>
            {/if}
          </div>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Group>
    <!-- Reset Selection button -->
    <div
      class="sticky -bottom-1 bg-default z-50 p-2 border-t border-gray-600 w-full"
    >
      <label
        on:click={handleResetAll}
        class="w-full sm:hover:text-white text-gray-300 bg-default text-start text-sm cursor-pointer"
      >
        Reset Selection
      </label>
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Root>
