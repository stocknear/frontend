<script lang="ts">
  import {
    isOpen,
    openPriceAlert,
    newPriceAlertData,
    screenWidth,
  } from "$lib/store";
  import {
    calculateChange,
    groupNews,
    groupEarnings,
    compareTimes,
    formatTime,
    abbreviateNumber,
  } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { Combobox } from "bits-ui";
  import Pencil from "lucide-svelte/icons/pencil";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import PriceAlert from "$lib/components/PriceAlert.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import { onDestroy, onMount } from "svelte";
  import {
    price_alert_breadcrumb_home,
    price_alert_breadcrumb_price_alert,
    price_alert_cancel,
    price_alert_earnings_after_close,
    price_alert_earnings_analysts_estimate,
    price_alert_earnings_and,
    price_alert_earnings_before_open,
    price_alert_earnings_during_market,
    price_alert_earnings_in_eps,
    price_alert_earnings_in_revenue,
    price_alert_earnings_will_report_monday,
    price_alert_earnings_will_report_today,
    price_alert_earnings_will_report_tomorrow,
    price_alert_earnings_yoy,
    price_alert_edit_alert,
    price_alert_empty_description,
    price_alert_empty_title,
    price_alert_get_started,
    price_alert_main_title,
    price_alert_no_earnings,
    price_alert_no_news,
    price_alert_no_results,
    price_alert_search_placeholder,
    price_alert_seo_description,
    price_alert_seo_keywords,
    price_alert_seo_title,
    price_alert_structured_description,
    price_alert_structured_name,
    price_alert_tab_earnings,
    price_alert_tab_news,
    price_alert_toast_deleted,
    price_alert_toast_select_symbols,
  } from "$lib/paraglide/messages";
  import { getLocale } from "$lib/paraglide/runtime.js";

  export let data;

  type PriceAlertItem = {
    id: string;
    symbol: string;
    name?: string;
    type?: string;
    targetPrice?: number | null;
    condition?: string;
    priceWhenCreated?: number | null;
    price?: number | null;
    changesPercentage?: number | null;
    volume?: number | null;
    hasNote?: boolean;
  };

  // Lazy-load markdown editor to keep /price-alert lightweight.
  let MarkdownNoteEditor: any = null;
  let isLoadingEditor = false;

  async function loadMarkdownEditor() {
    if (MarkdownNoteEditor) return;
    isLoadingEditor = true;
    try {
      const module = await import("$lib/components/MarkdownNoteEditor.svelte");
      MarkdownNoteEditor = module.default;
    } finally {
      isLoadingEditor = false;
    }
  }

  // Note cache + fetch dedupe (same pattern as /watchlist/stocks).
  const NOTE_CACHE_MAX_SIZE = 100;
  const noteCache = new Map<string, { note: string; timestamp: number }>();
  const noteFetchPromises = new Map<string, Promise<string>>();

  function getNoteFromCache(priceAlertId: string): string | null {
    const cached = noteCache.get(priceAlertId);
    if (!cached) return null;
    noteCache.delete(priceAlertId);
    noteCache.set(priceAlertId, cached);
    return cached.note;
  }

  function setNoteInCache(priceAlertId: string, note: string): void {
    if (noteCache.size >= NOTE_CACHE_MAX_SIZE) {
      const oldestKey = noteCache.keys().next().value;
      if (oldestKey) noteCache.delete(oldestKey);
    }
    noteCache.set(priceAlertId, { note, timestamp: Date.now() });
  }

  function invalidateNoteCache(priceAlertId: string): void {
    noteCache.delete(priceAlertId);
  }

  async function fetchNote(priceAlertId: string): Promise<string> {
    const existingPromise = noteFetchPromises.get(priceAlertId);
    if (existingPromise) return existingPromise;

    const cached = getNoteFromCache(priceAlertId);
    if (cached !== null) return cached;

    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/get-price-alert-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceAlertId }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch note");
        }

        const payload = await response.json();
        const note = payload?.note || "";
        setNoteInCache(priceAlertId, note);
        return note;
      } finally {
        noteFetchPromises.delete(priceAlertId);
      }
    })();

    noteFetchPromises.set(priceAlertId, fetchPromise);
    return fetchPromise;
  }

  function prefetchNote(priceAlertId: string, hasNote: boolean = false): void {
    if (!hasNote) return;
    if (!noteCache.has(priceAlertId) && !noteFetchPromises.has(priceAlertId)) {
      fetchNote(priceAlertId).catch(() => {
        // Prefetch is best-effort only.
      });
    }
  }

  let timeoutId;
  let searchBarData = [];
  let inputValue = "";
  let touchedInput = false;

  let addTicker = "";
  let addAssetType = "";
  let activeIdx = 0;
  let rawTabData = [];
  let displayList = [];
  let editMode = false;
  let numberOfChecked = 0;
  let priceAlertList: PriceAlertItem[] = data?.getPriceAlert?.data || [];
  let deletePriceAlertList: string[] = [];
  let news = data?.getPriceAlert?.news || [];
  let earnings = data?.getPriceAlert?.earnings || [];
  let groupedNews = [];
  let groupedEarnings = [];
  let hasMounted = false;
  let priceAlertSubscriptionKey = "";

  // Realtime quote websocket state (same feed as /watchlist/stocks table).
  let priceSocket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingQuoteUpdates: any[] = [];
  let frameFlushId: number | null = null;
  let lastSubscriptionKey = "";
  let priceAlertAudio: HTMLAudioElement | null = null;
  let reachedAlertSyncTimer: ReturnType<typeof setTimeout> | null = null;
  let reachedAlertSyncInFlight = false;
  const reachedAlertQueue = new Map<
    string,
    { id: string; currentPrice: number }
  >();

  // Note modal state
  let isNoteModalOpen = false;
  let isLoadingNote = false;
  let editingPriceAlertId = "";
  let editingNoteSymbol = "";
  let editingNoteText = "";
  let originalNoteText = "";
  $: isNewNote = originalNoteText === "";

  const tabs = ["News", "Earnings Release"];

  function syncDerivedContent() {
    news = (news || [])?.map((item) => {
      const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, type: match?.type } : { ...item };
    });

    earnings = (earnings || [])?.map((item) => {
      const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, name: match?.name } : { ...item };
    });

    if (priceAlertList?.length > 0) {
      groupedEarnings = groupEarnings(earnings);
      groupedNews = groupNews(news, priceAlertList);
    } else {
      groupedEarnings = [];
      groupedNews = [];
    }
  }

  syncDerivedContent();
  changeTab(0);

  function getTabLabel(tab: string): string {
    const tabLabels: Record<string, () => string> = {
      News: () => price_alert_tab_news(),
      "Earnings Release": () => price_alert_tab_earnings(),
    };
    return tabLabels[tab]?.() ?? tab;
  }

  function formatTimeLocale(dateStr: string): string {
    const date = new Date(dateStr);
    const locale = getLocale();
    if (locale === "de") {
      return (
        date.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) + " Uhr"
      );
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function toFiniteNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getToTargetStats(item: PriceAlertItem) {
    const currentPrice = toFiniteNumber(item?.price);
    const targetPrice = toFiniteNumber(item?.targetPrice);
    const condition =
      String(item?.condition || "").toLowerCase() === "below"
        ? "below"
        : "above";

    if (
      currentPrice === null ||
      targetPrice === null ||
      currentPrice <= 0 ||
      targetPrice <= 0
    ) {
      return {
        valid: false,
        reached: false,
        distancePct: null,
        progressPct: 0,
        label: "-",
        textClass: "text-gray-500 dark:text-zinc-400",
        barClass: "bg-gray-400 dark:bg-zinc-500",
      };
    }

    const reached =
      condition === "above"
        ? currentPrice >= targetPrice
        : currentPrice <= targetPrice;

    const rawDistancePct =
      condition === "above"
        ? ((targetPrice - currentPrice) / currentPrice) * 100
        : ((currentPrice - targetPrice) / currentPrice) * 100;

    const distancePct = Math.abs(rawDistancePct);
    const closenessPct =
      (Math.min(currentPrice, targetPrice) /
        Math.max(currentPrice, targetPrice)) *
      100;
    const progressPct = reached
      ? 100
      : Math.max(0, Math.min(100, closenessPct));

    let textClass = "text-rose-700 dark:text-rose-400";
    let barClass = "bg-rose-500 dark:bg-rose-400";
    if (reached) {
      textClass = "text-emerald-700 dark:text-emerald-400";
      barClass = "bg-emerald-500 dark:bg-emerald-400";
    } else if (distancePct <= 1) {
      textClass = "text-sky-700 dark:text-sky-400";
      barClass = "bg-sky-500 dark:bg-sky-400";
    } else if (distancePct <= 3) {
      textClass = "text-amber-700 dark:text-amber-400";
      barClass = "bg-amber-500 dark:bg-amber-400";
    }

    const label = reached ? "At target" : `${distancePct.toFixed(2)}% away`;

    return {
      valid: true,
      reached,
      distancePct,
      progressPct,
      label,
      textClass,
      barClass,
    };
  }

  function collectSymbols(): string[] {
    const unique = new Set(
      (priceAlertList || [])
        .map((item) => String(item?.symbol || "").trim().toUpperCase())
        .filter(Boolean),
    );
    return Array.from(unique);
  }

  function buildSubscriptionKey(list: PriceAlertItem[] = []): string {
    const unique = new Set(
      (list || [])
        .map((item) => String(item?.symbol || "").trim().toUpperCase())
        .filter(Boolean),
    );
    return Array.from(unique).sort().join(",");
  }

  function flushRealtimeUpdates(): void {
    frameFlushId = null;
    if (!pendingQuoteUpdates.length || !priceAlertList?.length) return;

    // Keep the latest update per symbol to minimize per-frame work.
    const latestBySymbol = new Map<string, any>();
    for (const update of pendingQuoteUpdates) {
      const symbol = String(update?.symbol || "").toUpperCase();
      if (symbol) latestBySymbol.set(symbol, update);
    }
    pendingQuoteUpdates = [];

    if (!latestBySymbol.size) return;
    const updates = Array.from(latestBySymbol.values());
    priceAlertList = calculateChange([...priceAlertList], updates);
    enqueueReachedAlertsForServerSync(priceAlertList);
  }

  function scheduleRealtimeFlush(): void {
    if (frameFlushId !== null) return;
    frameFlushId = requestAnimationFrame(flushRealtimeUpdates);
  }

  function clearRealtimeBuffers(): void {
    pendingQuoteUpdates = [];
    if (frameFlushId !== null) {
      cancelAnimationFrame(frameFlushId);
      frameFlushId = null;
    }
  }

  function clearReachedAlertSyncState(): void {
    reachedAlertQueue.clear();
    if (reachedAlertSyncTimer) {
      clearTimeout(reachedAlertSyncTimer);
      reachedAlertSyncTimer = null;
    }
    reachedAlertSyncInFlight = false;
  }

  async function playPriceAlertSound(): Promise<void> {
    if (!priceAlertAudio) return;
    try {
      priceAlertAudio.currentTime = 0;
      await priceAlertAudio.play();
    } catch {
      // Browser may block autoplay if user hasn't interacted yet.
    }
  }

  function enqueueReachedAlertsForServerSync(
    list: PriceAlertItem[] = [],
  ): void {
    for (const item of list) {
      const id = String(item?.id || "").trim();
      if (!id) continue;

      const stats = getToTargetStats(item);
      if (!stats.valid || !stats.reached) continue;

      const currentPrice = toFiniteNumber(item?.price);
      if (currentPrice === null || currentPrice <= 0) continue;

      reachedAlertQueue.set(id, { id, currentPrice });
    }
    scheduleReachedAlertSync();
  }

  function scheduleReachedAlertSync(): void {
    if (
      !hasMounted ||
      !reachedAlertQueue.size ||
      reachedAlertSyncInFlight ||
      reachedAlertSyncTimer
    ) {
      return;
    }

    reachedAlertSyncTimer = setTimeout(() => {
      reachedAlertSyncTimer = null;
      processReachedAlertsOnServer();
    }, 250);
  }

  async function processReachedAlertsOnServer(): Promise<void> {
    if (!reachedAlertQueue.size || reachedAlertSyncInFlight) return;

    reachedAlertSyncInFlight = true;
    const alerts = Array.from(reachedAlertQueue.values());
    reachedAlertQueue.clear();

    try {
      const response = await fetch("/api/process-price-alert-triggers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alerts }),
      });

      if (!response.ok) {
        throw new Error("Failed to process triggered alerts");
      }

      const payload = await response.json();
      const triggeredCount =
        Number(payload?.triggeredCount) ||
        Number(payload?.triggeredIds?.length) ||
        0;

      if (triggeredCount > 0) {
        void playPriceAlertSound();
        await getPriceAlertList();
      }
    } catch {
      // Re-queue on transient failure for retry.
      for (const alert of alerts) {
        reachedAlertQueue.set(alert.id, alert);
      }
    } finally {
      reachedAlertSyncInFlight = false;
      if (reachedAlertQueue.size > 0) {
        scheduleReachedAlertSync();
      }
    }
  }

  function sendPriceSocketMessage(message: unknown): void {
    if (priceSocket && priceSocket.readyState === WebSocket.OPEN) {
      priceSocket.send(JSON.stringify(message));
    }
  }

  function cleanupPriceSocket(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    clearRealtimeBuffers();

    if (priceSocket) {
      try {
        if (
          priceSocket.readyState === WebSocket.OPEN ||
          priceSocket.readyState === WebSocket.CONNECTING
        ) {
          priceSocket.close();
        }
      } catch {
        // no-op
      }
      priceSocket = null;
    }
  }

  function connectPriceSocket(): void {
    const symbols = collectSymbols();
    if (!hasMounted || !$isOpen || !data?.wsURL || symbols.length === 0) return;

    if (
      priceSocket &&
      (priceSocket.readyState === WebSocket.OPEN ||
        priceSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      priceSocket = new WebSocket(`${data.wsURL}/price-data`);
    } catch {
      priceSocket = null;
      return;
    }

    priceSocket.addEventListener("open", () => {
      sendPriceSocketMessage(symbols);
    });

    priceSocket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event?.data ?? "[]");
        const updates = Array.isArray(payload) ? payload : [payload];
        if (!updates.length) return;
        pendingQuoteUpdates.push(...updates);
        scheduleRealtimeFlush();
      } catch {
        // no-op
      }
    });

    priceSocket.addEventListener("close", () => {
      priceSocket = null;
      if (!hasMounted || !$isOpen || !collectSymbols().length) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectPriceSocket();
      }, 1500);
    });

    priceSocket.addEventListener("error", () => {
      if (priceSocket) {
        try {
          priceSocket.close();
        } catch {
          // no-op
        }
      }
    });
  }

  function restartPriceSocketIfNeeded(nextKey: string): void {
    if (nextKey === lastSubscriptionKey) return;

    lastSubscriptionKey = nextKey;
    cleanupPriceSocket();
    connectPriceSocket();
  }

  async function handleFilter(priceAlertId: string) {
    const filterSet = new Set(deletePriceAlertList);
    if (filterSet.has(priceAlertId)) {
      filterSet.delete(priceAlertId);
    } else {
      filterSet.add(priceAlertId);
    }
    deletePriceAlertList = Array.from(filterSet);
    numberOfChecked = deletePriceAlertList.length;
  }

  async function handleDeleteTickers() {
    if (numberOfChecked === 0) {
      toast.error(price_alert_toast_select_symbols(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    const idsToDelete = [...deletePriceAlertList];
    const symbolsToDelete = priceAlertList
      ?.filter((item) => idsToDelete.includes(item.id))
      ?.map((item) => item.symbol);

    toast.success(price_alert_toast_deleted(), {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });

    idsToDelete.forEach((id) => invalidateNoteCache(id));
    if (isNoteModalOpen && idsToDelete.includes(editingPriceAlertId)) {
      closeNoteModal();
    }

    priceAlertList = priceAlertList?.filter((item) => !idsToDelete.includes(item.id));
    news = news?.filter((item) => !symbolsToDelete.includes(item?.symbol));
    earnings = earnings?.filter((item) => !symbolsToDelete.includes(item?.symbol));

    syncDerivedContent();
    changeTab(activeIdx);

    deletePriceAlertList = [];
    numberOfChecked = 0;
    editMode = false;

    await fetch("/api/delete-price-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priceAlertIdList: idsToDelete }),
    });
  }

  async function handleAddAlert(event, ticker, assetType) {
    addTicker = ticker;
    addAssetType = assetType?.toLowerCase();
    const response = await fetch("/api/ticker-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "get-quote",
        ticker,
      }),
    });

    const output = await response?.json();
    data.getStockQuote = output;

    const clicked = document.getElementById("priceAlertModal");
    clicked?.dispatchEvent(new MouseEvent("click"));

    editMode = false;
    $openPriceAlert = true;

    inputValue = "";
    searchBarData = [];
    touchedInput = false;
    event?.preventDefault();
  }

  function changeTab(i: number) {
    activeIdx = i;
    rawTabData = activeIdx === 0 ? groupedNews : groupedEarnings;
    displayList = rawTabData?.slice(0, 8);
  }

  async function getPriceAlertList() {
    const response = await fetch("/api/get-price-alert", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const output = await response.json();

    priceAlertList = [...(output?.data || [])];
    news = output?.news || [];
    earnings = output?.earnings || [];
    syncDerivedContent();
    changeTab(activeIdx);
    enqueueReachedAlertsForServerSync(priceAlertList);
  }

  async function handleNoteClick(item: PriceAlertItem) {
    if (!item?.id || typeof item.id !== "string") return;

    editingPriceAlertId = item.id;
    editingNoteSymbol = item.symbol;
    isNoteModalOpen = true;
    isLoadingNote = true;

    try {
      const [, note] = await Promise.all([
        MarkdownNoteEditor ? Promise.resolve() : loadMarkdownEditor(),
        item?.hasNote ? fetchNote(item.id) : Promise.resolve(""),
      ]);

      editingNoteText = note;
      originalNoteText = note;
    } catch {
      editingNoteText = "";
      originalNoteText = "";
      toast.error("Failed to load note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoadingNote = false;
    }
  }

  function handleNoteHover(item: PriceAlertItem) {
    if (!item?.id) return;
    prefetchNote(item.id, item?.hasNote || false);
  }

  async function saveNote(markdown: string) {
    const wasNewNote = isNewNote;
    if (!editingPriceAlertId) {
      toast.error("No price alert selected");
      return;
    }

    try {
      const response = await fetch("/api/update-price-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "note",
          priceAlertId: editingPriceAlertId,
          note: markdown,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const payload = await response.json();
      setNoteInCache(editingPriceAlertId, markdown);

      const hasNote = Boolean(payload?.hasNote ?? markdown.trim().length > 0);
      priceAlertList = priceAlertList?.map((item) =>
        item?.id === editingPriceAlertId ? { ...item, hasNote } : item,
      );

      isNoteModalOpen = false;
      toast.success(wasNewNote ? "Note created" : "Note updated", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (error) {
      toast.error("Failed to save note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      throw error;
    }
  }

  function closeNoteModal() {
    isNoteModalOpen = false;
    editingPriceAlertId = "";
    editingNoteSymbol = "";
    editingNoteText = "";
    originalNoteText = "";
  }

  $: charNumber = $screenWidth < 640 ? 15 : 40;

  $: {
    if (Object?.keys($newPriceAlertData)?.length > 0) {
      getPriceAlertList();
    }
  }

  function handleEditMode() {
    if (editMode) {
      deletePriceAlertList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8;
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 8);
      displayList = [...displayList, ...filteredItem];
    }
  }

  onMount(() => {
    hasMounted = true;
    lastSubscriptionKey = priceAlertSubscriptionKey;
    if ($isOpen) {
      connectPriceSocket();
    }
    enqueueReachedAlertsForServerSync(priceAlertList);
    priceAlertAudio = new Audio("/audio/notification.wav");
    priceAlertAudio.preload = "auto";

    window.addEventListener("scroll", handleScroll);

    const preloadEditor = () => {
      if (!MarkdownNoteEditor && !isLoadingEditor) {
        loadMarkdownEditor();
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(preloadEditor, { timeout: 3000 });
    } else {
      setTimeout(preloadEditor, 2000);
    }

    return () => {
      cleanupPriceSocket();
      clearReachedAlertSyncState();
      priceAlertAudio = null;
      window.removeEventListener("scroll", handleScroll);
    };
  });

  onDestroy(() => {
    hasMounted = false;
    cleanupPriceSocket();
    clearReachedAlertSyncState();
  });

  $: priceAlertSubscriptionKey = buildSubscriptionKey(priceAlertList);

  $: if (hasMounted) {
    if (!$isOpen) {
      cleanupPriceSocket();
    } else {
      restartPriceSocketIfNeeded(priceAlertSubscriptionKey);
      connectPriceSocket();
    }
  }

  async function search() {
    clearTimeout(timeoutId);

    if (!inputValue.trim()) {
      searchBarData = [];
      return;
    }

    timeoutId = setTimeout(async () => {
      const response = await fetch(
        `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
      );
      searchBarData = await response?.json();
    }, 50);
  }
</script>

<SEO
  title={price_alert_seo_title()}
  description={price_alert_seo_description()}
  keywords={price_alert_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: price_alert_structured_name(),
    description: price_alert_structured_description(),
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Custom price alerts",
      "Real-time notifications",
      "Earnings calendar integration",
      "News feed monitoring",
      "Multiple condition types",
      "Volume tracking",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-sm sm:text-[0.95rem] breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{price_alert_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">
      {price_alert_breadcrumb_price_alert()}
    </li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {price_alert_main_title()}
            </h1>
          </div>

          {#if data?.user}
            <div
              class="w-full grid grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-row sm:items-center"
            >
              <div class="order-4 w-fit flex justify-end sm:ml-3">
                <div class="flex flex-row items-center justify-end">
                  {#if editMode}
                    <label
                      on:click={handleDeleteTickers}
                      class="border text-sm border-gray-300 dark:border-zinc-700 mr-2 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-2 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-800 dark:hover:text-rose-400"
                    >
                      <svg
                        class="inline-block w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                        /></svg>

                      <span class="ml-1 text-sm">
                        {numberOfChecked}
                      </span>
                    </label>
                  {/if}
                  <label
                    on:click={handleEditMode}
                    class="border text-sm border-gray-300 dark:border-zinc-700 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    <svg
                      class="inline-block w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                      ><path
                        fill="currentColor"
                        d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
                      /><path
                        fill="currentColor"
                        d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
                      /></svg>

                    {#if !editMode}
                      <span class="ml-1 text-[0.85rem] sm:text-sm">
                        {price_alert_edit_alert()}
                      </span>
                    {:else}
                      <span class="ml-1 text-sm sm:text-[1rem]">
                        {price_alert_cancel()}
                      </span>
                    {/if}
                  </label>
                </div>
              </div>

              <div class="order-2 sm:order-1 w-full">
                <Combobox.Root
                  items={searchBarData}
                  bind:inputValue
                  bind:touchedInput
                >
                  <div class="relative w-full">
                    <Combobox.Input
                      on:input={search}
                      class="py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56"
                      placeholder={price_alert_search_placeholder()}
                      aria-label={price_alert_search_placeholder()}
                    />
                  </div>
                  <Combobox.Content
                    class="w-auto z-10 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 px-1 py-1.5 shadow-none outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length > 0}
                      {#each searchBarData as item}
                        <Combobox.Item
                          class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-2 pl-5 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-[highlighted]:text-violet-600 dark:data-[highlighted]:text-violet-400"
                          value={item.symbol}
                          label={item.name}
                          on:click={(e) =>
                            handleAddAlert(e, item?.symbol, item?.type)}
                        >
                          <div class="flex flex-col items-start">
                            <span
                              class="text-sm text-gray-700 dark:text-zinc-200"
                              >{item?.symbol}</span
                            >
                            <span
                              class="text-xs sm:text-sm text-gray-500 dark:text-zinc-400"
                              >{item?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                        >
                          {price_alert_no_results()}
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        value=""
                        class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class=" text-sm text-gray-500 dark:text-zinc-400">
                          {price_alert_no_results()}
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>
              </div>
            </div>
            <!--Start Table-->
            {#if priceAlertList?.length > 0}
              <div
                class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-hidden overflow-x-auto mt-4"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <!-- head -->
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-950/30"
                  >
                    <tr class="border-b border-gray-300 dark:border-zinc-700">
                      <th
                        class=" font-semibold text-[11px] sm:text-[12px] text-left"
                        >Symbol</th
                      >
                      <th
                        class=" font-semibold text-[11px] sm:text-[12px] text-left"
                        >Company</th
                      >

                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Price Target</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Condition</th
                      >
                      <th
                        class=" font-semibold text-left text-[11px] sm:text-[12px]"
                        >To Target</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                      >
                        Price</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >% Change</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Volume</th
                      >
                    </tr>
                  </thead>
                  <tbody class="p-3">
                    {#each priceAlertList as item}
                      {@const toTarget = getToTargetStats(item)}
                      <!-- row -->
                      <tr
                        class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                      >
                        <td
                          on:click={() => editMode && handleFilter(item?.id)}
                          class="text-sm sm:text-[0.95rem] whitespace-nowrap text-start"
                        >
                          {#if editMode}
                            <div class="flex flex-row items-center">
                              <input
                                type="checkbox"
                                checked={deletePriceAlertList?.includes(
                                  item?.id,
                                ) ?? false}
                                class="h-[18px] w-[18px] rounded-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 ring-offset-0 mr-3 cursor-pointer"
                              />
                              <label
                                class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition"
                              >
                                {item?.symbol}
                              </label>
                            </div>
                          {:else}
                            <div class="flex items-center gap-1.5">
                              <HoverStockChart
                                symbol={item?.symbol}
                                assetType={item?.type}
                              />
                              <button
                                on:click|stopPropagation={() =>
                                  handleNoteClick(item)}
                                on:mouseenter={() => handleNoteHover(item)}
                                class="cursor-pointer ml-auto transition-colors"
                                title={item?.hasNote ? "Edit note" : "Add note"}
                              >
                                <Pencil
                                  class="h-3.5 w-3.5 {item?.hasNote
                                    ? 'text-violet-500 dark:text-violet-400'
                                    : 'text-gray-400 dark:text-zinc-500'}"
                                />
                              </button>
                            </div>
                          {/if}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap"
                        >
                          {item?.name?.length > charNumber
                            ? item?.name?.slice(0, charNumber) + "..."
                            : item?.name}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.targetPrice}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.condition}
                        </td>

                        <td class=" text-sm sm:text-[0.95rem] whitespace-nowrap">
                          {#if toTarget.valid}
                            <div class="min-w-[130px]">
                              <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-medium {toTarget.textClass}">
                                  {toTarget.label}
                                </span>
                                <span
                                  class="text-[11px] text-gray-500 dark:text-zinc-400 tabular-nums"
                                >
                                  {toTarget.progressPct.toFixed(0)}%
                                </span>
                              </div>
                              <div
                                class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden"
                              >
                                <div
                                  class="h-full rounded-full transition-all duration-300 {toTarget.barClass}"
                                  style={`width: ${toTarget.progressPct}%`}
                                ></div>
                              </div>
                            </div>
                          {:else}
                            <span class="text-gray-400 dark:text-zinc-500">-</span>
                          {/if}
                        </td>
                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.price?.toFixed(2)}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {#if item?.changesPercentage >= 0}
                            <span class="text-emerald-800 dark:text-emerald-400"
                              >+{item?.changesPercentage?.toFixed(2)}%</span
                            >
                          {:else}
                            <span class="text-rose-800 dark:text-rose-400"
                              >{item?.changesPercentage?.toFixed(2)}%
                            </span>
                          {/if}
                        </td>
                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {abbreviateNumber(item?.volume)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <div
                class="w-full m-auto border-b border-gray-300 dark:border-zinc-700 mt-10 mb-5"
              ></div>

              <div class=" ">
                <div
                  class="inline-flex justify-center w-full rounded sm:w-auto mb-3"
                >
                  <div
                    class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                  >
                    <div class="">
                      <div class="inline-flex">
                        <div
                          class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700"
                        >
                          {#each tabs as item, i (item)}
                            <button
                              on:click={() => changeTab(i)}
                              class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
                                    {activeIdx === i
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                            >
                              {getTabLabel(item)}
                            </button>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {#if activeIdx === 0}
                  {#if groupedNews?.length > 0}
                    {#each displayList as [date, titleGroups]}
                      <h3
                        class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                      >
                        {date}
                      </h3>
                      <div
                        class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                      >
                        {#each titleGroups as { title, items, symbols }, index}
                          <div
                            class="flex border-gray-300 {index > 0
                              ? 'border-t'
                              : ''} dark:border-zinc-700 text-sm"
                          >
                            <div
                              class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                            >
                              {formatTimeLocale(items[0].publishedDate)}
                            </div>
                            <div class="grow px-3 py-2 lg:py-1">
                              <h4 class="text-sm lg:text-base">
                                {title}
                              </h4>
                              <div
                                class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                              >
                                <div class=" lg:hidden">
                                  {formatTimeLocale(items[0].publishedDate)}
                                </div>
                                <div class="flex flex-wrap gap-x-2">
                                  {#each symbols as symbol}
                                    <a
                                      href={`/${items[0].type}/${symbol}`}
                                      class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                                    >
                                      {symbol}
                                    </a>
                                  {/each}
                                </div>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/each}
                  {:else}
                    <br />
                    <div class="mt-3 sm:mt-0">
                      <Infobox text={price_alert_no_news()} />
                    </div>
                  {/if}
                {:else if groupedEarnings?.length > 0}
                  {#each displayList as [date, titleGroups]}
                    <h3
                      class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                    >
                      {date}
                    </h3>
                    <div
                      class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                    >
                      {#each titleGroups as item, index}
                        <div
                          class="flex border-gray-300 dark:border-zinc-700 text-sm"
                        >
                          <div
                            class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                          >
                            {formatTime(item?.time)}
                          </div>
                          <div
                            class="grow px-3 py-2 lg:py-1 {index > 0
                              ? 'border-t'
                              : ''} border-gray-300 dark:border-zinc-700"
                          >
                            <div>
                              <strong>{item?.name}</strong>
                              (<HoverStockChart symbol={item?.symbol} />)
                              {item?.isToday
                                ? price_alert_earnings_will_report_today()
                                : [
                                      "Monday",
                                      "Tuesday",
                                      "Wednesday",
                                      "Thursday",
                                    ].includes(
                                      new Date().toLocaleDateString("en-US", {
                                        weekday: "long",
                                      }),
                                    )
                                  ? price_alert_earnings_will_report_tomorrow()
                                  : price_alert_earnings_will_report_monday()}
                              {#if item?.time}
                                {#if compareTimes(item?.time, "16:00") >= 0}
                                  {price_alert_earnings_after_close()}
                                {:else if compareTimes(item?.time, "09:30") <= 0}
                                  {price_alert_earnings_before_open()}
                                {:else}
                                  {price_alert_earnings_during_market()}
                                {/if}
                              {/if}
                              {price_alert_earnings_analysts_estimate()}
                              {abbreviateNumber(item?.revenueEst)}
                              {price_alert_earnings_in_revenue()} ({(
                                (item?.revenueEst / item?.revenuePrior - 1) *
                                100
                              )?.toFixed(2)}% {price_alert_earnings_yoy()}) {price_alert_earnings_and()}
                              {item?.epsEst}
                              {price_alert_earnings_in_eps()}
                              {#if item?.epsPrior !== 0}
                                ({(
                                  (item?.epsEst / item?.epsPrior - 1) *
                                  100
                                )?.toFixed(2)}% {price_alert_earnings_yoy()}).
                              {/if}
                            </div>

                            <div
                              class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                            >
                              <div class=" lg:hidden">
                                {formatTime(item?.time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/each}
                {:else}
                  <br />
                  <div class="mt-3 sm:mt-0">
                    <Infobox text={price_alert_no_earnings()} />
                  </div>
                {/if}
              </div>
            {/if}
          {/if}
          {#if priceAlertList?.length === 0}
            <div class="flex flex-col justify-center items-center m-auto mt-14">
              <span class=" font-bold text-xl sm:text-3xl">
                {price_alert_empty_title()}
              </span>

              <span
                class=" text-sm sm:text-[1rem] m-auto p-4 text-center text-gray-600 dark:text-zinc-300"
              >
                {price_alert_empty_description()}
              </span>

              {#if !data?.user}
                <a
                  class="w-64 flex mt-10 justify-center items-center m-auto rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200 group"
                  href="/register"
                >
                  {price_alert_get_started()}
                  <span
                    class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><g transform="rotate(90 12 12)"
                        ><g fill="none"
                          ><path
                            d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                          /><path
                            fill="black"
                            d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                          /></g
                        ></g
                      ></svg>

                  </span>
                </a>
              {/if}
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<input
  type="checkbox"
  id="priceAlertNoteModal"
  class="modal-toggle"
  bind:checked={isNoteModalOpen}
/>

<dialog id="priceAlertNoteModal" class="modal modal-bottom sm:modal-middle">
  <label
    class="cursor-pointer modal-backdrop bg-black/50"
    on:click={closeNoteModal}
  ></label>

  <div
    class="modal-box w-full overflow-hidden max-w-3xl p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    {#if isNoteModalOpen}
      {#if isLoadingEditor || isLoadingNote || !MarkdownNoteEditor}
        <label
          class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <span
            class="loading loading-spinner loading-md text-white dark:text-white"
          ></span>
        </label>
      {:else}
        <svelte:component
          this={MarkdownNoteEditor}
          value={editingNoteText}
          symbol={editingNoteSymbol}
          {isNewNote}
          placeholderText="Add why this price alert matters, your setup, and what action to take when it triggers..."
          onSave={saveNote}
          onCancel={closeNoteModal}
        />
      {/if}
    {/if}
  </div>
</dialog>

<PriceAlert {data} ticker={addTicker} assetType={addAssetType} />
