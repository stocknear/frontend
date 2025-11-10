<script lang="ts">
    import Spark from "lucide-svelte/icons/sparkles";
    import { invalidateAll } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import { mode } from "mode-watcher";

    export let data: any = null;
    export let tickers: any[] = [];
    export let showAnalyzeButton: boolean = true;
    export let portfolioId: string = "";

    let isExpanded = false;
    let activeIdx = 0;
    let isGenerating = false;
    let errorMessage = "";
    let streamingContent = "";
    let parsedStreamingBull = "";
    let parsedStreamingBear = "";

    function formatDate(dateStr, short = false) {
        try {
            // Normalize common "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
            const isoLike =
                typeof dateStr === "string" &&
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)
                    ? dateStr.replace(" ", "T")
                    : dateStr;

            const berlinFormatter = new Intl.DateTimeFormat("en-GB", {
                timeZone: "Europe/Berlin",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false, // <- IMPORTANT: use 24-hour clock so 'hour' is 0-23
            });

            const parseDateToUTCFromBerlinParts = (date) => {
                const parts = berlinFormatter.formatToParts(date);
                const get = (type) =>
                    Number(parts.find((p) => p.type === type)?.value ?? 0);
                const year = get("year");
                const month = get("month"); // 1-12
                const day = get("day");
                const hour = get("hour"); // now 0-23
                const minute = get("minute");
                const second = get("second");

                return new Date(
                    Date.UTC(year, month - 1, day, hour, minute, second),
                );
            };

            const berlinDateObj = parseDateToUTCFromBerlinParts(
                new Date(isoLike),
            );
            const berlinCurrentObj = parseDateToUTCFromBerlinParts(new Date());

            const seconds = Math.floor(
                (berlinCurrentObj - berlinDateObj) / 1000,
            );
            if (Number.isNaN(seconds)) throw new Error("Invalid date");

            const intervals = [
                { unit: "year", short: "y", seconds: 31536000 },
                { unit: "month", short: "mo", seconds: 2592000 },
                { unit: "week", short: "w", seconds: 604800 },
                { unit: "day", short: "d", seconds: 86400 },
                { unit: "hour", short: "h", seconds: 3600 },
                { unit: "minute", short: "m", seconds: 60 },
                { unit: "second", short: "s", seconds: 1 },
            ];

            for (const {
                unit,
                short: s,
                seconds: secondsInUnit,
            } of intervals) {
                const count = Math.floor(seconds / secondsInUnit);

                if (count >= 1) {
                    // Special case: prefer days instead of "25h".
                    if (unit === "hour" && count >= 24) {
                        const days = Math.floor(count / 24);
                        return short
                            ? `${days}d`
                            : `${days} day${days === 1 ? "" : "s"} ago`;
                    }

                    if (short) {
                        return `${count}${s}`;
                    }
                    return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
                }
            }

            return short ? "0s" : "Just now";
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    }

    // Parse streaming JSON to extract bull and bear text
    $: {
        if (streamingContent) {
            try {
                // Try to extract JSON even if it's incomplete
                let jsonContent = streamingContent.trim();

                // Remove markdown code blocks if present
                if (jsonContent.startsWith("```json")) {
                    jsonContent =
                        jsonContent
                            .split("```json")[1]
                            ?.split("```")[0]
                            ?.trim() || jsonContent;
                } else if (jsonContent.startsWith("```")) {
                    jsonContent =
                        jsonContent.split("```")[1]?.split("```")[0]?.trim() ||
                        jsonContent;
                }

                // Try to parse complete JSON
                if (jsonContent.startsWith("{")) {
                    // Close the JSON if it's incomplete
                    let tempJson = jsonContent;
                    if (!tempJson.endsWith("}")) {
                        tempJson = tempJson + '"}';
                    }

                    try {
                        const parsed = JSON.parse(tempJson);
                        parsedStreamingBull = parsed.bullSay || "";
                        parsedStreamingBear = parsed.bearSay || "";
                    } catch (e) {
                        // If parsing fails, try to extract text manually with regex
                        const bullMatch = jsonContent.match(
                            /"bullSay":\s*"([^"]*)"/,
                        );
                        const bearMatch = jsonContent.match(
                            /"bearSay":\s*"([^"]*)"/,
                        );
                        parsedStreamingBull = bullMatch ? bullMatch[1] : "";
                        parsedStreamingBear = bearMatch ? bearMatch[1] : "";
                    }
                }
            } catch (e) {
                // Fallback: keep empty if parsing fails
                parsedStreamingBull = "";
                parsedStreamingBear = "";
            }
        } else {
            parsedStreamingBull = "";
            parsedStreamingBear = "";
        }
    }

    // Use provided data
    $: analysisData =
        isGenerating && streamingContent
            ? { bullSays: "", bearSays: "" }
            : data;
    $: hasNoTickers = !tickers?.some(
        (ticker) =>
            ticker?.avgPrice != null &&
            ticker?.avgPrice > 0 &&
            ticker?.shares != null &&
            ticker?.shares > 0,
    );

    // --- Derived, safe strings & flags ---------------------------------------
    // Use streaming content if generating, otherwise use saved data
    $: bullText =
        isGenerating && parsedStreamingBull
            ? parsedStreamingBull
            : String(analysisData?.bullSays ?? "")?.trim();
    $: bearText =
        isGenerating && parsedStreamingBear
            ? parsedStreamingBear
            : String(analysisData?.bearSays ?? "")?.trim();

    $: hasAnyData = Boolean(analysisData) || (isGenerating && streamingContent);
    $: bullEmpty = bullText?.length === 0;
    $: bearEmpty = bearText?.length === 0;
    $: anyEmpty = hasAnyData && (bullEmpty || bearEmpty) && !isGenerating;

    // Truncation helpers
    function getTruncatedText(text: string, length: number = 250) {
        if (!text) return { text: "", isTruncated: false };
        const isTruncated = text?.length > length;
        return {
            text: isTruncated ? text?.slice(0, length) + "..." : text,
            isTruncated,
        };
    }

    $: bullTrunc = getTruncatedText(bullText);
    $: bearTrunc = getTruncatedText(bearText);

    function handleMode(i: number) {
        activeIdx = i;
        isExpanded = false; // Reset expansion when switching tabs
    }

    async function handleAnalyze() {
        if (!portfolioId) {
            errorMessage = "Portfolio ID is missing";
            return;
        }

        if (isGenerating) return; // Prevent double-clicks

        isGenerating = true;
        errorMessage = "";
        streamingContent = "";

        try {
            const response = await fetch("/api/portfolio-bull-bear", {
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

                // Show toast for insufficient credits
                if (errorData?.error?.includes("Insufficient credits")) {
                    toast.error(errorData.error, {
                        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                    });
                    isGenerating = false;
                    return;
                }

                throw new Error(
                    errorData?.error || "Failed to generate analysis",
                );
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("Failed to initialize stream reader");
            }

            let isComplete = false;

            while (!isComplete) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);

                            if (parsed.event === "progress") {
                                // Update streaming content as it arrives
                                streamingContent = parsed.content || "";
                            } else if (parsed.event === "complete") {
                                isComplete = true;
                                streamingContent = "";
                                // Reload data to reflect new analysis
                                await invalidateAll();
                            } else if (parsed.event === "error") {
                                throw new Error(
                                    parsed.message || "Analysis failed",
                                );
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete chunks
                            if (e instanceof SyntaxError) continue;
                            throw e;
                        }
                    }
                }
            }
        } catch (error: any) {
            errorMessage = error?.message || "Failed to generate analysis";
        } finally {
            isGenerating = false;
            streamingContent = "";
        }
    }
