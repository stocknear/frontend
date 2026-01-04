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

  let selectedOptionData: any = null;
  let insightData: any = null;
  let isLoadingInsight = false;
  let insightError = "";
  let showInsightModal = false;

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

  async function optionsInsight(optionsData: any) {
    insightError = "";
    insightData = null;

    if (data?.user?.tier !== "Pro") {
      toast.error("Unlock this feature with Pro Subscription", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Create cache key based on options data
    const cacheKey = `options_insight_v2_${Object.entries(optionsData)
      ?.sort(([a], [b]) => a.localeCompare(b))
      ?.map(([_, v]) => v ?? "")
      ?.join("_")}`;
    const cacheExpiration = 60 * 60 * 1000; // 1 hour in milliseconds

    // Check cache first
    const cachedData = getCachedOptionsInsight(cacheKey, cacheExpiration);

    // Check credits BEFORE opening modal (unless data is cached)
    if (!cachedData?.data && data?.user?.credits < 2) {
      toast?.error(
        `Insufficient credits. Your current balance is ${data?.user?.credits}.`,
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
      return;
    }

    // Open modal and fetch data
    selectedOptionData = optionsData;
    showInsightModal = true;

    if (cachedData?.data) {
      insightData = cachedData.data;
      return;
    }

    isLoadingInsight = true;

    try {
      const response = await fetch("/api/options-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionsData }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        insightError =
          result.error || "Failed to load analysis. Please try again.";
        isLoadingInsight = false;
        return;
      }

      insightData = result;

      // Deduct credits
      if (data?.user) {
        data.user.credits -= 2;
      }

      // Cache the result
      setCachedOptionsInsight(cacheKey, result);
    } catch (error) {
      console.error("Options insight error:", error);
      insightError = "Error loading analysis. Please try again.";
    } finally {
      isLoadingInsight = false;
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
  function setCachedOptionsInsight(cacheKey: string, insightResult: any) {
    try {
      const cacheData = {
        data: insightResult,
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

  // Helper functions for insight modal UI
  function closeInsightModal() {
    showInsightModal = false;
    insightError = "";
  }

  function getScoreColor(score: number) {
    if (score >= 70)
      return {
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/40",
        bar: "bg-green-500",
      };
    if (score >= 40)
      return {
        text: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/40",
        bar: "bg-yellow-500",
      };
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/40",
      bar: "bg-red-500",
    };
  }

  function getSentimentColor(sentiment: string) {
    const colorMap: Record<string, string> = {
      Bullish:
        "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40",
      "Highly Bullish":
        "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40",
      Bearish: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
      "Highly Bearish":
        "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
      Neutral:
        "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40",
    };
    return colorMap[sentiment] || colorMap["Neutral"];
  }

  function getVerdictColor(verdict: string) {
    const colorMap: Record<string, string> = {
      BUY: "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40",
      AVOID: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
      WATCH:
        "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40",
    };
    return colorMap[verdict] || colorMap["WATCH"];
  }

  function getAssessmentColor(assessment: string) {
    const colorMap: Record<string, string> = {
      "Strong Signal": "text-green-600 dark:text-green-400",
      "Moderate Signal": "text-yellow-600 dark:text-yellow-400",
      "Weak Signal": "text-red-600 dark:text-red-400",
      "Low Risk": "text-green-600 dark:text-green-400",
      "Moderate Risk": "text-yellow-600 dark:text-yellow-400",
      "High Risk": "text-red-600 dark:text-red-400",
      Favorable: "text-green-600 dark:text-green-400",
      Unfavorable: "text-red-600 dark:text-red-400",
      High: "text-red-600 dark:text-red-400",
      Medium: "text-yellow-600 dark:text-yellow-400",
      Low: "text-green-600 dark:text-green-400",
    };
    return colorMap[assessment] || "text-gray-600 dark:text-gray-400";
  }

  function generateInsightMarkdown(): string {
    if (!insightData || !selectedOptionData) return "";

    return `# Options Insight: ${selectedOptionData?.option_symbol}

## Trade Score: ${insightData.tradeScore}/100 - ${insightData.sentiment}
**Verdict:** ${insightData.verdict}

### Executive Summary
${insightData.executiveSummary}

---

## Order Analysis
**Assessment:** ${insightData.orderAnalysis?.assessment}
**Order Type:** ${insightData.orderAnalysis?.orderType}
**Execution:** ${insightData.orderAnalysis?.executionContext}

**Key Insights:**
${insightData.orderAnalysis?.keyInsights?.map((i: string) => `- ${i}`).join("\n") || "- N/A"}

---

## Sentiment Analysis
**Assessment:** ${insightData.sentimentAnalysis?.assessment}
**Buyer Intent:** ${insightData.sentimentAnalysis?.buyerIntent}
**Urgency:** ${insightData.sentimentAnalysis?.urgencyLevel}

**Key Insights:**
${insightData.sentimentAnalysis?.keyInsights?.map((i: string) => `- ${i}`).join("\n") || "- N/A"}

---

## Risk Profile
**Assessment:** ${insightData.riskProfile?.assessment}
**Moneyness:** ${insightData.riskProfile?.moneyness}
**Time Decay Risk:** ${insightData.riskProfile?.timeDecayRisk}

**Key Insights:**
${insightData.riskProfile?.keyInsights?.map((i: string) => `- ${i}`).join("\n") || "- N/A"}

---

## Trade Setup
**Assessment:** ${insightData.tradeSetup?.assessment}
**Entry Strategy:** ${insightData.tradeSetup?.entryStrategy}
**Risk Consideration:** ${insightData.tradeSetup?.riskConsideration}

---

## Bullish Signals
${insightData.bullishSignals?.map((s: string) => `- ${s}`).join("\n") || "- None identified"}

## Red Flags
${insightData.redFlags?.length > 0 ? insightData.redFlags.map((f: string) => `- ${f}`).join("\n") : "- None identified"}

---

## Trader Takeaway
${insightData.traderTakeaway}

---
*Generated on ${new Date().toLocaleDateString()}*
`;
  }

  function copyInsightToClipboard() {
    const markdown = generateInsightMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
      toast.success("Analysis copied to clipboard!", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    });
  }

  function downloadInsightMarkdown() {
    const markdown = generateInsightMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedOptionData?.option_symbol}-options-insight.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Analysis downloaded!", {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
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
    leg: "none",
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
      leg: (a, b) => {
        const legOrder = { "SINGLE-LEG": 1, "MULTI-LEG": 2 };
        const legA = legOrder[a.trade_leg_type?.toUpperCase()] || 3;
        const legB = legOrder[b.trade_leg_type?.toUpperCase()] || 3;
        return sortOrder === "asc" ? legA - legB : legB - legA;
      },
      exec: (a, b) => {
        const execOrder = {
          "ABOVE ASK": 1,
          "AT ASK": 2,
          "AT MIDPOINT": 3,
          BETWEEN: 4,
          "AT BID": 5,
          "BELOW BID": 6,
        };
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
      leg: (a, b) => {
        const legOrder = { "SINGLE-LEG": 1, "MULTI-LEG": 2 };
        const legA = legOrder[a.trade_leg_type?.toUpperCase()] || 3;
        const legB = legOrder[b.trade_leg_type?.toUpperCase()] || 3;
        return sortOrder === "asc" ? legA - legB : legB - legA;
      },
      exec: (a, b) => {
        const execOrder = {
          "ABOVE ASK": 1,
          "AT ASK": 2,
          "AT MIDPOINT": 3,
          BETWEEN: 4,
          "AT BID": 5,
          "BELOW BID": 6,
        };
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
      class="table-driver bg-default text-white grid grid-cols-17 sticky top-0 z-10 border border-gray-300 dark:border-gray-800 font-bold text-xs uppercase"
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
        on:click={() => sortData("leg")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Leg
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['leg'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['leg'] === 'desc'
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
        class="grid grid-cols-17 gap-0 relative overflow-hidden"
        class:bg-[#fff]={index % 2 === 0 && $mode === "light"}
        class:bg-[#09090B]={index % 2 === 0 && $mode !== "light"}
        class:bg-[#121217]={index % 2 !== 0 && $mode !== "light"}
        class:bg-[#F6F7F8]={index % 2 !== 0 && $mode == "light"}
        class:opacity-30={index + 1 === rawData?.length &&
          data?.user?.tier !== "Pro"}
      >
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
            optionSymbol={sortedDisplayData[index]?.option_symbol}
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
            : 'text-rose-600 dark:text-rose-400'} "
        >
          {sortedDisplayData[index]?.put_call}
        </div>

        <div
          class="p-2 text-end text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {sortedDisplayData[
            index
          ]?.sentiment === 'Bullish'
            ? 'text-green-800 dark:text-[#00FC50]'
            : sortedDisplayData[index]?.sentiment === 'Bearish'
              ? 'text-rose-600 dark:text-rose-400'
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
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {sortedDisplayData[
            index
          ]?.trade_leg_type === 'multi-leg'
            ? 'text-muted dark:text-[#FF9500]'
            : 'text-muted dark:text-[#7B8794]'}"
        >
          {sortedDisplayData[index]?.trade_leg_type === "multi-leg"
            ? "Multi"
            : "Single"}
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

<!-- Options Insight Modal -->
{#if showInsightModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    on:click={closeInsightModal}
    on:keydown={(e) => e.key === "Escape" && closeInsightModal()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[92vh] bg-white dark:bg-[#09090B] rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-slideUp"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="document"
    >
      <!-- Modal Header -->
      <div
        class="sticky top-0 z-10 bg-white dark:bg-[#09090B] px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 border-b border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <div
              class="p-1.5 sm:p-2 md:p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg flex-shrink-0"
            >
              <Spark
                class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h2
                class="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate"
              >
                Options Flow Insight
              </h2>
              <p
                class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 mt-0.5 truncate"
              >
                {selectedOptionData?.option_symbol}
                • DTE {selectedOptionData?.dte}
              </p>
            </div>
          </div>
          <button
            on:click={closeInsightModal}
            class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <svg
              class="w-5 h-5 text-gray-800 dark:text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div
        class="overflow-y-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(92vh-80px)] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 bg-gray-50 dark:bg-[#0A0A0B]"
      >
        {#if isLoadingInsight}
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="relative">
              <div
                class="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full"
              ></div>
              <div
                class="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"
              ></div>
            </div>
            <p class="text-sm text-purple-700 dark:text-purple-300 font-medium">
              Analyzing options flow...
            </p>
            <p class="text-xs text-purple-500 dark:text-purple-400">
              Extracting trade insights and signals
            </p>
          </div>
        {:else if insightError}
          <div
            class="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <p class="text-sm font-medium text-red-700 dark:text-red-300">
                {insightError}
              </p>
            </div>
          </div>
        {:else if insightData}
          <!-- Trade Score Card -->
          <div
            class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 md:p-6"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div class="flex-1">
                <div class="mb-3 sm:mb-4">
                  <span
                    class="text-xs font-semibold text-gray-800 dark:text-gray-400 uppercase tracking-wider"
                    >Trade Signal Score</span
                  >
                </div>
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="px-3 py-1.5 rounded-full text-sm font-semibold {getSentimentColor(
                        insightData.sentiment,
                      )}"
                    >
                      {insightData.sentiment}
                    </span>
                    <span
                      class="px-3 py-1.5 rounded-full text-sm font-bold {getVerdictColor(
                        insightData.verdict,
                      )}"
                    >
                      {insightData.verdict}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-32 sm:w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full {getScoreColor(insightData.tradeScore)
                          .bar} rounded-full transition-all duration-500"
                        style="width: {insightData.tradeScore}%"
                      ></div>
                    </div>
                    <span
                      class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
                    >
                      {insightData.tradeScore}%
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  on:click={copyInsightToClipboard}
                  class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </button>
                <button
                  on:click={downloadInsightMarkdown}
                  class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>

          <!-- Executive Summary -->
          <div
            class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 md:p-6"
          >
            <div class="flex items-center gap-2 sm:gap-2.5 md:gap-3 mb-3">
              <div
                class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0"
              >
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fill-rule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <h4
                class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
              >
                Executive Summary
              </h4>
            </div>
            <p
              class="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {insightData.executiveSummary}
            </p>
          </div>

          <!-- Analysis Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <!-- Order Analysis -->
            <div
              class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div
                    class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Order Analysis
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    insightData.orderAnalysis?.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {insightData.orderAnalysis?.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Type</span
                    >
                    <span
                      class="text-sm font-semibold text-gray-900 dark:text-white"
                      >{insightData.orderAnalysis?.orderType}</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Execution</span
                    >
                    <span
                      class="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                      >{insightData.orderAnalysis?.executionContext}</span
                    >
                  </div>
                </div>
                {#each insightData.orderAnalysis?.keyInsights || [] as insight}
                  <div class="flex items-start gap-2">
                    <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                    <p
                      class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 leading-relaxed"
                    >
                      {insight}
                    </p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Sentiment Analysis -->
            <div
              class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div
                    class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Sentiment
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getSentimentColor(
                    insightData.sentimentAnalysis?.assessment,
                  )} rounded flex-shrink-0"
                >
                  {insightData.sentimentAnalysis?.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Intent</span
                    >
                    <span
                      class="text-sm font-semibold text-gray-900 dark:text-white"
                      >{insightData.sentimentAnalysis?.buyerIntent}</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Urgency</span
                    >
                    <span
                      class="text-xs sm:text-sm font-semibold {getAssessmentColor(
                        insightData.sentimentAnalysis?.urgencyLevel,
                      )}">{insightData.sentimentAnalysis?.urgencyLevel}</span
                    >
                  </div>
                </div>
                {#each insightData.sentimentAnalysis?.keyInsights || [] as insight}
                  <div class="flex items-start gap-2">
                    <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                    <p
                      class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 leading-relaxed"
                    >
                      {insight}
                    </p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Risk Profile -->
            <div
              class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div
                    class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Risk Profile
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    insightData.riskProfile?.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {insightData.riskProfile?.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Moneyness</span
                    >
                    <span
                      class="text-sm font-semibold text-gray-900 dark:text-white"
                      >{insightData.riskProfile?.moneyness}</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Theta Risk</span
                    >
                    <span
                      class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >{insightData.riskProfile?.timeDecayRisk}</span
                    >
                  </div>
                </div>
                {#each insightData.riskProfile?.keyInsights || [] as insight}
                  <div class="flex items-start gap-2">
                    <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                    <p
                      class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 leading-relaxed"
                    >
                      {insight}
                    </p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Trade Setup -->
            <div
              class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div
                    class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Trade Setup
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    insightData.tradeSetup?.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {insightData.tradeSetup?.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <span
                    class="text-xs font-medium text-gray-600 dark:text-gray-200"
                    >Entry Strategy</span
                  >
                  <p
                    class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1"
                  >
                    {insightData.tradeSetup?.entryStrategy}
                  </p>
                </div>
                <div
                  class="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <span
                    class="text-xs font-medium text-gray-600 dark:text-gray-200"
                    >Risk Consideration</span
                  >
                  <p
                    class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1"
                  >
                    {insightData.tradeSetup?.riskConsideration}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bullish Signals & Red Flags -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div
              class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5"
            >
              <div class="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div
                  class="p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/30 rounded-lg flex-shrink-0"
                >
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <h5
                  class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                >
                  Bullish Signals
                </h5>
              </div>
              <ul class="space-y-2 sm:space-y-2.5">
                {#each insightData.bullishSignals || [] as signal}
                  <li class="flex items-start gap-2 sm:gap-2.5">
                    <svg
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span
                      class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                      >{signal}</span
                    >
                  </li>
                {/each}
              </ul>
            </div>

            {#if insightData.redFlags?.length > 0}
              <div
                class="bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5"
              >
                <div class="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <div
                    class="p-1.5 sm:p-2 bg-red-50 dark:bg-red-950/30 rounded-lg flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Red Flags
                  </h5>
                </div>
                <ul class="space-y-2 sm:space-y-2.5">
                  {#each insightData.redFlags as flag}
                    <li class="flex items-start gap-2 sm:gap-2.5">
                      <svg
                        class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <span
                        class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                        >{flag}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>

          <!-- Trader Takeaway -->
          <div
            class="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-4 sm:p-5 md:p-6"
          >
            <div class="flex items-center gap-2 sm:gap-2.5 mb-3">
              <div
                class="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex-shrink-0"
              >
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h5
                class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
              >
                Trader Takeaway
              </h5>
            </div>
            <p
              class="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {insightData.traderTakeaway}
            </p>
          </div>

          <!-- Disclaimer -->
          <div
            class="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4"
          >
            <p class="text-xs text-gray-800 dark:text-gray-200 italic">
              This analysis was generated by AI based on order flow data and may
              not capture all market factors. Always conduct your own research
              before making trading decisions.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

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

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
</style>
