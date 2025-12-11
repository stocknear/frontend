<script>
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import ArrowUp from "lucide-svelte/icons/trending-up";
  import ArrowDown from "lucide-svelte/icons/trending-down";
  import News from "lucide-svelte/icons/newspaper";
  import AnalystReport from "lucide-svelte/icons/file-chart-column-increasing";
  import UpcomingEarnings from "lucide-svelte/icons/send-horizontal";
  import RecentEarnings from "lucide-svelte/icons/chart-no-axes-combined";
  import EconomicCalendar from "lucide-svelte/icons/loader";
  import OptionsFlow from "lucide-svelte/icons/waves";
  import DarkPool from "lucide-svelte/icons/venetian-mask";

  export let data;
  // Mock team item data with gradient avatar colors
  const initialAvailableWidgets = [
    {
      id: "gainers",
      name: "Top Gainers",
      key: "gainers",
      description: "Stocks with the highest % Change for today",
    },
    {
      id: "losers",
      name: "Top Losers",
      description: "Stocks with the lowest % Change for today",
    },
    {
      id: "wiim",
      name: "Stock & Market News",
      description: "Understand why priced moved in realtime",
    },
    {
      id: "analystReport",
      name: "Analyst Insight Report",
      description:
        "Latest Analyst report summarized to get the most valueable insights.",
    },
    {
      id: "upcomingEarnings",
      name: "Upcoming Earnings",
      description: "The latest upcoming earnings for today.",
    },
    {
      id: "recentEarnings",
      name: "Recent Earnings",
      description: "The latest recent earnings for today.",
    },
    {
      id: "economicCalendar",
      name: "Economic Calendar",
      description: "Latest Economic Events for the US.",
    },
    {
      id: "optionsFlow",
      name: "Options Flow Order",
      description: "Realtime Unusual Options Flow Orders from big whales.",
    },
    {
      id: "darkpool",
      name: "Dark Pool Order",
      description: "Realtime Unusual Dark Pool Orders from big whales.",
    },
  ];

  let defaultWidgets = [
    "gainers",
    "losers",
    "wiim",
    "analystReport",
    "upcomingEarnings",
    "recentEarnings",
  ];

  // Fix applied here: If data?.getCustomSettings is null, undefined, or an empty array,
  // selectedWidgets will be initialized with the widgets corresponding to the ids in defaultWidgets.
  // Otherwise, it will use the value from data?.getCustomSettings.
  let selectedWidgets =
    data?.getCustomSettings && data.getCustomSettings.length > 0
      ? data.getCustomSettings
      : initialAvailableWidgets?.filter((item) =>
          defaultWidgets.includes(item.id),
        );

  // Create a Set of widget names that are selected or default
  // This part of the logic is now simplified as selectedWidgets is correctly initialized
  const selectedWidgetIds = new Set(selectedWidgets?.map((w) => w?.id));

  // Filter available widgets
  // Available widgets are those from initialAvailableWidgets whose ids are NOT in selectedWidgetIds
  let availableWidgets = initialAvailableWidgets?.filter((item) => {
    return !selectedWidgetIds?.has(item?.id);
  });

  // Note: The original code also attempted to push items into selectedWidgets within the filter loop.
  // With the corrected initialization of selectedWidgets, this is no longer necessary
  // and has been removed for clarity and correctness.
  async function handleSaveSettings() {
    if (selectedWidgets?.length < 2) {
      toast.error("At least two widget is required!");
      return;
    }
    if (selectedWidgets?.length > 10) {
      toast.error("You can select up to 8 widgets only.");
      return;
    }
    const postData = {
      selectedWidgets,
    };
    // build the promise that does the work
    const savePromise = fetch("/api/custom-dashboard-widget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    }).then((res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    });

    // show toast while promise is pending
    toast.promise(
      savePromise,
      {
        loading: "Saving Custom Settings...",
        success: () => {
          // you can trigger any additional UI feedback here,
          // or just return an empty string if you don't want a second toast
          return "Settings Saved!";
        },
        error: "Something went wrong. Please try again later!",
      },
      {
        style: {
          borderRadius: "5px",
          background: "#fff",
          color: "#000",
          borderColor: $mode === "light" ? "#F9FAFB" : "#4B5563",
          fontSize: "15px",
        },
      },
    );
  }

  function handleDefaultSettings() {
    defaultWidgets = [
      "gainers",
      "losers",
      "wiim",
      "analystReport",
      "upcomingEarnings",
      "recentEarnings",
    ];

    selectedWidgets = [];
    const defaultWidgetSet = new Set(defaultWidgets);

    availableWidgets = initialAvailableWidgets?.filter((item) => {
      if (defaultWidgetSet?.has(item.id)) {
        selectedWidgets?.push(item);
        return false; // remove from availableWidgets
      }
      return true; // keep in availableWidgets
    });
  }

  const flipDurationMs = 300;
  const groupType = "items";

  function handleDndConsider(e, target) {
    const { items, info } = e.detail;

    // Cross-zone drag: move item between arrays
    if (info.trigger === "drop" && info.destination !== info.source) {
      const moved = items.find(
        (i) =>
          !(target === "available"
            ? selectedWidgets.some((s) => s.id === i.id)
            : availableWidgets.some((a) => a.id === i.id)),
      );

      if (moved) {
        // **NEW GUARD**: don’t allow removing the last widget
        if (target === "available" && selectedWidgets.length <= 1) {
          toast.error("At least one widget is needed");
          return; // abort the drop
        }

        if (target === "selected") {
          availableWidgets = availableWidgets.filter((m) => m.id !== moved.id);
          selectedWidgets = [...selectedWidgets, moved];
        } else {
          selectedWidgets = selectedWidgets.filter((m) => m.id !== moved.id);
          availableWidgets = [...availableWidgets, moved];
        }
        return;
      }
    }

    // Same-zone reorder
    if (target === "available") availableWidgets = items;
    else selectedWidgets = items;
  }

  function handleDndFinalize(e, target) {
    handleDndConsider(e, target);
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">Customization</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              Custom Dashboard
            </h1>
          </div>
          <div
            class="w-full flex flex-row items-center justify-center sm:justify-end"
          >
            <button
              type="button"
              on:click={handleSaveSettings}
              class="w-full sm:w-fit cursor-pointer sm:ml-auto align-middle inline-flex items-center gap-x-1.5 rounded px-2.5 py-2 text-sm font-semibold shadow border-gray-300 dark:border-gray-600 border sm:hover:bg-gray-200 dark:sm:hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-none transition duration-150 ease-in-out whitespace-nowrap"
            >
              <svg
                class="w-3.5 h-3.5 inline-block cursor-pointer shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                ><path
                  fill="currentColor"
                  d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                /></svg
              >
              Save Custom
            </button>

            <button
              type="button"
              on:click={handleDefaultSettings}
              class="w-full sm:w-fit cursor-pointer ml-3 align-middle inline-flex items-center gap-x-1.5 rounded px-2.5 py-2 text-sm font-semibold shadow border-gray-300 dark:border-gray-600 border sm:hover:bg-gray-200 dark:sm:hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-none transition duration-150 ease-in-out whitespace-nowrap"
            >
              <svg
                class="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 21 21"
                ><g
                  fill="none"
                  fill-rule="evenodd"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" /><path
                    d="M7.5 6.5h-4v-4"
                  /></g
                ></svg
              >
              Default Settings
            </button>
          </div>

          <div class="mt-5">
            <div class="flex flex-col sm:flex-row items-start gap-8">
              <!-- Available Widgets -->
              <div class="flex-1 rounded shadow">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-bold">Available Widgets</h2>
                  <div class="relative flex-shrink-0">
                    <span
                      class="bg-blue-100 dark:bg-[#2A2E39] dark:text-white text-blue-800 w-6 h-6 flex items-center justify-center rounded-full text-sm"
                    >
                      {availableWidgets?.length}
                    </span>
                  </div>
                </div>

                <div
                  use:dndzone={{
                    items: availableWidgets,
                    flipDurationMs,
                    type: groupType,
                  }}
                  on:consider={(e) => handleDndConsider(e, "available")}
                  on:finalize={(e) => handleDndFinalize(e, "available")}
                  class="space-y-4 min-h-[10rem] max-h-[500px] sm:max-h-[700px] overflow-y-auto border border-gray-300 dark:border-gray-800 rounded p-4"
                  class:flex={availableWidgets?.length === 0}
                  class:items-center={availableWidgets?.length === 0}
                  class:justify-center={availableWidgets?.length === 0}
                >
                  {#if availableWidgets.length === 0}
                    <p class="text-gray-700 dark:text-gray-400">
                      Drop Dashboard Widgets here
                    </p>
                  {/if}
                  {#each availableWidgets as item (item.id)}
                    <div
                      animate:flip={{ duration: flipDurationMs }}
                      class="border border-gray-200 dark:border-gray-800 rounded p-4 shadow"
                    >
                      <div class="flex items-center space-x-4">
                        <div
                          class="relative border border-gray-300 dark:border-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                        >
                          {#if item?.id === "gainers"}
                            <ArrowUp class="w-5 h-5" />
                          {:else if item?.id === "losers"}
                            <ArrowDown class="w-5 h-5" />
                          {:else if item?.id === "wiim"}
                            <News class="w-5 h-5" />
                          {:else if item?.id === "analystReport"}
                            <AnalystReport class="w-5 h-5" />
                          {:else if item?.id === "upcomingEarnings"}
                            <UpcomingEarnings class="w-5 h-5" />
                          {:else if item?.id === "recentEarnings"}
                            <RecentEarnings class="w-5 h-5" />
                          {:else if item?.id === "economicCalendar"}
                            <EconomicCalendar class="w-5 h-5" />
                          {:else if item?.id === "optionsFlow"}
                            <OptionsFlow class="w-5 h-5" />
                          {:else if item?.id === "darkpool"}
                            <DarkPool class="w-5 h-5" />
                          {/if}
                        </div>

                        <div>
                          <h3 class="font-medium">{item.name}</h3>
                          <p class="text-gray-600 dark:text-gray-300 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Selected items -->
              <div class="flex-1 rounded shadow">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-bold">Selected Widgets</h2>
                  <div class="relative flex-shrink-0">
                    <span
                      class="bg-blue-100 dark:bg-[#2A2E39] dark:text-white text-blue-800 w-6 h-6 flex items-center justify-center rounded-full text-sm"
                    >
                      {selectedWidgets?.length}
                    </span>
                  </div>
                </div>

                <div
                  use:dndzone={{
                    items: selectedWidgets,
                    flipDurationMs,
                    type: groupType,
                  }}
                  on:consider={(e) => handleDndConsider(e, "selected")}
                  on:finalize={(e) => handleDndFinalize(e, "selected")}
                  class="space-y-4 min-h-[10rem] border-2 border-dashed border-gray-300 dark:border-gray-800 rounded p-4"
                  class:flex={selectedWidgets.length === 0}
                  class:items-center={selectedWidgets.length === 0}
                  class:justify-center={selectedWidgets.length === 0}
                >
                  {#if selectedWidgets.length === 0}
                    <p class="text-gray-700 dark:text-gray-400">
                      Drop Dashboard Widgets here
                    </p>
                  {:else}
                    {#each selectedWidgets as item (item.id)}
                      <div
                        animate:flip={{ duration: flipDurationMs }}
                        class="border border-gray-200 dark:border-gray-800 rounded p-4 shadow"
                      >
                        <div class="flex items-center space-x-4">
                          <div
                            class="relative border border-gray-300 dark:border-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                          >
                            {#if item?.id === "gainers"}
                              <ArrowUp class="w-5 h-5" />
                            {:else if item?.id === "losers"}
                              <ArrowDown class="w-5 h-5" />
                            {:else if item?.id === "wiim"}
                              <News class="w-5 h-5" />
                            {:else if item?.id === "analystReport"}
                              <AnalystReport class="w-5 h-5" />
                            {:else if item?.id === "upcomingEarnings"}
                              <UpcomingEarnings class="w-5 h-5" />
                            {:else if item?.id === "recentEarnings"}
                              <RecentEarnings class="w-5 h-5" />
                            {:else if item?.id === "economicCalendar"}
                              <EconomicCalendar class="w-5 h-5" />
                            {:else if item?.id === "optionsFlow"}
                              <OptionsFlow class="w-5 h-5" />
                            {:else if item?.id === "darkpool"}
                              <DarkPool class="w-5 h-5" />
                            {/if}
                          </div>
                          <div>
                            <h3 class="font-medium">{item.name}</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
