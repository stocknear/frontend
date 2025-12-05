<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  export let data;
  export let periodType: "annual" | "quarterly" | "ttm" = "annual";
  export let statementType:
    | "income-statement"
    | "balance-sheet"
    | "cash-flow"
    | "ratios" = "income-statement";

  let isLoadingSummary = false;
  let summaryData = null;
  let errorMessage = "";
  let showModal = false;

  // Track if valid cache exists for current params
  let hasCachedSummary = false;

  // Check localStorage for cached summary
  function getCachedSummary(ticker: string, period: string, statement: string) {
    try {
      const cacheKey = `financial-summary-${ticker}-${period}-${statement}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        // Cache valid for 24 hours
        if (now - cacheTime < 24 * 60 * 60 * 1000) {
          return parsed.data;
        } else {
          // Cache is expired, delete it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.error("Error reading cache:", e);
    }
    return null;
  }

  // Check for cached summary when params change
  function checkCacheExists() {
    if (typeof window !== "undefined") {
      const cached = getCachedSummary($stockTicker, periodType, statementType);
      hasCachedSummary = cached !== null;
      if (cached) {
        summaryData = cached;
      }
    }
  }

  // Reactive check when params change
  $: if ($stockTicker && periodType && statementType) {
    checkCacheExists();
  }

  function saveSummaryToCache(
    ticker: string,
    period: string,
    statement: string,
    summary: any,
  ) {
    try {
      const cacheKey = `financial-summary-${ticker}-${period}-${statement}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: summary,
          timestamp: Date.now(),
        }),
      );
    } catch (e) {
      console.error("Error saving to cache:", e);
    }
  }

  async function generateSummary() {
    // If we already have cached data loaded, just open the modal
    if (hasCachedSummary && summaryData) {
      showModal = true;
      return;
    }

    // Check cache first - if cached, show it without requiring credits
    const cached = getCachedSummary($stockTicker, periodType, statementType);
    if (cached) {
      summaryData = cached;
      hasCachedSummary = true;
      showModal = true;
      return;
    }

    // Only check login/tier/credits if we need to make an API call
    if (!data?.user) {
      goto(`/login?redirectTo=/stocks/${$stockTicker}/financials`);
      return;
    }

    if (!["Plus", "Pro"]?.includes(data?.user?.tier)) {
      errorMessage = "This feature requires a Plus or Pro subscription.";
      showModal = true;
      return;
    }

    if (data?.user?.credits < 3) {
      errorMessage = `Insufficient credits. You have ${data?.user?.credits} credits. This summary costs 3 credits.`;
      showModal = true;
      return;
    }

    // Open modal immediately and show loading inside
    isLoadingSummary = true;
    errorMessage = "";
    showModal = true;

    try {
      const response = await fetch("/api/financial-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: $stockTicker,
          periodType: periodType,
          statementType: statementType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      summaryData = await response.json();

      // Save to cache
      saveSummaryToCache($stockTicker, periodType, statementType, summaryData);
      hasCachedSummary = true;

      // Deduct credits on client side
      if (data?.user) {
        data.user.credits -= 3;
      }
    } catch (error) {
      errorMessage = error.message || "Failed to generate summary";
      console.error("Summary generation error:", error);
    } finally {
      isLoadingSummary = false;
    }
  }

  function closeModal() {
    showModal = false;
    errorMessage = "";
  }

  function getHealthColor(health: string) {
    const colorMap = {
      Bullish: "text-[#10B981] bg-[#10B981]/10",
      Neutral: "text-[#F59E0B] bg-[#F59E0B]/10",
      Bearish: "text-[#EF4444] bg-[#EF4444]/10",
    };
    return colorMap[health] || "text-[#F59E0B] bg-[#F59E0B]/10";
  }

  function getHealthColors(health: string) {
    switch (health?.toLowerCase()) {
      case "bullish":
        return {
          text: "text-green-700 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/40",
          bar: "bg-green-500",
        };
      case "bearish":
        return {
          text: "text-red-700 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/40",
          bar: "bg-red-500",
        };
      default: // neutral
        return {
          text: "text-yellow-700 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/40",
          bar: "bg-yellow-500",
        };
    }
  }

  $: healthColors = getHealthColors(summaryData?.overallHealth ?? "Neutral");

  function getPeriodLabel(period: string): string {
    const labels = {
      annual: "Annual",
      quarterly: "Quarterly",
      ttm: "TTM (Trailing Twelve Months)",
    };
    return labels[period] || "Annual";
  }

  function getStatementLabel(statement: string): string {
    const labels = {
      "income-statement": "Income Statement",
      "balance-sheet": "Balance Sheet",
      "cash-flow": "Cash Flow Statement",
      ratios: "Financial Ratios",
    };
    return labels[statement] || "Financial";
  }

  function getSectionLabels(statement: string) {
    const labelMap = {
      "income-statement": {
        section1: "Revenue Growth",
        section1Icon: "chart-up",
        section2: "Profitability",
        section2Icon: "dollar",
        section3: "Expense Management",
        section3Icon: "database",
        section4: "Earnings Quality",
        section4Icon: "badge",
      },
      "balance-sheet": {
        section1: "Asset Position",
        section1Icon: "chart-up",
        section2: "Financial Structure",
        section2Icon: "dollar",
        section3: "Liability Management",
        section3Icon: "database",
        section4: "Liquidity & Stability",
        section4Icon: "badge",
      },
      "cash-flow": {
        section1: "Operating Cash Flow",
        section1Icon: "chart-up",
        section2: "Free Cash Flow",
        section2Icon: "dollar",
        section3: "Capital Allocation",
        section3Icon: "database",
        section4: "Cash Generation Quality",
        section4Icon: "badge",
      },
      ratios: {
        section1: "Performance Metrics",
        section1Icon: "chart-up",
        section2: "Profitability Ratios",
        section2Icon: "dollar",
        section3: "Efficiency Metrics",
        section3Icon: "database",
        section4: "Overall Strength",
        section4Icon: "badge",
      },
    };
    return labelMap[statement] || labelMap["income-statement"];
  }

  $: sectionLabels = getSectionLabels(statementType);

  function getAssessmentColor(assessment: string) {
    const colorMap = {
      Excellent: "text-[#10B981]",
      Strong: "text-[#3B82F6]",
      Moderate: "text-[#F59E0B]",
      Weak: "text-[#EF4444]",
      High: "text-[#10B981]",
      Low: "text-[#EF4444]",
      Expanding: "text-[#10B981]",
      Stable: "text-[#3B82F6]",
      Compressing: "text-[#EF4444]",
      Accelerating: "text-[#10B981]",
      Decelerating: "text-[#F59E0B]",
      Declining: "text-[#EF4444]",
      Improving: "text-[#10B981]",
      Deteriorating: "text-[#EF4444]",
      "Very Consistent": "text-[#10B981]",
      Consistent: "text-[#3B82F6]",
      Volatile: "text-[#EF4444]",
    };
    return colorMap[assessment] || "text-gray-600";
  }

  function generateMarkdown(): string {
    if (!summaryData) return "";

    return `# ${$stockTicker} - Financial Analysis (${summaryData.yearsAnalyzed})

## Overall Health: ${summaryData.overallHealth} (${summaryData.healthScore}/100)

### Executive Summary
${summaryData.executiveSummary}

---

## Revenue Analysis
**Assessment:** ${summaryData.revenueAnalysis.assessment}
**CAGR:** ${summaryData.revenueAnalysis.cagr}
**Trend:** ${summaryData.revenueAnalysis.trend}

**Key Insights:**
${summaryData.revenueAnalysis.keyInsights.map((i) => `- ${i}`).join("\n")}

---

## Profitability
**Assessment:** ${summaryData.profitabilityAnalysis.assessment}
**Margin Trend:** ${summaryData.profitabilityAnalysis.marginTrend}

**Key Insights:**
${summaryData.profitabilityAnalysis.keyInsights.map((i) => `- ${i}`).join("\n")}

---

## Expense Management
**Assessment:** ${summaryData.expenseManagement.assessment}
**Efficiency:** ${summaryData.expenseManagement.efficiency}

**Key Insights:**
${summaryData.expenseManagement.keyInsights.map((i) => `- ${i}`).join("\n")}

---

## Earnings Quality
**Assessment:** ${summaryData.earningsQuality.assessment}
**Consistency:** ${summaryData.earningsQuality.consistency}

${summaryData.earningsQuality.insight}

---

## Key Strengths
${summaryData.keyStrengths.map((s) => `- ${s}`).join("\n")}

## Red Flags
${summaryData.redFlags?.length > 0 ? summaryData.redFlags.map((r) => `- ${r}`).join("\n") : "- None identified"}

---

## Investor Takeaway
${summaryData.investorTakeaway}

---
*Generated on ${new Date().toLocaleDateString()}*
`;
  }

  function copyToClipboard() {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
      toast.success("Summary copied to clipboard!", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    });
  }

  function downloadMarkdown() {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Generate filename with statement type
    const statementName = statementType.replace("-", "-");
    a.download = `${$stockTicker}-${statementName}-analysis-${summaryData.yearsAnalyzed}.md`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Summary downloaded!", {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
  }
