<script lang="ts">
  import {
    groupNews,
    groupEarnings,
    compareTimes,
    formatTime,
    abbreviateNumber,
    removeCompanyStrings,
  } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { onMount, tick } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import Pencil from "lucide-svelte/icons/pencil";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  const intlCompact = new Intl.NumberFormat("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Lazy load MarkdownNoteEditor
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

  // ── Note Caching (LRU, max 100) ──
  const NOTE_CACHE_MAX_SIZE = 100;
  const noteCache = new Map<string, { note: string; timestamp: number }>();
  const noteFetchPromises = new Map<string, Promise<string>>();

  function getNoteFromCache(
    watchlistId: string,
    itemId: string,
  ): string | null {
    const key = `${watchlistId}:${itemId}`;
    const cached = noteCache.get(key);
    if (cached) {
      noteCache.delete(key);
      noteCache.set(key, cached);
      return cached.note;
    }
    return null;
  }

  function setNoteInCache(
    watchlistId: string,
    itemId: string,
    note: string,
  ): void {
    const key = `${watchlistId}:${itemId}`;
    if (noteCache.size >= NOTE_CACHE_MAX_SIZE) {
      const oldestKey = noteCache.keys().next().value;
      if (oldestKey) noteCache.delete(oldestKey);
    }
    noteCache.set(key, { note, timestamp: Date.now() });
  }

  async function fetchNote(
    watchlistId: string,
    itemId: string,
  ): Promise<string> {
    const key = `${watchlistId}:${itemId}`;
    const existingPromise = noteFetchPromises.get(key);
    if (existingPromise) return existingPromise;

    const cached = getNoteFromCache(watchlistId, itemId);
    if (cached !== null) return cached;

    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/get-options-watchlist-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchListId: watchlistId, itemId }),
        });
        if (!response.ok) throw new Error("Failed to fetch note");
        const data = await response.json();
        const note = data.note || "";
        setNoteInCache(watchlistId, itemId, note);
        return note;
      } finally {
        noteFetchPromises.delete(key);
      }
    })();

    noteFetchPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  function prefetchNote(watchlistId: string, itemId: string): void {
    const key = `${watchlistId}:${itemId}`;
    if (!noteCache.has(key) && !noteFetchPromises.has(key)) {
      fetchNote(watchlistId, itemId).catch(() => {});
    }
  }

  // ── Page State ──
  export let data;

  let optionsWatchlist = data?.getOptionsWatchlist;
  let watchList: any[] = [];
  let isLoaded = false;
  let editMode = false;
  let deleteIdList: string[] = [];
  $: deleteIdSet = new Set(deleteIdList);
  let numberOfChecked = 0;
  let searchQuery = "";
  let debouncedSearchQuery = "";
  let searchDebounceTimer: ReturnType<typeof setTimeout>;

  $: {
    clearTimeout(searchDebounceTimer);
    if (searchQuery.length === 0) {
      debouncedSearchQuery = "";
      currentPage = 1;
    } else {
      searchDebounceTimer = setTimeout(() => {
        debouncedSearchQuery = searchQuery;
        currentPage = 1;
      }, 200);
    }
  }

  // ── Enrichment State (populated from SSR) ──
  let enrichmentMap = new Map<
    string,
    {
      currentPrice: number | null;
      iv: number | null;
      delta: number | null;
      pctChange: number | null;
      volume: number | null;
      openInterest: number | null;
      oiChange: number | null;
      volChange: number | null;
      status: "pending" | "loading" | "done" | "error";
    }
  >(Object.entries(data?.enrichmentData ?? {}));
  let enrichmentDone = Object.keys(data?.enrichmentData ?? {}).length > 0;

  // Note modal state
  let isLoadingNote = false;
  let isNoteModalOpen = false;
  let editingNoteItemId = "";
  let editingNoteLabel = "";
  let editingNoteText = "";
  let originalNoteText = "";
  $: isNewNote = originalNoteText === "";

  // News / Earnings state
  let news: any[] = [];
  let earnings: any[] = [];
  let groupedNews: any[] = [];
  let groupedEarnings: any[] = [];
  let displayList: any[] = [];
  let rawTabData: any[] = [];
  let activeIdx = 0;

  // ── Inline Price Editing State ──
  let editingPriceItemId: string | null = null;
  let editingPriceValue = "";
  let priceInputRef: HTMLInputElement | null = null;
  let skipPriceBlur = false;

  const tabs = ["News", "Earnings Release"];

  // ── Column Visibility ──
  type ColumnDef = { name: string; key: string };

  const ALL_COLUMNS: ColumnDef[] = [
    { name: "C/P", key: "put_call" },
    { name: "Strike", key: "strike_price" },
    { name: "Expiry", key: "date_expiration" },
    { name: "DTE", key: "dte" },
    { name: "Sent.", key: "sentiment" },
    { name: "Spot", key: "underlying_price" },
    { name: "Added Price", key: "price" },
    { name: "Price", key: "currentPrice" },
    { name: "Price Chg%", key: "pctChange" },
    { name: "IV", key: "iv" },
    { name: "Delta", key: "delta" },
    { name: "Prem", key: "cost_basis" },
    { name: "Type", key: "option_activity_type" },
    { name: "Leg", key: "trade_leg_type" },
    { name: "Exec", key: "execution_estimate" },
    { name: "Size", key: "size" },
    { name: "Added Vol", key: "addedVol" },
    { name: "Vol", key: "volume" },
    { name: "Vol Chg%", key: "volChange" },
    { name: "Added OI", key: "addedOI" },
    { name: "OI", key: "openInterest" },
    { name: "OI Chg%", key: "oiChange" },
  ];

  const DEFAULT_VISIBLE_KEYS = new Set(ALL_COLUMNS.map((c) => c.key));
  const COL_STORAGE_KEY = "watchlist_options_columns";

  let visibleColumns: Set<string> = new Set(DEFAULT_VISIBLE_KEYS);
  let indicatorSearch = "";
  let indicatorSearchResults: ColumnDef[] = [];

  function loadVisibleColumns(): Set<string> {
    try {
      const saved = localStorage.getItem(COL_STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {}
    return new Set(DEFAULT_VISIBLE_KEYS);
  }

  function saveVisibleColumns() {
    try {
      localStorage.setItem(
        COL_STORAGE_KEY,
        JSON.stringify([...visibleColumns]),
      );
    } catch {}
  }

  function toggleColumn(key: string) {
    const updated = new Set(visibleColumns);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    visibleColumns = updated;
    saveVisibleColumns();
  }

  function resetColumns() {
    indicatorSearch = "";
    indicatorSearchResults = [];
    visibleColumns = new Set();
    saveVisibleColumns();
  }

  function selectAllColumns() {
    indicatorSearch = "";
    indicatorSearchResults = [];
    visibleColumns = new Set(ALL_COLUMNS.map((c) => c.key));
    saveVisibleColumns();
  }

  function handleIndicatorSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value?.toLowerCase() || "";
    indicatorSearch = q;
    if (q.length > 0) {
      indicatorSearchResults = orderedColumns.filter((c) =>
        c.name.toLowerCase().startsWith(q),
      );
    } else {
      indicatorSearchResults = [];
    }
  }

  // ── Column Order (drag-reorder) ──
  const COL_ORDER_STORAGE_KEY = "watchlist_options_columnOrder";
  let customColumnOrder: string[] = [];

  function loadColumnOrder(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem(COL_ORDER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveColumnOrder(order: string[]) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(COL_ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch {}
  }

  function applyColumnOrder(
    cols: ColumnDef[],
    order: string[],
  ): ColumnDef[] {
    if (!order.length) return cols;
    const colMap = new Map(cols.map((c) => [c.key, c]));
    const ordered: ColumnDef[] = [];
    for (const key of order) {
      const col = colMap.get(key);
      if (col) {
        ordered.push(col);
        colMap.delete(key);
      }
    }
    for (const col of colMap.values()) {
      ordered.push(col);
    }
    return ordered;
  }

  function resetColumnOrder() {
    customColumnOrder = [];
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(COL_ORDER_STORAGE_KEY);
      } catch {}
    }
  }

  $: orderedColumns = applyColumnOrder([...ALL_COLUMNS], customColumnOrder);
  $: orderedVisibleColumns = orderedColumns.filter((c) =>
    visibleColumns.has(c.key),
  );

  // ── Drag-and-Drop Column Reorder ──
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;

  function handleDragStart(event: DragEvent, index: number) {
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    }
    const target = event.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  }

  function handleDragEnd(event: DragEvent) {
    (event.target as HTMLElement).style.opacity = "1";
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragOver(event: DragEvent, index: number) {
    if (draggedIndex === null) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (index !== draggedIndex) dragOverIndex = index;
  }

  function handleDragLeave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) dragOverIndex = null;
  }

  function handleDrop(event: DragEvent, toIndex: number) {
    if (draggedIndex === null) return;
    event.preventDefault();
    if (draggedIndex !== toIndex) handleColumnReorder(draggedIndex, toIndex);
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleColumnReorder(
    fromVisibleIdx: number,
    toVisibleIdx: number,
  ) {
    const fromCol = orderedVisibleColumns[fromVisibleIdx];
    const toCol = orderedVisibleColumns[toVisibleIdx];

    const fullOrder =
      customColumnOrder.length > 0
        ? [...customColumnOrder]
        : ALL_COLUMNS.map((c) => c.key);

    const fromFullIdx = fullOrder.indexOf(fromCol.key);
    const toFullIdx = fullOrder.indexOf(toCol.key);

    const [removed] = fullOrder.splice(fromFullIdx, 1);
    fullOrder.splice(toFullIdx, 0, removed);

    customColumnOrder = fullOrder;
    saveColumnOrder(customColumnOrder);
  }

  // ── Contract Chart Modal ──
  let chartModalOpen = false;
  let chartModalItem: any = null;

  function openContractChart(item: any) {
    chartModalItem = item;
    chartModalOpen = true;
  }

  // ── Search / Filter ──
  $: filteredWatchList =
    debouncedSearchQuery.length > 0
      ? watchList.filter((item) => {
          const q = debouncedSearchQuery.toLowerCase();
          return (
            item?.ticker?.toLowerCase().includes(q) ||
            item?.put_call?.toLowerCase().includes(q) ||
            item?.sentiment?.toLowerCase().includes(q) ||
            item?.option_activity_type?.toLowerCase().includes(q) ||
            item?.execution_estimate?.toLowerCase().includes(q) ||
            item?.option_symbol?.toLowerCase().includes(q) ||
            String(item?.strike_price)?.includes(q)
          );
        })
      : watchList;

  function resetSearch() {
    searchQuery = "";
  }

  // ── Sorting ──
  const SORT_TYPES: Record<string, "string" | "number" | "date"> = {
    time: "string",
    ticker: "string",
    put_call: "string",
    strike_price: "number",
    date_expiration: "date",
    dte: "number",
    sentiment: "string",
    underlying_price: "number",
    price: "number",
    currentPrice: "number",
    pctChange: "number",
    iv: "number",
    delta: "number",
    cost_basis: "number",
    option_activity_type: "string",
    trade_leg_type: "string",
    execution_estimate: "string",
    size: "number",
    volume: "number",
    openInterest: "number",
    addedVol: "number",
    volChange: "number",
    addedOI: "number",
    oiChange: "number",
  };

  let sortOrders: Record<string, string> = Object.fromEntries(
    Object.keys(SORT_TYPES).map((k) => [k, "none"]),
  );

  const enrichedSortKeys = new Set([
    "currentPrice",
    "pctChange",
    "iv",
    "delta",
    "volume",
    "openInterest",
    "oiChange",
    "volChange",
  ]);

  function getSortValue(item: any, key: string) {
    if (key === "time") return (item.date || "") + "T" + (item.time || "");
    if (enrichedSortKeys.has(key)) {
      const enriched = enrichmentMap.get(item.id);
      if (enriched && enriched[key] != null) return enriched[key];
      if (key === "volume") return item.volume ?? null;
      if (key === "openInterest") return item.open_interest ?? null;
      return null;
    }
    if (key === "addedOI") return item.open_interest ?? null;
    if (key === "addedVol") return item.volume ?? null;
    return item[key] ?? null;
  }

  const sortData = (key: string) => {
    for (const k in sortOrders) {
      if (k !== key) sortOrders[k] = "none";
    }
    const orderCycle = ["none", "asc", "desc"];
    const idx = orderCycle.indexOf(sortOrders[key]);
    sortOrders[key] = orderCycle[(idx + 1) % 3];
    sortOrders = sortOrders;
    currentPage = 1;
  };

  const sortIconHtml = (order: string) => {
    if (!order || order === "none") return "";
    return `<svg class="shrink-0 w-3.5 h-3.5 ${order === "asc" ? "rotate-180" : ""} inline-block" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`;
  };

  $: sortedList = (() => {
    const activeKey = Object.keys(sortOrders).find(
      (k) => sortOrders[k] !== "none",
    );
    if (!activeKey) return filteredWatchList;
    const dir = sortOrders[activeKey];
    const type = SORT_TYPES[activeKey];

    return [...filteredWatchList].sort((a, b) => {
      let va: any = getSortValue(a, activeKey);
      let vb: any = getSortValue(b, activeKey);

      if (va == null) return 1;
      if (vb == null) return -1;

      if (type === "string") {
        va = String(va).toUpperCase();
        vb = String(vb).toUpperCase();
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (type === "date") {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      } else {
        va = parseFloat(va) || 0;
        vb = parseFloat(vb) || 0;
      }
      return dir === "asc" ? va - vb : vb - va;
    });
  })();

  // ── Pagination ──
  let currentPage = 1;
  let rowsPerPage = 20;
  const rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  $: {
    totalPages = Math.max(1, Math.ceil(sortedList.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
  }

  $: paginatedList = sortedList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    try {
      localStorage.setItem(
        "watchlist_options_rowsPerPage",
        String(rowsPerPage),
      );
    } catch {}
  }

  function loadRowsPerPage() {
    try {
      const saved = localStorage.getItem("watchlist_options_rowsPerPage");
      if (saved && rowsPerPageOptions.includes(Number(saved))) {
        rowsPerPage = Number(saved);
      }
    } catch {}
  }

  function computeDTE(expirationDate: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "";
    return (
      dateString.substring(5, 7) +
      "/" +
      dateString.substring(8, 10) +
      "/" +
      dateString.substring(2, 4)
    );
  }

  function formatTradeTime(timeString: string): string {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  function formatTimeLocale(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function loadWatchlistData() {
    const items = Array.isArray(optionsWatchlist?.data)
      ? optionsWatchlist.data
      : [];
    watchList = items.map((item: any) => ({
      ...item,
      dte: item.date_expiration ? computeDTE(item.date_expiration) : null,
    }));
  }

  // ── Scorecard Reactive Stats (single-pass) ──
  $: scorecard = (() => {
    const items: any[] = [];
    let wins = 0;
    let totalReturn = 0;
    let bulls = 0;
    let bears = 0;
    let puts = 0;
    let calls = 0;
    let best: any = null;
    let worst: any = null;
    let bestPct = -Infinity;
    let worstPct = Infinity;

    for (const item of filteredWatchList) {
      const e = enrichmentMap.get(item.id);
      if (e?.status !== "done" || e.pctChange === null) continue;

      items.push(item);
      const pct = e.pctChange;
      totalReturn += pct;
      if (pct > 0) wins++;
      if (item.sentiment === "Bullish") bulls++;
      else if (item.sentiment === "Bearish") bears++;
      if (item.put_call === "Puts") puts++;
      else if (item.put_call === "Calls") calls++;
      if (pct > bestPct) {
        bestPct = pct;
        best = item;
      }
      if (pct < worstPct) {
        worstPct = pct;
        worst = item;
      }
    }

    const count = items.length;
    return {
      items,
      count,
      wins,
      winRate: count > 0 ? ((wins / count) * 100).toFixed(0) : null,
      avgReturn: count > 0 ? (totalReturn / count).toFixed(1) : null,
      best,
      worst,
      bestPct: bestPct === -Infinity ? null : bestPct,
      worstPct: worstPct === Infinity ? null : worstPct,
      bulls,
      bears,
      puts,
      calls,
      putCallRatio: calls > 0 ? (puts / calls).toFixed(2) : null,
    };
  })();

  // ── News / Earnings ──
  function changeTab(i: number) {
    activeIdx = i;
    if (activeIdx === 0) {
      rawTabData = groupedNews;
    } else {
      rawTabData = groupedEarnings;
    }
    displayList = rawTabData?.slice(0, 3);
  }

  async function fetchNewsFeed() {
    const uniqueTickers = [
      ...new Set(watchList.map((i: any) => i.ticker).filter(Boolean)),
    ];
    if (uniqueTickers.length === 0) return;

    try {
      const response = await fetch("/api/get-options-watchlist-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: uniqueTickers }),
      });

      if (!response.ok) return;

      const feed = await response.json();
      news = feed?.news || [];
      earnings = feed?.earnings || [];

      // Build a fake watchList-like structure for groupNews (needs .symbol and .type)
      const tickerTypes = uniqueTickers.map((t) => ({
        symbol: t,
        type: "stocks",
      }));

      if (news.length > 0 || earnings.length > 0) {
        groupedNews = groupNews(news, tickerTypes);
        groupedEarnings = groupEarnings(earnings);
      }

      changeTab(0);
    } catch (e) {
      // Silently fail — news/earnings are non-critical
    }
  }

  // ── Edit / Delete ──
  function handleEditMode() {
    if (editMode) {
      deleteIdList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  function toggleDeleteItem(id: string) {
    const set = new Set(deleteIdList);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    deleteIdList = Array.from(set);
    numberOfChecked = deleteIdList.length;
  }

  async function handleDeleteItems() {
    if (numberOfChecked === 0) {
      toast.error("Select items to delete", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Remove deleted items from enrichmentMap
    const cleanMap = new Map(enrichmentMap);
    for (const id of deleteIdList) {
      cleanMap.delete(id);
    }
    enrichmentMap = cleanMap;

    watchList = watchList.filter((item) => !deleteIdSet.has(item.id));
    editMode = false;

    try {
      const response = await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "delete",
          itemIds: deleteIdList,
          id: optionsWatchlist?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      const result = await response.json();
      optionsWatchlist.data = result.data || [];
      loadWatchlistData();

      toast.success("Removed from watchlist", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (e) {
      toast.error("Failed to delete items", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      loadWatchlistData();
    }

    deleteIdList = [];
    numberOfChecked = 0;
  }

  // ── Scroll handler for lazy-loading more news/earnings ──
  let scrollTicking = false;
  function handleScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const scrollThreshold = document.body.offsetHeight * 0.8;
      const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
      if (isBottom && displayList?.length !== rawTabData?.length) {
        const nextIndex = displayList?.length;
        const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 3);
        displayList = [...displayList, ...filteredItem];
      }
      scrollTicking = false;
    });
  }

  // ── Notes ──
  async function handleNoteClick(
    itemId: string,
    hasNote: boolean,
    label: string,
  ) {
    const watchlistId = optionsWatchlist?.id;
    if (!watchlistId) return;

    editingNoteItemId = itemId;
    editingNoteLabel = label;
    isNoteModalOpen = true;
    isLoadingNote = true;

    try {
      const [, note] = await Promise.all([
        MarkdownNoteEditor ? Promise.resolve() : loadMarkdownEditor(),
        hasNote ? fetchNote(watchlistId, itemId) : Promise.resolve(""),
      ]);
      editingNoteText = note;
      originalNoteText = note;
    } catch (error) {
      editingNoteText = "";
      originalNoteText = "";
      toast.error("Failed to load note", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoadingNote = false;
    }
  }

  function handleNoteHover(itemId: string, hasNote: boolean) {
    if (!hasNote || !optionsWatchlist?.id) return;
    prefetchNote(optionsWatchlist.id, itemId);
  }

  async function saveNote(markdown: string) {
    const wasNewNote = isNewNote;
    const watchlistId = optionsWatchlist?.id;
    if (!watchlistId) return;

    try {
      const response = await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "note",
          id: watchlistId,
          itemId: editingNoteItemId,
          note: markdown,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      setNoteInCache(watchlistId, editingNoteItemId, markdown);

      const hasNote = markdown.length > 0;
      watchList = watchList.map((item) => {
        if (item.id === editingNoteItemId) {
          return { ...item, hasNote };
        }
        return item;
      });

      isNoteModalOpen = false;
      toast.success(wasNewNote ? "Note created" : "Note updated", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (error) {
      toast.error("Failed to save note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  function closeNoteModal() {
    isNoteModalOpen = false;
    editingNoteItemId = "";
    editingNoteLabel = "";
    editingNoteText = "";
    originalNoteText = "";
    isLoadingNote = false;
  }

  // ── Inline Price Editing ──
  function formatPriceValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num) || !Number.isFinite(num)) return "";
    return num.toFixed(2);
  }

  async function startPriceEdit(itemId: string, currentPrice: unknown) {
    editingPriceItemId = itemId;
    editingPriceValue = formatPriceValue(currentPrice);
    await tick();
    if (priceInputRef) {
      priceInputRef.focus();
      priceInputRef.select();
    }
  }

  function cancelPriceEdit() {
    editingPriceItemId = null;
    editingPriceValue = "";
  }

  function handlePriceInputKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      skipPriceBlur = true;
      savePriceEdit();
      (event.target as HTMLInputElement)?.blur();
      setTimeout(() => {
        skipPriceBlur = false;
      }, 0);
    } else if (event.key === "Escape") {
      skipPriceBlur = true;
      cancelPriceEdit();
      setTimeout(() => {
        skipPriceBlur = false;
      }, 0);
    }
  }

  function handlePriceBlur() {
    if (skipPriceBlur) return;
    savePriceEdit();
  }

  async function savePriceEdit() {
    if (!editingPriceItemId) return;
    const itemId = editingPriceItemId;
    const trimmed = editingPriceValue.trim();

    let newPrice: number | null = null;
    if (trimmed.length > 0) {
      const isValid = /^[0-9]+\.?[0-9]*$/.test(trimmed);
      if (isValid) {
        const parsed = parseFloat(trimmed);
        if (parsed > 0) {
          newPrice = Math.round(parsed * 100) / 100;
        }
      }
    }

    const item = watchList.find((i: any) => i.id === itemId);
    const oldPrice = item?.price ?? null;
    const oldPriceNum =
      oldPrice != null
        ? Math.round(parseFloat(String(oldPrice)) * 100) / 100
        : null;

    editingPriceItemId = null;
    editingPriceValue = "";

    if (newPrice === oldPriceNum) return;

    // Optimistic update
    watchList = watchList.map((i: any) => {
      if (i.id === itemId) return { ...i, price: newPrice };
      return i;
    });

    const enriched = enrichmentMap.get(itemId);
    if (enriched) {
      const currentPrice = enriched.currentPrice;
      const updatedPctChange =
        currentPrice != null && newPrice != null && newPrice > 0
          ? ((currentPrice - newPrice) / newPrice) * 100
          : null;
      enrichmentMap = new Map(enrichmentMap).set(itemId, {
        ...enriched,
        pctChange: updatedPctChange,
      });
    }

    try {
      const response = await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "updatePrice",
          id: optionsWatchlist?.id,
          itemId,
          price: newPrice,
        }),
      });

      if (!response.ok) throw new Error("Failed to update price");

      toast.success("Price updated", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (e) {
      // Revert on failure
      watchList = watchList.map((i: any) => {
        if (i.id === itemId) return { ...i, price: oldPrice };
        return i;
      });

      if (enriched) {
        const currentPrice = enriched.currentPrice;
        const revertedPctChange =
          currentPrice != null && oldPriceNum != null && oldPriceNum > 0
            ? ((currentPrice - oldPriceNum) / oldPriceNum) * 100
            : null;
        enrichmentMap = new Map(enrichmentMap).set(itemId, {
          ...enriched,
          pctChange: revertedPctChange,
        });
      }

      toast.error("Failed to update price", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  onMount(async () => {
    loadRowsPerPage();
    loadWatchlistData();
    visibleColumns = loadVisibleColumns();
    customColumnOrder = loadColumnOrder();
    isLoaded = true;

    // Fetch news/earnings for unique tickers
    if (watchList.length > 0) {
      fetchNewsFeed();
    }

    window.addEventListener("scroll", handleScroll);

    // Preload markdown editor during idle time
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
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<SEO
  title="Options Watchlist"
  description="Track your saved options flow trades. Monitor premium, sentiment, and contract details in one place."
  keywords="options watchlist, options flow tracker, saved options trades, options premium tracker"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Watchlist",
    description: "Track your saved options flow trades in one place.",
    url: "https://stocknear.com/watchlist/options",
    applicationCategory: "FinanceApplication",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Watchlist",
          item: "https://stocknear.com/watchlist",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Options",
          item: "https://stocknear.com/watchlist/options",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
/>

<div
  class="w-full overflow-hidden min-h-screen mt-1 text-gray-700 dark:text-zinc-200"
>
  <div class="w-full">
    {#if isLoaded}
      <!-- Toolbar (matching stocks watchlist layout) -->

      <!-- Empty States -->
      {#if !data?.user}
        <div class="flex flex-col justify-center items-center m-auto z-0 pt-16">
          <span class="font-bold text-xl sm:text-3xl">
            Your Options Watchlist
          </span>
          <span class="text-sm sm:text-lg m-auto p-4 text-center">
            Sign in and save options flow trades to track them here.
          </span>
          <a
            class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out"
            href="/register"
          >
            Get Started
          </a>
        </div>
      {:else if data?.user?.tier !== "Pro"}
        <div class="flex flex-col justify-center items-center m-auto z-0 pt-16">
          <span class="font-bold text-xl sm:text-3xl"> Options Watchlist </span>
          <span class="text-sm sm:text-lg m-auto p-4 text-center">
            Upgrade to Pro to save and track options flow trades.
          </span>
          <a
            class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out"
            href="/pricing"
          >
            Upgrade to Pro
          </a>
        </div>
      {:else if watchList.length === 0}
        <div class="flex flex-col justify-center items-center m-auto z-0 pt-16">
          <span class="font-bold text-xl sm:text-3xl"> No Saved Trades </span>
          <span class="text-sm sm:text-lg pt-5 m-auto p-4 text-center">
            Save trades from the Options Flow page using the star icon.
          </span>
          <a
            href="/options-flow"
            class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out group"
          >
            Browse Options Flow
            <span
              class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
            >
              <svg
                class="ml-1 size-5 text-white dark:text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </a>
        </div>
      {:else}
        <!-- Table Header Row (like Table component's header: title + find + download) -->
        <div
          class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between text-gray-700 dark:text-zinc-200 pt-2 pb-2 sm:border-b sm:border-gray-300 sm:dark:border-zinc-700"
        >
          <div
            class="flex flex-row items-center justify-between sm:justify-start w-full sm:w-fit whitespace-nowrap -mb-1 sm:mb-0"
          >
            <h2
              class="text-start w-full mb-2 sm:mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {watchList.length} Trade{watchList.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div
            class="flex flex-col sm:flex-row items-center sm:justify-end w-full border-t border-b border-gray-300 dark:border-zinc-700 sm:border-none pt-2 pb-2 sm:pt-0 sm:pb-0 gap-2 sm:gap-0"
          >
            <!-- Mobile Row 1: Find input -->
            <div class="w-full sm:w-fit">
              <div
                class="relative min-w-24 grow sm:grow-0 sm:w-fit sm:flex-1 lg:flex-none"
              >
                <div
                  class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
                >
                  {#if searchQuery?.length > 0}
                    <label class="cursor-pointer" on:click={resetSearch}>
                      <svg
                        class="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                        />
                      </svg>
                    </label>
                  {/if}
                </div>
                <input
                  bind:value={searchQuery}
                  type="text"
                  placeholder="Find..."
                  class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                />
              </div>
            </div>

            <!-- Mobile Row 2: Add Trades + Indicators -->
            <div
              class="flex flex-row items-center justify-end gap-2 w-full sm:w-auto sm:ml-2"
            >
              <!-- Add Trades Button -->
              <a
                href="/options-flow"
                class="border text-sm border-gray-300 shadow dark:border-zinc-700 inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-800 dark:hover:text-violet-400"
              >
                <svg
                  class="inline-block w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><line x1="12" y1="5" x2="12" y2="19" /><line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                  /></svg
                >
                <span class=" text-[0.85rem] sm:text-sm font-medium"
                  >Add Trades</span
                >
              </a>

              <div
                class="flex items-center gap-2 {watchList?.length === 0
                  ? 'hidden'
                  : ''}"
              >
                <!-- Delete Button (edit mode only) -->
                {#if editMode}
                  <label
                    on:click={handleDeleteItems}
                    class="border text-sm border-gray-300 shadow dark:border-zinc-700 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-1.5 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-800 dark:hover:text-rose-400"
                  >
                    <svg
                      class="inline-block w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                      /></svg
                    >
                    <span class="ml-1 text-sm">
                      {numberOfChecked}
                    </span>
                  </label>
                {/if}

                <!-- Edit Watchlist Button -->
                <label
                  on:click={handleEditMode}
                  class="border text-sm border-gray-300 shadow dark:border-zinc-700 cursor-pointer inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-800 dark:hover:text-violet-400"
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
                    /></svg
                  >
                  {#if !editMode}
                    <span class="ml-1 text-[0.85rem] sm:text-sm">
                      Edit Watchlist
                    </span>
                  {:else}
                    <span class="ml-1 text-[0.85rem] sm:text-sm"> Cancel </span>
                  {/if}
                </label>
              </div>
            </div>

            <!-- Mobile Row 3: Indicators + Download -->
            <div
              class="flex flex-row items-center justify-end w-full sm:w-auto gap-2 sm:ml-2"
            >
              <div class={watchList?.length === 0 ? "hidden" : ""}>
                <!-- Indicators Dropdown -->
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="min-w-fit w-fit border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 hover:bg-white dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-200 flex items-center px-3 py-2 rounded-full text-[0.85rem] sm:text-sm transition hover:text-violet-800 dark:hover:text-violet-400"
                    >
                      <span>Indicators</span>
                      <svg
                        class="ml-1 h-4 w-4 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </Button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    class="w-60 max-h-[400px] overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200"
                  >
                    <!-- Sticky search header -->
                    <div
                      class="sticky -top-1 z-40 bg-white/95 dark:bg-zinc-950/95 p-2 border-b border-gray-300 dark:border-zinc-700"
                    >
                      <div class="relative w-full">
                        <input
                          bind:value={indicatorSearch}
                          on:input={handleIndicatorSearch}
                          autocomplete="off"
                          type="text"
                          placeholder="Search indicators..."
                          class="text-sm w-full border-0 bg-white/95 dark:bg-zinc-950/95 focus:ring-0 focus:outline-none placeholder:text-gray-600 dark:placeholder:text-zinc-400 text-gray-700 dark:text-zinc-200 pr-8"
                        />
                        {#if indicatorSearch.length > 0}
                          <button
                            on:click={() => {
                              indicatorSearch = "";
                              indicatorSearchResults = [];
                            }}
                            class="absolute right-2 top-1/2 -translate-y-1/2"
                          >
                            <svg
                              class="h-5 w-5 text-gray-500 dark:text-zinc-400 cursor-pointer"
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
                        {/if}
                      </div>
                    </div>

                    <!-- Column checkboxes -->
                    <DropdownMenu.Group class="pb-2">
                      {#if indicatorSearch.length > 0 && indicatorSearchResults.length === 0}
                        <div
                          class="px-2 py-1 text-xs text-gray-500 dark:text-zinc-400"
                        >
                          No indicators found
                        </div>
                      {/if}
                      {#each indicatorSearch.length > 0 ? indicatorSearchResults : orderedColumns as col}
                        <DropdownMenu.Item
                          class="hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-lg"
                        >
                          <label
                            on:click|capture|preventDefault={() =>
                              toggleColumn(col.key)}
                            class="cursor-pointer flex items-center w-full"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.has(col.key)}
                              class="rounded checked:bg-blue-700 dark:checked:bg-blue-600 cursor-pointer"
                            />
                            <span class="ml-2">{col.name}</span>
                          </label>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>

                    <!-- Sticky footer -->
                    <div
                      class="sticky -bottom-1 bg-white/95 dark:bg-zinc-950/95 z-50 p-2 border-t border-gray-300 dark:border-zinc-700 flex justify-between"
                    >
                      <label
                        on:click={resetColumns}
                        class="hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 text-sm cursor-pointer"
                      >
                        Reset All
                      </label>
                      <label
                        on:click={selectAllColumns}
                        class="hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 text-sm cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              <!-- Reset Column Order -->
              {#if customColumnOrder?.length > 0}
                <button
                  on:click={resetColumnOrder}
                  title="Reset column order"
                  class="shrink-0 cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 7h14M3 12h10M3 17h6M17 10l4 4-4 4M21 14H11" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              {/if}

              <!-- Download -->
              <DownloadData
                {data}
                rawData={filteredWatchList}
                title="options-watchlist"
                bulkDownload={false}
              />
            </div>
          </div>
        </div>

        <!-- Flow Scorecard -->
        {#if enrichmentDone && scorecard.count > 0}
          <div
            class="w-full mt-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-3 sm:p-4"
          >
            <div
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              <div>
                <div
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                >
                  Win Rate
                </div>
                <div
                  class="text-sm font-semibold {Number(scorecard.winRate) >= 50
                    ? 'text-emerald-800 dark:text-emerald-400'
                    : 'text-rose-800 dark:text-rose-400'}"
                >
                  {scorecard.winRate}%
                </div>
              </div>
              <div>
                <div
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                >
                  Avg Return
                </div>
                <div
                  class="text-sm font-semibold {Number(scorecard.avgReturn) >= 0
                    ? 'text-emerald-800 dark:text-emerald-400'
                    : 'text-rose-800 dark:text-rose-400'}"
                >
                  {Number(scorecard.avgReturn) >= 0
                    ? "+"
                    : ""}{scorecard.avgReturn}%
                </div>
              </div>
              <div>
                <div
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                >
                  Put/Call Ratio
                </div>
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {scorecard.putCallRatio !== null
                    ? scorecard.putCallRatio
                    : "-"}
                </div>
              </div>
              <div>
                <div
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                >
                  Bull / Bear
                </div>
                <div class="text-sm font-semibold">
                  <span class="text-emerald-800 dark:text-emerald-400"
                    >{scorecard.bulls}</span
                  >
                  <span class="text-gray-400 dark:text-zinc-500"> / </span>
                  <span class="text-rose-800 dark:text-rose-400"
                    >{scorecard.bears}</span
                  >
                </div>
              </div>
              {#if scorecard.best}
                <div>
                  <div
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    Best
                  </div>
                  <div
                    class="text-sm font-semibold truncate {scorecard.bestPct >=
                    0
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-rose-800 dark:text-rose-400'}"
                  >
                    {scorecard.bestPct >= 0
                      ? "+"
                      : ""}{scorecard.bestPct?.toFixed(1)}% {scorecard.best
                      .ticker}
                  </div>
                </div>
              {/if}
              {#if scorecard.worst}
                <div>
                  <div
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    Worst
                  </div>
                  <div
                    class="text-sm font-semibold truncate {scorecard.worstPct >=
                    0
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-rose-800 dark:text-rose-400'}"
                  >
                    {scorecard.worstPct >= 0
                      ? "+"
                      : ""}{scorecard.worstPct?.toFixed(1)}% {scorecard.worst
                      .ticker}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Options Watchlist Table -->
        <div
          class="w-full m-auto mt-5 mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto relative"
        >
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
          >
            <thead>
              <tr
                class="bg-white/60 dark:bg-zinc-950/40 text-gray-500 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wide border-b border-gray-300 dark:border-zinc-700"
              >
                {#if editMode}
                  <th class="p-2 text-center w-8"></th>
                {/if}
                <th
                  class="p-2 text-left cursor-pointer select-none"
                  on:click={() => sortData("time")}
                >
                  <span class="inline-flex items-center gap-0.5"
                    >Time {@html sortIconHtml(sortOrders.time)}</span
                  >
                </th>
                <th class="p-2 text-center w-8"></th>
                <th
                  class="p-2 text-left cursor-pointer select-none"
                  on:click={() => sortData("ticker")}
                >
                  <span class="inline-flex items-center gap-0.5"
                    >Symbol {@html sortIconHtml(sortOrders.ticker)}</span
                  >
                </th>
                <th class="p-2 text-center w-8"></th>
                {#each orderedVisibleColumns as col, index}
                  <th
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(e, index)}
                    on:dragend={handleDragEnd}
                    on:dragover={(e) => handleDragOver(e, index)}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) => handleDrop(e, index)}
                    class="p-2 text-right cursor-pointer select-none cursor-grab active:cursor-grabbing {dragOverIndex === index && draggedIndex !== index ? 'bg-violet-100 dark:bg-violet-900/30 border-l-2 border-violet-500' : ''}"
                    on:click={() => sortData(col.key)}
                  >
                    <span class="inline-flex items-center justify-end gap-0.5"
                      >{col.name} {@html sortIconHtml(sortOrders[col.key])}</span
                    >
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
              {#each paginatedList as item}
                {@const enriched = enrichmentMap.get(item.id)}
                <tr
                  class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                >
                  {#if editMode}
                    <td class="text-center">
                      <input
                        type="checkbox"
                        checked={deleteIdSet.has(item.id)}
                        on:click={() => toggleDeleteItem(item.id)}
                        class="h-4 w-4 rounded border cursor-pointer"
                      />
                    </td>
                  {/if}
                  <td
                    class="text-start text-xs whitespace-nowrap text-gray-500 dark:text-zinc-400"
                  >
                    {formatTradeTime(item?.time)} · {formatDate(item?.date)}
                  </td>
                  <td class="text-center">
                    <button
                      on:click|stopPropagation={() => openContractChart(item)}
                      class="cursor-pointer inline-block"
                      aria-label="View contract chart"
                    >
                      <svg
                        class="w-4 h-4 text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        ><g id="SVGRepo_iconCarrier">
                          <path
                            d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></path>
                        </g></svg
                      >
                    </button>
                  </td>
                  <td
                    on:click|stopPropagation
                    class="text-start text-sm whitespace-nowrap"
                  >
                    <HoverStockChart
                      symbol={item?.ticker}
                      assetType={item?.underlying_type}
                      optionSymbol={item?.option_symbol}
                    />
                  </td>
                  <td class="text-center whitespace-nowrap">
                    <button
                      on:click|stopPropagation={() =>
                        handleNoteClick(
                          item.id,
                          item?.hasNote || false,
                          `${item?.ticker} ${item?.strike_price} ${item?.put_call}`,
                        )}
                      on:mouseenter={() =>
                        handleNoteHover(item.id, item?.hasNote || false)}
                      class="cursor-pointer transition-colors"
                      title={item?.hasNote ? "Edit note" : "Add note"}
                    >
                      <Pencil
                        class="h-3.5 w-3.5 {item?.hasNote
                          ? 'text-violet-500 dark:text-violet-400'
                          : 'text-gray-400 dark:text-zinc-500'}"
                      />
                    </button>
                  </td>
                  {#each orderedVisibleColumns as col (col.key)}
                    {#if col.key === "put_call"}
                      <td
                        class="text-end text-sm whitespace-nowrap {item?.put_call ===
                        'Calls'
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : 'text-rose-800 dark:text-rose-400'}"
                      >
                        {item?.put_call}
                      </td>
                    {:else if col.key === "strike_price"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {item?.strike_price}
                      </td>
                    {:else if col.key === "date_expiration"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {formatDate(item?.date_expiration)}
                      </td>
                    {:else if col.key === "dte"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if item?.dte === null}
                          -
                        {:else if item.dte < 0}
                          <span class="text-gray-400 dark:text-zinc-500"
                            >expired</span
                          >
                        {:else}
                          {item.dte}d
                        {/if}
                      </td>
                    {:else if col.key === "sentiment"}
                      <td
                        class="text-end text-sm whitespace-nowrap {item?.sentiment ===
                        'Bullish'
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : item?.sentiment === 'Bearish'
                            ? 'text-rose-800 dark:text-rose-400'
                            : 'text-orange-800 dark:text-[#C6A755]'}"
                      >
                        {item?.sentiment}
                      </td>
                    {:else if col.key === "underlying_price"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {item?.underlying_price}
                      </td>
                    {:else if col.key === "currentPrice"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else if enriched?.status === "done" && enriched.currentPrice !== null}
                          {enriched.currentPrice.toFixed(2)}
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {:else if col.key === "price"}
                      <td
                        class="text-end text-sm whitespace-nowrap"
                        on:click|stopPropagation
                      >
                        {#if editingPriceItemId === item.id}
                          <input
                            type="text"
                            bind:this={priceInputRef}
                            bind:value={editingPriceValue}
                            on:keydown={handlePriceInputKeydown}
                            on:blur={handlePriceBlur}
                            class="border border-gray-300 shadow dark:border-zinc-700 rounded-md px-2 py-1 w-auto max-w-20 text-right bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
                          />
                        {:else}
                          <button
                            type="button"
                            class="flex h-full w-full items-center justify-end gap-1 cursor-pointer focus:outline-hidden"
                            on:click={() => startPriceEdit(item.id, item?.price)}
                          >
                            {#if item?.price != null && item?.price !== ""}
                              <span class="min-w-[3rem] text-right">
                                {formatPriceValue(item.price)}
                              </span>
                            {:else}
                              <svg
                                class="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                ></path>
                              </svg>
                              <span class="text-sm">Add</span>
                            {/if}
                          </button>
                        {/if}
                      </td>
                    {:else if col.key === "pctChange"}
                      <td
                        class="text-end text-sm whitespace-nowrap {enriched?.pctChange !=
                        null
                          ? enriched.pctChange >= 0
                            ? 'text-emerald-800 dark:text-emerald-400'
                            : 'text-rose-800 dark:text-rose-400'
                          : ''}"
                      >
                        {#if enriched?.status === "done" && enriched.pctChange !== null}
                          {enriched.pctChange >= 0
                            ? "+"
                            : ""}{enriched.pctChange.toFixed(1)}%
                        {:else if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {:else if col.key === "iv"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if enriched?.status === "done" && enriched.iv !== null}
                          {(enriched.iv * 100).toFixed(0)}%
                        {:else if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {:else if col.key === "delta"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if enriched?.status === "done" && enriched.delta !== null}
                          {enriched.delta.toFixed(2)}
                        {:else if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {:else if col.key === "cost_basis"}
                      <td class="text-end text-sm whitespace-nowrap">
                        {abbreviateNumber(item?.cost_basis)}
                      </td>
                    {:else if col.key === "option_activity_type"}
                      <td
                        class="text-end text-sm whitespace-nowrap {item?.option_activity_type ===
                        'Sweep'
                          ? 'text-gray-600 dark:text-[#C6A755]'
                          : item?.option_activity_type === 'Block'
                            ? 'text-gray-600 dark:text-[#FF6B6B]'
                            : item?.option_activity_type === 'Large'
                              ? 'text-gray-600 dark:text-[#4ECDC4]'
                              : 'text-gray-600 dark:text-[#976DB7]'}"
                      >
                        {item?.option_activity_type}
                      </td>
                    {:else if col.key === "trade_leg_type"}
                      <td
                        class="text-end text-sm whitespace-nowrap {item?.trade_leg_type ===
                        'multi-leg'
                          ? 'text-gray-600 dark:text-[#FF9500]'
                          : 'text-gray-600 dark:text-[#7B8794]'}"
                      >
                        {item?.trade_leg_type === "multi-leg"
                          ? "Multi"
                          : "Single"}
                      </td>
                    {:else if col.key === "execution_estimate"}
                      <td
                        class="text-end text-sm whitespace-nowrap {[
                          'At Ask',
                          'Above Ask',
                        ].includes(item?.execution_estimate)
                          ? 'text-gray-600 dark:text-[#C8A32D]'
                          : ['At Bid', 'Below Bid'].includes(
                                item?.execution_estimate,
                              )
                            ? 'text-gray-600 dark:text-[#8F82FE]'
                            : 'text-gray-600 dark:text-[#A98184]'}"
                      >
                        {item?.execution_estimate?.replace("Midpoint", "Mid")}
                      </td>
                    {:else if col.key === "size"}
                      <td class="text-end text-sm whitespace-nowrap tabular-nums">
                        {intlCompact.format(item?.size)}
                      </td>
                    {:else if col.key === "volume"}
                      <td class="text-end text-sm whitespace-nowrap tabular-nums">
                        {intlCompact.format(
                          enrichmentMap.get(item.id)?.volume ?? item?.volume,
                        )}
                      </td>
                    {:else if col.key === "addedVol"}
                      <td class="text-end text-sm whitespace-nowrap tabular-nums">
                        {intlCompact.format(item?.volume)}
                      </td>
                    {:else if col.key === "volChange"}
                      <td
                        class="text-end text-sm whitespace-nowrap {enriched?.volChange !=
                        null
                          ? enriched.volChange >= 0
                            ? 'text-emerald-800 dark:text-emerald-400'
                            : 'text-rose-800 dark:text-rose-400'
                          : ''}"
                      >
                        {#if enriched?.status === "done" && enriched.volChange !== null}
                          {enriched.volChange >= 0
                            ? "+"
                            : ""}{enriched.volChange.toFixed(1)}%
                        {:else if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {:else if col.key === "openInterest"}
                      <td class="text-end text-sm whitespace-nowrap tabular-nums">
                        {intlCompact.format(
                          enrichmentMap.get(item.id)?.openInterest ??
                            item?.open_interest,
                        )}
                      </td>
                    {:else if col.key === "addedOI"}
                      <td class="text-end text-sm whitespace-nowrap tabular-nums">
                        {intlCompact.format(item?.open_interest)}
                      </td>
                    {:else if col.key === "oiChange"}
                      <td
                        class="text-end text-sm whitespace-nowrap {enriched?.oiChange !=
                        null
                          ? enriched.oiChange >= 0
                            ? 'text-emerald-800 dark:text-emerald-400'
                            : 'text-rose-800 dark:text-rose-400'
                          : ''}"
                      >
                        {#if enriched?.status === "done" && enriched.oiChange !== null}
                          {enriched.oiChange >= 0
                            ? "+"
                            : ""}{enriched.oiChange.toFixed(1)}%
                        {:else if enriched?.status === "loading"}
                          <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                          <span class="text-gray-400 dark:text-zinc-500">-</span>
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if sortedList.length > 0}
          <Pagination
            {currentPage}
            {totalPages}
            {rowsPerPage}
            {rowsPerPageOptions}
            on:pageChange={(e) => goToPage(e.detail.page)}
            on:rowsPerPageChange={(e) =>
              changeRowsPerPage(e.detail.rowsPerPage)}
          />
        {/if}

        <!-- Divider -->
        <div
          class="w-full m-auto border-b border-gray-300 dark:border-zinc-700 mt-10 mb-5"
        ></div>

        <!-- News / Earnings Tabs -->
        <div>
          <div class="inline-flex justify-center w-full rounded sm:w-auto mb-3">
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
            >
              <div>
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
                        {item}
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
                  class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
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
                          <div class="lg:hidden">
                            {formatTimeLocale(items[0].publishedDate)}
                          </div>
                          <div class="flex flex-wrap gap-x-2">
                            {#each symbols as symbol}
                              <a
                                href={`/stocks/${symbol}`}
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
                <Infobox text="No recent news for your saved tickers." />
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
                class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
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
                        {removeCompanyStrings(item?.name)}
                        (<HoverStockChart symbol={item?.symbol} />) will report

                        {#if item?.time}
                          {#if compareTimes(item?.time, "16:00") >= 0}
                            after close
                          {:else if compareTimes(item?.time, "09:30") <= 0}
                            before open
                          {:else}
                            during market
                          {/if}
                        {/if}
                        with analysts estimating
                        {abbreviateNumber(item?.revenueEst)}
                        in revenue ({(
                          (item?.revenueEst / item?.revenuePrior - 1) *
                          100
                        )?.toFixed(2)}% YoY) and
                        {item?.epsEst}
                        in EPS
                        {#if item?.epsPrior !== 0}
                          ({(
                            (item?.epsEst / item?.epsPrior - 1) *
                            100
                          )?.toFixed(2)}% YoY).
                        {/if}
                      </div>

                      <div
                        class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                      >
                        <div class="lg:hidden">
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
              <Infobox text="No upcoming earnings for your saved tickers." />
            </div>
          {/if}
        </div>
      {/if}
    {:else}
      <!-- Loading State -->
      <div class="flex justify-center items-center h-80">
        <div class="relative">
          <label
            class="bg-gray-900/80 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <span
              class="loading loading-spinner loading-md text-white dark:text-white"
            ></span>
          </label>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Note Modal -->
<input
  type="checkbox"
  id="optionsNoteModal"
  class="modal-toggle"
  bind:checked={isNoteModalOpen}
/>

<dialog id="optionsNoteModal" class="modal modal-bottom sm:modal-middle">
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
          symbol={editingNoteLabel}
          {isNewNote}
          onSave={saveNote}
          onCancel={closeNoteModal}
        />
      {/if}
    {/if}
  </div>
</dialog>

<!-- Contract Chart Modal -->
{#if chartModalOpen}
  {#await import("$lib/components/Options/ContractChartModal.svelte") then { default: ContractChartModal }}
    <ContractChartModal
      item={chartModalItem}
      isOpen={chartModalOpen}
      onClose={() => {
        chartModalOpen = false;
        chartModalItem = null;
      }}
    />
  {/await}
{/if}
