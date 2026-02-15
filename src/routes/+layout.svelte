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
  } from "$lib/store";

  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.ts";
  import * as Sheet from "$lib/components/shadcn/sheet/index.ts";
  import * as Accordion from "$lib/components/shadcn/accordion/index.js";

  import Home from "lucide-svelte/icons/house";
  import ChartNoAxes from "lucide-svelte/icons/chart-no-axes-combined";
  import Menu from "lucide-svelte/icons/menu";
  import Stock from "lucide-svelte/icons/chart-candlestick";
  import Calendar from "lucide-svelte/icons/calendar";
  import Analyst from "lucide-svelte/icons/chart-no-axes-column";
  import Flow from "lucide-svelte/icons/tornado";
  import HandShake from "lucide-svelte/icons/handshake";
  import Layers from "lucide-svelte/icons/layers";
  import Boxes from "lucide-svelte/icons/boxes";
  import Newspaper from "lucide-svelte/icons/newspaper";
  import BookOpen from "lucide-svelte/icons/book-open";
  import Tools from "lucide-svelte/icons/wrench";
  import Gem from "lucide-svelte/icons/gem";
  import Plus from "lucide-svelte/icons/plus";
  import Screener from "lucide-svelte/icons/microscope";
  import PieChart from "lucide-svelte/icons/chart-pie";
  import Star from "lucide-svelte/icons/star";
  import Sparkles from "lucide-svelte/icons/sparkles";
  import {
    layout_all_politicians,
    layout_analyst,
    layout_analyst_live_flow,
    layout_by_industry,
    layout_calendar,
    layout_comparison_tool,
    layout_congress,
    layout_congress_flow,
    layout_dividends_calendar,
    layout_economic_calendar,
    layout_earnings_calendar,
    layout_etf_providers,
    layout_etfs,
    layout_flow_feed,
    layout_hedge_funds,
    layout_home,
    layout_ipo_calendar,
    layout_insider_tracker,
    layout_login,
    layout_logo_alt,
    layout_logout,
    layout_market_flow,
    layout_market_heatmap,
    layout_market_mover,
    layout_market_news,
    layout_daily_briefing,
    layout_learning_center,
    layout_my_account,
    layout_news_flow,
    layout_new_launches,
    layout_options_calculator,
    layout_options_flow,
    layout_options_screener,
    layout_portfolio,
    layout_price_alert,
    layout_pricing_plan,
    layout_potus_tracker,
    layout_reddit_tracker,
    layout_screener,
    layout_start_trial,
    layout_stock_lists,
    layout_stock_screener,
    layout_stocks,
    layout_toggle_menu,
    layout_tools,
    layout_top_analyst_stocks,
    layout_top_analysts,
    layout_unusual_order_flow,
    layout_watchlist,
    layout_start_new_chat,
    layout_income_strategy,
    layout_covered_call_screener,
    layout_backtesting_strategy,
  } from "$lib/paraglide/messages.js";
  //import Simulation from "lucide-svelte/icons/radical";
  //import Backtesting from "lucide-svelte/icons/blocks";

  export let data;
  let isChartRoute = false;

  BProgress.configure({
    showSpinner: false,
  });

  let hasUnreadElement = false;
  let notificationList = [];

  // Bottom navbar scroll hide/show
  let navbarHidden = false;
  let lastScrollY = 0;
  let scrollRafId: number | undefined = undefined;
  const scrollThreshold = 10;
  const routePrefixes = ["/chart", "/chat"];

  function handleScroll() {
    if (!browser) return;

    // Keep scroll work aligned to paint to reduce handler pressure.
    if (scrollRafId) return;
    scrollRafId = window.requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Only trigger if scroll amount exceeds threshold
      if (Math.abs(scrollDiff) >= scrollThreshold) {
        // Hide when scrolling down, show when scrolling up
        if (scrollDiff > 0 && currentScrollY > 100) {
          navbarHidden = true;
        } else if (scrollDiff < 0) {
          navbarHidden = false;
        }
        lastScrollY = currentScrollY;
      }

      scrollRafId = undefined;
    });
  }

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
    if (!data?.user?.id || syncWorker) return;

    if (typeof Worker !== "undefined") {
      const SyncWorker = await import("$lib/workers/notificationWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.postMessage({ message: { userId: data.user.id } });
      syncWorker.onmessage = handleMessage;
      return;
    }

    // Fallback logic here
    await fallbackWorker();
  };

  async function fallbackWorker() {
    // Implement fallback logic here, e.g., using timers or other techniques
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
  let marketingScriptTimer: ReturnType<typeof setTimeout> | undefined =
    undefined;
  let workerLoadTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  // GTM loading delay in milliseconds (3 seconds for better PageSpeed scores)
  const GTM_LOAD_DELAY = 3000;

  // Add preconnect hints dynamically when we're about to load GTM
  function addPreconnectHints() {
    const domains = [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ];

    domains.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"][rel="preconnect"]`)) {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }

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

    // Add preconnect hints just before loading GTM
    addPreconnectHints();

    const GTM_ID = "GTM-NZBJ9W63";
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    requestAnimationFrame(() => {
      document.head.appendChild(script);
    });
  }

  /*
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
    */

  // Load all marketing scripts (only if consent given)
  function loadMarketingScripts() {
    if (marketingScriptsLoaded) return;

    initDataLayer();
    loadGTMScript();
    //loadMetaPixel();
    //loadGoogleAds();
    marketingScriptsLoaded = true;
  }

  function hasMarketingConsent() {
    return Boolean(data?.cookieConsent?.marketing);
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

  onMount(() => {
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
    } else if (!currentUser && $loginData?.id) {
      // Server says logged out but client thinks logged in - clear client state
      $loginData = undefined;
    }

    // Use optimized service worker registration
    registerServiceWorker();

    // User interaction events that trigger early GTM loading
    const interactionEvents = [
      "scroll",
      "click",
      "touchstart",
      "keydown",
    ] as const;
    const marketingConsent = true; //hasMarketingConsent();

    // Handler for user interaction - loads GTM immediately on engagement
    const handleUserInteraction = () => {
      // Remove all interaction listeners once triggered
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction, {
          capture: true,
        });
      });

      // Clear the delayed timer if it exists
      if (marketingScriptTimer) {
        clearTimeout(marketingScriptTimer);
        marketingScriptTimer = undefined;
      }

      // Load marketing scripts immediately on user interaction
      loadMarketingScripts();
      /*
      if (!marketingScriptsLoaded && hasMarketingConsent()) {
        loadMarketingScripts();
      }
        */
    };

    if (marketingConsent) {
      // Add interaction listeners (passive for scroll/touch to not block)
      interactionEvents.forEach((event) => {
        window.addEventListener(event, handleUserInteraction, {
          capture: true,
          passive: true,
          once: true,
        });
      });

      deferFunction(() => {
        // Delay GTM loading to 3 seconds after page load for better PageSpeed scores
        // If user interacts before this, GTM loads immediately via interaction handler
        marketingScriptTimer = setTimeout(() => {
          loadMarketingScripts();

          if (hasMarketingConsent()) {
            loadMarketingScripts();
          }
        }, GTM_LOAD_DELAY);
      });
    }

    // Notifications are independent from marketing and should load lazily.
    if (data?.user?.id) {
      workerLoadTimer = setTimeout(() => {
        void loadWorker();
      }, 2500);
    }

    // Cleanup function
    return () => {
      if (cookieConsentDelayTimer) clearTimeout(cookieConsentDelayTimer);
      if (marketingScriptTimer) clearTimeout(marketingScriptTimer);
      if (workerLoadTimer) clearTimeout(workerLoadTimer);

      // Remove interaction listeners on cleanup
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction, {
          capture: true,
        });
      });

      // Clean up worker on unmount
      if (syncWorker) {
        syncWorker.terminate();
        syncWorker = undefined;
      }

      if (scrollRafId) {
        window.cancelAnimationFrame(scrollRafId);
        scrollRafId = undefined;
      }
    };
  });

  onDestroy(() => {
    if (scrollRafId) {
      window.cancelAnimationFrame(scrollRafId);
      scrollRafId = undefined;
    }
    clearCache();
  });

  beforeNavigate(() => {
    BProgress?.start();
  });

  afterNavigate(({ from }) => {
    $previousPage = from?.url.pathname || $previousPage;
    BProgress?.done();
  });

  $: isLandingPage = ($page.url.pathname === "/" && !data?.user) || $page.url.pathname === "/register";

  $: {
    if ($page.url.pathname) {
      // Force reactive update of login data
      const nextLoginData = data?.user;
      if ($loginData !== nextLoginData) {
        $loginData = nextLoginData;
      }
      const path = $page.url.pathname;
      isChartRoute = routePrefixes?.some(
        (p) => path === p || path?.startsWith(p + "/"),
      );
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

<svelte:window
  bind:innerWidth={$screenWidth}
  on:scroll|passive={handleScroll}
/>

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
        class="w-full navbar sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-300 dark:border-zinc-700 flex h-14 items-center gap-4 px-4 sm:h-auto sm:px-6"
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
              <span class="sr-only">{layout_toggle_menu()}</span>
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
                      alt={layout_logo_alt()}
                    />
                    Stocknear
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  class="rounded-full w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 transition"
                >
                  <a
                    class="cursor-pointer w-full flex justify-start items-start"
                    href="/chat"
                  >
                    <div
                      class="flex flex-row items-center justify-start w-full"
                    >
                      <Plus class="w-4 h-4 inline-block mr-2" />
                      <span class="text-[1rem]">
                        {layout_start_new_chat()}
                      </span>
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
                        class="h-6 w-6 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                      />
                    </div>
                    <span
                      class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >{layout_home()}</span
                    >
                  </a>
                </Button>
              </Sheet.Close>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Stock
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_stocks()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_by_industry()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/market-mover/gainers"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_market_mover()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/heatmap"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_market_heatmap()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/list"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_stock_lists()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Layers
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_etfs()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_new_launches()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/etf/etf-providers"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_etf_providers()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Analyst
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_analyst()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_top_analysts()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/analysts/top-stocks"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_top_analyst_stocks()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/analysts/analyst-flow"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_analyst_live_flow()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Calendar
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_calendar()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_dividends_calendar()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/earnings-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_earnings_calendar()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/ipos"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_ipo_calendar()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/economic-calendar"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_economic_calendar()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <HandShake
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_congress()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_congress_flow()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/politicians"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_all_politicians()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Flow
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_flow_feed()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_market_flow()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/news-flow"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-2"
                              >{layout_news_flow()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/options-flow"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_flow()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/unusual-order-flow"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_unusual_order_flow()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Screener
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_screener()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_stock_screener()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_screener()}</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <div class="ml-4 mt-5">
                        <span
                          class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500"
                          >{layout_income_strategy()}</span
                        >
                      </div>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full rounded-full bg-transparent transition cursor-pointer"
                          >
                            <a
                              href="/covered-call-screener"
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_covered_call_screener()}</a
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
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto"
                        >Simulation</span
                      >
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_backtesting_strategy()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_calculator()}</a
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
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <Tools
                        class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_tools()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_comparison_tool()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_calculator()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_potus_tracker()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_insider_tracker()}</a
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
                              class="text-start w-full text-[0.95rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_reddit_tracker()}</a
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
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >{layout_hedge_funds()}</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full rounded-full bg-transparent transition"
                >
                  <a
                    href="/chart/NVDA"
                    class="group flex flex-row items-center w-full -mt-4"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <ChartNoAxes
                          class="size-6 mr-3 flex-shrink-0 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >Pro Chart</span
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
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-gray-800 dark:text-zinc-300 text-[0.95rem] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
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
                    class="group flex flex-row items-center w-full -mt-8"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <Newspaper
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >{layout_market_news()}</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full rounded-full bg-transparent transition"
                >
                  <a
                    href={data?.hasDailyBriefing && data?.isPreMarket && data?.dailyBriefingSlug ? `/learning-center/article/${data.dailyBriefingSlug}` : '/learning-center'}
                    class="group flex flex-row items-center w-full -mt-8"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                      >
                        <BookOpen
                          class="h-5.5 w-5.5 mr-3 text-gray-500 dark:text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auto text-sm font-semibold tracking-tight text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                        >{data?.hasDailyBriefing && data?.isPreMarket ? layout_daily_briefing() : layout_learning_center()}</span
                      >
                      {#if data?.hasDailyBriefing && data?.isPreMarket}
                        <span class="relative flex h-2 w-2 ml-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      {/if}
                    </div>
                  </a>
                </Button>
              </Sheet.Close>

            </nav>
          </Sheet.Content>
        </Sheet.Root>

        <a href="/" class="-ml-2 flex flex-row items-center shrink-0">
          <img
            class="avatar w-9 3xl:w-10 rounded-full"
            src="/pwa-192x192.png"
            alt={layout_logo_alt()}
          />
          <span
            class="text-gray-900 dark:text-white sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition font-semibold tracking-tight ml-2 text-xl"
            >Stocknear</span
          >
        </a>

        <div
          class="relative w-full flex flex-row justify-end sm:justify-between items-center gap-2 sm:gap-3"
        >
          {#if !isLandingPage}
            <div class="sm:w-full sm:ml-2 2xl:ml-[75px]">
              <Searchbar />
            </div>
            <NotificationBell {data} {hasUnreadElement} />
          {:else}
            <div class="flex-1"></div>
          {/if}

          {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && !data?.user}
            <div class="hidden shrink-0 sm:inline-flex">
              <a
                href="/register"
                class="inline-flex items-center whitespace-nowrap justify-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {layout_start_trial()}
              </a>
            </div>
          {/if}

          <div class="shrink-0">
            {#if data?.user}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    size="icon"
                    aria-label={layout_my_account()}
                    class="overflow-hidden rounded-full bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900/70 border border-gray-300 shadow dark:border-zinc-700 w-10 h-10 transition"
                    builders={[builder]}
                  >
                    <svg
                      class="h-[28px] w-[28px] overflow-hidden rounded-full text-gray-500 dark:text-zinc-400 sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
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
                  class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <a href="/profile" class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      {layout_my_account()}
                    </DropdownMenu.Item>
                  </a>
                  <DropdownMenu.Separator
                    class="my-1 h-px bg-gray-200/70 dark:bg-zinc-800/80"
                  />
                  <form class="cursor-pointer" action="/logout" method="POST">
                    <button
                      type="submit"
                      aria-label={layout_logout()}
                      class="w-full text-start cursor-pointer"
                    >
                      <DropdownMenu.Item
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition cursor-pointer"
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

                        <span class="text-start">{layout_logout()}</span>
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
                {layout_login()}
              </a>
            {/if}
          </div>
        </div>
      </div>
      <div>
        <div class="flex w-full">
          {#if !isChartRoute}
            <div class="hidden 3xl:block 3xl:w-[300px]">
              <aside
                class="fixed overflow-y-auto overflow-hidden inset-y-0 left-0 z-50 3xl:flex w-64 flex-col xl:border-r border-gray-300 dark:3xl:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur"
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
                      alt={layout_logo_alt()}
                    />
                    <span
                      class="text-gray-900 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition dark:text-white sm:hover:text-violet-800 dark:sm:hover:text-violet-400 text-lg font-semibold tracking-tight"
                      >Stocknear</span
                    >
                  </a>

                  <a
                    href="/chat"
                    class="mb-2 flex flex-row items-center ml-8 pr-7 w-full"
                  >
                    <div
                      class="shadow px-4 py-1 sm:py-2 rounded-full flex flex-row items-center justify-start w-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 transition"
                    >
                      <Plus class="w-4 h-4 inline-block mr-2" />
                      <span class="font-semibold">
                        {layout_start_new_chat()}
                      </span>
                    </div>
                  </a>

                  <a
                    href="/"
                    class="group flex flex-row items-center ml-9 w-full"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <Home class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >{layout_home()}</span
                    >
                  </a>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Stock class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_stocks()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/industry"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_by_industry()}</a
                            >

                            <a
                              href="/market-mover/gainers"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_market_mover()}</a
                            >

                            <a
                              href="/heatmap"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_market_heatmap()}</a
                            >

                            <a
                              href="/list"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_stock_lists()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Layers class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_etfs()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/etf/new-launches"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_new_launches()}</a
                            >
                            <a
                              href="/etf/etf-providers"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_etf_providers()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Analyst class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_analyst()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/analysts"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_top_analysts()}</a
                            >
                            <a
                              href="/analysts/top-stocks"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_top_analyst_stocks()}</a
                            >

                            <a
                              href="/analysts/analyst-flow"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_analyst_live_flow()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Calendar class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_calendar()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/dividends-calendar"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_dividends_calendar()}</a
                            >
                            <a
                              href="/earnings-calendar"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_earnings_calendar()}</a
                            >
                            <!--
                          <a
                            href="/fda-calendar"
                            class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >FDA Calendar</a
                          >
                            -->

                            <a
                              href="/ipos"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_ipo_calendar()}</a
                            >
                            <a
                              href="/economic-calendar"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_economic_calendar()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <HandShake class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_congress()}</span>
                          </div>
                        </Accordion.Trigger>

                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <div class="flex flex-col items-start">
                              <a
                                href="/politicians/flow-data"
                                class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                                >{layout_congress_flow()}</a
                              >
                              <a
                                href="/politicians"
                                class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                                >{layout_all_politicians()}</a
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
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Flow class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_flow_feed()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/market-flow"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_market_flow()}</a
                            >

                            <a
                              href="/news-flow"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_news_flow()}</a
                            >

                            <a
                              href="/options-flow"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_flow()}</a
                            >
                            <a
                              href="/unusual-order-flow"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_unusual_order_flow()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Screener class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_screener()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/stock-screener"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_stock_screener()}</a
                            >

                            <a
                              href="/options-screener"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_screener()}</a
                            >

                            <span
                              class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 ml-4 mt-6"
                              >{layout_income_strategy()}</span
                            >

                            <a
                              href="/covered-call-screener"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_covered_call_screener()}</a
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
                      <Accordion.Trigger class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition">
                        <Simulation
                          class="h-5.5 w-5.5 mr-3 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 p-1 text-gray-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition ml-1"
                        />
                        <span class="ml-1 mr-auto"
                          >Simulation</span
                        >
                      </Accordion.Trigger>
                      <Accordion.Content
                        class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                      >
                        <div class="flex flex-col items-start">
                          <a
                            href="/backtesting"
                            class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >Backtesting Strategy</a
                          >

                          <a
                            href="/options-calculator"
                            class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                            >{layout_options_calculator()}</a
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
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                            >
                              <Tools class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_tools()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-gray-300 dark:border-zinc-700 ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href="/compare"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_comparison_tool()}</a
                            >

                            <a
                              href="/options-calculator"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_options_calculator()}</a
                            >

                            <a
                              href="/potus-tracker"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_potus_tracker()}</a
                            >
                            <a
                              href="/insider-tracker"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_insider_tracker()}</a
                            >
                            <a
                              href="/reddit-tracker"
                              class="text-[0.95rem] font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition ml-4 mt-4"
                              >{layout_reddit_tracker()}</a
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
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <Boxes class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >{layout_hedge_funds()}</span
                    >
                  </a>

                  <a
                    href="/chart/NVDA"
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <ChartNoAxes class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >Pro Chart</span
                    >
                  </a>

                  <a
                    href="/market-news"
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <Newspaper class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >{layout_market_news()}</span
                    >
                  </a>

                  <a
                    href={data?.hasDailyBriefing && data?.isPreMarket && data?.dailyBriefingSlug ? `/learning-center/article/${data.dailyBriefingSlug}` : '/learning-center'}
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition md:h-8 md:w-8"
                    >
                      <BookOpen class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                      >{data?.hasDailyBriefing && data?.isPreMarket ? layout_daily_briefing() : layout_learning_center()}</span
                    >
                    {#if data?.hasDailyBriefing && data?.isPreMarket}
                      <span class="relative flex h-2 w-2 ml-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    {/if}
                  </a>

                </nav>
              </aside>
            </div>
          {/if}
          <div class="w-full">
            <main
              class={`w-full ${
                isChartRoute
                  ? "overflow-hidden p-0"
                  : $page.url.pathname.startsWith("/chat")
                    ? "overflow-y-auto sm:p-4"
                    : $page.url.pathname.startsWith("/learning-center/article/")
                      ? "pb-16 sm:pb-0 sm:p-4"
                      : "overflow-y-auto pb-16 sm:pb-0 sm:p-4"
              }`}
            >
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
        {#if !$page?.url?.pathname?.startsWith("/chat") && !isChartRoute}
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

{#if data?.user?.id && !isChartRoute}
  {#await import("$lib/components/Feedback.svelte") then { default: Comp }}
    <svelte:component this={Comp} {data} />
  {/await}
{/if}

<!-- Bottom Navigation Bar -->
{#if !isChartRoute && !isLandingPage}
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out
           sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:border-0 sm:rounded-2xl sm:shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
           {navbarHidden
      ? 'translate-y-full sm:translate-y-[calc(100%+2rem)]'
      : 'translate-y-0'}"
  >
    <div
      class="grid grid-cols-5 h-14 sm:flex sm:h-auto sm:px-2 sm:py-2 sm:gap-1"
    >
      <a
        href="/"
        class="group relative flex flex-col items-center justify-center gap-0.5 transition-all
               sm:flex-col sm:gap-1 sm:px-4 sm:py-2 sm:rounded-xl hover:bg-white/10
               {$page.url.pathname === '/'
          ? 'text-white dark:text-violet-400'
          : 'text-zinc-400 active:text-white dark:active:text-violet-400'}"
      >
        <Home
          class="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform sm:group-hover:scale-110"
        />
        <span
          class="text-[10px] font-medium sm:text-[11px] sm:font-normal sm:tracking-tight"
          >{layout_home()}</span
        >
        {#if $page.url.pathname === "/"}
          <span
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-violet-400"
          ></span>
        {/if}
      </a>
      <a
        href="/portfolio"
        class="group relative flex flex-col items-center justify-center gap-0.5 transition-all
               sm:flex-col sm:gap-1 sm:px-4 sm:py-2 sm:rounded-xl hover:bg-white/10
               {$page.url.pathname.startsWith('/portfolio')
          ? 'text-white dark:text-violet-400'
          : 'text-zinc-400 active:text-white dark:active:text-violet-400'}"
      >
        <PieChart
          class="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform sm:group-hover:scale-110"
        />
        <span
          class="text-[10px] font-medium sm:text-[11px] sm:font-normal sm:tracking-tight"
          >{layout_portfolio()}</span
        >
        {#if $page.url.pathname.startsWith("/portfolio")}
          <span
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-violet-400"
          ></span>
        {/if}
      </a>
      <a
        href="/watchlist/stocks"
        class="group relative flex flex-col items-center justify-center gap-0.5 transition-all
               sm:flex-col sm:gap-1 sm:px-4 sm:py-2 sm:rounded-xl hover:bg-white/10
               {$page.url.pathname.startsWith('/watchlist')
          ? 'text-white dark:text-violet-400'
          : 'text-zinc-400 active:text-white dark:active:text-violet-400'}"
      >
        <Star
          class="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform sm:group-hover:scale-110"
        />
        <span
          class="text-[10px] font-medium sm:text-[11px] sm:font-normal sm:tracking-tight"
          >{layout_watchlist()}</span
        >
        {#if $page.url.pathname.startsWith("/watchlist")}
          <span
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-violet-400"
          ></span>
        {/if}
      </a>
      <a
        href="/price-alert"
        class="group relative flex flex-col items-center justify-center gap-0.5 transition-all
               sm:flex-col sm:gap-1 sm:px-4 sm:py-2 sm:rounded-xl hover:bg-white/10
               {$page.url.pathname.startsWith('/price-alert')
          ? 'text-white dark:text-violet-400'
          : 'text-zinc-400 active:text-white dark:active:text-violet-400'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform sm:group-hover:scale-110"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
            <circle cx="12" cy="13" r="8" />
            <path d="M9.5 13h5M12 10.5v5" />
          </g>
        </svg>
        <span
          class="text-[10px] font-medium sm:text-[11px] sm:font-normal sm:tracking-tight"
          >{layout_price_alert()}</span
        >
        {#if $page.url.pathname.startsWith("/price-alert")}
          <span
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-violet-400"
          ></span>
        {/if}
      </a>
      <a
        href="/chat"
        class="group relative flex flex-col items-center justify-center gap-0.5 transition-all
               sm:flex-col sm:gap-1 sm:px-4 sm:py-2 sm:rounded-xl hover:bg-white/10
               {$page.url.pathname.startsWith('/chat')
          ? 'text-white dark:text-violet-400'
          : 'text-zinc-400 active:text-white dark:active:text-violet-400'}"
      >
        <Sparkles
          class="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-transform sm:group-hover:scale-110"
        />
        <span
          class="text-[10px] font-medium sm:text-[11px] sm:font-normal sm:tracking-tight"
          >Chat</span
        >
        {#if $page.url.pathname.startsWith("/chat")}
          <span
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-violet-400"
          ></span>
        {/if}
      </a>
    </div>
  </nav>
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