</script>

<!-- AI Summarize Button (Inline) -->
<Button
  on:click={generateSummary}
  disabled={isLoadingSummary}
  class="ml-2 w-fit border-gray-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white dark:border-gray-600 border ease-out flex flex-row justify-between items-center px-3 py-1.5 rounded truncate disabled:opacity-50"
>
  {#if isLoadingSummary}
    <svg
      class="animate-spin h-4 w-4 mr-2"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    Analyzing...
  {:else}
    <svg
      class="w-4 h-4 mr-1"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
    {hasCachedSummary ? "Show Summary" : "AI Summarize"}
  {/if}
</Button>

<!-- Modal -->
{#if showModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    on:click={closeModal}
  >
    <div
      class="relative w-full max-w-6xl max-h-[95vh] sm:max-h-[92vh] bg-white dark:bg-[#09090B] rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-slideUp"
      on:click|stopPropagation
    >
      <!-- Modal Header -->
      <div
        class="sticky top-0 z-10 bg-white dark:bg-[#09090B] px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 border-b border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <div
              class="p-1.5 sm:p-2 md:p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex-shrink-0"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h2
                class="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate"
              >
                AI Financial Analysis
              </h2>
              <p
                class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 mt-0.5 truncate"
              >
                {$stockTicker} • {getStatementLabel(statementType)} • {getPeriodLabel(
                  periodType,
                )}
              </p>
            </div>
          </div>
          <button
            on:click={closeModal}
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
        {#if isLoadingSummary}
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
              Analyzing financial data...
            </p>
            <p class="text-xs text-purple-500 dark:text-purple-400">
              Extracting insights from {getStatementLabel(statementType).toLowerCase()}
            </p>
          </div>
        {:else if errorMessage}
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
                {errorMessage}
              </p>
            </div>
          </div>
        {:else if summaryData}
          <!-- Health Score Card -->
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
                  >
                    {summaryData.yearsAnalyzed} Overall Health
                  </span>
                </div>
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                >
                  <span
                    class="px-3 py-1.5 rounded-full text-sm font-semibold {healthColors.text} {healthColors.bg} w-fit"
                  >
                    {summaryData.overallHealth}
                  </span>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-32 sm:w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full {healthColors.bar} rounded-full transition-all duration-500"
                        style="width: {summaryData.healthScore}%"
                      ></div>
                    </div>
                    <span
                      class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
                    >
                      {summaryData.healthScore}%
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  on:click={copyToClipboard}
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
                  on:click={downloadMarkdown}
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
              {summaryData.executiveSummary}
            </p>
          </div>

          <!-- Analysis Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <!-- Section 1 Analysis -->
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
                    {sectionLabels.section1}
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    summaryData.revenueAnalysis.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {summaryData.revenueAnalysis.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >CAGR</span
                    >
                    <span
                      class="text-base sm:text-lg font-bold {summaryData.revenueAnalysis.cagr?.startsWith(
                        '+',
                      )
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500'}"
                    >
                      {summaryData.revenueAnalysis.cagr}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Trend</span
                    >
                    <span
                      class="font-semibold text-xs sm:text-sm {getAssessmentColor(
                        summaryData.revenueAnalysis.trend,
                      )}"
                    >
                      {summaryData.revenueAnalysis.trend}
                    </span>
                  </div>
                </div>
                {#each summaryData.revenueAnalysis.keyInsights as insight}
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

            <!-- Section 2 Analysis -->
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
                        d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"
                      />
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    {sectionLabels.section2}
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    summaryData.profitabilityAnalysis.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {summaryData.profitabilityAnalysis.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Margins</span
                    >
                    <span
                      class="font-semibold text-xs sm:text-sm {getAssessmentColor(
                        summaryData.profitabilityAnalysis.marginTrend,
                      )}"
                    >
                      {summaryData.profitabilityAnalysis.marginTrend}
                    </span>
                  </div>
                </div>
                {#each summaryData.profitabilityAnalysis.keyInsights as insight}
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

            <!-- Section 3 Analysis -->
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
                        d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"
                      />
                      <path
                        d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"
                      />
                      <path
                        d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"
                      />
                    </svg>
                  </div>
                  <h5
                    class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white"
                  >
                    {sectionLabels.section3}
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    summaryData.expenseManagement.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {summaryData.expenseManagement.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Efficiency</span
                    >
                    <span
                      class="font-semibold text-xs sm:text-sm {getAssessmentColor(
                        summaryData.expenseManagement.efficiency,
                      )}"
                    >
                      {summaryData.expenseManagement.efficiency}
                    </span>
                  </div>
                </div>
                {#each summaryData.expenseManagement.keyInsights as insight}
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

            <!-- Section 4 Analysis -->
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
                    {sectionLabels.section4}
                  </h5>
                </div>
                <span
                  class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold {getAssessmentColor(
                    summaryData.earningsQuality.assessment,
                  )} bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0"
                >
                  {summaryData.earningsQuality.assessment}
                </span>
              </div>
              <div class="space-y-2 sm:space-y-3">
                <div
                  class="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-600 dark:text-gray-200"
                      >Consistency</span
                    >
                    <span
                      class="font-semibold text-xs sm:text-sm {getAssessmentColor(
                        summaryData.earningsQuality.consistency,
                      )}"
                    >
                      {summaryData.earningsQuality.consistency}
                    </span>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <p
                    class="text-xs sm:text-sm text-gray-600 dark:text-gray-200 leading-relaxed"
                  >
                    {summaryData.earningsQuality.insight}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Strengths & Red Flags -->
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
                  Key Strengths
                </h5>
              </div>
              <ul class="space-y-2 sm:space-y-2.5">
                {#each summaryData.keyStrengths as strength}
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
                      >{strength}</span
                    >
                  </li>
                {/each}
              </ul>
            </div>

            {#if summaryData.redFlags?.length > 0}
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
                  {#each summaryData.redFlags as flag}
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

          <!-- Investor Takeaway -->
          <div
            class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 sm:p-5 md:p-6"
          >
            <div class="flex items-center gap-2 sm:gap-2.5 mb-3">
              <div
                class="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0"
              >
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400"
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
                Investor Takeaway
              </h5>
            </div>
            <p
              class="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {summaryData.investorTakeaway}
            </p>
          </div>

          <!-- Disclaimer -->
          <div
            class="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4"
          >
            <p class="text-xs text-gray-800 dark:text-gray-200 italic">
              This analysis was generated by AI and may not capture all nuances
              from the financial statements. Please review the full financial
              data for complete information.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
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
