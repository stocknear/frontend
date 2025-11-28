<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import { onDestroy } from "svelte";

  import VirtualList from "svelte-tiny-virtual-list";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Spark from "lucide-svelte/icons/sparkles";

  export let data;
  export let optionsWatchlist;
  export let displayedData = [];
  export let filteredData = [];
  export let rawData = [];

  let selectedOptionData = "";
  let optionsInsightContent = "";
  let optionsInsightThoughts = "";
  let isStreaming = false;

  // Internal sorted data that we control
  let sortedDisplayData = [];
  //  let animationClass = "";
  //  let animationId = "";

  // Clear all options insight cache when component is destroyed (leaving the page)
  onDestroy(() => {
    clearAllOptionsInsightCache();
  });

  function formatTime(timeString) {
    // Split the time string into components
    const [hours, minutes, seconds] = timeString?.split(":").map(Number);

    // Determine AM or PM
    const period = hours >= 12 ? "PM" : "AM";

    // Convert hours from 24-hour to 12-hour format
    const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight

    // Format the time string
    const formattedTimeString = `${formattedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;

    return formattedTimeString;
  }

  function reformatDate(dateString) {
    return (
      dateString.substring(5, 7) +
      "/" +
      dateString.substring(8) +
      "/" +
      dateString.substring(2, 4)
    );
  }
  /*
  async function addToWatchlist(itemId) {
    if (data?.user?.tier === "Pro") {
      try {
        const postData = {
          itemIdList: [itemId],
          id: optionsWatchlist?.id,
        };

        if (optionsWatchlist?.optionsId?.includes(itemId)) {
          // Remove ticker from the watchlist.
          optionsWatchlist.optionsId = optionsWatchlist?.optionsId.filter(
            (item) => item !== itemId,
          );
        } else {
          // Add ticker to the watchlist.
          animationId = itemId;
          animationClass = "heartbeat";
          const removeAnimation = () => {
            animationId = "";
            animationClass = "";
          };
          optionsWatchlist.optionsId = [...optionsWatchlist?.optionsId, itemId];
          const heartbeatElement = document.getElementById(itemId);
          if (heartbeatElement) {
            // Only add listener if it's not already present
            if (!heartbeatElement.classList.contains("animation-added")) {
              heartbeatElement.addEventListener(
                "animationend",
                removeAnimation,
              );
              heartbeatElement.classList.add("animation-added"); // Prevent re-adding listener
            }
          }
        }

        const response = await fetch("/api/update-options-watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        optionsWatchlist.id = await response.json();
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
      } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately (e.g., show an error message to the user)
      }
    } else {
      toast.error("Unlock this feature with Pro Subscription", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }
    */

  async function optionsInsight(optionsData) {
    optionsInsightContent = ""; // Clear previous content
    optionsInsightThoughts = ""; // Clear previous thoughts

    if (data?.user?.tier === "Pro") {
      try {
        // Create cache key based on options data
        const cacheKey = `options_insight_${Object.entries(optionsData)
          ?.sort(([a], [b]) => a.localeCompare(b)) // sort keys alphabetically
          ?.map(([_, v]) => v ?? "") // use values, fallback empty if undefined/null
          ?.join("_")}`;
        const cacheExpiration = 30 * 60 * 1000; // 30 minutes in milliseconds

        // Check cache first
        const cachedData = getCachedOptionsInsight(cacheKey, cacheExpiration);

        if (cachedData) {
          // Use cached data - no credit deduction
          selectedOptionData = optionsData;
          optionsInsightContent = cachedData.content;

          const clicked = document.getElementById("optionsInsightModal");
          clicked?.dispatchEvent(new MouseEvent("click"));

          return;
        }

        // Check credits only if not cached
        if (data?.user?.credits < 2) {
          toast?.error(
            `Insufficient credits. Your current balance is ${data?.user?.credits}.`,
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          return;
        }

        selectedOptionData = optionsData;
        isStreaming = true;

        const clicked = document.getElementById("optionsInsightModal");
        clicked?.dispatchEvent(new MouseEvent("click"));

        const postData = {
          optionsData: optionsData,
        };

        const response = await fetch("/api/options-insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          optionsInsightContent = "Error loading analysis. Please try again.";
          isStreaming = false;
          return;
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalContent = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const json = JSON.parse(line);

              if (json.error) {
                console.error("Stream error:", json.error);
                optionsInsightContent =
                  "Error loading analysis. Please try again.";
                isStreaming = false;
                return;
              }

              if (json.thoughts) {
                optionsInsightThoughts = json.thoughts;
              }

              if (json.content) {
                optionsInsightContent = json.content;
                finalContent = json.content; // Store for caching
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }

        isStreaming = false;

        // Only deduct credits and cache if we got a successful response
        if (finalContent) {
          // Deduct credits only for new API calls
          if (data?.user) {
            data.user.credits -= 2;
          }

          // Cache the result
          setCachedOptionsInsight(cacheKey, finalContent);
        }
      } catch (error) {
        console.error("An error occurred:", error);
        optionsInsightContent = "Error loading analysis. Please try again.";
        isStreaming = false;
      }
    } else {
      toast.error("Unlock this feature with Pro Subscription", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  // Helper function to get cached data
  function getCachedOptionsInsight(cacheKey, expirationMs) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired
      if (now - parsedCache.timestamp > expirationMs) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }

  // Helper function to set cached data
  function setCachedOptionsInsight(cacheKey, content) {
    try {
      const cacheData = {
        content: content,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Clean up old cache entries to prevent localStorage bloat
      cleanupOldCache();
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }

  // Helper function to clean up old cache entries
  function cleanupOldCache() {
    try {
      const keys = Object.keys(localStorage);
      const optionsInsightKeys = keys.filter((key) =>
        key.startsWith("options_insight_"),
      );
      const maxCacheEntries = 50; // Keep only the 50 most recent entries

      if (optionsInsightKeys.length > maxCacheEntries) {
        // Sort by timestamp and remove oldest entries
        const entries = optionsInsightKeys
          .map((key) => {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              return { key, timestamp: data.timestamp || 0 };
            } catch {
              return { key, timestamp: 0 };
            }
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        // Remove excess entries
        const entriesToRemove = entries.slice(maxCacheEntries);
        entriesToRemove.forEach((entry) => {
          localStorage.removeItem(entry.key);
        });
      }
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }

  // Helper function to clear all options insight cache data
  function clearAllOptionsInsightCache() {
    try {
      const keys = Object.keys(localStorage);
      const optionsInsightKeys = keys.filter((key) =>
        key.startsWith("options_insight_"),
      );

      optionsInsightKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(
        `Cleared ${optionsInsightKeys.length} options insight cache entries`,
      );
    } catch (error) {
      console.error("Error clearing options insight cache:", error);
    }
  }

  let sortOrders = {
    time: "none",
    ticker: "none",
    expiry: "none",
    dte: "none",
    strike: "none",
    callPut: "none",
    sentiment: "none",
    spot: "none",
    price: "none",
    premium: "none",
    type: "none",
    exec: "none",
    vol: "none",
    oi: "none",
  };

  // Store the current sort key and order
  let currentSortKey = null;
  let currentSortOrder = "none";

  // Generalized sorting function
  function sortData(key) {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k] = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key]);
    sortOrders[key] = orderCycle[(currentOrderIndex + 1) % orderCycle.length];

    const sortOrder = sortOrders[key];

    // Store current sort state
    currentSortKey = key;
    currentSortOrder = sortOrder;

    const originalData = [...displayedData];

    // Reset to original data when 'none'
    if (sortOrder === "none") {
      currentSortKey = null;
      currentSortOrder = "none";
      sortedDisplayData = originalData;
      return;
    }

    const compareFunctions = {
      time: (a, b) => {
        const timeA = new Date("1970-01-01T" + a.time).getTime();
        const timeB = new Date("1970-01-01T" + b.time).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      ticker: (a, b) => {
        const tickerA = a.ticker.toUpperCase();
        const tickerB = b.ticker.toUpperCase();
        return sortOrder === "asc"
          ? tickerA.localeCompare(tickerB)
          : tickerB.localeCompare(tickerA);
      },
      expiry: (a, b) => {
        const timeA = new Date(a.date_expiration);
        const timeB = new Date(b.date_expiration);
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      dte: (a, b) => {
        const timeA = new Date(a.date_expiration);
        const timeB = new Date(b.date_expiration);
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      strike: (a, b) => {
        const strikeA = parseFloat(a.strike_price);
        const strikeB = parseFloat(b.strike_price);
        return sortOrder === "asc" ? strikeA - strikeB : strikeB - strikeA;
      },
      spot: (a, b) => {
        const spotA = parseFloat(a.underlying_price);
        const spotB = parseFloat(b.underlying_price);
        return sortOrder === "asc" ? spotA - spotB : spotB - spotA;
      },
      price: (a, b) => {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      },
      premium: (a, b) => {
        const premiumA = parseFloat(a.cost_basis);
        const premiumB = parseFloat(b.cost_basis);
        return sortOrder === "asc" ? premiumA - premiumB : premiumB - premiumA;
      },
      size: (a, b) => {
        const volA = parseFloat(a?.size);
        const volB = parseFloat(b?.size);
        return sortOrder === "asc" ? volA - volB : volB - volA;
      },
      vol: (a, b) => {
        const volA = parseFloat(a.volume);
        const volB = parseFloat(b.volume);
        return sortOrder === "asc" ? volA - volB : volB - volA;
      },
      oi: (a, b) => {
        const oiA = parseFloat(a.open_interest);
        const oiB = parseFloat(b.open_interest);
        return sortOrder === "asc" ? oiA - oiB : oiB - oiA;
      },
      callPut: (a, b) => {
        const callPutA = a.put_call?.toUpperCase();
        const callPutB = b.put_call?.toUpperCase();
        return sortOrder === "asc"
          ? callPutA.localeCompare(callPutB)
          : callPutB.localeCompare(callPutA);
      },
      sentiment: (a, b) => {
        const sentimentOrder = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 };
        const sentimentA = sentimentOrder[a?.sentiment?.toUpperCase()] || 4;
        const sentimentB = sentimentOrder[b?.sentiment?.toUpperCase()] || 4;
        return sortOrder === "asc"
          ? sentimentA - sentimentB
          : sentimentB - sentimentA;
      },
      type: (a, b) => {
        const typeOrder = { SWEEP: 1, BLOCK: 2, LARGE: 3, TRADE: 4 };
        const typeA = typeOrder[a.option_activity_type?.toUpperCase()] || 5;
        const typeB = typeOrder[b.option_activity_type?.toUpperCase()] || 5;
        return sortOrder === "asc" ? typeA - typeB : typeB - typeA;
      },
      exec: (a, b) => {
        const execOrder = { "ABOVE ASK": 1, "AT ASK": 2, "AT MIDPOINT": 3, "BETWEEN": 4, "AT BID": 5, "BELOW BID": 6 };
        const execA = execOrder[a?.execution_estimate?.toUpperCase()] || 7;
        const execB = execOrder[b?.execution_estimate?.toUpperCase()] || 7;
        return sortOrder === "asc" ? execA - execB : execB - execA;
      },
    };

    // Sort using the appropriate comparison function
    sortedDisplayData = originalData.sort(compareFunctions[key]);
  }

  // Function to apply sort without cycling
  function applySortDirectly(data, key, sortOrder) {
    if (sortOrder === "none") {
      return data;
    }

    const compareFunctions = {
      time: (a, b) => {
        const timeA = new Date("1970-01-01T" + a.time).getTime();
        const timeB = new Date("1970-01-01T" + b.time).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      ticker: (a, b) => {
        const tickerA = a.ticker.toUpperCase();
        const tickerB = b.ticker.toUpperCase();
        return sortOrder === "asc"
          ? tickerA.localeCompare(tickerB)
          : tickerB.localeCompare(tickerA);
      },
      expiry: (a, b) => {
        const timeA = new Date(a.date_expiration);
        const timeB = new Date(b.date_expiration);
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      dte: (a, b) => {
        const timeA = new Date(a.date_expiration);
        const timeB = new Date(b.date_expiration);
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      strike: (a, b) => {
        const strikeA = parseFloat(a.strike_price);
        const strikeB = parseFloat(b.strike_price);
        return sortOrder === "asc" ? strikeA - strikeB : strikeB - strikeA;
      },
      spot: (a, b) => {
        const spotA = parseFloat(a.underlying_price);
        const spotB = parseFloat(b.underlying_price);
        return sortOrder === "asc" ? spotA - spotB : spotB - spotA;
      },
      price: (a, b) => {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      },
      premium: (a, b) => {
        const premiumA = parseFloat(a.cost_basis);
        const premiumB = parseFloat(b.cost_basis);
        return sortOrder === "asc" ? premiumA - premiumB : premiumB - premiumA;
      },
      size: (a, b) => {
        const volA = parseFloat(a?.size);
        const volB = parseFloat(b?.size);
        return sortOrder === "asc" ? volA - volB : volB - volA;
      },
      vol: (a, b) => {
        const volA = parseFloat(a.volume);
        const volB = parseFloat(b.volume);
        return sortOrder === "asc" ? volA - volB : volB - volA;
      },
      oi: (a, b) => {
        const oiA = parseFloat(a.open_interest);
        const oiB = parseFloat(b.open_interest);
        return sortOrder === "asc" ? oiA - oiB : oiB - oiA;
      },
      callPut: (a, b) => {
        const callPutA = a.put_call?.toUpperCase();
        const callPutB = b.put_call?.toUpperCase();
        return sortOrder === "asc"
          ? callPutA.localeCompare(callPutB)
          : callPutB.localeCompare(callPutA);
      },
      sentiment: (a, b) => {
        const sentimentOrder = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 };
        const sentimentA = sentimentOrder[a?.sentiment?.toUpperCase()] || 4;
        const sentimentB = sentimentOrder[b?.sentiment?.toUpperCase()] || 4;
        return sortOrder === "asc"
          ? sentimentA - sentimentB
          : sentimentB - sentimentA;
      },
      type: (a, b) => {
        const typeOrder = { SWEEP: 1, BLOCK: 2, LARGE: 3, TRADE: 4 };
        const typeA = typeOrder[a.option_activity_type?.toUpperCase()] || 5;
        const typeB = typeOrder[b.option_activity_type?.toUpperCase()] || 5;
        return sortOrder === "asc" ? typeA - typeB : typeB - typeA;
      },
      exec: (a, b) => {
        const execOrder = { "ABOVE ASK": 1, "AT ASK": 2, "AT MIDPOINT": 3, "BETWEEN": 4, "AT BID": 5, "BELOW BID": 6 };
        const execA = execOrder[a?.execution_estimate?.toUpperCase()] || 7;
        const execB = execOrder[b?.execution_estimate?.toUpperCase()] || 7;
        return sortOrder === "asc" ? execA - execB : execB - execA;
      },
    };

    return data.sort(compareFunctions[key]);
  }

  // Function to reapply current sort
  function reapplySort(data) {
    if (currentSortKey && currentSortOrder !== "none") {
      // Reapply the current sort
      return applySortDirectly(data, currentSortKey, currentSortOrder);
    } else {
      // No sort applied, just use the data as is
      return data;
    }
  }

  // Watch for changes in displayedData prop and update sortedDisplayData
  // This ensures new data is shown while preserving sort
  $: {
    if (displayedData?.length > 0) {
      // Apply current sort to the new data
      if (currentSortKey && currentSortOrder !== "none") {
        sortedDisplayData = applySortDirectly(
          [...displayedData],
          currentSortKey,
          currentSortOrder,
        );
      } else {
        sortedDisplayData = [...displayedData];
      }
    } else {
      sortedDisplayData = [];
    }
  }
</script>

<div class="w-full overflow-x-auto">
  <!-- Set a min-width on smaller screens so the grid can show all columns -->
  <div class="min-w-[1000px]">
    <!-- Header row using grid -->
    <div
      class="table-driver bg-default text-white grid grid-cols-16 sticky top-0 z-10 border border-gray-300 dark:border-gray-800 font-bold text-xs uppercase"
    >
      <div
        on:click={() => sortData("time")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Time
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['time'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['time'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>
      <div
        on:click={() => sortData("ticker")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Symbol
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['ticker'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['ticker'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div class="cursor-pointer p-2 text-center whitespace-nowrap">
        Insight
      </div>

      <div
        on:click={() => sortData("expiry")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        Expiry
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['expiry'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['expiry'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("dte")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        dte
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['dte'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['dte'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("strike")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        strike
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['strike'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['strike'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("callPut")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        C/P
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['callPut'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['callPut'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("sentiment")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        Sent.
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['sentiment'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['sentiment'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("spot")}
        class="cursor-pointer p-2 text-center whitespace-nowrap"
      >
        Spot
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['spot'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['spot'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("price")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Price
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['price'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['price'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>
      <div
        on:click={() => sortData("premium")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Prem
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['premium'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['premium'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("type")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Type
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['type'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['type'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("exec")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Exec
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['exec'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['exec'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("size")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Size
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['size'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['size'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>
      <div
        on:click={() => sortData("vol")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Vol
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['vol'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['vol'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>

      <div
        on:click={() => sortData("oi")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        OI
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['oi'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['oi'] === 'desc'
              ? 'inline-block'
              : 'hidden'} "
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:50px"
          ><path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path></svg
        >
      </div>
    </div>

    <VirtualList
      width="100%"
      height={$screenWidth < 640
        ? data?.user?.tier === "Pro"
          ? 550
          : 250
        : data?.user?.tier === "Pro"
          ? 850
          : 250}
      itemCount={sortedDisplayData.length}
      itemSize={40}
    >
      <div
        slot="item"
        let:index
        let:style
        {style}
        class="grid grid-cols-16 gap-0 relative overflow-hidden"
        class:bg-[#fff]={index % 2 === 0 && $mode === "light"}
        class:bg-[#09090B]={index % 2 === 0 && $mode !== "light"}
        class:bg-[#121217]={index % 2 !== 0 && $mode !== "light"}
        class:bg-[#F6F7F8]={index % 2 !== 0 && $mode == "light"}
        class:opacity-30={index + 1 === rawData?.length &&
          data?.user?.tier !== "Pro"}
      >
        <!-- Apply gradient overlay for options -->
        {#if sortedDisplayData[index]}
          {@const item = sortedDisplayData[index]}
          {@const isBullishCall =
            item?.put_call === "Calls" &&
            (item?.execution_estimate === "At Ask" ||
              item?.execution_estimate === "Above Ask")}
          {@const isBearishCall =
            item?.put_call === "Calls" &&
            (item?.execution_estimate === "At Bid" ||
              item?.execution_estimate === "Below Bid")}
          {@const isPut = item?.put_call === "Puts"}
          {@const isSweep = ["Sweep", "Block", "Large"].includes(item?.option_activity_type)}

          {#if isBullishCall || isBearishCall || isPut}
            {@const baseColor =
              $mode === "light"
                ? index % 2 === 0
                  ? "#ffffff"
                  : "#F6F7F8"
                : index % 2 === 0
                  ? "#09090B"
                  : "#121217"}

            <div
              class="absolute inset-0 pointer-events-none z-0"
              style="background: {(() => {
                if ($mode === 'light') {
                  if (isBullishCall) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.1) 70%, rgba(34, 197, 94, 0.2) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.05) 70%, rgba(34, 197, 94, 0.1) 100%)`;
                  }
                  if (isBearishCall) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(239, 68, 68, 0.1) 70%, rgba(239, 68, 68, 0.2) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(239, 68, 68, 0.05) 70%, rgba(239, 68, 68, 0.1) 100%)`;
                  }
                  if (isPut) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(147, 51, 234, 0.1) 70%, rgba(147, 51, 234, 0.2) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(147, 51, 234, 0.05) 70%, rgba(147, 51, 234, 0.1) 100%)`;
                  }
                } else {
                  // Dark mode - CheddarFlow style
                  if (isBullishCall) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.08) 60%, rgba(0, 252, 80, 0.15) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.03) 70%, rgba(0, 252, 80, 0.08) 100%)`;
                  }
                  if (isBearishCall) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(255, 47, 31, 0.08) 60%, rgba(255, 47, 31, 0.15) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(255, 47, 31, 0.03) 70%, rgba(255, 47, 31, 0.08) 100%)`;
                  }
                  if (isPut) {
                    return isSweep
                      ? `linear-gradient(90deg, ${baseColor} 0%, rgba(147, 51, 234, 0.08) 60%, rgba(147, 51, 234, 0.15) 100%)`
                      : `linear-gradient(90deg, ${baseColor} 0%, rgba(147, 51, 234, 0.03) 70%, rgba(147, 51, 234, 0.08) 100%)`;
                  }
                }
                return 'transparent';
              })()}"
            ></div>
          {/if}
        {/if}
        <div
          class="p-2 text-end text-xs sm:text-sm whitespace-nowrap relative z-10"
        >
          {formatTime(sortedDisplayData[index]?.time)}
        </div>
        <div
          on:click|stopPropagation
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          <HoverStockChart
            symbol={sortedDisplayData[index]?.ticker}
            assetType={sortedDisplayData[index]?.underlying_type}
          />
        </div>

        <div
          on:click|stopPropagation={() =>
            optionsInsight(sortedDisplayData[index])}
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          <Spark
            class="w-5 h-5 inline-block cursor-pointer shrink-0 text-black sm:hover:text-muted dark:text-white dark:sm:hover:text-gray-200"
          />
        </div>
        <!--
        <div
          id={sortedDisplayData[index]?.id}
          on:click|stopPropagation={() =>
            addToWatchlist(sortedDisplayData[index]?.id)}
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap {optionsWatchlist.optionsId?.includes(
            sortedDisplayData[index]?.id,
          )
            ? 'text-[#FFA500]'
            : $mode === 'light'
              ? 'text-gray-400'
              : 'text-[#fff]'}"
        >
          <svg
            class="{sortedDisplayData[index]?.id === animationId
              ? animationClass
              : ''} w-4 sm:w-5 sm:h-5 inline-block cursor-pointer shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            ><path
              fill="currentColor"
              d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
            /></svg
          >
        </div>
