<script lang="ts">
  import { isBeforeMarketOpen, isAfterMarketClose, isOpen } from "$lib/store";
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
  import {
    watchlist_add_stock_placeholder,
    watchlist_breadcrumb_home,
    watchlist_breadcrumb_watchlist,
    watchlist_cancel,
    watchlist_count_stocks,
    watchlist_create_watchlist,
    watchlist_earnings_after_close,
    watchlist_earnings_analysts_estimate,
    watchlist_earnings_and,
    watchlist_earnings_before_open,
    watchlist_earnings_during_market,
    watchlist_earnings_in_eps,
    watchlist_earnings_in_revenue,
    watchlist_earnings_will_report,
    watchlist_earnings_yoy,
    watchlist_edit_watchlist,
    watchlist_empty_description,
    watchlist_empty_title,
    watchlist_exit_full_width,
    watchlist_expand_full_width,
    watchlist_full_width,
    watchlist_get_started,
    watchlist_main_title,
    watchlist_modal_create_button,
    watchlist_modal_delete_button,
    watchlist_modal_delete_confirm,
    watchlist_modal_delete_title,
    watchlist_modal_list_name,
    watchlist_modal_new_title,
    watchlist_new_watchlist,
    watchlist_no_earnings,
    watchlist_no_news,
    watchlist_no_results,
    watchlist_normal_width,
    watchlist_seo_description,
    watchlist_seo_keywords,
    watchlist_seo_title,
    watchlist_structured_description,
    watchlist_structured_name,
    watchlist_toast_already_in_list,
    watchlist_toast_created,
    watchlist_toast_creating,
    watchlist_toast_deleted,
    watchlist_toast_error,
    watchlist_toast_error_generic,
    watchlist_toast_select_symbols,
    watchlist_toast_title_empty,
    watchlist_toast_title_long,
    watchlist_toast_updated,
    watchlist_toast_updating,
    watchlist_tab_news,
    watchlist_tab_earnings,
  } from "$lib/paraglide/messages";
  import { getLocale } from "$lib/paraglide/runtime.js";

  import { onMount } from "svelte";
  import Input from "$lib/components/Input.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { Combobox } from "bits-ui";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  // Lazy load MarkdownNoteEditor for better performance
  let MarkdownNoteEditor: any = null;
  let isLoadingEditor = false;

  async function loadMarkdownEditor() {
    if (MarkdownNoteEditor) return; // Already loaded
    isLoadingEditor = true;
    try {
      const module = await import("$lib/components/MarkdownNoteEditor.svelte");
      MarkdownNoteEditor = module.default;
    } finally {
      isLoadingEditor = false;
    }
  }

  // ============================================
  // Note Caching System for Performance
  // ============================================
  // LRU Cache to store fetched notes (max 100 entries to limit memory)
  const NOTE_CACHE_MAX_SIZE = 100;
  const noteCache = new Map<string, { note: string; timestamp: number }>();
  const noteFetchPromises = new Map<string, Promise<string>>(); // Prevent duplicate fetches

  function getNoteFromCache(
    watchlistId: string,
    symbol: string,
  ): string | null {
    const key = `${watchlistId}:${symbol}`;
    const cached = noteCache.get(key);
    if (cached) {
      // Move to end (most recently used)
      noteCache.delete(key);
      noteCache.set(key, cached);
      return cached.note;
    }
    return null;
  }

  function setNoteInCache(
    watchlistId: string,
    symbol: string,
    note: string,
  ): void {
    const key = `${watchlistId}:${symbol}`;
    // Evict oldest if at capacity
    if (noteCache.size >= NOTE_CACHE_MAX_SIZE) {
      const oldestKey = noteCache.keys().next().value;
      if (oldestKey) noteCache.delete(oldestKey);
    }
    noteCache.set(key, { note, timestamp: Date.now() });
  }

  function invalidateNoteCache(watchlistId: string, symbol: string): void {
    const key = `${watchlistId}:${symbol}`;
    noteCache.delete(key);
  }

  // Fetch note from server (with deduplication)
  async function fetchNote(
    watchlistId: string,
    symbol: string,
  ): Promise<string> {
    const key = `${watchlistId}:${symbol}`;

    // Check if already fetching
    const existingPromise = noteFetchPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Check cache first
    const cached = getNoteFromCache(watchlistId, symbol);
    if (cached !== null) {
      return cached;
    }

    // Fetch from server
    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/get-watchlist-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchListId: watchlistId, symbol }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch note");
        }

        const data = await response.json();
        const note = data.note || "";

        // Cache the result
        setNoteInCache(watchlistId, symbol, note);
        return note;
      } finally {
        // Clean up fetch promise
        noteFetchPromises.delete(key);
      }
    })();

    noteFetchPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  // Prefetch note on hover (non-blocking)
  function prefetchNote(watchlistId: string, symbol: string): void {
    const key = `${watchlistId}:${symbol}`;
    // Only prefetch if not already cached or fetching
    if (!noteCache.has(key) && !noteFetchPromises.has(key)) {
      fetchNote(watchlistId, symbol).catch(() => {
        // Silently fail prefetch - user will see error if they actually click
      });
    }
  }

  let isLoadingNote = false;

  export let data;
  let timeoutId;
  let searchBarData = [];
  let switchWatchlist = false;
  let deleteTargetWatchlist = null;
  let editMode = false;
  let numberOfChecked = 0;
  let activeIdx = 0;
  let rawTabData = [];
  let originalData = [];

  let deleteTickerList = [];

  let watchList: any[] = [];
  let tableKey = 0; // Counter to force Table re-render when needed
  type ColType = "decimal" | "int" | "float" | "percentSign";
  type Col = {
    name: string;
    rule: string;
    type: ColType;
    sessionOnly?: boolean;
  };

  const BASE: Col[] = [
    { name: "Volume", rule: "volume", type: "decimal" },
    { name: "Market Cap", rule: "marketCap", type: "int" },
    { name: "Added Price", rule: "addedPrice", type: "float" },
    { name: "Price", rule: "price", type: "float" },
    { name: "% Since Added", rule: "sinceAdded", type: "percentSign" },
    { name: "% Change", rule: "changesPercentage", type: "percentSign" },
  ];

  const PREMARKET: Col[] = [
    {
      name: "Premkt Price",
      rule: "preMarketPrice",
      type: "float",
      sessionOnly: true,
    },
    {
      name: "% Premkt Change",
      rule: "preMarketChangesPercentage",
      type: "percentSign",
      sessionOnly: true,
    },
  ];

  const AFTERMARKET: Col[] = [
    {
      name: "Aftermkt Price",
      rule: "afterMarketPrice",
      type: "float",
      sessionOnly: true,
    },
    {
      name: "% Aftermkt Change",
      rule: "afterMarketChangesPercentage",
      type: "percentSign",
      sessionOnly: true,
    },
  ];

  let defaultList: Col[] = BASE;

  // Reactive derivation: base + (premarket extras) + (aftermarket extras)
  $: defaultList = [
    ...BASE,
    ...(!$isOpen && $isBeforeMarketOpen ? PREMARKET : []),
    ...(!$isOpen && $isAfterMarketClose ? AFTERMARKET : []),
  ];

  let news = [];
  let earnings = [];
  let groupedNews = [];
  let groupedEarnings = [];
  let displayList = [];

  const tabs = ["News", "Earnings Release"];

  function getTabLabel(tab: string): string {
    const tabLabels: Record<string, () => string> = {
      News: watchlist_tab_news,
      "Earnings Release": watchlist_tab_earnings,
    };
    return tabLabels[tab]?.() ?? tab;
  }

  function formatTimeLocale(dateString: string): string {
    const date = new Date(dateString);
    const isGerman = getLocale() === "de";
    if (isGerman) {
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

  let isLoaded = false;
  let isFullWidth = false;
  let displayWatchList;
  let allList = data?.getAllWatchlist;

  async function getWatchlistData() {
    const postData = {
      watchListId: displayWatchList?.id,
      ruleOfList: [
        { rule: "volume" },
        { rule: "marketCap" },
        { rule: "price" },
        { rule: "changesPercentage" },
        { rule: "addedPrice" },
      ]?.map((item) => item?.rule),
    };

    let output;
    try {
      const response = await fetch("/api/get-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        console.error("Failed to fetch watchlist data:", response.status);
        return;
      }

      output = await response.json();
    } catch (error) {
      console.error("Error fetching watchlist data:", error);
      return;
    }

    // Parse ticker data - handle both string (JSON) and array formats
    let tickerData = displayWatchList?.ticker || [];
    if (typeof tickerData === "string") {
      try {
        tickerData = JSON.parse(tickerData);
      } catch {
        tickerData = [];
      }
    }

    // Create a lookup map for hasNote flags from displayWatchList.ticker
    // Handle both old format (array of strings) and new format (array of objects with hasNote)
    const tickerHasNote = new Map(
      Array.isArray(tickerData)
        ? tickerData.map((t) => {
            if (typeof t === "string") {
              return [t, false];
            }
            // Support both hasNote (new format) and note (legacy format)
            const hasNote =
              t.hasNote ?? Boolean(t.note && t.note.trim?.().length > 0);
            return [t.symbol, hasNote];
          })
        : [],
    );

    // Calculate sinceAdded (% return since entry) for each item and merge hasNote flag
    watchList = output?.data?.map((item) => {
      const currentPrice = parseFloat(item?.price) || 0;
      const entryPrice = parseFloat(item?.addedPrice) || 0;

      let sinceAdded = null;
      if (entryPrice > 0 && currentPrice > 0) {
        sinceAdded = ((currentPrice - entryPrice) / entryPrice) * 100;
        sinceAdded = Math.round(sinceAdded * 100) / 100; // Round to 2 decimal places
      }

      // Merge hasNote flag from watchlist ticker data
      const hasNote = tickerHasNote.get(item?.symbol) || false;

      return { ...item, sinceAdded, hasNote };
    });
    originalData = watchList;

    // Force Table re-render to sync internal state
    tableKey++;

    news = output?.news;
    earnings = output?.earnings;

    news = news?.map((item) => {
      const match = watchList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, type: match?.type } : { ...item };
    });

    earnings = earnings?.map((item) => {
      const match = watchList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, name: match?.name } : { ...item };
    });
    if (watchList?.length > 0) {
      groupedEarnings = groupEarnings(earnings);
      groupedNews = groupNews(news, watchList);
    } else {
      groupedEarnings = [];
      groupedNews = [];
    }
    changeTab(0);
  }

  async function createWatchList(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(event.target); // Create a FormData object from the form
    const title = formData.get("title");

    // Validate the title input
    if (!title || title.toString().trim().length === 0) {
      toast.error(watchlist_toast_title_empty(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    if (title.toString().length > 100) {
      toast.error(watchlist_toast_title_long(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Build the POST data object
    const postData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      postData[key] = value;
    }

    // Create a promise for the POST request
    const promise = fetch("/api/create-watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    }).then(async (response) => {
      const output = await response.json();
      if (!response.ok) {
        // If the server returned an error (e.g. non‑Pro user already has a watchlist),
        // throw an error to be caught by toast.promise.
        throw new Error(
          output.error || "Something went wrong. Please try again!",
        );
      }
      return output;
    });

    // Use toast.promise to display a loading toast, then a success or error message
    toast.promise(promise, {
      loading: watchlist_toast_creating(),
      success: watchlist_toast_created(),
      error: (err) => err.message || watchlist_toast_error(),
    });

    try {
      const output = await promise;

      // Save the watchlist ID to localStorage (optional)
      try {
        localStorage.setItem("last-watchlist-id", JSON.stringify(output?.id));
      } catch (e) {
        console.log("Failed saving watchlist id: ", e);
      }

      // Dispatch events to close the modal and navigate to the watchlist page
      const clicked = document.getElementById("addWatchlist");
      clicked?.dispatchEvent(new MouseEvent("click"));

      const anchor = document.createElement("a");
      anchor.href = "/watchlist/stocks";
      anchor.dispatchEvent(new MouseEvent("click"));
    } catch (error) {
      console.error("Error creating watchlist:", error);
      // No additional toast.error is needed here since toast.promise already handles errors.
    }
  }

  function handleDeleteModal(event) {
    event?.preventDefault();
    const clicked = document.getElementById("deleteWatchlist");
    clicked.dispatchEvent(new MouseEvent("click"));
  }

  async function deleteWatchlist(event) {
    event.preventDefault(); // prevent the default form submission behavior

    const idToDelete = deleteTargetWatchlist?.id;
    if (!idToDelete) return;

    const postData = {
      watchListId: idToDelete,
    };

    try {
      const response = await fetch("/api/delete-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const output = await response.json();

      if (output === "success") {
        toast.success(watchlist_toast_deleted(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });

        allList = allList?.filter((item) => item?.id !== idToDelete);
        allList = [...allList];

        // Only switch display if we deleted the currently displayed watchlist
        if (displayWatchList?.id === idToDelete) {
          if (allList.length > 0) {
            displayWatchList = allList[0];
            changeWatchList(displayWatchList);
          } else {
            displayWatchList = {};
            watchList = [];
            originalData = [];
            news = [];
            earnings = [];
            groupedNews = [];
            groupedEarnings = [];
          }
        }

        deleteTargetWatchlist = null;

        const clicked = document.getElementById("deleteWatchlist");
        clicked.dispatchEvent(new MouseEvent("click"));
      } else {
        toast.error(watchlist_toast_error(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(watchlist_toast_error_generic(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  function handleEditMode() {
    if (editMode === true) {
      deleteTickerList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  async function handleFilter(symbol) {
    const filterSet = new Set(deleteTickerList);

    // Check if the new filter already exists in the list
    if (filterSet?.has(symbol)) {
      // If it exists, remove it from the list
      filterSet?.delete(symbol);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(symbol);
    }
    deleteTickerList = Array?.from(filterSet);
    numberOfChecked = deleteTickerList?.length;
  }

  async function handleDeleteTickers() {
    if (numberOfChecked === 0) {
      toast.error(watchlist_toast_select_symbols(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      watchList = watchList?.filter(
        (item) => !deleteTickerList?.includes(item?.symbol),
      );

      originalData = watchList;

      news = news?.filter((item) => !deleteTickerList?.includes(item?.symbol));
      earnings = earnings?.filter(
        (item) => !deleteTickerList?.includes(item?.symbol),
      );

      deleteTickerList = [...deleteTickerList];
      editMode = false;
      const postData = {
        ticker: watchList?.map((item) => item?.symbol),
        watchListId: displayWatchList?.id,
        mode: "delete",
      };

      try {
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          console.error("Failed to delete tickers:", response.status);
        }
      } catch (error) {
        console.error("Error deleting tickers:", error);
      }

      deleteTickerList = [];
      numberOfChecked = 0;
      allList = allList?.map((item) => {
        if (item?.id === displayWatchList?.id) {
          return { ...item, ticker: watchList }; // Update ticker with watchlist
        }
        return item; // Return unchanged item if condition doesn't match
      });

      allList = [...allList];
      if (watchList?.length > 0) {
        groupedNews = groupNews(news, watchList);
        groupedEarnings = groupEarnings(earnings);
      } else {
        groupedEarnings = [];
        groupedNews = [];
      }
      // Force Table re-render to sync with updated data
      tableKey++;
    }
  }

  function changeTab(i) {
    activeIdx = i;
    if (activeIdx === 0) {
      rawTabData = groupedNews;
    } else {
      rawTabData = groupedEarnings;
    }
    displayList = rawTabData?.slice(0, 3);
  }

  let isAddingTicker = false;

  async function handleAddTicker(event, ticker) {
    // Prevent multiple simultaneous calls
    if (isAddingTicker) return;

    // Check if the ticker is already in the watchlist.
    if (watchList?.some((item) => item?.symbol === ticker)) {
      toast.error(watchlist_toast_already_in_list(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      clearSearchInput();
      return;
    }

    isAddingTicker = true;

    // Clear input and search results (delayed to run after Combobox handler)
    clearSearchInput();

    // Exit edit mode.
    editMode = false;

    try {
      // Prepare the data to send to the API (price is fetched server-side)
      const postData = {
        ticker: ticker,
        watchListId: displayWatchList?.id,
      };

      // Create a promise for the fetch request.
      const promise = fetch("/api/update-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      }).then(async (response) => {
        const output = await response.json();
        // If the response is not OK, throw an error with the message from the API.
        if (!response.ok) {
          throw new Error(output.error || "Failed to update watchlist");
        }
        return output;
      });

      // Use toast.promise to display notifications based on the promise's state.
      toast?.promise(promise, {
        loading: watchlist_toast_updating(),
        success: watchlist_toast_updated(),
        error: (err) => err.message || watchlist_toast_error(),
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });

      // Await the promise, which returns the updated watchlist data.
      const updatedData = await promise;

      // Update the local allList with the updated watchlist.
      allList = allList?.map((item) => {
        if (item?.id === displayWatchList?.id) {
          return { ...item, ticker: updatedData.ticker };
        }
        return item;
      });

      // Refresh displayWatchList from the updated list.
      displayWatchList = allList?.find(
        (item) => item?.id === displayWatchList?.id,
      );

      // Refresh the watchlist data (UI or state refresh).
      await getWatchlistData();
    } catch (error) {
      console.error("Error updating watchlist:", error);
      // Note: The error toast is already displayed by toast.promise.
    } finally {
      isAddingTicker = false;
    }
  }

  function changeWatchList(newWatchList) {
    displayWatchList = newWatchList;
    switchWatchlist = true;
    try {
      // Save the version along with the rules
      localStorage?.setItem(
        "last-watchlist-id",
        JSON?.stringify(displayWatchList?.id),
      );
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 3);
      displayList = [...displayList, ...filteredItem];
    }
  }

  async function handleScrollStocks() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 8);
      displayList = [...displayList, ...filteredItem];
    }
  }

  // Helper function to safely parse JSON
  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      // If JSON parsing fails, just return the original value
      return value;
    }
  }

  // Toggle full width mode
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem("watchlist-stocks-full-width", String(isFullWidth));
    } catch (e) {
      console.warn("Failed to save full width preference:", e);
    }
  }

  onMount(async () => {
    // Load full width preference
    const savedFullWidth = localStorage?.getItem("watchlist-stocks-full-width");
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    try {
      const savedLastWatchlistId = localStorage?.getItem("last-watchlist-id");

      // Safely parse savedLastWatchlistId using safeParse
      let parsedLastWatchlistId = null;
      if (savedLastWatchlistId && savedLastWatchlistId.length > 0) {
        parsedLastWatchlistId = safeParse(savedLastWatchlistId);
      }

      displayWatchList = allList?.find(
        (item) => item?.id === parsedLastWatchlistId,
      );

      // If no valid watchlist is found, default to the first element of allList
      if (!displayWatchList && allList?.length > 0) {
        displayWatchList = allList.at(0);
      } else if (!displayWatchList) {
        displayWatchList = {};
      }

      await getWatchlistData();

      isLoaded = true;
    } catch (e) {
      console.error("onMount error:", e);
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScrollStocks);

    // Preload markdown editor during idle time for faster note opening
    const preloadEditor = () => {
      if (!MarkdownNoteEditor && !isLoadingEditor) {
        loadMarkdownEditor();
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(preloadEditor, { timeout: 3000 });
    } else {
      setTimeout(preloadEditor, 2000);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScrollStocks);
    };
  });

  $: {
    if (switchWatchlist && typeof window !== "undefined") {
      switchWatchlist = false;
      isLoaded = false;
      getWatchlistData().then(() => {
        isLoaded = true;
      });
    }
  }

  let inputValue = "";
  let touchedInput = false;

  // Clear search input (delayed to run after Combobox internal handler)
  const clearSearchInput = () => {
    setTimeout(() => {
      inputValue = "";
      searchBarData = [];
      touchedInput = false;
    }, 0);
  };

  async function search() {
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      return;
    }

    timeoutId = setTimeout(async () => {
      const response = await fetch(
        `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
      );
      searchBarData = await response?.json();
    }, 50); // delay
  }

  // Note Modal State
  let isNoteModalOpen = false;
  let editingNoteSymbol = "";
  let editingNoteText = "";
  let originalNoteText = ""; // Track original text to detect changes

  // Check if this is a new note
  $: isNewNote = originalNoteText === "";

  async function handleNoteClick(symbol: string, hasNote: boolean = false) {
    // Security: Validate symbol format (alphanumeric, dots, hyphens, ^ for index tickers, max 20 chars)
    if (!symbol || !/^[\^A-Za-z0-9.\-]{1,20}$/.test(symbol)) {
      console.error("Invalid symbol format");
      return;
    }

    const watchlistId = displayWatchList?.id;
    if (!watchlistId) {
      console.error("No watchlist selected");
      return;
    }

    editingNoteSymbol = symbol;
    isNoteModalOpen = true;
    isLoadingNote = true;

    try {
      // Load editor component and fetch note in parallel
      const [, note] = await Promise.all([
        MarkdownNoteEditor ? Promise.resolve() : loadMarkdownEditor(),
        hasNote ? fetchNote(watchlistId, symbol) : Promise.resolve(""),
      ]);

      editingNoteText = note;
      originalNoteText = note;
    } catch (error) {
      console.error("Failed to load note:", error);
      editingNoteText = "";
      originalNoteText = "";
      toast.error("Failed to load note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoadingNote = false;
    }
  }

  // Handler for prefetching notes on hover
  function handleNoteHover(symbol: string, hasNote: boolean = false) {
    if (!hasNote || !displayWatchList?.id) return;
    prefetchNote(displayWatchList.id, symbol);
  }

  async function saveNote(markdown: string) {
    const wasNewNote = isNewNote;
    const watchlistId = displayWatchList?.id;

    if (!watchlistId) {
      toast.error("No watchlist selected");
      return;
    }

    try {
      const response = await fetch("/api/update-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "note",
          watchListId: watchlistId,
          symbol: editingNoteSymbol,
          note: markdown,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      // Update the note cache with the saved content
      setNoteInCache(watchlistId, editingNoteSymbol, markdown);

      // Update hasNote flag in local data (without storing the full note)
      const hasNote = markdown.length > 0;
      allList = allList?.map((item) => {
        if (item?.id === watchlistId) {
          const updatedTicker = item.ticker?.map((t: any) => {
            if (t.symbol === editingNoteSymbol) {
              return { ...t, hasNote };
            }
            return t;
          });
          return { ...item, ticker: updatedTicker };
        }
        return item;
      });

      // Refresh displayWatchList from the updated list
      displayWatchList = allList?.find((item) => item?.id === watchlistId);

      // Close modal and reset state
      isNoteModalOpen = false;

      toast.success(wasNewNote ? "Note created" : "Note updated", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });

      // Refresh watchlist data to sync Table component (gets fresh hasNote flags)
      await getWatchlistData();
    } catch (error) {
      toast.error("Failed to save note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      throw error; // Re-throw to let the editor know the save failed
    }
  }

  function closeNoteModal() {
    isNoteModalOpen = false;
    editingNoteSymbol = "";
    editingNoteText = "";
    originalNoteText = "";
    isLoadingNote = false;
  }
</script>

<SEO
  title={watchlist_seo_title()}
  description={watchlist_seo_description()}
  keywords={watchlist_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: watchlist_structured_name(),
    description: watchlist_structured_description(),
    url: "https://stocknear.com/watchlist/stocks",
    applicationCategory: "FinanceApplication",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: watchlist_breadcrumb_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: watchlist_breadcrumb_watchlist(),
          item: "https://stocknear.com/watchlist",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Stocks",
          item: "https://stocknear.com/watchlist/stocks",
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

<section
  class="w-full overflow-hidden min-h-screen pt-5 pb-40 px-3 text-gray-700 dark:text-zinc-200 transition-all duration-300 {isFullWidth
    ? 'max-w-full'
    : 'max-w-3xl sm:max-w-[1400px]'}"
>
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs">
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 transition"
        >{watchlist_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">
      {watchlist_breadcrumb_watchlist()}
    </li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
          >
            {watchlist_main_title()}
          </h1>
          {#if isLoaded}
            <div
              class="flex w-full sm:w-[50%] md:w-auto mb-5 {!data?.user
                ? 'hidden'
                : 'md:block'} border-t border-b border-gray-300 dark:border-zinc-700 py-2"
            >
              <div
                class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-row sm:items-center"
              >
                <div class="order-0 w-full sm:w-fit">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="min-w-[110px] w-full sm:w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate font-medium text-sm"
                          >{displayWatchList?.title !== undefined
                            ? displayWatchList?.title
                            : watchlist_create_watchlist()}</span
                        >
                        <svg
                          class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                      side="bottom"
                      align="start"
                      sideOffset={10}
                      alignOffset={0}
                      class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
                    >
                      <DropdownMenu.Label>
                        <DropdownMenu.Trigger asChild let:builder>
                          <Button
                            builders={[builder]}
                            class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 bg-transparent whitespace-nowrap focus:outline-hidden text-gray-700 dark:text-zinc-200"
                          >
                            <label
                              for="addWatchlist"
                              class="flex flex-row items-center cursor-pointer hover:text-violet-800 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                              <div class="text-sm text-start">
                                {watchlist_new_watchlist()}
                              </div>
                            </label>
                          </Button>
                        </DropdownMenu.Trigger>
                      </DropdownMenu.Label>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Group>
                        {#each allList as item}
                          <DropdownMenu.Item
                            on:click={() => changeWatchList(item)}
                            class="text-sm cursor-pointer {item?.id ===
                            displayWatchList?.id
                              ? 'text-violet-800 dark:text-violet-400 '
                              : 'text-gray-600 dark:text-zinc-300 sm:hover:text-violet-800 dark:sm:hover:text-violet-400'}"
                          >
                            {item?.title} ({item?.ticker?.length})
                            <label
                              for="deleteWatchlist"
                              class="ml-auto inline-block cursor-pointer sm:hover:text-rose-800 dark:sm:hover:text-rose-400 transition"
                              on:click|capture={(e) => { deleteTargetWatchlist = item; handleDeleteModal(e); }}
                            >
                              <svg
                                class="size-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                style="max-width:40px"
                                ><path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path></svg>

                            </label>
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>

                <div
                  class="order-2 sm:order-1 w-full {displayWatchList?.title ===
                  undefined
                    ? 'hidden'
                    : ''}"
                >
                  <Combobox.Root
                    items={searchBarData}
                    bind:inputValue
                    bind:touchedInput
                  >
                    <div class="relative sm:ml-3 w-full">
                      <Combobox.Input
                        on:input={search}
                        class="py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full"
                        placeholder={watchlist_add_stock_placeholder()}
                        aria-label={watchlist_add_stock_placeholder()}
                      />
                    </div>

                    <Combobox.Content
                      class="w-auto z-10 rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 px-1 py-1.5 outline-hidden shadow-none"
                      sideOffset={8}
                    >
                      {#if inputValue?.length > 0}
                        {#each searchBarData as item}
                          <Combobox.Item
                            class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-[highlighted]:text-violet-800 dark:data-[highlighted]:text-violet-400"
                            value={item?.symbol}
                            label={item?.name}
                            on:click={(e) => handleAddTicker(e, item?.symbol)}
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
                          <!--This else is related to for loop-->
                        {:else}
                          <span
                            class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                          >
                            {watchlist_no_results()}
                          </span>
                        {/each}
                      {:else}
                        <Combobox.Item
                          class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                        >
                          <span
                            class=" text-sm text-gray-500 dark:text-zinc-400"
                          >
                            {watchlist_no_results()}
                          </span>
                        </Combobox.Item>
                      {/if}
                    </Combobox.Content>
                  </Combobox.Root>
                </div>

                <div
                  class="order-1 sm:order-last w-full sm:w-fit flex justify-end sm:ml-3 {displayWatchList?.title ===
                  undefined
                    ? 'hidden'
                    : ''}"
                >
                  <div class="flex flex-row items-center justify-end w-full">
                    {#if editMode}
                      <label
                        on:click={handleDeleteTickers}
                        class="w-full border text-sm border-gray-300 dark:border-zinc-700 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-1.5 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-800 dark:hover:text-rose-400"
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
                      class=" w-full border text-sm border-gray-300 dark:border-zinc-700 sm:ml-3 cursor-pointer inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-800 dark:hover:text-violet-400"
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
                          {watchlist_edit_watchlist()}
                        </span>
                      {:else}
                        <span class="ml-1 text-[0.85rem] sm:text-sm">
                          {watchlist_cancel()}
                        </span>
                      {/if}
                    </label>

                    <button
                      on:click={toggleFullWidth}
                      title={isFullWidth
                        ? watchlist_exit_full_width()
                        : watchlist_expand_full_width()}
                      class="ml-3 hidden 3xl:flex cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-violet-800 dark:hover:text-violet-400 flex-row items-center px-3 py-2 rounded-full gap-2 {isFullWidth
                        ? 'border-violet-400 dark:border-violet-500'
                        : ''}"
                    >
                      {#if isFullWidth}
                        <svg
                          class="w-4 h-4 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="4 14 10 14 10 20" />
                          <polyline points="20 10 14 10 14 4" />
                          <line x1="14" y1="10" x2="21" y2="3" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                      {:else}
                        <svg
                          class="w-4 h-4 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="15 3 21 3 21 9" />
                          <polyline points="9 21 3 21 3 15" />
                          <line x1="21" y1="3" x2="14" y2="10" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                      {/if}
                      <span class="truncate text-[0.85rem] sm:text-sm"
                        >{isFullWidth
                          ? watchlist_normal_width()
                          : watchlist_full_width()}</span
                      >
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {#if allList.length === 0}
              <div
                class="flex flex-col justify-center items-center m-auto z-0 pt-16"
              >
                <span class=" font-bold text-xl sm:text-3xl">
                  {watchlist_empty_title()}
                </span>

                <span class=" text-sm sm:text-lg m-auto p-4 text-center">
                  {watchlist_empty_description()}
                </span>
                {#if !data?.user}
                  <a
                    class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out group"
                    href="/register"
                  >
                    {watchlist_get_started()}
                    <span
                      class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                    >
                      <svg
                        class="ml-1 size-5 text-white dark:text-gray-900"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><g transform="rotate(90 12 12)"
                          ><g fill="none"
                            ><path
                              d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                            /><path
                              fill="currentColor"
                              d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                            /></g
                          ></g
                        ></svg>

                    </span>
                  </a>
                {/if}
              </div>
            {:else}
              <!--Start Table of Watchlist-->
              {#key tableKey}
                {#if watchList?.length > 0}
                  <div class="w-full">
                    <Table
                      {data}
                      rawData={watchList}
                      title={watchlist_count_stocks({
                        count: watchList?.length,
                      })}
                      excludedRules={new Set([
                        "volume",
                        "price",
                        "changesPercentage",
                        "marketCap",
                        "eps",
                        "addedPrice",
                        "sinceAdded",
                      ])}
                      {defaultList}
                      {editMode}
                      {deleteTickerList}
                      bulkDownload={true}
                      onToggleDeleteTicker={handleFilter}
                      includePrePostData={true}
                      onNoteClick={handleNoteClick}
                      onNoteHover={handleNoteHover}
                    />

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
                                      <div class=" lg:hidden">
                                        {formatTimeLocale(
                                          items[0].publishedDate,
                                        )}
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
                            <Infobox text={watchlist_no_news()} />
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
                                    (<HoverStockChart symbol={item?.symbol} />)
                                    {watchlist_earnings_will_report()}

                                    {#if item?.time}
                                      {#if compareTimes(item?.time, "16:00") >= 0}
                                        {watchlist_earnings_after_close()}
                                      {:else if compareTimes(item?.time, "09:30") <= 0}
                                        {watchlist_earnings_before_open()}
                                      {:else}
                                        {watchlist_earnings_during_market()}
                                      {/if}
                                    {/if}
                                    {watchlist_earnings_analysts_estimate()}
                                    {abbreviateNumber(item?.revenueEst)}
                                    {watchlist_earnings_in_revenue()} ({(
                                      (item?.revenueEst / item?.revenuePrior -
                                        1) *
                                      100
                                    )?.toFixed(2)}% {watchlist_earnings_yoy()}) {watchlist_earnings_and()}
                                    {item?.epsEst}
                                    {watchlist_earnings_in_eps()}
                                    {#if item?.epsPrior !== 0}
                                      ({(
                                        (item?.epsEst / item?.epsPrior - 1) *
                                        100
                                      )?.toFixed(2)}% {watchlist_earnings_yoy()}).
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
                          <Infobox text={watchlist_no_earnings()} />
                        </div>
                      {/if}
                    </div>
                  </div>
                {:else}
                  <div
                    class="flex flex-col justify-center items-center m-auto pt-16 z-0"
                  >
                    <span class=" font-bold text-xl sm:text-3xl">
                      {watchlist_empty_title()}
                    </span>

                    <span
                      class=" text-sm sm:text-lg pt-5 m-auto p-4 text-center"
                    >
                      {watchlist_empty_description()}
                    </span>
                  </div>
                {/if}
              {/key}
              <!--End Table of Watchlist-->
            {/if}
          {:else}
            <div class="flex justify-center items-center h-80">
              <div class="relative">
                <label
                  class=" bg-gray-900/80 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    class="loading loading-spinner loading-md text-white dark:text-white"
                  ></span>
                </label>
              </div>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<!--Start Create Watchlist Modal-->

<!-- Desktop modal using dialog component -->
<input type="checkbox" id="addWatchlist" class="modal-toggle" />

<dialog id="addWatchlist" class="modal modal-bottom sm:modal-middle">
  <!-- Modal backdrop for desktop -->
  <label for="addWatchlist" class="cursor-pointer modal-backdrop"></label>

  <!-- Desktop modal content -->
  <div
    class="modal-box w-full relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="addWatchlist"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg>
    </label>
    <div class="mb-5">
      <h3 class="font-bold text-2xl mb-5">{watchlist_modal_new_title()}</h3>

      <form on:submit={createWatchList} class="space-y-2 w-full m-auto">
        <Input
          id="title"
          type="text"
          label={watchlist_modal_list_name()}
          errors=""
          required={true}
        />

        <button
          type="submit"
          class="cursor-pointer mt-2 py-3 w-full rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
        >
          {watchlist_modal_create_button()}
        </button>
      </form>
    </div>
  </div>
</dialog>
<!--End Create Watchlist Modal-->

<!--Start Delete Strategy Modal-->

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deleteWatchlist" class="modal-toggle" />

<dialog id="deleteWatchlist" class="modal modal-middle p-3 sm:p-0">
  <label for="deleteWatchlist" class="cursor-pointer modal-backdrop" on:click={() => { deleteTargetWatchlist = null; }}></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="deleteWatchlist"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
      on:click={() => { deleteTargetWatchlist = null; }}
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg>
    </label>
    <h3 class="text-lg font-medium mb-2">{watchlist_modal_delete_title()}</h3>
    <p class="text-sm mb-6">
      {watchlist_modal_delete_confirm()}
    </p>
    <div class="flex justify-end space-x-3">
      <label
        for="deleteWatchlist"
        on:click={() => { deleteTargetWatchlist = null; }}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-800 dark:hover:text-violet-400"
        tabindex="0">{watchlist_cancel()}</label
      ><label
        for="deleteWatchlist"
        on:click={deleteWatchlist}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        ><svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg>
{watchlist_modal_delete_button()}</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->

<!--Start Note Modal-->
<input
  type="checkbox"
  id="noteModal"
  class="modal-toggle"
  bind:checked={isNoteModalOpen}
/>

<dialog id="noteModal" class="modal modal-bottom sm:modal-middle">
  <label
    class="cursor-pointer modal-backdrop bg-black/50"
    on:click={closeNoteModal}
  ></label>

  <div
    class="modal-box w-full overflow-hidden max-w-3xl p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    {#if isNoteModalOpen}
      {#if isLoadingEditor || isLoadingNote || !MarkdownNoteEditor}
        <!-- Loading state while editor or note loads -->
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
          onSave={saveNote}
          onCancel={closeNoteModal}
        />
      {/if}
    {/if}
  </div>
</dialog>

<!--End Note Modal-->