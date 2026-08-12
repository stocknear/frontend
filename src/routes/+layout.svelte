<script lang="ts">
  import { deLocalizeHref } from "$lib/paraglide/runtime.js";
  import "../app.css";
  import { Toaster } from "svelte-sonner";
  import "@bprogress/core/css";
  import { BProgress } from "@bprogress/core";
  import { GTM_EVENT_SIGNUP } from "$lib/constants/tracking";
  import { FREE_TRIAL_ENABLED } from "$lib/constants/freeTrial";

  import { ModeWatcher } from "mode-watcher";
  import { page } from "$app/stores";

  import Footer from "$lib/components/Footer.svelte";
  import Searchbar from "$lib/components/Searchbar.svelte";
  import NotificationBell from "$lib/components/NotificationBell.svelte";
  import LanguageSuggestion from "$lib/components/LanguageSuggestion.svelte";

  //import DiscountBanner from '$lib/components/DiscountBanner.svelte';

  import { beforeNavigate, afterNavigate } from "$app/navigation";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { registerServiceWorker } from "$lib/registerServiceWorker";
  import {
    baseLocale,
    deLocalizeUrl,
    extractLocaleFromUrl,
    type Locale,
  } from "$lib/paraglide/runtime.js";
  import { localizedHref } from "$lib/i18n/navigation";
  import { canonicalizeLocale } from "$lib/i18n/locales";
  import {
    hasRouteMessages,
    loadRouteMessages,
  } from "$lib/i18n/delivery/client";

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
    layout_etf_heatmap,
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
    layout_etf_screener,
    layout_portfolio,
    layout_price_alert,
    layout_potus_tracker,
    layout_reddit_tracker,
    layout_etf_reverse_lookup,
    layout_screener,
    layout_start_trial,
    layout_sign_up,
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
    layout_chat,
    layout_income_strategy,
    layout_covered_call_screener,
    layout_cash_secured_put_screener,
  } from "$lib/paraglide/messages.js";

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
  const routeStartsWith = (path: string, prefix: string) =>
    path === prefix || path.startsWith(`${prefix}/`);

  let isLandingPage = false;
  let isSensitiveOAuthRoute = false;
  let currentLocale: Locale = data?.locale ?? baseLocale;
  let bottomNavState = {
    home: false,
    portfolio: false,
    watchlist: false,
    priceAlert: false,
    chat: false,
  };
  let translationNavigationGeneration = 0;
  let translationNavigationRetry: {
    target: string;
    generation: number;
  } | null = null;

  $: currentLocale =
    extractLocaleFromUrl($page.url) ?? data?.locale ?? baseLocale;
  $: isSensitiveOAuthRoute =
    deLocalizeUrl($page.url).pathname === "/oauth/authorize";

  let localHref: (href: string) => string;
  $: localHref = (href: string) => localizedHref(href, currentLocale);

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
  let marketHourInterval: ReturnType<typeof setInterval> | undefined = undefined;
  let hasMarketingConsent = data?.cookieConsent?.marketing === true;

  // GTM loading delay in milliseconds (3 seconds for better PageSpeed scores)
  const GTM_LOAD_DELAY = 3000;
  const MARKET_HOUR_CHECK_INTERVAL = 30_000;

  // Add preconnect hint dynamically when we're about to load GTM
  function addPreconnectHint() {
    const href = "https://www.googletagmanager.com";
    if (!document.querySelector(`link[href="${href}"][rel="preconnect"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      document.head.appendChild(link);
    }
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

    // Add preconnect hint just before loading GTM
    addPreconnectHint();

    const GTM_ID = "GTM-NZBJ9W63";
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    requestAnimationFrame(() => {
      document.head.appendChild(script);
    });
  }

  // Load all marketing scripts (only if consent given)
  function loadMarketingScripts() {
    if (marketingScriptsLoaded) return;

    initDataLayer();
    loadGTMScript();
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
    hasMarketingConsent = consent?.marketing === true;

    if (hasMarketingConsent) {
      loadMarketingScripts();
    }
  }

  let isStandalonePWA = false;

  onMount(() => {
    if (!browser) return;

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

    // Keep the consent document isolated from the product shell, workers,
    // persistence, market timers, and analytics. Consent exits use full loads.
    if (isSensitiveOAuthRoute) return;

    checkMarketHour();
    marketHourInterval = setInterval(checkMarketHour, MARKET_HOUR_CHECK_INTERVAL);

    isStandalonePWA =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Delay mounting the cookie consent component to keep initial load snappy
    cookieConsentDelayTimer = setTimeout(() => {
      showCookieConsentAfterDelay = true;
    }, 2000);

    // Use optimized service worker registration
    registerServiceWorker();

    // User interaction events that trigger early GTM loading after consent.
    const interactionEvents = [
      "scroll",
      "click",
      "touchstart",
      "keydown",
    ] as const;

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

      if (hasMarketingConsent) {
        loadMarketingScripts();
      }
    };

    if (hasMarketingConsent) {
      // Add interaction listeners (passive for scroll/touch to not block)
      interactionEvents.forEach((event) => {
        window.addEventListener(event, handleUserInteraction, {
          capture: true,
          passive: true,
          once: true,
        });
      });

      deferFunction(() => {
        // Delay GTM loading to 3 seconds after page load for better PageSpeed scores.
        // If the user interacts first, the same consent-gated path loads it early.
        marketingScriptTimer = setTimeout(() => {
          /*if (hasMarketingConsent) {
            loadMarketingScripts();
          }
          */
          loadMarketingScripts();
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
      if (marketHourInterval) clearInterval(marketHourInterval);

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

  beforeNavigate((navigation) => {
    if (
      navigation.to?.url &&
      (navigation.type === "link" || navigation.type === "goto")
    ) {
      const destination = navigation.to.url;
      if (destination.origin === window.location.origin) {
        const navigationGeneration = ++translationNavigationGeneration;
        const [firstSegment] =
          destination.pathname.split("/")?.filter(Boolean) ?? [];
        const destinationHasLocale = Boolean(
          firstSegment && canonicalizeLocale(firstSegment),
        );
        if (!destinationHasLocale) {
          const currentUrlLocale = extractLocaleFromUrl(window.location.href);
          const localized = localizedHref(
            `${destination.pathname}${destination.search}${destination.hash}`,
            currentUrlLocale,
          );
          const expected = new URL(localized, window.location.origin);
          if (expected.pathname !== destination.pathname) {
            navigation.cancel();
            void goto(`${expected.pathname}${expected.search}${expected.hash}`);
            return;
          }
        }

        const destinationLocale = extractLocaleFromUrl(destination);
        const activeLocale = extractLocaleFromUrl(window.location.href);
        if (destinationLocale !== activeLocale) {
          navigation.cancel();
          window.location.assign(destination.href);
          return;
        }

        const targetRouteId = navigation.to.route.id;
        const target = `${destination.pathname}${destination.search}${destination.hash}`;
        const isTranslationRetry =
          translationNavigationRetry?.target === target;
        if (isTranslationRetry) translationNavigationRetry = null;
        if (
          !isTranslationRetry &&
          targetRouteId &&
          !hasRouteMessages(targetRouteId, activeLocale)
        ) {
          navigation.cancel();
          void loadRouteMessages(targetRouteId, activeLocale)
            ?.then(async () => {
              if (navigationGeneration !== translationNavigationGeneration)
                return;
              translationNavigationRetry = {
                target,
                generation: navigationGeneration,
              };
              await goto(target);
            })
            ?.catch(() => {
              if (navigationGeneration === translationNavigationGeneration) {
                window.location.assign(target);
              }
            })
            ?.finally(() => {
              if (
                translationNavigationRetry?.generation === navigationGeneration
              ) {
                translationNavigationRetry = null;
              }
            });
          return;
        }
      }
    }
    BProgress?.start();
  });

  afterNavigate(({ from }) => {
    $previousPage = from?.url.pathname || $previousPage;
    BProgress?.done();
  });

  $: isLandingPage =
    (deLocalizeUrl($page.url).pathname === "/" && !data?.user) ||
    deLocalizeUrl($page.url).pathname === "/register" ||
    deLocalizeUrl($page.url).pathname === "/login" ||
    isSensitiveOAuthRoute;

  $: {
    const path = deLocalizeUrl($page.url).pathname;
    bottomNavState = {
      home: path === "/",
      portfolio: routeStartsWith(path, "/portfolio"),
      watchlist: routeStartsWith(path, "/watchlist"),
      priceAlert: routeStartsWith(path, "/alerts"),
      chat: routeStartsWith(path, "/chat"),
    };
  }

  $: {
    if ($page.url.pathname) {
      // Force reactive update of login data
      const nextLoginData = data?.user;
      if ($loginData !== nextLoginData) {
        $loginData = nextLoginData;
      }
      const path = deLocalizeUrl($page.url).pathname;
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

  // GTM signup conversion (server-validated via httpOnly cookie in +layout.server.ts)
  // Reactive so it fires when data updates after form action, not just on initial mount
  let signupConversionFired = false;
  $: if (
    browser &&
    !isSensitiveOAuthRoute &&
    data.signupConversion &&
    !signupConversionFired
  ) {
    signupConversionFired = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: GTM_EVENT_SIGNUP });
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
</script>

<svelte:window
  bind:innerWidth={$screenWidth}
  on:scroll|passive={handleScroll}
/>

<!-- defaultTheme keeps daisyUI's `data-theme` in step with the mode. Without it
     mode-watcher writes `data-theme=""`, and because the attribute is still
     present that defeats both `[data-theme=dark]` and daisyUI's
     `:root:not([data-theme])` fallback — freezing daisyUI on its light theme. -->
<ModeWatcher defaultMode={data?.themeMode} defaultTheme={data?.themeMode} />

<!-- Google Tag Manager (noscript) -->
{#if data?.cookieConsent?.marketing === true && !isSensitiveOAuthRoute}
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=GTM-NZBJ9W63"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
      title="Google Tag Manager"
    ></iframe>
  </noscript>
{/if}

{#if isStandalonePWA && !isSensitiveOAuthRoute}
  {#await import("$lib/components/PullToRefresh.svelte") then { default: PullToRefresh }}
    <PullToRefresh />
  {:catch _err}
    <!-- PTR chunk failed to load; silently degrade -->
  {/await}
{/if}

<div class="app text-fg">
  <div class="flex min-h-screen w-full flex-col bg-surface-page">
    <div class="w-full">
      {#if !isSensitiveOAuthRoute}
        <div
          class="w-full navbar sticky top-0 z-40 bg-surface-card border-b border-line flex h-14 items-center gap-4 px-4 sm:h-auto sm:px-6"
        >
        <Sheet.Root>
          <Sheet.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              size="icon"
              class="group rounded-full bg-transparent dark:bg-[#131214] text-fg-muted sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 border-none transition 3xl:hidden"
            >
              <Menu
                class="h-5.5 w-5.5 sm:w-7 sm:h-7 text-fg-muted transition group-hover:text-accent"
              />
              <span class="sr-only">{layout_toggle_menu()}</span>
            </Button>
          </Sheet.Trigger>
          <Sheet.Content
            side="left"
            class="max-w-screen w-full sm:max-w-xs bg-white/95 dark:bg-[#131214] backdrop-blur overflow-y-auto text-fg"
          >
            <nav class=" grid gap-6 text-lg">
              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  class="-ml-4 mr-auto bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref("/")}
                    class="flex items-center gap-4 px-0.5 text-fg text-lg sm:text-xl font-semibold tracking-tight"
                  >
                    <img
                      class="avatar w-9 sm:w-10 rounded-full"
                      src="/pwa-192x192.png"
                      alt={layout_logo_alt()}
                      width="40"
                      height="40"
                    />
                    Stocknear
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  class="rounded-full w-full border border-line bg-surface-raised/50 transition"
                >
                  <a
                    class="cursor-pointer w-full flex justify-start items-start"
                    href={localHref("/chat")}
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
                  class="w-full -ml-4 mr-auto bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref("/")}
                    class="w-full group flex flex-row items-center mr-auto mt-5"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-control text-fg group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <Home
                        class="h-6 w-6 mr-3 text-fg group-hover:text-accent transition ml-1"
                      />
                    </div>
                    <span
                      class="ml-1 mr-auto text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition"
                      >{layout_home()}</span
                    >
                  </a>
                </Button>
              </Sheet.Close>

              <div class="flex flex-row items-center w-full">
                <Accordion.Root class="w-full">
                  <Accordion.Item value="item-1">
                    <Accordion.Trigger
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Stock
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_stocks()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/industry")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_by_industry()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/market-mover/gainers")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_market_mover()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/stocks/heatmap")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_market_heatmap()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/stocks/compare")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_comparison_tool()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/list")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Layers
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_etfs()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf/etf-providers")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_providers()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf/heatmap")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_heatmap()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf/compare")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_comparison_tool()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf/new-launches")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_new_launches()}</a
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Analyst
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_analyst()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/analysts")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_top_analysts()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/analysts/top-stocks")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_top_analyst_stocks()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/analysts/analyst-flow")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Calendar
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_calendar()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/dividends-calendar")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_dividends_calendar()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/earnings-calendar")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_earnings_calendar()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/ipos")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_ipo_calendar()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/economic-calendar")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_economic_calendar()}</a
                            >
                          </Button>
                          <!--
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/economic-indicator")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >Economic Indicator</a
                            >
                          </Button>
                          

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/stock-splits-calendar")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <HandShake
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_congress()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/politicians/flow-data")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_congress_flow()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/politicians")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Flow
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_flow_feed()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/market-flow")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_market_flow()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/news-flow")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-2"
                              >{layout_news_flow()}</a
                            >
                          </Button>

                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/options-flow")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_options_flow()}</a
                            >
                          </Button>
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/unusual-order-flow")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Screener
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_screener()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/stocks/screener")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf/screener")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_screener()}</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/options-screener")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_options_screener()}</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <div class="ml-4 mt-5">
                        <span
                          class="text-xs font-semibold uppercase tracking-wider text-fg"
                          >{layout_income_strategy()}</span
                        >
                      </div>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/covered-call-screener")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_covered_call_screener()}</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/cash-secured-put-screener")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_cash_secured_put_screener()}</a
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
                      class="group text-sm font-semibold tracking-tight text-fg hover:text-accent transition"
                    >
                      <Tools
                        class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                      />
                      <span class="ml-1 mr-auto">{layout_tools()}</span>
                    </Accordion.Trigger>
                    <Accordion.Content
                      class="border-l border-line ml-2 mt-5"
                    >
                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/options-calculator")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/potus-tracker")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/insider-tracker")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/reddit-tracker")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_reddit_tracker()}</a
                            >
                          </Button>
                        </div>
                      </Sheet.Close>

                      <Sheet.Close asChild let:builder>
                        <div class="flex flex-col items-start">
                          <Button
                            builders={[builder]}
                            type="submit"
                            class="w-full  cursor-pointer bg-transparent dark:bg-[#131214]"
                          >
                            <a
                              href={localHref("/etf-reverse-lookup")}
                              class="text-start w-full text-[0.95rem] text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_reverse_lookup()}</a
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
                  class="-ml-4 w-full bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref("/hedge-funds")}
                    class="group flex flex-row items-center w-full -mt-2"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-control text-fg group-hover:text-accent transition md:h-8 md:w-8"
                      >
                        <Boxes
                          class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition"
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
                  class="-ml-4 w-full bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref("/chart/NVDA")}
                    class="group flex flex-row items-center w-full -mt-4"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-control text-fg group-hover:text-accent transition md:h-8 md:w-8"
                      >
                        <ChartNoAxes
                          class="size-6 mr-3 flex-shrink-0 text-fg group-hover:text-accent transition ml-1"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition"
                        >Pro Chart</span
                      >
                    </div>
                  </a>
                </Button>
              </Sheet.Close>

              <Sheet.Close asChild let:builder>
                <Button
                  builders={[builder]}
                  type="submit"
                  class="-ml-4 w-full bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref("/market-news")}
                    class="group flex flex-row items-center w-full -mt-8"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-control text-fg group-hover:text-accent transition md:h-8 md:w-8"
                      >
                        <Newspaper
                          class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auot text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition"
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
                  class="-ml-4 w-full bg-transparent dark:bg-[#131214]"
                >
                  <a
                    href={localHref(
                      data?.hasDailyBriefing &&
                        data?.isPreMarket &&
                        data?.dailyBriefingSlug
                        ? `/learning-center/article/${data.dailyBriefingSlug}`
                        : "/learning-center",
                    )}
                    class="group flex flex-row items-center w-full -mt-8"
                  >
                    <div class="flex flex-row items-center mr-auto">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-control text-fg group-hover:text-accent transition md:h-8 md:w-8"
                      >
                        <BookOpen
                          class="h-5.5 w-5.5 mr-3 text-fg group-hover:text-accent transition ml-1 flex-shrink-0"
                        />
                      </div>
                      <span
                        class="ml-1 mr-auto text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition"
                        >{data?.hasDailyBriefing && data?.isPreMarket
                          ? layout_daily_briefing()
                          : layout_learning_center()}</span
                      >
                      {#if data?.hasDailyBriefing && data?.isPreMarket}
                        <span class="relative flex h-2 w-2 ml-2">
                          <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                          ></span>
                          <span
                            class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                          ></span>
                        </span>
                      {/if}
                    </div>
                  </a>
                </Button>
              </Sheet.Close>
            </nav>
          </Sheet.Content>
        </Sheet.Root>

        <a
          href={localHref("/")}
          class="-ml-2 flex flex-row items-center shrink-0"
        >
          <img
            class="avatar w-9 3xl:w-10 rounded-full"
            src="/pwa-192x192.png"
            alt={layout_logo_alt()}
            width="40"
            height="40"
          />
          <span
            class="text-fg sm:hover:text-accent transition font-semibold tracking-tight ml-2 text-xl"
            >Stocknear</span
          >
        </a>

        <div
          class="relative w-full flex flex-row justify-end sm:justify-between items-center gap-2 sm:gap-3"
        >
          <div class="sm:w-full sm:ml-2 2xl:ml-[75px]">
            <Searchbar />
          </div>
          {#if !(deLocalizeHref($page.url.pathname) === "/" && !data?.user)}
            <NotificationBell {data} {hasUnreadElement} />
          {/if}

          {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && !data?.user}
            <div class="hidden shrink-0 sm:inline-flex">
              <a
                href={localHref("/register")}
                class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-control bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
              >
                {FREE_TRIAL_ENABLED ? layout_start_trial() : layout_sign_up()}
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
                    class="overflow-hidden rounded-full bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900/70 border border-line w-10 h-10 transition"
                    builders={[builder]}
                  >
                    <svg
                      class="h-[28px] w-[28px] overflow-hidden rounded-full text-fg sm:hover:text-accent"
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
                  class="rounded-container border border-line bg-surface-card p-1 text-fg shadow-none"
                >
                  <a href={localHref("/profile")} class="cursor-pointer">
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-accent transition cursor-pointer"
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
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-accent transition cursor-pointer"
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
              <!-- Secondary CTA. border-line-strong measured only 1.74:1 against
                   the dark navbar; a control boundary needs 3:1 to read as a
                   button rather than as text. fg-subtle gives 3.64:1 light and
                   3.77:1 dark. -->
              <a
                href={localHref("/login")}
                class="inline-flex h-9 items-center justify-center rounded-control border border-fg-subtle bg-surface-card px-4 text-sm font-medium text-fg transition-colors hover:border-fg-muted hover:bg-surface-raised"
              >
                {layout_login()}
              </a>
            {/if}
          </div>
        </div>
        </div>
      {/if}
      <div>
        <div class="flex w-full">
          {#if !isChartRoute && !isSensitiveOAuthRoute}
            <div class="hidden 3xl:block 3xl:w-[300px] 3xl:shrink-0">
              <aside
                class="sidebar-scroll sticky top-[64px] z-30 3xl:flex w-64 h-full self-start max-h-[calc(100dvh-84px)] overflow-x-hidden overflow-y-auto overscroll-contain flex-col bg-white/90 dark:bg-[#131214] backdrop-blur"
              >
                <nav
                  class="flex flex-col items-center mr-auto gap-y-4 3xl:py-5 w-full"
                >
                  <a
                    href={localHref("/chat")}
                    class="mb-2 flex flex-row items-center ml-8 pr-7 w-full"
                  >
                    <div
                      class="px-4 py-1 sm:py-2 rounded-full flex flex-row items-center justify-start w-full border border-line bg-white/70 dark:bg-zinc-900/50 transition"
                    >
                      <Plus class="w-4 h-4 inline-block mr-2" />
                      <span class="font-semibold">
                        {layout_start_new_chat()}
                      </span>
                    </div>
                  </a>

                  <a
                    href={localHref("/")}
                    class="group flex flex-row items-center ml-9 w-full"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <Home class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 group-hover:text-accent transition"
                      >{layout_home()}</span
                    >
                  </a>

                  <div class="flex flex-row items-center ml-9 w-full mt-3">
                    <Accordion.Root class="w-full">
                      <Accordion.Item value="item-1">
                        <Accordion.Trigger
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Stock class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_stocks()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/industry")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_by_industry()}</a
                            >

                            <a
                              href={localHref("/market-mover/gainers")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_market_mover()}</a
                            >

                            <a
                              href={localHref("/stocks/heatmap")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_market_heatmap()}</a
                            >

                            <a
                              href={localHref("/stocks/compare")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_comparison_tool()}</a
                            >

                            <a
                              href={localHref("/list")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Layers class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_etfs()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/etf/etf-providers")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_providers()}</a
                            >
                            <a
                              href={localHref("/etf/heatmap")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_heatmap()}</a
                            >
                            <a
                              href={localHref("/etf/compare")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_comparison_tool()}</a
                            >
                            <a
                              href={localHref("/etf/new-launches")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_new_launches()}</a
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Analyst class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_analyst()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/analysts")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_top_analysts()}</a
                            >
                            <a
                              href={localHref("/analysts/top-stocks")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_top_analyst_stocks()}</a
                            >

                            <a
                              href={localHref("/analysts/analyst-flow")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Calendar class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_calendar()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/dividends-calendar")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_dividends_calendar()}</a
                            >
                            <a
                              href={localHref("/earnings-calendar")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_earnings_calendar()}</a
                            >
                            <!--
                          <a
                            href={localHref("/fda-calendar")}
                            class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                            >FDA Calendar</a
                          >
                            -->

                            <a
                              href={localHref("/ipos")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_ipo_calendar()}</a
                            >
                            <a
                              href={localHref("/economic-calendar")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <HandShake class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_congress()}</span>
                          </div>
                        </Accordion.Trigger>

                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <div class="flex flex-col items-start">
                              <a
                                href={localHref("/politicians/flow-data")}
                                class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                                >{layout_congress_flow()}</a
                              >
                              <a
                                href={localHref("/politicians")}
                                class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Flow class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_flow_feed()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/market-flow")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_market_flow()}</a
                            >

                            <a
                              href={localHref("/news-flow")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_news_flow()}</a
                            >

                            <a
                              href={localHref("/options-flow")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_options_flow()}</a
                            >
                            <a
                              href={localHref("/unusual-order-flow")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Screener class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_screener()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/stocks/screener")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_stock_screener()}</a
                            >

                            <a
                              href={localHref("/etf/screener")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_screener()}</a
                            >

                            <a
                              href={localHref("/options-screener")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_options_screener()}</a
                            >

                            <span
                              class="text-xs font-semibold uppercase tracking-wider text-fg ml-4 mt-6"
                              >{layout_income_strategy()}</span
                            >

                            <a
                              href={localHref("/covered-call-screener")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_covered_call_screener()}</a
                            >
                            <a
                              href={localHref("/cash-secured-put-screener")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_cash_secured_put_screener()}</a
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
                          class="group text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 hover:text-accent transition"
                        >
                          <div class="flex items-center mr-auto">
                            <div
                              class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                            >
                              <Tools class="h-5.5 w-5.5" />
                            </div>
                            <span class="ml-3">{layout_tools()}</span>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Content
                          class="border-l border-line ml-2 mt-5"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={localHref("/options-calculator")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_options_calculator()}</a
                            >

                            <a
                              href={localHref("/potus-tracker")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_potus_tracker()}</a
                            >
                            <a
                              href={localHref("/insider-tracker")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_insider_tracker()}</a
                            >
                            <a
                              href={localHref("/reddit-tracker")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_reddit_tracker()}</a
                            >
                            <a
                              href={localHref("/etf-reverse-lookup")}
                              class="text-[0.95rem] font-medium text-fg-muted hover:text-accent transition ml-4 mt-4"
                              >{layout_etf_reverse_lookup()}</a
                            >
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>

                  <a
                    href={localHref("/hedge-funds")}
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <Boxes class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 group-hover:text-accent transition"
                      >{layout_hedge_funds()}</span
                    >
                  </a>

                  <a
                    href={localHref("/chart/NVDA")}
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <ChartNoAxes class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 group-hover:text-accent transition"
                      >Pro Chart</span
                    >
                  </a>

                  <a
                    href={localHref("/market-news")}
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <Newspaper class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 group-hover:text-accent transition"
                      >{layout_market_news()}</span
                    >
                  </a>

                  <a
                    href={localHref(
                      data?.hasDailyBriefing &&
                        data?.isPreMarket &&
                        data?.dailyBriefingSlug
                        ? `/learning-center/article/${data.dailyBriefingSlug}`
                        : "/learning-center",
                    )}
                    class="group flex flex-row items-center ml-9 w-full mt-3"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/70 dark:bg-zinc-900/50 text-muted dark:text-zinc-100 group-hover:text-accent transition md:h-8 md:w-8"
                    >
                      <BookOpen class="h-5.5 w-5.5" />
                    </div>
                    <span
                      class="ml-3 text-sm font-semibold tracking-tight text-muted dark:text-zinc-100 group-hover:text-accent transition"
                      >{data?.hasDailyBriefing && data?.isPreMarket
                        ? layout_daily_briefing()
                        : layout_learning_center()}</span
                    >
                    {#if data?.hasDailyBriefing && data?.isPreMarket}
                      <span class="relative flex h-2 w-2 ml-2">
                        <span
                          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                        ></span>
                        <span
                          class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                        ></span>
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
                isChartRoute || isSensitiveOAuthRoute
                  ? "overflow-hidden p-0"
                  : deLocalizeHref($page.url.pathname).startsWith("/chat")
                    ? "overflow-y-auto sm:p-4"
                    : deLocalizeHref($page.url.pathname).startsWith("/learning-center/article/")
                      ? "pb-[var(--nav-clearance)] sm:p-4 sm:pb-[var(--nav-clearance)]"
                      : "overflow-y-auto pb-[var(--nav-clearance)] sm:p-4 sm:pb-[var(--nav-clearance)]"
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
        {#if !$page?.url?.pathname?.startsWith("/chat") && !isChartRoute && !isSensitiveOAuthRoute}
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

{#if data?.user?.id && !isChartRoute && !isSensitiveOAuthRoute}
  {#await import("$lib/components/Feedback.svelte") then { default: Comp }}
    <svelte:component this={Comp} {data} />
  {/await}
{/if}

<!-- Bottom Navigation Bar -->
{#if !isChartRoute && !isLandingPage && !isSensitiveOAuthRoute}
  <!-- Floating dock on mobile and desktop. It used to occlude table rows and
       the pricing tiers because it floats over the canvas while pages set
       `sm:pb-0`; the fix is the reserved clearance below, not deleting it.
       Surfaces are tokens now instead of hardcoded slate. -->
  <nav
    aria-label="Primary navigation"
    class="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 transform-gpu border-t border-line bg-surface-card text-fg backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none
           sm:bottom-5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:rounded-container sm:border sm:shadow-[var(--shadow-overlay)]
           {navbarHidden
      ? 'translate-y-[calc(100%+1rem)] sm:translate-y-[calc(100%+2rem)]'
      : 'translate-y-0'}"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
    ></span>
    <div
      class="grid grid-cols-5 gap-1 px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 sm:flex sm:items-center sm:justify-center sm:gap-2 sm:px-3 sm:py-2.5"
    >
      <a
        href={localHref("/")}
        aria-current={bottomNavState.home ? "page" : undefined}
        class={`group relative flex min-h-[48px] min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-container px-1.5 py-1.5 text-center text-[11px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 ease-out outline-none motion-reduce:transition-none sm:min-w-[92px] sm:text-[13px]
               text-fg-muted hover:bg-surface-raised hover:text-fg active:scale-[0.97] active:text-fg`}
      >
        <span
          class={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-container transition-transform duration-200 motion-reduce:transition-none ${
            bottomNavState.home ? "scale-105" : "group-hover:scale-105"
          }`}
        >
          <Home class="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <span class={bottomNavState.home ? "opacity-100" : "opacity-90"}
          >{layout_home()}</span
        >
      </a>
      <a
        href={localHref("/portfolio")}
        aria-current={bottomNavState.portfolio ? "page" : undefined}
        class={`group relative flex min-h-[48px] min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-container px-1.5 py-1.5 text-center text-[11px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 ease-out outline-none motion-reduce:transition-none sm:min-w-[92px] sm:text-[13px]
               text-fg-muted hover:bg-surface-raised hover:text-fg active:scale-[0.97] active:text-fg`}
      >
        <span
          class={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-container transition-transform duration-200 motion-reduce:transition-none ${
            bottomNavState.portfolio ? "scale-105" : "group-hover:scale-105"
          }`}
        >
          <PieChart class="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <span class={bottomNavState.portfolio ? "opacity-100" : "opacity-90"}
          >{layout_portfolio()}</span
        >
      </a>
      <a
        href={localHref("/watchlist/stocks")}
        aria-current={bottomNavState.watchlist ? "page" : undefined}
        class={`group relative flex min-h-[48px] min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-container px-1.5 py-1.5 text-center text-[11px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 ease-out outline-none motion-reduce:transition-none sm:min-w-[92px] sm:text-[13px]
               text-fg-muted hover:bg-surface-raised hover:text-fg active:scale-[0.97] active:text-fg`}
      >
        <span
          class={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-container transition-transform duration-200 motion-reduce:transition-none ${
            bottomNavState.watchlist ? "scale-105" : "group-hover:scale-105"
          }`}
        >
          <Star class="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <span class={bottomNavState.watchlist ? "opacity-100" : "opacity-90"}
          >{layout_watchlist()}</span
        >
      </a>
      <a
        href={localHref("/alerts")}
        aria-current={bottomNavState.priceAlert ? "page" : undefined}
        class={`group relative flex min-h-[48px] min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-container px-1.5 py-1.5 text-center text-[11px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 ease-out outline-none motion-reduce:transition-none sm:min-w-[92px] sm:text-[13px]
               text-fg-muted hover:bg-surface-raised hover:text-fg active:scale-[0.97] active:text-fg`}
      >
        <span
          class={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-container transition-transform duration-200 motion-reduce:transition-none ${
            bottomNavState.priceAlert ? "scale-105" : "group-hover:scale-105"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 sm:h-6 sm:w-6"
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
        </span>
        <span class={bottomNavState.priceAlert ? "opacity-100" : "opacity-90"}
          >{layout_price_alert()}</span
        >
      </a>
      <a
        href={localHref("/chat")}
        aria-current={bottomNavState.chat ? "page" : undefined}
        class={`group relative flex min-h-[48px] min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-container px-1.5 py-1.5 text-center text-[11px] font-medium tracking-tight transition-[background-color,color,transform] duration-200 ease-out outline-none motion-reduce:transition-none sm:min-w-[92px] sm:text-[13px]
               text-fg-muted hover:bg-surface-raised hover:text-fg active:scale-[0.97] active:text-fg`}
      >
        <span
          class={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-container transition-transform duration-200 motion-reduce:transition-none ${
            bottomNavState.chat ? "scale-105" : "group-hover:scale-105"
          }`}
        >
          <Sparkles class="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <span class={bottomNavState.chat ? "opacity-100" : "opacity-90"}
          >{layout_chat()}</span
        >
      </a>
    </div>
  </nav>
{/if}

{#if !isSensitiveOAuthRoute}
  <LanguageSuggestion initialLocale={data?.suggestedLocale ?? null} />
{/if}

<!-- Cookie Consent Banner -->
{#if showCookieConsentAfterDelay && !isSensitiveOAuthRoute}
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

  :global(body.search-modal-open) .app-bottom-nav {
    display: none !important;
  }

  /* Thin scrollbar for desktop sidebar (Firefox + WebKit/Blink). */
  :global(.sidebar-scroll) {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.65) transparent;
  }

  :global(.dark .sidebar-scroll) {
    scrollbar-color: rgba(82, 82, 91, 0.9) transparent;
  }

  :global(.sidebar-scroll::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }

  :global(.sidebar-scroll::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.sidebar-scroll::-webkit-scrollbar-thumb) {
    background: rgba(156, 163, 175, 0.65);
    border-radius: 9999px;
  }

  :global(.dark .sidebar-scroll::-webkit-scrollbar-thumb) {
    background: rgba(82, 82, 91, 0.9);
  }

  :global(.sidebar-scroll::-webkit-scrollbar-thumb:hover) {
    background: rgba(107, 114, 128, 0.9);
  }

  :global(.dark .sidebar-scroll::-webkit-scrollbar-thumb:hover) {
    background: rgba(113, 113, 122, 0.95);
  }
</style>
