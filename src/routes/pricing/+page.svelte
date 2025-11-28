<script lang="ts">
  import { openLemonSqueezyUrl } from "$lib/lemonsqueezy";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  import SEO from "$lib/components/SEO.svelte";
  import Discount from "$lib/components/Discount.svelte";
  export let data;
  export let form;

  let mode = false;

  let showLifetime = $page.url.searchParams.get("aff") ?? false;

  const emailAddress = "support@stocknear.com";

  function toggleMode() {
    mode = !mode;
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

<svelte:head>
  <script>
    window.lemonSqueezyAffiliateConfig = { store: "Stocknear" };
  </script>
  <script src="https://lmsqueezy.com/affiliate.js" defer></script>
</svelte:head>

<section
  class=" min-h-screen mb-40 w-full max-w-3xl sm:max-w-6xl m-auto text-muted dark:text-white"
>
  <div
    class="flex flex-col sm:flex-row w-full mx-auto justify-center items-center sm:space-x-8 text-sm relative pt-5 pb-10"
  >
    <div class="flex items-center" style="opacity: 1; transform: none;">
      <svg
        stroke="currentColor"
        fill="currentColor"
        stroke-width="0"
        viewBox="0 0 640 512"
        class="mr-2 w-4 h-4 sm:w-5 sm:h-5"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"
        ></path></svg
      ><span class="font-medium text-sm sm:text-lg"
        >Trusted by <span class="font-semibold">7,000</span>+ Investors</span
      >
    </div>
    <span
      class="hidden sm:inline-block text-zinc-600"
      style="opacity: 1; transform: none;">|</span
    >
    <div class="mt-2 sm:mt-0 flex items-center text-sm sm:text-lg">
      <svg
        stroke="currentColor"
        fill="currentColor"
        stroke-width="0"
        viewBox="0 0 576 512"
        class="text-muted dark:text-indigo-400 mr-2"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"
        ></path></svg
      ><span class="ml-1 mr-2 font-bold"><span>4.5</span>/5</span><span
        class="font-medium"
        >Rated "Excellent" on <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://www.trustpilot.com/review/stocknear.com"
          class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
        >
          Trustpilot</a
        ></span
      >
    </div>
  </div>

  <div class="px-3">
    <div class="mx-auto text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-5">
        <span class="relative flex h-1.5 w-1.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
        </span>
        <span class="text-violet-400 font-medium text-xs tracking-widest uppercase">Live Now</span>
      </div>
      <h1 class="text-5xl sm:text-7xl font-bold tracking-tight">
        <span class="text-muted dark:text-white">Black</span>
        <span class="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">Friday</span>
      </h1>
      <p class="text-lg text-muted/70 dark:text-zinc-400 mt-4 font-normal tracking-wide">
        Premium access. Half the price.
      </p>
    </div>

    <Discount />

    <div class="flex flex-row items-center justify-center">
      <div class="flex flex-row items-center ml-auto">
        <span class="text-[1rem] font-semibold mr-3"> Monthly </span>

        <label class="inline-flex cursor-pointer relative">
          <input
            on:click={toggleMode}
            type="checkbox"
            checked={mode}
            value={mode}
            class="sr-only peer"
          />
          <div
            class="w-14 h-7 bg-[#09090B] border border-gray-600 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[0.40rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black dark:bg-default {mode ===
            false
              ? 'after:translate-x-[-0.2rem]'
              : ''} "
          ></div>
        </label>

        <div class="ml-3 flex flex-col text-[1rem] items-start">Annually</div>
      </div>
    </div>

    <div
      class="grid max-w-md grid-cols-1 gap-6 mx-auto text-center lg:max-w-full lg:grid-cols-3"
    >
      <div
        style="opacity: 1; transform: translateY(20px);"
        class="hidden sm:block rounded lg:flex flex-col relative bg-white dark:bg-zinc-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-[3px] overflow-visible border border-gray-400 dark:border-zinc-600 p-6 isolate"
      >
        <h3 class="text-3xl font-bold">Basic</h3>
        <p class="text-muted dark:text-zinc-300 text-sm mt-1">Get Started</p>
        <div class="mt-4">
          <span class="text-4xl font-bold">$0</span><span class=" text-xl ml-1"
            >/mo</span
          >
        </div>

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
            ><span class="">Realtime Notification</span>
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

            <span class="text-muted dark:text-gray-400"
              >Hedge Fund Portfolio Access</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >US Congress Portfolio Access</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >Financial History Access</span
            >
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

            <span class="text-muted dark:text-gray-400">Stock Screener</span>
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

            <span class="text-muted dark:text-gray-400"
              >Financial Data Download</span
            >
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

            <span class="text-muted dark:text-gray-400">No Ads</span>
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

            <span class="text-muted dark:text-gray-400"
              >Realtime Options Activity</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >Realtime Unusual Orders</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >Premium Discord Channel Access</span
            >
          </li>
        </ul>
        <div class="mt-auto pt-6 border-t border-zinc-700 mx-4">
          {#if !data?.user}
            <label
              for="userLogin"
              class="text-white cursor-pointer w-full py-3 px-4 bg-black dark:bg-white rounded-[3px] font-semibold sm:hover:bg-default dark:sm:hover:bg-gray-100 text-white dark:text-black transition duration-100 flex items-center justify-center"
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
        style="opacity: 1; transform: translateY(20px);"
        class="rounded relative flex flex-col relative bg-white dark:bg-zinc-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-[3px] overflow-visible border border-gray-400 dark:border-zinc-600 p-6 isolate"
      >
        <h3 class="text-3xl font-bold">Plus</h3>
        <p class="text-muted dark:text-zinc-300 text-sm mt-1">Most Popular</p>
        <div class="mt-4">
          <span class="text-gray-500 text-4xl font-bold line-through"
            >{mode ? "$7.50" : "$10"}</span
          >

          <span class=" text-4xl font-bold ml-1">{mode ? "$3.75" : "$5"}</span
          ><span class=" text-xl">/mo</span>
        </div>
        <p
          class="text-muted dark:text-gray-400 text-sm mt-1 mx-4 {!mode
            ? 'hidden'
            : ''}"
        >
          (Billed Annually)
        </p>

        <ul class="mt-6 mb-6 space-y-2">
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
            ><span class="">Realtime Notification</span>
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

            <span class="text-muted dark:text-gray-400"
              >Realtime Options Activity</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >Realtime Unusual Orders</span
            >
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

            <span class="text-muted dark:text-gray-400"
              >Premium Discord Channel Access</span
            >
          </li>
        </ul>
        <div class="mt-auto pt-6 border-t border-zinc-700 mx-4">
          <label
            for={!data?.user ? "userLogin" : ""}
            on:click={() => purchasePlan("plus")}
            class="text-white cursor-pointer w-full py-3 px-4 bg-black dark:bg-white rounded-[3px] font-semibold sm:hover:bg-default dark:sm:hover:bg-gray-100 text-white dark:text-black transition duration-100 flex items-center justify-center"
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
        </div>
      </div>
      <div
        style="opacity: 1; transform: translateY(20px);"
        class=" rounded text-white flex flex-col relative bg-[#18181B] dark:bg-zinc-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-[3px] overflow-visible border border-violet-500/50 dark:border-violet-500/50 p-6 isolate"
      >
        <!-- Subtle top glow -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
        <!-- Best Value Badge -->
        <div
          class="w-fit absolute -top-[12px] left-1/2 transform -translate-x-1/2 whitespace-nowrap m-auto px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase
              bg-violet-500 text-white"
        >
          Best Value
        </div>
        <h3 class="text-3xl font-bold mt-2">Pro</h3>
        <p class="text-white dark:text-zinc-300 text-sm mt-1">
          Unlimited usage for Power Users.
        </p>
        <div class="mt-4">
          <span
            class="text-gray-500 text-4xl font-bold line-through {!mode
              ? ''
              : ''}">{mode ? "$15" : "$20"}</span
          >
          <span class="text-white text-4xl font-bold ml-1"
            >{mode ? "$7.5" : "$10"}</span
          >
          <span class=" text-xl ml-1">/mo</span>
        </div>
        <p
          class="text-white dark:text-gray-400 text-sm mt-1 mx-4 {!mode
            ? 'hidden'
            : ''}"
        >
          (Billed Annually)
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
          <li class="flex items-start text-white">
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

          <li class="flex items-start text-white">
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

          <li class="flex items-start text-white">
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

          <li class="flex items-start text-white">
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

            <span class="">Realtime Options Activity</span>
          </li>
          <li class="flex items-start text-white">
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

            <span class="">Realtime Unusual Orders</span>
          </li>
          <li class="flex items-start text-white">
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

        <div class="mt-auto pt-6 border-t border-zinc-700 mx-4">
          <label
            for={!data?.user ? "userLogin" : ""}
            on:click={() => purchasePlan("pro")}
            class="cursor-pointer w-full py-3 px-4 bg-white rounded-[3px] font-semibold sm:hover:bg-gray-100 dark:sm:hover:bg-gray-100 text-black transition duration-100 flex items-center justify-center"
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
        </div>
      </div>

      {#if showLifetime}
        <div
          class="relative text-left w-full col-span-1 lg:col-span-3 text-white bg-[#18181B] dark:bg-zinc-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-[3px] overflow-visible border border-zinc-200 dark:border-zinc-600 p-6 isolate translate-y-5 opacity-100"
        >
          <div class="flex flex-row items-center justify-between">
            <h3 class="text-2xl md:text-3xl font-bold">
              Lifetime (Super Limited)
            </h3>
            <div>
              <span class="text-3xl md:text-4xl font-bold">$449</span>
            </div>
          </div>

          <p class=" md:text-lg mt-4 lg:mt-2">
            Everything in Pro, pay once, never again.
          </p>

          <div class="mt-10 flex justify-center lg:justify-end mx-4 lg:mx-0">
            <label
              for={data?.user ? "" : "userLogin"}
              on:click={() => purchasePlan("lifetime")}
              class="cursor-pointer w-full lg:w-auto py-3 lg:mt-2 px-4 bg-white rounded-[3px] font-semibold sm:hover:bg-gray-100 dark:sm:hover:bg-gray-100 text-black transition duration-100 flex items-center justify-center lg:justify-end"
            >
              Get Lifetime Now
              <svg
                class="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </label>
          </div>
        </div>
      {/if}
    </div>

    <!--Start FAQ-->

    <section class="mt-10">
      <div class="mx-auto">
        <div class="py-12 md:py-10">
          <!-- Section header -->
          <div class="max-w-3xl mx-auto text-center pb-12 md:pb-14">
            <h2 class="text-4xl font-bold">Frequently Asked Questions</h2>
          </div>

          <!-- Faqs -->
          <ul class="mx-auto divide-y divide-gray-800">
            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                  >What are the advantages of Stocknear Service?</summary
                >
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
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
            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  What are credits and how do they work?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
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
            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  What’s included with Premium Discord Channel Access?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    Gain access to real-time options flow from major
                    institutional players, live dark pool activity, instant
                    earnings updates, market-moving news, and much more — all
                    designed to keep you ahead of the market.
                  </p>
                </div>
              </details>
            </li>

            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  How does the 7 day trial work?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 transition-all duration-300 ease-in-out"
                  >
                    You are entitled to one FREE 7 day trial. You can cancel
                    anytime within your trial period with no obligations. If you
                    go past 7 days without cancelling, your account will be
                    automatically billed.
                  </p>
                </div>
              </details>
            </li>

            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  Can I change my plan at any time?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 transition-all duration-300 ease-in-out"
                  >
                    Yes, you can easily upgrade your plan on your Account Page.
                    Or simply reach out to us via email, and we’ll take care of
                    it for you.
                    <a
                      href={`mailto:${emailAddress}`}
                      class="text-blue-800 dark:text-blue-400 underline"
                    >
                      {emailAddress}
                    </a>
                  </p>
                </div>
              </details>
            </li>

            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  Are there any commissions in addition to the subscription
                  plans?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    No, we do not charge any additional commissions or hidden
                    fees beyond our subscription plans.
                  </p>
                </div>
              </details>
            </li>
            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  Can I request a refund?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    We offer a 30 day money back guarantee, no questions asked.
                    Just send an email to <a
                      href={`mailto:${emailAddress}`}
                      class="text-blue-800 dark:text-blue-400 underline"
                      >{emailAddress}</a
                    > and you will get a full refund.
                  </p>
                </div>
              </details>
            </li>

            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  What are my payment options?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    We support only Credit Card payments.
                  </p>
                </div>
              </details>
            </li>

            <li class="border-b border-gray-300 dark:border-gray-800">
              <details class="collapse collapse-arrow">
                <summary
                  class="font-semibold collapse-title text-[1rem] sm:text-xl flex items-center justify-between w-full text-left py-5"
                >
                  Can I cancel at any time?
                </summary>
                <div class="collapse-content">
                  <p
                    class="text-sm sm:text-[1rem] pb-5 dark:text-gray-200 overflow-hidden transition-all duration-300 ease-in-out"
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
