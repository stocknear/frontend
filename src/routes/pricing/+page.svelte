<script lang="ts">
  import { openLemonSqueezyUrl } from "$lib/lemonsqueezy";
  import { onMount } from "svelte";

  import SEO from "$lib/components/SEO.svelte";
  import Discount from "$lib/components/Discount.svelte";
  export let data;
  export let form;

  let mode = false;

  const emailAddress = "support@stocknear.com";

  let affiliateScriptLoad: Promise<void> | null = null;

  function loadLemonSqueezyAffiliate() {
    if (affiliateScriptLoad) return affiliateScriptLoad;

    affiliateScriptLoad = new Promise<void>((resolve) => {
      if (typeof window === "undefined") return resolve();
      if (document.querySelector('script[data-ls-affiliate="1"]'))
        return resolve();

      (window as any).lemonSqueezyAffiliateConfig = { store: "Stocknear" };

      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://lmsqueezy.com/affiliate.js";
      script.dataset.lsAffiliate = "1";
      script.onload = () => resolve();
      script.onerror = () => resolve();

      document.head.appendChild(script);
    });

    return affiliateScriptLoad;
  }

  let LoginPopup;

  onMount(async () => {
    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }
  });

  async function purchasePlan(subscriptionType: string = "") {
    if (data?.user) {
      let subId;

      if (subscriptionType?.toLowerCase() === "lifetime") {
        subId = import.meta.env.VITE_LEMON_SQUEEZY_LIFE_TIME_ACCESS_ID;
      } else {
        const isPro = subscriptionType?.toLowerCase() === "pro";
        const isPlus = subscriptionType?.toLowerCase() === "plus";
        const isAnnual = Boolean(mode); // true = annual, false = monthly
        const isFreeTrial = !data?.user?.freeTrial;

        let plan = "";

        if (isPro) {
          plan = isAnnual ? "ANNUAL_ID_PRO" : "MONTHLY_ID_PRO";
        } else if (isPlus) {
          plan = isAnnual ? "ANNUAL_ID_PLUS" : "MONTHLY_ID_PLUS";
        }

        const prefix = isFreeTrial
          ? "VITE_LEMON_SQUEEZY_FREE_TRIAL_"
          : "VITE_LEMON_SQUEEZY_";

        subId = import.meta.env[`${prefix}${plan}`];
      }

      const isDarkMode =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const checkoutUrl =
        `https://stocknear.lemonsqueezy.com/checkout/buy/${subId}?` +
        new URLSearchParams({
          embed: "1",
          dark: isDarkMode ? "1" : "0",
          "checkout[email]": data?.user?.email,
          "checkout[name]": data?.user?.username,
          "checkout[custom][userId]": data?.user?.id,
        })?.toString();

      await loadLemonSqueezyAffiliate();
      openLemonSqueezyUrl(checkoutUrl);
      //goto(`https://stocknear.lemonsqueezy.com/checkout/buy/${subId}`)
    }
  }
</script>

<SEO
  title="Stocknear Pricing - Pro Stock Analysis Plans & Premium Features "
  description="Unlock premium stock analysis features with Stocknear Pro and Lifetime plans. Get unlimited access to advanced tools, real-time data, AI forecasts, options flow, and institutional-grade analytics. Start your free trial today."
  keywords="stocknear pricing, stocknear pro, stock analysis subscription, premium stock tools, investment analytics pricing, trading tools subscription, stock data premium, financial analysis plans"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Stocknear Pricing Plans",
    description:
      "Premium subscription plans for advanced stock analysis and trading tools",
    url: "https://stocknear.com/pricing",
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
          name: "Pricing",
          item: "https://stocknear.com/pricing",
        },
      ],
    },
    offers: [
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "20",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "20",
          priceCurrency: "USD",
          unitCode: "MON",
        },
      },
      {
        "@type": "Offer",
        name: "Lifetime Plan",
        price: "449",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "449",
          priceCurrency: "USD",
        },
      },
    ],
  }}
/>

<section
  class="pricing-shell relative mb-40 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 overflow-hidden text-[rgb(var(--pricing-ink))]"