-->
        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {reformatDate(sortedDisplayData[index]?.date_expiration)}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.dte < 0
            ? "expired"
            : sortedDisplayData[index]?.dte + "d"}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.strike_price}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {sortedDisplayData[
            index
          ]?.put_call === 'Calls'
            ? 'text-green-800 dark:text-[#00FC50]'
            : 'text-red-800 dark:text-[#FF2F1F]'} "
        >
          {sortedDisplayData[index]?.put_call}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {sortedDisplayData[
            index
          ]?.sentiment === 'Bullish'
            ? 'text-green-800 dark:text-[#00FC50]'
            : sortedDisplayData[index]?.sentiment === 'Bearish'
              ? 'text-red-800 dark:text-[#FF2F1F]'
              : 'text-orange-800 dark:text-[#C6A755]'} "
        >
          {sortedDisplayData[index]?.sentiment}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.underlying_price}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.price}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {@html abbreviateNumber(
            sortedDisplayData[index]?.cost_basis,
            false,
            true,
          )}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {sortedDisplayData[
            index
          ]?.option_activity_type === 'Sweep'
            ? 'text-muted dark:text-[#C6A755]'
            : sortedDisplayData[index]?.option_activity_type === 'Block'
              ? 'text-muted dark:text-[#FF6B6B]'
              : sortedDisplayData[index]?.option_activity_type === 'Large'
                ? 'text-muted dark:text-[#4ECDC4]'
                : 'text-muted dark:text-[#976DB7]'}"
        >
          {sortedDisplayData[index]?.option_activity_type}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {[
            'At Ask',
            'Above Ask',
          ]?.includes(sortedDisplayData[index]?.execution_estimate)
            ? 'text-muted dark:text-[#C8A32D]'
            : ['At Bid', 'Below Bid']?.includes(
                  sortedDisplayData[index]?.execution_estimate,
                )
              ? 'text-muted dark:text-[#8F82FE]'
              : 'text-muted dark:text-[#A98184]'}"
        >
          {sortedDisplayData[index]?.execution_estimate?.replace(
            "Midpoint",
            "Mid",
          )}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {new Intl.NumberFormat("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(sortedDisplayData[index]?.size)}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {new Intl.NumberFormat("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(sortedDisplayData[index]?.volume)}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {new Intl.NumberFormat("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(sortedDisplayData[index]?.open_interest)}
        </div>
      </div>
    </VirtualList>
  </div>
</div>

<input type="checkbox" id="optionsInsightModal" class="modal-toggle" />
<dialog id="optionsInsightModal" class="modal p-3 sm:p-0">
  <label
    id="optionsInsightModal"
    for="optionsInsightModal"
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box max-h-[80vh] sm:max-h-[1000px] w-full max-w-4xl rounded w-full bg-white dark:bg-secondary border border-gray-600 overflow-hidden overflow-y-auto"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="mb-2 px-6 fixed w-full h-fit sticky -top-6 z-40 bg-white dark:bg-secondary shadow opacity-100 pb-6 pt-5 border-gray-300 dark:border-gray-600 border-b"
      >
        <div class="flex flex-row items-center justify-between">
          <h3
            class="font-semibold text-lg sm:text-xl text-black dark:text-white pr-8"
          >
            {selectedOptionData?.ticker}
            {selectedOptionData?.put_call?.replace("s", "")}
            Strike {selectedOptionData?.strike_price}
            DTE {selectedOptionData?.dte} Options Insight
          </h3>
          <label
            for="optionsInsightModal"
            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem]"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              /></svg
            >
          </label>
        </div>
      </div>

      <!-- Content Area -->
      <div class="p-3 sm:p-6">
        <div class="flex flex-col items-start w-full">
          {#if isStreaming && !optionsInsightContent && !optionsInsightThoughts}
            <div class="flex items-center gap-3 w-full">
              <img
                class="w-8 h-8 rounded-full shrink-0"
                src="/pwa-192x192.png"
                alt="Stocknear Logo"
                loading="lazy"
              />
              <div
                class="text-sm sm:text-[1rem] text-gray-500 dark:text-gray-400 shimmer-text"
              >
                Analyzing options flow order...
              </div>
            </div>
          {/if}

          {#if isStreaming && optionsInsightThoughts && !optionsInsightContent}
            <div class="flex items-center gap-3 w-full">
              <img
                class="w-8 h-8 rounded-full shrink-0"
                src="/pwa-192x192.png"
                alt="Stocknear Logo"
                loading="lazy"
              />
              <div
                class="flex text-sm sm:text-[1rem] items-center space-x-2 py-2"
              >
                {optionsInsightThoughts}
              </div>
            </div>
          {/if}

          {#if optionsInsightContent || (!isStreaming && optionsInsightContent)}
            <div class="flex flex-col sm:flex-row items-start gap-3 w-full">
              <img
                class="w-8 h-8 rounded-full shrink-0"
                src="/pwa-192x192.png"
                alt="Stocknear Logo"
                loading="lazy"
              />
              <div class="flex-1">
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  {@html optionsInsightContent}
                </div>
                {#if isStreaming && optionsInsightContent}
                  <div class="mt-2 flex items-center">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span
                      class="ml-1.5 text-xs text-gray-500 dark:text-gray-400"
                      >Analyzing...</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</dialog>

<style>
  .heartbeat {
    animation: heartbeat-animation 0.3s;
    animation-timing-function: ease-in-out;
  }

  @keyframes heartbeat-animation {
    0% {
      transform: rotate(0deg) scale(0.95);
    }
    25% {
      transform: rotate(10deg) scale(1.05);
    }
    50% {
      transform: rotate(0deg) scale(1.2);
    }
    75% {
      transform: rotate(-10deg) scale(1.05);
    }
    100% {
      transform: rotate(0deg) scale(0.95);
    }
  }
</style>