</script>

<div class="">
    <div class="space-y-3 overflow-hidden">
        {#if hasNoTickers}
            <!-- No tickers in portfolio -->
            <div class="flex justify-center items-center h-40">
                <div class="text-center text-gray-800 dark:text-gray-400">
                    <p class="text-lg font-medium mb-2">
                        No Tickers in Portfolio
                    </p>
                    <p class="text-sm">
                        Add tickers to your portfolio to analyze it
                    </p>
                </div>
            </div>
        {:else if !hasAnyData}
            <!-- No analysis object at all -->
            <div class="flex justify-center items-center h-40">
                <div class="text-center text-gray-800 dark:text-gray-400">
                    <p class="text-lg font-medium mb-2">
                        No Analysis Available
                    </p>
                    <p class="text-sm">
                        Add stocks to your portfolio to see bull and bear
                        analysis
                    </p>
                </div>
            </div>
        {:else if anyEmpty}
            <!-- Optimized early-return for the 'any empty' case -->
            <div class="w-auto lg:w-full p-1 flex flex-col m-auto">
                {#if showAnalyzeButton || analysisData?.date}
                    <div class="flex flex-col items-center w-full mb-3">
                        <div
                            class="flex flex-row justify-start mr-auto items-center w-full"
                        >
                            <div
                                class="flex flex-row items-center justify-between w-full"
                            >
                                {#if analysisData?.date}
                                    <h3
                                        class="italic text-sm text-gray-800 dark:text-gray-300"
                                    >
                                        Last Updated: {formatDate(
                                            analysisData?.date,
                                        )}
                                    </h3>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <div
                    class="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-5"
                >
                    <p class="text-gray-800 dark:text-gray-200 leading-relaxed">
                        We couldn't find any <span class="font-medium"
                            >bull</span
                        >
                        or <span class="font-medium">bear</span> points yet. Run
                        an analysis to generate arguments for both sides.
                    </p>
                    {#if showAnalyzeButton && !hasNoTickers}
                        <div class="flex flex-col gap-y-1.5 mt-4 w-fit">
                            <button
                                on:click={handleAnalyze}
                                disabled={isGenerating}
                                class="cursor-pointer inline-flex items-center text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-gray-800 dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isGenerating}
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
                                        />
                                        <path
                                            class="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Generating...
                                {:else}
                                    <Spark class="w-4 h-4 mr-2" />
                                    Generate AI Analysis
                                {/if}
                            </button>
                            <span
                                class="text-xs text-gray-800 dark:text-gray-300 ml-1 mt-0.5"
                            >
                                Analyze portfolio with latest holdings
                            </span>
                            {#if errorMessage}
                                <p
                                    class="text-xs text-red-600 dark:text-red-400 ml-1 mt-2"
                                >
                                    {errorMessage}
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- Normal rendering when at least one side has content -->
            <div class="w-auto lg:w-full p-1 flex flex-col m-auto">
                <!-- Header Section -->
                {#if showAnalyzeButton || analysisData?.date}
                    <div class="flex flex-col items-center w-full mb-3">
                        <div
                            class="flex flex-row justify-start mr-auto items-center w-full"
                        >
                            <div
                                class="flex flex-row items-center justify-between w-full"
                            >
                                {#if analysisData?.date}
                                    <h3
                                        class="italic text-sm text-gray-800 dark:text-gray-300"
                                    >
                                        Last Updated: {formatDate(
                                            analysisData?.date,
                                        )}
                                    </h3>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Tabs -->
                <div class="inline-flex mt-2 sm:mt-0 mb-3">
                    <div
                        class="-mb-px flex space-x-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <button
                            on:click={() => handleMode(0)}
                            class="cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-base font-medium transition-colors {activeIdx ===
                            0
                                ? 'border-[#37C97D] text-[#37C97D]'
                                : 'border-transparent text-gray-800 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'}"
                        >
                            Bull Say
                        </button>
                        <button
                            on:click={() => handleMode(1)}
                            class="cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-base font-medium transition-colors {activeIdx ===
                            1
                                ? 'text-red-800 border-red-800 dark:text-red-400 dark:border-red-400'
                                : 'border-transparent text-gray-800 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'}"
                        >
                            Bear Say
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex mt-5 h-auto">
                    <div
                        class="{activeIdx === 0
                            ? 'bg-[#37C97D]'
                            : 'bg-red-800 dark:bg-red-400'} w-full max-w-[3px] rounded-l-xl"
                    />
                    <div
                        class="text-gray-800 dark:text-gray-100 ml-3 text-[1rem] w-full"
                    >
                        {#if activeIdx === 0}
                            <div
                                class="bg-green-50 dark:bg-green-950/20 p-4 rounded-r-lg border-l-0"
                            >
                                {#if isGenerating && !streamingContent}
                                    <!-- Shimmer loading state before streaming starts -->
                                    <div class="py-3">
                                        <div
                                            class="text-sm sm:text-[1rem] text-gray-800 dark:text-gray-400 shimmer-text"
                                        >
                                            Creating bull arguments...
                                        </div>
                                    </div>
                                {:else if isGenerating && streamingContent}
                                    <!-- Streaming in progress - show only the streaming data -->
                                    <!-- Mobile: Truncated/Full based on isExpanded -->
                                    <p class="pr-1 leading-relaxed sm:hidden">
                                        {isExpanded ? bullText : bullTrunc.text}
                                    </p>
                                    <!-- Desktop: Always show full text -->
                                    <p
                                        class="pr-1 leading-relaxed hidden sm:block"
                                    >
                                        {bullText}
                                    </p>
                                {:else}
                                    <!-- Normal state: show saved data or empty message -->
                                    <!-- Mobile: Truncated/Full based on isExpanded -->
                                    <p class="pr-1 leading-relaxed sm:hidden">
                                        {#if bullEmpty}
                                            Analyze your portfolio to surface
                                            the strongest bull arguments
                                        {:else}
                                            {isExpanded
                                                ? bullText
                                                : bullTrunc.text}
                                        {/if}
                                    </p>
                                    <!-- Desktop: Always show full text -->
                                    <p
                                        class="pr-1 leading-relaxed hidden sm:block"
                                    >
                                        {#if bullEmpty}
                                            Analyze your portfolio to surface
                                            the strongest bull arguments
                                        {:else}
                                            {bullText}
                                        {/if}
                                    </p>
                                    {#if !bullEmpty && bullTrunc.isTruncated}
                                        <button
                                            on:click={() =>
                                                (isExpanded = !isExpanded)}
                                            class="mt-3 text-sm font-medium text-[#37C97D] hover:underline sm:hidden"
                                        >
                                            {isExpanded
                                                ? "Show Less"
                                                : "Show More"}
                                        </button>
                                    {/if}
                                {/if}
                            </div>
                        {:else}
                            <div
                                class="bg-red-50 dark:bg-red-950/20 p-4 rounded-r-lg border-l-0"
                            >
                                {#if isGenerating && !streamingContent}
                                    <!-- Shimmer loading state before streaming starts -->
                                    <div class="py-3">
                                        <div
                                            class="text-sm sm:text-[1rem] text-gray-800 dark:text-gray-400 shimmer-text"
                                        >
                                            Creating bear arguments...
                                        </div>
                                    </div>
                                {:else if isGenerating && streamingContent}
                                    <!-- Streaming in progress - show only the streaming data -->
                                    <!-- Mobile: Truncated/Full based on isExpanded -->
                                    <p class="pr-1 leading-relaxed sm:hidden">
                                        {isExpanded ? bearText : bearTrunc.text}
                                    </p>
                                    <!-- Desktop: Always show full text -->
                                    <p
                                        class="pr-1 leading-relaxed hidden sm:block"
                                    >
                                        {bearText}
                                    </p>
                                {:else}
                                    <!-- Normal state: show saved data or empty message -->
                                    <!-- Mobile: Truncated/Full based on isExpanded -->
                                    <p class="pr-1 leading-relaxed sm:hidden">
                                        {#if bearEmpty}
                                            Analyze your portfolio to surface
                                            the strongest bear arguments
                                        {:else}
                                            {isExpanded
                                                ? bearText
                                                : bearTrunc.text}
                                        {/if}
                                    </p>
                                    <!-- Desktop: Always show full text -->
                                    <p
                                        class="pr-1 leading-relaxed hidden sm:block"
                                    >
                                        {#if bearEmpty}
                                            Analyze your portfolio to surface
                                            the strongest bear arguments
                                        {:else}
                                            {bearText}
                                        {/if}
                                    </p>
                                    {#if !bearEmpty && bearTrunc.isTruncated}
                                        <button
                                            on:click={() =>
                                                (isExpanded = !isExpanded)}
                                            class="mt-3 text-sm font-medium text-red-800 dark:text-red-400 hover:underline sm:hidden"
                                        >
                                            {isExpanded
                                                ? "Show Less"
                                                : "Show More"}
                                        </button>
                                    {/if}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            {#if showAnalyzeButton && !hasNoTickers}
                <div class="flex flex-col gap-y-1.5 mt-5 w-fit px-2">
                    <button
                        on:click={handleAnalyze}
                        disabled={isGenerating}
                        class="cursor-pointer inline-flex items-center text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-gray-800 dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isGenerating}
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
                                />
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Generating...
                        {:else}
                            <Spark class="w-4 h-4 mr-2" />
                            Generate AI Analysis
                        {/if}
                    </button>
                    <span
                        class="text-xs text-gray-800 dark:text-gray-300 ml-1 mt-0.5"
                    >
                        Analyze portfolio with latest holdings
                    </span>
                    {#if errorMessage}
                        <p
                            class="text-xs text-red-600 dark:text-red-400 ml-1 mt-2"
                        >
                            {errorMessage}
                        </p>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
</div>