>
  <div class="pointer-events-none absolute inset-0 -z-10">
    <div
      class="absolute -top-24 left-1/2 h-72 w-[120%] -translate-x-1/2 bg-transparent"
    ></div>
    <div class="absolute inset-0 bg-transparent"></div>
  </div>

  <div class="relative">
    <div
      class="flex flex-wrap items-center justify-center gap-3 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.3em]"
    >
      <div
        class="flex items-center gap-2 rounded-full border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 py-2 shadow-none"
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          stroke-width="0"
          viewBox="0 0 640 512"
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"
          ></path>
        </svg>
        <span>10,000+ investors</span>
      </div>
      <div
        class="flex items-center gap-2 rounded-full border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 py-2 shadow-none"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        <span class="text-[rgb(var(--pricing-ink))]">4.6/5</span>
        <span class="font-medium">Trustpilot</span>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://www.trustpilot.com/review/stocknear.com"
          class="underline underline-offset-4 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >
          Reviews
        </a>
      </div>
    </div>

    <div class="mx-auto mt-10 text-center max-w-3xl">
      <h1 class="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
        Faster research, smarter trades.
      </h1>
      <p class="mt-4 text-base sm:text-lg">
        Start free, upgrade anytime. Every tier is built for focus: clean data,
        smart alerts, and tools that save hours.
      </p>
      <div
        class="mt-6 flex flex-wrap items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.18em]"
      >
        <span
          class="rounded-full border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-3 py-1"
          >7-day free trial</span
        >
        <span
          class="rounded-full border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-3 py-1"
          >Cancel anytime</span
        >
        <span
          class="rounded-full border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-3 py-1"
          >No hidden fees</span
        >
      </div>
    </div>

    <Discount />

    <div
      class="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold"
    >
      <span class={mode ? "" : "text-[rgb(var(--pricing-ink))]"}>
        Monthly
      </span>
      <label class="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" bind:checked={mode} class="peer sr-only" />
        <span
          class="h-8 w-16 rounded-full border border-[rgb(var(--pricing-border)/0.55)] bg-[rgb(var(--pricing-card)/0.9)] shadow-none transition peer-checked:bg-[rgb(var(--pricing-accent)/0.12)]"
        ></span>
        <span
          class="absolute left-1 top-1 h-6 w-6 rounded-full bg-muted dark:bg-white shadow-md transition peer-checked:translate-x-8 dark:bg-zinc-200"
        ></span>
      </label>
      <span class={mode ? "text-[rgb(var(--pricing-ink))]" : ""}> Annual </span>
      <span
        class="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
      >
        Save 33%
      </span>
    </div>

    <div class="mt-12 grid gap-6 lg:grid-cols-3">
      <div
        class="hidden sm:flex flex-col relative rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.9)] p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-semibold tracking-tight">Basic</h3>
          <span
            class="rounded-full border border-[rgb(var(--pricing-border)/0.45)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
          >
            Starter
          </span>
        </div>
        <p class="mt-2 text-sm">Everything you need to explore the platform.</p>
        <div class="mt-5 flex items-baseline justify-center gap-2">
          <span class="text-4xl font-semibold">$0</span>
          <span class="text-sm">/month</span>
        </div>

        <ul class="mt-6 mb-6 space-y-2 text-sm">
          <li class="flex flex-row items-center">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="mr-2">10 Credits/mo</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">1 Watchlist (up to 5 stocks)</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">1 Portfolio (up to 5 stocks)</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">3 Price Alerts</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Real-Time Notification</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Hedge Fund Portfolio Access</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">US Congress Portfolio Access</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Financial History Access</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Stock Screener</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Financial Data Download</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">No Ads</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time & Historical Options Data</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time Options Flow Data</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time Unusual Orders</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Premium Discord Channel Access</span>
          </li>
        </ul>
        <div
          class="mt-auto pt-6 border-t border-[rgb(var(--pricing-border)/0.5)] mx-2"
        >
          {#if !data?.user}
            <label
              for="userLogin"
              class="text-[rgb(var(--pricing-ink))] cursor-pointer w-full py-3 px-4 border border-[rgb(var(--pricing-border)/0.55)] bg-[rgb(var(--pricing-card)/0.9)] rounded-full font-semibold sm:hover:bg-white/80 dark:sm:hover:bg-[rgb(var(--pricing-card))] transition duration-150 flex items-center justify-center"
              >Get Registered Now<svg
                class="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path></svg
              ></label
            >
          {/if}
        </div>
      </div>

      <div
        class="rounded-2xl flex flex-col relative border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.9)] p-6"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-semibold tracking-tight">Plus</h3>
        </div>
        <p class="mt-2 text-sm">Essential tools for individual investors.</p>
        <div class="mt-5 flex items-baseline justify-center gap-2">
          <span class="text-4xl font-semibold">{mode ? "$10" : "$15"}</span>
          <span class="text-sm">/month</span>
        </div>
        <p
          class=" text-xs mt-2 uppercase tracking-[0.2em] {!mode
            ? 'hidden'
            : ''}"
        >
          Billed annually ($120)
        </p>

        <ul class="mt-6 mb-6 space-y-2 text-sm">
          <li class="flex flex-row items-center whitespace-nowrap">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="mr-2">150 Credits/mo </span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Unlimited Watchlist up to 100 stocks</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Unlimited Portfolio up to 100 stocks</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Unlimited Price Alerts</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Unlimited Stock Screener</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Unlimited Financial Data Download</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Real-Time Notification</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Hedge Fund Portfolio Access</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">US Congress Portfolio Access</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Financial History Access</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">No Ads</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time & Historical Options Data</span>
          </li>

          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time Options Flow Data</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Real-Time Unusual Orders</span>
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              viewBox="0 0 64 64"
              version="1.1"
              fill="currentColor"
              style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <rect
                  id="Icons"
                  x="-448"
                  y="-64"
                  width="1280"
                  height="800"
                  style="fill:none;"
                ></rect>
                <g id="Icons1" serif:id="Icons">
                  <g id="Strike"> </g> <g id="H1"> </g> <g id="H2"> </g>
                  <g id="H3"> </g> <g id="list-ul"> </g>
                  <g id="hamburger-1"> </g> <g id="hamburger-2"> </g>
                  <g id="list-ol"> </g> <g id="list-task"> </g>
                  <g id="trash"> </g> <g id="vertical-menu"> </g>
                  <g id="horizontal-menu"> </g> <g id="sidebar-2"> </g>
                  <g id="Pen"> </g> <g id="Pen1" serif:id="Pen"> </g>
                  <g id="clock"> </g> <g id="external-link"> </g>
                  <g id="hr"> </g> <g id="info"> </g> <g id="warning"> </g>
                  <g id="plus-circle"> </g> <g id="minus-circle"> </g>
                  <g id="vue"> </g> <g id="cog"> </g> <g id="logo"> </g>
                  <path
                    id="times"
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path>
                  <path
                    d="M32.033,29.19l15.55,-15.55l2.863,2.863l-15.55,15.55l15.55,15.55l-2.863,2.863l-15.55,-15.55l-15.55,15.55l-2.863,-2.863l15.55,-15.55l-15.55,-15.55l2.863,-2.863l15.55,15.55Z"
                  ></path> <g id="radio-check"> </g> <g id="eye-slash"> </g>
                  <g id="eye"> </g> <g id="toggle-off"> </g>
                  <g id="shredder"> </g>
                  <g
                    id="spinner--loading--dots-"
                    serif:id="spinner [loading, dots]"
                  >
                  </g> <g id="react"> </g> <g id="check-selected"> </g>
                  <g id="turn-off"> </g> <g id="code-block"> </g>
                  <g id="user"> </g> <g id="coffee-bean"> </g>
                  <g id="coffee-beans">
                    <g id="coffee-bean1" serif:id="coffee-bean"> </g>
                  </g> <g id="coffee-bean-filled"> </g>
                  <g id="coffee-beans-filled">
                    <g id="coffee-bean2" serif:id="coffee-bean"> </g>
                  </g> <g id="clipboard"> </g> <g id="clipboard-paste"> </g>
                  <g id="clipboard-copy"> </g> <g id="Layer1"> </g>
                </g>
              </g></svg
            >

            <span class="">Premium Discord Channel Access</span>
          </li>
        </ul>
        <div
          class="mt-auto pt-6 border-t border-[rgb(var(--pricing-border)/0.5)] mx-2"
        >
          {#if data?.user?.tier === "Plus"}
            <div
              class="w-full py-3 px-4 border border-[rgb(var(--pricing-border)/0.5)] bg-[rgb(var(--pricing-card)/0.7)] rounded-full font-semibold flex items-center justify-center cursor-not-allowed"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              Current Plan
            </div>
          {:else if data?.user?.tier === "Pro"}
            <div
              class="w-full py-3 px-4 border border-[rgb(var(--pricing-border)/0.5)] bg-[rgb(var(--pricing-card)/0.7)] rounded-full font-semibold flex items-center justify-center cursor-not-allowed"
            >
              Pro Plan Active
            </div>
          {:else}
            <label
              for={!data?.user ? "userLogin" : ""}
              on:click={() => purchasePlan("plus")}
              class="text-white cursor-pointer w-full py-3 px-4 rounded-full font-semibold transition bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 flex items-center justify-center"
              >{data?.user?.freeTrial
                ? "Unlock Plus Access"
                : "Start Free 7 Day Trial"}<svg
                class="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path></svg
              ></label
            >
          {/if}
        </div>
      </div>
      <div
        class="rounded-2xl flex flex-col relative border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.9)] p-6 text-gray-900 dark:text-white"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-semibold tracking-tight">Pro</h3>
        </div>
        <p class="text-sm mt-2 text-gray-600 dark:text-zinc-400">
          Professional tools at retail pricing.
        </p>
        <div class="mt-5 flex items-baseline justify-center gap-2">
          <span class="text-4xl font-semibold">{mode ? "$30" : "$45"}</span>
          <span class="text-sm text-gray-500 dark:text-zinc-400">/month</span>
        </div>
        <p
          class="text-xs mt-2 uppercase tracking-[0.2em] {!mode
            ? 'hidden'
            : ''}"
        >
          Billed annually ($360)
        </p>

        <ul class="mt-6 mb-6 space-y-2">
          <li class="flex flex-row items-center">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="mr-2">1,000 Credits/mo</span>
          </li>
          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Everything in Plus and ...</span>
          </li>

          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Watchlist with up to 300 stocks</span>
          </li>

          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            ><span class="">Portfolio with up to 300 stocks</span>
          </li>

          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Real-Time Options & Historical Data</span>
          </li>

          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Real-Time Options Flow Data</span>
          </li>
          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Real-Time Unusual Orders</span>
          </li>
          <li class="flex items-start text-gray-700 dark:text-zinc-200">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path></svg
            >

            <span class="">Premium Discord Channel Access</span>
          </li>
        </ul>
        <!--
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)  === true}
          <div class="mt-3 items-center text-[1rem] font-medium mb-5">
            Promo Code: <strong>EASTERSALE</strong>
            <br class="mb-2" />
            Get started with <strong></strong> on Pro Monthly to test our Service!
          </div>
        {/if}
        -->

        <div
          class="mt-auto pt-6 border-t border-gray-200 dark:border-zinc-800/80 mx-2"
        >
          {#if data?.user?.tier === "Pro"}
            <div
              class="w-full py-3 px-4 rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 font-semibold text-gray-500 dark:text-zinc-400 flex items-center justify-center cursor-not-allowed"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              Current Plan
            </div>
          {:else if data?.user?.tier === "Plus"}
            <a
              href="/profile"
              class="cursor-pointer w-full py-3 px-4 border border-gray-300 shadow dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/70 rounded-full font-semibold text-gray-900 dark:text-white transition hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center"
              >Upgrade in Account<svg
                class="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path></svg
              ></a
            >
          {:else}
            <label
              for={!data?.user ? "userLogin" : ""}
              on:click={() => purchasePlan("pro")}
              class="cursor-pointer w-full py-3 px-4 bg-white rounded-full font-semibold sm:hover:bg-slate-100 text-slate-900 transition duration-150 flex items-center justify-center"
              >{data?.user?.freeTrial
                ? "Upgrade Access"
                : "Start Free 7 Day Trial"}<svg
                class="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path></svg
              ></label
            >
          {/if}
        </div>
      </div>
    </div>

    {#if ["Plus", "Pro"].includes(data?.user?.tier)}
      <div
        class="mx-auto w-full mt-10 p-4 rounded-2xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40"
      >
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <p class="text-sm text-[rgb(var(--pricing-ink))]">
            You're currently subscribed to <span class="font-semibold"
              >{data?.user?.tier}</span
            >.
            <a
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-2 font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
              >Manage your subscription</a
            >
          </p>
        </div>
      </div>
    {/if}

    <!--Start FAQ-->

    <section class="mt-16">
      <div class="mx-auto">
        <div class="py-10">
          <!-- Section header -->
          <div class="max-w-3xl mx-auto text-center pb-8">
            <h2
              class="text-3xl sm:text-4xl font-semibold text-[rgb(var(--pricing-ink))]"
            >
              Frequently Asked Questions
            </h2>
            <p class="mt-3 text-sm sm:text-base">
              Clear answers to the most common questions about trials, billing,
              and upgrades.
            </p>
          </div>

          <!-- Faqs -->
          <ul class="mx-auto space-y-3">
            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                  >What are the advantages of Stocknear Service?</summary
                >
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    Stocknear Service provides simplified, actionable trading
                    data and an extensive tool suite for every investor,
                    featuring exclusive, high-quality Wall Street data at an
                    unmatched price. We also offer proprietary AI Agents and
                    models for accurate analyzes, all within a single unified
                    platform.
                  </p>
                </div>
              </details>
            </li>
            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  What are credits and how do they work?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    On Stocknear, certain premium features have monthly usage
                    limits. Credits represent your available usage for these
                    features. The more credits you have, the more you can access
                    advanced tools like chatting with our AI Agent and bulk
                    downloading data. Your credits reset monthly based on your
                    subscription plan, with higher-tier plans offering more
                    credits for increased usage.
                  </p>
                </div>
              </details>
            </li>
            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  What’s included with Premium Discord Channel Access?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    Gain access to real-time options flow from major
                    institutional players, live dark pool activity, instant
                    earnings updates, market-moving news, and much more — all
                    designed to keep you ahead of the market.
                  </p>
                </div>
              </details>
            </li>

            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  How does the 7 day trial work?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 transition-all duration-300 ease-in-out"
                  >
                    You are entitled to one FREE 7 day trial. You can cancel
                    anytime within your trial period with no obligations. If you
                    go past 7 days without cancelling, your account will be
                    automatically billed.
                  </p>
                </div>
              </details>
            </li>

            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  Can I change my plan at any time?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 transition-all duration-300 ease-in-out"
                  >
                    Yes, you can easily upgrade your plan on your Account Page.
                    Or simply reach out to us via email, and we’ll take care of
                    it for you.
                    <a
                      href={`mailto:${emailAddress}`}
                      class="text-gray-600 dark:text-zinc-400 underline hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      {emailAddress}
                    </a>
                  </p>
                </div>
              </details>
            </li>

            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  Are there any commissions in addition to the subscription
                  plans?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    No, we do not charge any additional commissions or hidden
                    fees beyond our subscription plans.
                  </p>
                </div>
              </details>
            </li>
            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  Can I request a refund?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    We offer a 30 day money back guarantee, no questions asked.
                    Just send an email to <a
                      href={`mailto:${emailAddress}`}
                      class="text-gray-600 dark:text-zinc-400 underline hover:text-violet-600 dark:hover:text-violet-400 transition"
                      >{emailAddress}</a
                    > and you will get a full refund.
                  </p>
                </div>
              </details>
            </li>

            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  What are my payment options?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    We support only Credit Card payments.
                  </p>
                </div>
              </details>
            </li>

            <li
              class="rounded-2xl border border-[rgb(var(--pricing-border)/0.45)] bg-[rgb(var(--pricing-card)/0.7)] px-4 sm:px-6"
            >
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-base sm:text-lg flex items-center justify-between w-full text-left py-4 text-[rgb(var(--pricing-ink))]"
                >
                  Can I cancel at any time?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-base pb-5 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    Of course. There is a "Cancel Subscription" button in your
                    account area that you get access to after signing up. You
                    can also send us a message and we will cancel for you.
                  </p>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!--End FAQ-->
  </div>
</section>

<!--Start Login Modal-->
{#if LoginPopup}
  <LoginPopup {form} />
{/if}

<!--End Login Modal-->

<style>
  .pricing-shell {
    --pricing-accent: 124 58 237;
    --pricing-accent-strong: 109 40 217;
    --pricing-ink: 15 23 42;
    --pricing-muted: 71 85 105;
    --pricing-card: 255 255 255;
    --pricing-surface: 248 250 252;
    --pricing-border: 148 163 184;
    background: rgb(var(--pricing-surface));
    border: 1px solid rgb(var(--pricing-border) / 0.25);
    border-radius: 32px;
  }

  :global(.dark) .pricing-shell {
    --pricing-ink: 244 244 245;
    --pricing-muted: 161 161 170;
    --pricing-card: 24 24 27;
    --pricing-surface: 9 9 11;
    --pricing-border: 82 82 91;
    background: rgb(var(--pricing-surface));
  }

  .pricing-shell :global([class*="shadow"]) {
    box-shadow: none !important;
  }

  .pricing-shell :global(.backdrop-blur-xl) {
    backdrop-filter: none;
  }
</style>
