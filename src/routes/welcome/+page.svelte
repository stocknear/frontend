<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import confetti from "canvas-confetti";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  let tier = $page.url.searchParams.get("tier") ?? "";
  let urlValue = $page.url.searchParams.get("value");
  const emailAddress = "support@stocknear.com";

  var duration = 5 * 500;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  onMount(async () => {
    // Extract value from URL or use default based on tier
    const value = urlValue
      ? parseFloat(urlValue)
      : tier === "Plus"
        ? 10
        : tier === "Pro"
          ? 20
          : null;

    // Meta Pixel conversion tracking
    if (typeof window !== "undefined" && window.fbq && value) {
      window?.fbq("track", "Purchase", {
        value: value,
        currency: "USD",
        content_ids: [data?.user?.id || "unknown"],
        content_type: "product",
        content_name: tier + " Subscription",
      });
    }

    // Google Ads conversion tracking

    if (typeof window !== "undefined" && window.gtag && value) {
      window?.gtag("event", "conversion", {
        send_to: "AW-11328922950/FfVkCPuTupcbEMbKhpoq",
        value: value || 1.0,
        currency: "USD",
        transaction_id: data?.user?.id || "",
      });
    }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function () {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  });
</script>

<SEO title="Welcome to Stocknear" description="" />

<main class="text-muted dark:text-white w-full min-h-screen pb-20">
  <section
    class="border-b border-gray-200 dark:border-none shadow dark:border-gray-800 sm:rounded w-full bg-gray-100 dark:bg-gray-500/20"
  >
    <div class="mx-auto max-w-7xl px-6 py-16 sm:py-2 md:px-8">
      <div class="text-center">
        <img
          class="m-auto w-20 sm:w-24 rounded-full mb-5 mt-3"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
          loading="lazy"
        />
        <h1 class="mt-1 text-4xl font-bold sm:text-5xl">
          You have now {tier} Access!
        </h1>
        <p
          class="mx-auto mt-5 max-w-3xl text-xl leading-relaxed md:mt-7 md:text-2xl mb-10"
        >
          Your subscription pays for itself with just one better trade decision.
          Join thousands of investors making smarter, data-driven choices.
        </p>
      </div>
    </div>
  </section>

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
    <h2 class="text-xl font-semibold mb-5">Welcome aboard! 👋</h2>

    <p class="mb-5 text-base md:text-lg leading-relaxed">
      Thank you for subscribing to <strong>Stocknear</strong>! You've made a
      smart investment that typically pays for itself with just one prevented
      loss or better-timed trade.
    </p>

    <p class="mb-5 text-base md:text-lg leading-relaxed">
      You now have access to the same institutional-grade tools and real-time
      data that hedge funds pay thousands for monthly. Need assistance with any
      feature? Our support team is here to help at
      <a
        href="mailto:{emailAddress}"
        class="text-blue-800 dark:text-blue-400 hover:underline"
      >
        {emailAddress}
      </a>.
    </p>

    {#if ["Pro", "Lifetime"]?.includes(tier)}
      <p class="mb-5 text-base md:text-lg leading-relaxed">
        Your Pro subscription unlocks:
      </p>
      <ul
        class="list-disc list-inside mb-5 text-base md:text-lg leading-relaxed"
      >
        <li>Real-time options flow and dark pool activity tracking</li>
        <li>AI-powered forecasts and market analysis</li>
        <li>Congressional and hedge fund portfolio insights</li>
        <li>Advanced screeners and unlimited alerts</li>
        <li>Priority access to new features and updates</li>
      </ul>
    {:else if tier === "Plus"}
      <p class="mb-5 text-base md:text-lg leading-relaxed">
        Your Plus subscription unlocks:
      </p>
      <ul
        class="list-disc list-inside mb-5 text-base md:text-lg leading-relaxed"
      >
        <li>Unlimited watchlists and price alerts</li>
        <li>AI-powered forecasts and market analysis</li>
        <li>Congressional and hedge fund portfolio insights</li>
        <li>Advanced stock screeners with custom filters</li>
        <li>Complete financial history and analysis tools</li>
        <li>Ad-free experience across the platform</li>
      </ul>
    {/if}

    <a
      href="/"
      class="flex justify-center items-center w-fit px-10 m-auto py-2.5 mt-10 rounded duration-100 bg-black text-white sm:hover:bg-default dark:bg-[#fff] dark:sm:hover:hover:bg-gray-300 dark:text-black font-semibold"
    >
      Start Researching Now!
    </a>
  </div>
</main>
