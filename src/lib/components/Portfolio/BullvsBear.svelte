<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { invalidateAll } from "$app/navigation";

  export let data: any = null;
  export let tickers: any[] = [];
  export let showAnalyzeButton: boolean = true;
  export let portfolioId: string = "";

  const SUMMARY_CREDIT_COST = 3;
  const CACHE_TTL = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds

  let isGeneratingSummary = false;
  let showSummary = false;
  let summaryGenerated = false;
  let summaryError = false;
  let summaryData: {
    sentiment?: string;
    sentimentScore?: number;
    keyHighlights?: string[];
    risks?: string[];
    outlook?: string;
    error?: string;
    date?: string;
  } | null = null;

  // Check if tickers have valid data
  $: hasNoTickers = !tickers?.some(
    (ticker) =>
      ticker?.avgPrice != null &&
      ticker?.avgPrice > 0 &&
      ticker?.shares != null &&
      ticker?.shares > 0,
  );

  // LocalStorage cache functions
  // Cache key is based on holdings (symbol, shares, avgPrice) to invalidate when portfolio changes
  function generateHoldingsHash(holdings: any[]): string {
    if (!holdings || holdings.length === 0) return "empty";

    // Sort holdings by symbol for consistent hashing
    const sortedHoldings = [...holdings]
      .filter((h) => h?.symbol && h?.shares > 0 && h?.avgPrice > 0)
      .sort((a, b) => (a.symbol || "").localeCompare(b.symbol || ""))
      .map((h) => `${h.symbol}-${h.shares}-${h.avgPrice}`)
      .join(",");

    // Simple hash function for the holdings string
    let hash = 0;
    for (let i = 0; i < sortedHoldings.length; i++) {
      const char = sortedHoldings.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  function getCacheKey(id: string, holdings: any[]) {
    const holdingsHash = generateHoldingsHash(holdings);
    return `portfolio-summary-${id}-${holdingsHash}`;
  }

  function getCachedSummary(id: string, holdings: any[]) {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(getCacheKey(id, holdings));
      if (!cached) return null;

      const { data: cachedData, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_TTL) {
        localStorage.removeItem(getCacheKey(id, holdings));
        return null;
      }

      return cachedData;
    } catch {
      return null;
    }
  }

  function saveSummaryToCache(id: string, holdings: any[], summaryResult: any) {
    if (typeof window === "undefined") return;
    try {
      // Clean up old cache entries for this portfolio (different holdings hashes)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key?.startsWith(`portfolio-summary-${id}-`) &&
          key !== getCacheKey(id, holdings)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      localStorage.setItem(
        getCacheKey(id, holdings),
        JSON.stringify({
          data: summaryResult,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Ignore storage errors
    }
  }

  // Generate markdown for export
  function generateMarkdown() {
    if (!summaryData) return "";

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let md = `# Portfolio Analysis Summary\n\n`;
    md += `## Overall Sentiment: ${summaryData?.sentiment ?? "Neutral"} (${summaryData?.sentimentScore ?? 50}%)\n\n`;

    if (summaryData?.keyHighlights?.length) {
      md += `## Key Highlights\n`;
      summaryData.keyHighlights.forEach((h) => {
        md += `- ${h}\n`;
      });
      md += `\n`;
    }

    if (summaryData?.risks?.length) {
      md += `## Risk Signals\n`;
      summaryData.risks.forEach((r) => {
        md += `- ${r}\n`;
      });
      md += `\n`;
    }

    if (summaryData?.outlook) {
      md += `## Outlook\n${summaryData.outlook}\n\n`;
    }

    md += `---\n*Generated on ${date}*\n`;
    return md;
  }

  function copyToClipboard() {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    toast.success("Summary copied to clipboard!", {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
  }

  function downloadMarkdown() {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Summary downloaded!", {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
  }

  async function generateSummary() {
    if (summaryGenerated && !summaryError) {
      showSummary = !showSummary;
      return;
    }

    // Check localStorage cache first (free, no credits)
    // Cache key includes holdings hash so it invalidates when portfolio changes
    const cached = getCachedSummary(portfolioId, tickers);
    if (cached) {
      summaryData = cached;
      summaryGenerated = true;
      showSummary = true;
      return;
    }

    // Check if user is logged in
    if (!data?.user) {
      toast.error("Please log in to use this feature.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Check if user has the right tier
    if (!["Plus", "Pro"]?.includes(data?.user?.tier)) {
      toast.error(
        "This feature is available exclusively for Subscribers. Please upgrade your plan.",
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
      return;
    }

    // Check if user has enough credits
    if (data?.user?.credits < SUMMARY_CREDIT_COST) {
      toast.error(
        `Insufficient credits. Your current balance is ${data?.user?.credits}. This feature costs ${SUMMARY_CREDIT_COST} credits.`,
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
      return;
    }

    isGeneratingSummary = true;
    showSummary = true;
    summaryError = false;

    try {
      const response = await fetch("/api/portfolio-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolioId,
          holdings: tickers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.error || "Failed to generate analysis", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
        showSummary = false;
        isGeneratingSummary = false;
        return;
      }

      summaryData = await response.json();

      if (summaryData?.error) {
        summaryError = true;
        toast.error(summaryData.error, {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
        showSummary = false;
      } else {
        // Save to localStorage cache (includes holdings hash for invalidation)
        saveSummaryToCache(portfolioId, tickers, summaryData);
        // Deduct credits on successful generation
        data.user.credits -= SUMMARY_CREDIT_COST;
        summaryGenerated = true;
        // Refresh page data to get updated bullBear from PocketBase
        await invalidateAll();
      }
    } catch (e) {
      console.error("Summary generation error:", e);
      toast.error("Something went wrong. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      showSummary = false;
      summaryError = true;
    } finally {
      isGeneratingSummary = false;
    }
  }

  // Helper function for sentiment colors
  function getSentimentColors(sentiment: string) {
    switch (sentiment?.toLowerCase()) {
      case "bullish":
        return {
          text: "text-emerald-700 dark:text-emerald-300",
          bg: "bg-emerald-50/60 dark:bg-emerald-500/10",
          bar: "bg-emerald-500/70 dark:bg-emerald-400",
        };
      case "bearish":
        return {
          text: "text-rose-700 dark:text-rose-300",
          bg: "bg-rose-50/60 dark:bg-rose-500/10",
          bar: "bg-rose-500/70 dark:bg-rose-400",
        };
      default:
        return {
          text: "text-amber-700 dark:text-amber-300",
          bg: "bg-amber-50/60 dark:bg-amber-500/10",
          bar: "bg-amber-500/70 dark:bg-amber-400",
        };
    }
  }

  // On mount/update: Check if we have a valid localStorage cache for current holdings
  // Don't auto-load from PocketBase since it might be for different holdings
  $: if (
    portfolioId &&
    tickers?.length > 0 &&
    !summaryData &&
    !summaryGenerated
  ) {
    const cached = getCachedSummary(portfolioId, tickers);
    if (cached) {
      summaryData = cached;
      summaryGenerated = true;
    }
  }

  $: sentimentColors = getSentimentColors(summaryData?.sentiment ?? "Neutral");
</script>

<div class="w-full">
  <!-- Header with Generate Button -->
  <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
      Portfolio Analysis
    </h2>

    {#if showAnalyzeButton && !hasNoTickers}
      <button
        on:click={generateSummary}
        disabled={isGeneratingSummary || hasNoTickers}
        class="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50 disabled:opacity-60"
      >
        {#if isGeneratingSummary}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        {/if}
        {summaryGenerated
          ? showSummary
            ? "Hide Summary"
            : "Show Summary"
          : "AI Summarize"}
      </button>
    {/if}
  </div>

  {#if hasNoTickers}
    <!-- No tickers in portfolio -->
    <div class="flex justify-center items-center h-40">
      <div class="text-center text-gray-700 dark:text-zinc-400">
        <p class="text-lg font-medium mb-2">No Tickers in Portfolio</p>
        <p class="text-sm">Add tickers to your portfolio to analyze it</p>
      </div>
    </div>
  {:else if showSummary}
    <!-- AI Summary Panel -->
    <div
      class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4 sm:p-6 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200"
    >
      {#if isGeneratingSummary}
        <!-- Loading State -->
        <div class="flex flex-col items-center justify-center py-8">
          <div class="relative">
            <div
              class="w-12 h-12 border-4 border-gray-200/80 dark:border-zinc-700 rounded-full"
            ></div>
            <div
              class="w-12 h-12 border-4 border-gray-900/80 border-t-transparent dark:border-white/80 rounded-full animate-spin absolute top-0 left-0"
            ></div>
          </div>
          <p class="mt-4 text-sm text-gray-700 dark:text-zinc-200 font-medium">
            Analyzing your portfolio with AI...
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400 text-center">
            Evaluating positions, concentration, and strategic implications
          </p>
        </div>
      {:else}
        <!-- Summary Content -->
        <div class="space-y-6">
          <!-- Header with Sentiment -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-gray-600 dark:text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                AI-Generated Summary
              </h3>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-800 dark:text-zinc-300"
                >Portfolio Sentiment:</span
              >
              <div class="flex items-center gap-2">
                <span
                  class="px-2.5 py-1 text-sm font-semibold {sentimentColors.text} {sentimentColors.bg} rounded-full"
                >
                  {summaryData?.sentiment ?? "Neutral"}
                </span>
                <div class="flex items-center gap-1">
                  <div
                    class="w-16 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full {sentimentColors.bar} rounded-full"
                      style="width: {summaryData?.sentimentScore ?? 50}%"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-zinc-400"
                    >{summaryData?.sentimentScore ?? 50}%</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Export Actions -->
          <div
            class="flex flex-wrap items-center justify-end gap-2 pb-4 border-b border-gray-300 dark:border-zinc-700"
          >
            <div class="flex items-center gap-2">
              <button
                on:click={copyToClipboard}
                class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
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
                class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
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

          <!-- Key Highlights -->
          <div>
            <h4
              class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
            >
              <svg
                class="w-4 h-4 text-gray-800 dark:text-zinc-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              Key Highlights
            </h4>
            <ul class="space-y-2">
              {#each summaryData?.keyHighlights ?? [] as highlight}
                <li
                  class="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-200"
                >
                  <svg
                    class="w-4 h-4 text-gray-800 dark:text-zinc-300 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {highlight}
                </li>
              {/each}
            </ul>
          </div>

          <!-- Risks Section -->
          {#if summaryData?.risks?.length}
            <div>
              <h4
                class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4 text-gray-800 dark:text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Risk Signals
              </h4>
              <ul class="space-y-2">
                {#each summaryData?.risks ?? [] as risk}
                  <li
                    class="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-200"
                  >
                    <svg
                      class="w-4 h-4 text-gray-800 dark:text-zinc-300 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {risk}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Outlook -->
          <div>
            <h4
              class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
            >
              <svg
                class="w-4 h-4 text-gray-800 dark:text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Strategic Outlook
            </h4>
            <p
              class="text-sm text-gray-700 dark:text-zinc-200 bg-white/70 dark:bg-zinc-950/40 rounded-2xl p-4 border border-gray-300 shadow dark:border-zinc-700"
            >
              {summaryData?.outlook ?? "No outlook available."}
            </p>
          </div>

          <!-- Disclaimer -->
          <p
            class="text-xs text-gray-500 dark:text-zinc-400 italic border-t border-gray-300 dark:border-zinc-700 pt-4"
          >
            This summary was generated by AI based on your portfolio holdings.
            It should not be considered investment advice. Please conduct your
            own research.
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>
