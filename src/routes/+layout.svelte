<script lang="ts">
  import "../app.css";
  import { Toaster } from "svelte-sonner";
  import "@bprogress/core/css";
  import { BProgress } from "@bprogress/core";

  import { ModeWatcher, setMode, mode } from "mode-watcher";
  import { page } from "$app/stores";

  import Footer from "$lib/components/Footer.svelte";
  import Searchbar from "$lib/components/Searchbar.svelte";
  import NotificationBell from "$lib/components/NotificationBell.svelte";
  //import PullToRefresh from '$lib/components/PullToRefresh.svelte';

  //import DiscountBanner from '$lib/components/DiscountBanner.svelte';

  import { beforeNavigate, afterNavigate } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { registerServiceWorker } from "$lib/registerServiceWorker";

  import {
    clearCache,
    screenWidth,
    stockTicker,
    etfTicker,
    indexTicker,
    loginData,
    numberOfUnreadNotification,
    clientSideCache,
    isOpen,
    isHoliday,
    isAfterMarketClose,
    isBeforeMarketOpen,
    isWeekend,
    previousPage,
    chatReasoning,
  } from "$lib/store";

  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.ts";
  import * as Sheet from "$lib/components/shadcn/sheet/index.ts";
  import * as Accordion from "$lib/components/shadcn/accordion/index.js";

  import Home from "lucide-svelte/icons/house";
  import Menu from "lucide-svelte/icons/menu";
  import Stock from "lucide-svelte/icons/chart-candlestick";
  import Calendar from "lucide-svelte/icons/calendar";
  import Analyst from "lucide-svelte/icons/chart-no-axes-column";
  import Flow from "lucide-svelte/icons/tornado";
  import HandShake from "lucide-svelte/icons/handshake";
  import Layers from "lucide-svelte/icons/layers";
  import Boxes from "lucide-svelte/icons/boxes";
  import Newspaper from "lucide-svelte/icons/newspaper";
  import Tools from "lucide-svelte/icons/wrench";
  import Gem from "lucide-svelte/icons/gem";
  import Plus from "lucide-svelte/icons/plus";
  import Screener from "lucide-svelte/icons/microscope";
  //import Simulation from "lucide-svelte/icons/radical";
  //import Backtesting from "lucide-svelte/icons/blocks";

  export let data;

  BProgress.configure({
    showSpinner: false,
  });

  let hasUnreadElement = false;
  let notificationList = [];

  //Define web workers:
  let syncWorker: Worker | undefined = undefined;
  // Handling messages from the worker
  const handleMessage = (event) => {
    const output = event.data?.output;
    notificationList = output?.notificationList;
    hasUnreadElement = output?.hasUnreadElement;
    numberOfUnreadNotification.set(output?.numberOfUnreadNotification);
  };

  const loadWorker = async () => {
    if ("serviceWorker" in navigator) {
      const SyncWorker = await import("$lib/workers/notificationWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.postMessage({ message: { userId: data?.user?.id } });
      syncWorker.onmessage = handleMessage;
    } else {
      // Fallback logic here
      await fallbackWorker();
    }
  };

  async function fallbackWorker() {
    // Implement fallback logic here, e.g., using timers or other techniques
    console.log("Fallback worker activated");
    const postData = { readed: false };
    const response = await fetch("/api/get-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    notificationList = await response.json();
    const unreadNotifications = notificationList?.length; //notificationList.filter((item?) => !item?.readed,);
    hasUnreadElement = unreadNotifications > 0 ? true : false;
    numberOfUnreadNotification.set(unreadNotifications);
  }
  // Track if marketing scripts have been loaded this session
  let marketingScriptsLoaded = false;
  let showCookieConsentAfterDelay = false;
  let cookieConsentDelayTimer: ReturnType<typeof setTimeout> | undefined =
    undefined;

  // Initialize GTM dataLayer
  function initDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
  }

  // Load GTM script in a non-blocking way
  function loadGTMScript() {
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]'))
      return;

    const GTM_ID = "GTM-NZBJ9W63";
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    requestAnimationFrame(() => {
      document.head.appendChild(script);
    });
  }

  // Load Meta Pixel (Facebook)
  function loadMetaPixel() {
    if (window.fbq) return;

    (function (
      f: any,
      b: Document,
      e: string,
      v: string,
      n?: any,
      t?: HTMLScriptElement,
      s?: Element,
    ) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s?.parentNode?.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js",
    );

    window.fbq("init", "1862625670961244");
    window.fbq("track", "PageView");
  }

  // Load Google Ads gtag.js
  function loadGoogleAds() {
    if (
      window.gtag &&
      document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    )
      return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=AW-11328922950";
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", "AW-11328922950");
  }

  // Load all marketing scripts (only if consent given)
  function loadMarketingScripts() {
    if (marketingScriptsLoaded) return;

    initDataLayer();
    loadGTMScript();
    loadMetaPixel();
    loadGoogleAds();
    marketingScriptsLoaded = true;
  }

  // Handle consent change event from CookieConsent component
  function handleConsentChange(
    event: CustomEvent<{
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
    }>,
  ) {
    const consent = event.detail;
    if (consent.marketing) {
      loadMarketingScripts();
    }
  }
  let cacheInterval: number;

  onMount(async () => {
    try {
      const chatSettings = localStorage?.getItem("chat-settings");
      if (chatSettings) {
        let parsedData = JSON.parse(chatSettings);
        $chatReasoning = parsedData?.reasoning || false;
      }
    } catch (e) {
      console.log(e);
    }

    checkMarketHour();

    if (!browser) return;

    // Delay mounting the cookie consent component to keep initial load snappy
    cookieConsentDelayTimer = setTimeout(() => {
      showCookieConsentAfterDelay = true;
    }, 2000);

    // Force auth state synchronization in production
    // This fixes the hydration mismatch where server/client auth states differ
    const currentUser = data?.user;
    if (currentUser && currentUser.id) {
      // User is logged in according to server - ensure client state matches
      $loginData = currentUser;
      console.log("[Auth] Synchronized logged-in state");
    } else if (!currentUser && $loginData?.id) {
      // Server says logged out but client thinks logged in - clear client state
      $loginData = undefined;
      console.log("[Auth] Synchronized logged-out state");
    }

    // Use optimized service worker registration
    registerServiceWorker();

    deferFunction(() => {
      // Delay these tasks to ensure they don't block main thread
      setTimeout(async () => {
        // Only load marketing scripts if user has consented
        if (data?.cookieConsent?.marketing) {
          loadMarketingScripts();
        }

        // Only load worker if user is logged in
        if (data?.user?.id) {
          await loadWorker();
        }
      }, 1000);
    });

    // Cleanup function
    return () => {
      if (cookieConsentDelayTimer) clearTimeout(cookieConsentDelayTimer);

      // Clean up worker on unmount
      if (syncWorker) {
        syncWorker.terminate();
        syncWorker = undefined;
      }
    };
  });

  onDestroy(() => {
    clearCache();
  });

  beforeNavigate(async () => {
    BProgress?.start();
  });

  afterNavigate(async ({ from }) => {
    $previousPage = from?.url.pathname || $previousPage;
    BProgress?.done();
  });

  $: {
    if ($page.url.pathname) {
      // Force reactive update of login data
      $loginData = data?.user;
    }
  }

  $: {
    if ($stockTicker && !$clientSideCache[$stockTicker]) {
      $clientSideCache[$stockTicker] = {};
    }
  }

  $: {
    if ($etfTicker && !$clientSideCache[$etfTicker]) {
      $clientSideCache[$etfTicker] = {};
    }
  }

  $: {
    if ($indexTicker && !$clientSideCache[$indexTicker]) {
      $clientSideCache[$indexTicker] = {};
    }
  }

  const checkMarketHour = () => {
    const holidays = [
      "2026-01-01",
      "2026-01-19",
      "2026-02-16",
      "2026-04-03",
      "2026-05-25",
      "2026-06-19",
      "2026-07-03",
      "2026-09-07",
      "2026-11-26",
      "2026-12-25",
    ];

    const currentDate = new Date().toISOString().split("T")[0];

    // Get the current time in the ET time zone
    const etTimeZone = "America/New_York";
    const currentTime = new Date().toLocaleString("en-US", {
      timeZone: etTimeZone,
    });

    // Determine if the NYSE is currently open or closed
    const currentHour = new Date(currentTime).getHours();
    const isWeekendValue =
      new Date(currentTime).getDay() === 6 ||
      new Date(currentTime).getDay() === 0;
    const isBeforeMarketOpenValue =
      currentHour < 9 ||
      (currentHour === 9 && new Date(currentTime).getMinutes() < 30);
    const isAfterMarketCloseValue = currentHour >= 16;

    isHoliday.set(holidays?.includes(currentDate));
    isOpen.set(
      !(
        isWeekendValue ||
        isBeforeMarketOpenValue ||
        isAfterMarketCloseValue ||
        holidays?.includes(currentDate)
      ),
    );

    isWeekend.set(isWeekendValue);
    isBeforeMarketOpen.set(isBeforeMarketOpenValue);
    isAfterMarketClose.set(isAfterMarketCloseValue);
  };

  async function handleModeChange() {
    const newMode = $mode === "light" ? "dark" : "light";
    setMode(newMode);

    try {
      await fetch("/api/theme-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  }
</script>

<svelte:window bind:innerWidth={$screenWidth} />

<ModeWatcher defaultMode={data?.themeMode} />

<!-- Google Tag Manager (noscript) -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-NZBJ9W63"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
    title="Google Tag Manager"
  ></iframe>
</noscript>

<div class="app text-gray-700 dark:text-zinc-200">
  <div class="flex min-h-screen w-full flex-col bg-white dark:bg-zinc-950">
    <div class="w-full">
      <div
        class="w-full navbar sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-200/70 dark:border-zinc-800/80 flex h-14 items-center gap-4 px-4 sm:h-auto sm:px-6"
      >
        <Sheet.Root>
          <Sheet.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              size="icon"
              class="group rounded-full bg-transparent text-gray-600 dark:text-zinc-300 sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 border-none transition"
            >
              <Menu
                class="h-5.5 w-5.5 sm:w-7 sm:h-7 text-gray-600 dark:text-zinc-300 transition group-hover:text-violet-500 dark:group-hover:text-violet-400"
              />
              <span class="sr-only">Toggle Menu</span>
            </Button>
          </Sheet.Trigger>
          <Sheet.Content
            side="left"
            class="max-w-screen w-full sm:max-w-xs bg-white/95 dark:bg-zinc-950/95 backdrop-blur overflow-y-auto text-gray-700 dark:text-zinc-200"
          >
            <nav class=" grid gap-6 text-lg">
              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  class="-ml-4 mr-auto rounded-full bg-transparent transition"
                >
                  <a
                    href="/"
                    class="flex items-center gap-4 px-0.5 text-gray-900 dark:text-white text-lg sm:text-xl font-semibold tracking-tight"
                  >
                    <img
                      class="avatar w-9 sm:w-10 rounded-full"
                      src="/pwa-192x192.png"
                      alt="Stocknear Logo"
                    />
                    Stocknear
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  class="rounded-full w-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 transition"
                >
                  <a
                    class="cursor-pointer w-full flex justify-start items-start"
                    href="/chat"
                  >
                    <div
                      class="flex flex-row items-center justify-start w-full"
                    >
                      <Plus class="w-4 h-4 inline-block mr-2" />
                      <span class="text-[1rem]">Start new chat</span>
                    </div>
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="w-full -ml-4 mr-auto rounded-full bg-transparent transition"
                >
                  <a
                    href="/"
                    class="w-full group flex flex-row items-center mr-auto mt-5"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <Home
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                    </div>
                    <span
                      class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >Home</span
                    >
                  </a>
                </Button>
              </Sheet.Close>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Stock
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Stocks</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/industry"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >By Industry</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/market-mover/gainers"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Market Mover</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/heatmap"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Market Heatmap</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/list"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Stock Lists</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Layers
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >ETFs</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/etf/new-launches"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >New Launches</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/etf/etf-providers"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >ETF Providers</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Analyst
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Analyst</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/analysts"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >Top Analysts</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/analysts/top-stocks"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Top Analyst Stocks</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/analysts/analyst-flow"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Analyst Live Flow</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Calendar
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Calendar</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/dividends-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >Dividends Calendar</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/earnings-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Earnings Calendar</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/ipos"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >IPO Calendar</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/economic-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Economic Calendar</a
                            >
                          </Button>
                          <!--
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/economic-indicator"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Economic Indicator</a
                            >
                          </Button>
                          

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/stock-splits-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Stock Splits Calendar</a
                            >
                             
                          </Button>
                           -->
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <HandShake
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Congress</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/politicians/flow-data"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >Congress Flow</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/politicians"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >All Politicians</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Flow
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Flow Feed</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/market-flow"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >Market Flow</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/news-flow"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >News Flow</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/options-flow"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Options Flow</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/unusual-order-flow"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Unusual Order Flow</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Screener
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Screener</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/stock-screener"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Stock Screener</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/options-screener"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Options Screener</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <!--
              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Simulation
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Simulation</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/backtesting"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Backtesting Strategy</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/options-calculator"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Options Calculator</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>
            -->

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                      <Tools
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                      <span class="ml-1 mr-auto"
                        >Tools</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/compare"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Comparison Tool</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/options-calculator"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Options Calculator</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/potus-tracker"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >POTUS Tracker</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/insider-tracker"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Insider Tracker</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/reddit-tracker"
                              class="text-start w-full text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Reddit Tracker</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </div>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full rounded-full bg-transparent transition"
                >
                  <a
                    href="/hedge-funds"
                    class="group flex flex-row items-center w-full -mt-2"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <Boxes
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >Hedge Funds</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>
              <!--
              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full rounded-full bg-transparent transition"
                >
                  <a
                    href="/backtesting"
                    class="group flex flex-row items-center w-full -mt-2"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <Backtesting
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-gray-600 dark:text-zinc-400 text-[0.95rem] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >Backtesting</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>
-->
              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full rounded-full bg-transparent transition"
                >
                  <a
                    href="/market-news"
                    class="group flex flex-row items-center w-full -mt-2"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <Newspaper
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >Market News</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>
              {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                <Sheet.Close asChild let:builder>
                  <Button
                    builders={[builder]}
                    type="submit"
                    class="-ml-4 w-full rounded-full bg-transparent transition"
                  >
                    <a
                      href="/pricing"
                      class="group flex flex-row items-center w-full -mt-2"
                    >
                      <div class="flex flex-row items-center mr-auto">
                        <div
                          class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                        >
                          <Gem class="h-5.5 w-5.5" />
                        </div>
                        <span
                          class="ml-3 text-gray-600 dark:text-zinc-400 text-[0.95rem] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                          >Pricing Plan</span
                        >
                      </div>
                    </a>
                  </Button>
                </Sheet.Close>
              {/if}
            </nav>
          </Sheet.Content>
        </Sheet.Root>

        <a href="/" class="-ml-2 flex flex-row items-center shrink-0">
          <img
            class="avatar w-9 3xl:w-10 rounded-full"
            src="/pwa-192x192.png"
            alt="Stocknear Logo"
          />
          <span
            class="text-gray-900 dark:text-white font-semibold tracking-tight ml-2 text-xl"
            >Stocknear</span
          >
        </a>

        <div
          class="relative w-full flex flex-row justify-end sm:justify-between items-center gap-2 sm:gap-3"
        >
          <div class="sm:w-full sm:ml-2 2xl:ml-[75px]">
            <Searchbar />
          </div>
          <NotificationBell {data} {hasUnreadElement} />

          {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && !data?.user}
            <div class="hidden shrink-0 sm:inline-flex">
              <a
                href="/pricing"
                class="inline-flex items-center whitespace-nowrap justify-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                Start Trial
              </a>
            </div>
          {/if}

          <div class="shrink-0">
            {#if data?.user}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    size="icon"
                    aria-label="Settings"
                    class="overflow-hidden rounded-full bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900/70 border border-gray-200/70 dark:border-zinc-800/80 w-10 h-10 transition"
                    builders={[builder]}
                  >
                    <svg
                      class="h-[28px] w-[28px] overflow-hidden rounded-full text-gray-500 dark:text-zinc-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"
                      /></svg
                    >
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={10}
                  alignOffset={0}
                  class="rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <a href="/profile" class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      My Account
                    </DropdownMenu.Item>
                  </a>
                  <DropdownMenu.Separator
                    class="my-1 h-px bg-gray-200/70 dark:bg-zinc-800/80"
                  />

                  <a href="/portfolio" class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      Portfolio
                    </DropdownMenu.Item>
                  </a>

                  <a href="/watchlist/stocks" class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      Watchlist
                    </DropdownMenu.Item>
                  </a>
                  <a href="/price-alert" class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      Price Alert
                    </DropdownMenu.Item>
                  </a>

                  <button
                    on:click={handleModeChange}
                    class="cursor-pointer w-full sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-hidden data-disabled:pointer-events-none"
                  >
                    <span>{$mode === "light" ? "Dark" : "Light"} Mode</span>
                    <span class="sr-only">Toggle theme</span>
                  </button>

                  <DropdownMenu.Separator
                    class="my-1 h-px bg-gray-200/70 dark:bg-zinc-800/80"
                  />
                  <form class="cursor-pointer" action="/logout" method="POST">
                    <button
                      type="submit"
                      aria-label="Logout"
                      class="w-full text-start cursor-pointer"
                    >
                      <DropdownMenu.Item
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition cursor-pointer"
                      >
                        <svg
                          class="lucide lucide-log-out mr-2 w-3.5 h-3.5 transform scale-x-[-1]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                          ></path><polyline points="16 17 21 12 16 7"
                          ></polyline><line x1="21" x2="9" y1="12" y2="12"
                          ></line></svg
                        >
                        <span class="text-start">Logout</span>
                      </DropdownMenu.Item>
                    </button>
                  </form>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {:else}
              <a
                href="/login"
                class="inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                Login
              </a>
            {/if}
          </div>
        </div>
      </div>
      <div>
        <div class="flex w-full">
          <div class="hidden 3xl:block 3xl:w-[300px]">
            <aside
              class="fixed overflow-y-auto overflow-hidden inset-y-0 left-0 z-50 3xl:flex w-64 flex-col xl:border-r border-gray-200/70 dark:3xl:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur"
            >
              <nav
                class="flex flex-col items-center mr-auto gap-y-4 3xl:py-5 w-full"
              >
                <a
                  href="/"
                  class="ml-3 mb-3 flex justify-end items-center h-9 w-9 shrink-0 gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:"
                >
                  <img
                    class="avatar w-9 3xl:w-12 rounded-full"
                    src="/pwa-192x192.png"
                    alt="Stocknear Logo"
                  />
                  <span
                    class="text-gray-900 dark:text-white text-lg font-semibold tracking-tight"
                    >Stocknear</span
                  >
                </a>

                <a
                  href="/chat"
                  class="mb-2 flex flex-row items-center ml-8 pr-7 w-full"
                >
                  <div
                    class="px-4 py-1 sm:py-2 rounded-full flex flex-row items-center justify-start w-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 transition"
                  >
                    <Plus class="w-4 h-4 inline-block mr-2" />
                    <span class="font-semibold">Start new chat</span>
                  </div>
                </a>
                <a href="/" class="group flex flex-row items-center ml-9 w-full">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                  >
                    <Home class="h-5.5 w-5.5" />
                  </div>
                  <span
                    class="ml-3 text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                    >Home</span
                  >
                </a>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Stock
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Stocks</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/industry"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >By Industry</a
                          >

                          <a
                            href="/market-mover/gainers"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Market Mover</a
                          >

                          <a
                            href="/heatmap"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Market Heatmap</a
                          >

                          <a
                            href="/list"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Stock Lists</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Layers
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >ETFs</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/etf/new-launches"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >New Launches</a
                          >
                          <a
                            href="/etf/etf-providers"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >ETF Providers</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Analyst
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Analyst</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/analysts"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Top Analysts</a
                          >
                          <a
                            href="/analysts/top-stocks"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Top Analyst Stocks</a
                          >

                          <a
                            href="/analysts/analyst-flow"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Analyst Live Flow</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Calendar
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Calendar</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/dividends-calendar"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Dividends Calendar</a
                          >
                          <a
                            href="/earnings-calendar"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Earnings Calendar</a
                          >
                          <!--
                          <a
                            href="/fda-calendar"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >FDA Calendar</a
                          >
                            -->

                          <a
                            href="/ipos"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >IPO Calendar</a
                          >
                          <a
                            href="/economic-calendar"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Economic Calendar</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <HandShake
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Congress</span
                        >
                      </Accordion.Trigger>

                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <div class="flex flex-col items-start">
                            <a
                              href="/politicians/flow-data"
                              class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >Congress Flow</a
                            >
                            <a
                              href="/politicians"
                              class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >All Politicians</a
                            >
                          </div>
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Flow
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Flow Feed</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/market-flow"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Market Flow</a
                          >

                          <a
                            href="/news-flow"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >News Flow</a
                          >

                          <a
                            href="/options-flow"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Options Flow</a
                          >
                          <a
                            href="/unusual-order-flow"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Unusual Order Flow</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Screener
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Screener</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/stock-screener"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Stock Screener</a
                          >

                          <a
                            href="/options-screener"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Options Screener</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <!--
                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Simulation
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Simulation</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/backtesting"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Backtesting Strategy</a
                          >

                          <a
                            href="/options-calculator"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Options Calculator</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>
                -->

                <div class="flex flex-row items-center ml-9 w-full mt-3">
                  <Accordion.Root class="w-full">
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Tools
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Tools</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-200/70 dark:border-zinc-800/80 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/compare"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Comparison Tool</a
                          >

                          <a
                            href="/options-calculator"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Options Calculator</a
                          >

                          <a
                            href="/potus-tracker"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >POTUS Tracker</a
                          >
                          <a
                            href="/insider-tracker"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Insider Tracker</a
                          >
                          <a
                            href="/reddit-tracker"
                            class="text-[0.95rem] text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Reddit Tracker</a
                          >
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </div>

                <a
                  href="/hedge-funds"
                  class="group flex flex-row items-center ml-9 w-full mt-3"
                >
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                  >
                    <Boxes class="h-5.5 w-5.5" />
                  </div>
                  <span
                    class="ml-3 text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                    >Hedge Funds</span
                  >
                </a>

                <a
                  href="/market-news"
                  class="group flex flex-row items-center ml-9 w-full mt-3"
                >
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                  >
                    <Newspaper class="h-5.5 w-5.5" />
                  </div>
                  <span
                    class="ml-3 text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                    >Market News</span
                  >
                </a>
                {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                  <a
                    href="/pricing"
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <Gem class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-gray-600 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >Pricing Plan</span
                    >
                  </a>
                {/if}
              </nav>
            </aside>
          </div>
          <div class="w-full">
            <main class=" w-full overflow-y-auto sm:p-4">
              <slot />
              <Toaster position="top-center" />

              <!--
              {#if Cookie && $showCookieConsent === true}
                <Cookie />
              {/if}
              -->
            </main>
          </div>
        </div>
      </div>
      <div>
        {#if !$page?.url?.pathname?.startsWith("/chat")}
          <Footer />
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Floating AI Assistant -->
<!--
{#if $screenWidth >= 640}
  {#await import("$lib/components/Chat/Assistant.svelte") then { default: Comp }}
    <svelte:component this={Comp} {data} />
  {/await}
{/if}

-->
{#if data?.user?.id}
  {#await import("$lib/components/Feedback.svelte") then { default: Comp }}
    <svelte:component this={Comp} {data} />
  {/await}
{/if}

<!-- Cookie Consent Banner -->
{#if showCookieConsentAfterDelay}
  {#await import("$lib/components/CookieConsent.svelte") then { default: Comp }}
    <svelte:component
      this={Comp}
      cookieConsent={data?.cookieConsent
        ? JSON.stringify(data.cookieConsent)
        : undefined}
      on:consent={handleConsentChange}
    />
  {/await}
{/if}

<style lang="scss">
  :root {
    --bprogress-color: #00a6f4;
    --bprogress-height: 1px;
  }
</style>
