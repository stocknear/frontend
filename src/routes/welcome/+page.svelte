<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import confetti from "canvas-confetti";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { GTM_EVENT_PURCHASE } from "$lib/constants/tracking";
  import {
  welcome_access_info,
  welcome_cta_button,
  welcome_greeting,
  welcome_plus_feature_1,
  welcome_plus_feature_2,
  welcome_plus_feature_3,
  welcome_plus_feature_4,
  welcome_plus_feature_5,
  welcome_plus_feature_6,
  welcome_plus_unlocks_title,
  welcome_pro_feature_1,
  welcome_pro_feature_2,
  welcome_pro_feature_3,
  welcome_pro_feature_4,
  welcome_pro_feature_5,
  welcome_pro_unlocks_title,
  welcome_seo_title,
  welcome_subtitle,
  welcome_thanks,
  welcome_title,
} from "$lib/paraglide/messages";

  export let data;

  let tier = $page.url.searchParams.get("tier") ?? "";
  const emailAddress = "support@stocknear.com";

  var duration = 5 * 500;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  onMount(async () => {
    // Purchase conversion (server-validated in +page.server.ts)
    if (data.purchaseConversion) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: GTM_EVENT_PURCHASE,
        conversionValue: data.purchaseConversion.value,
        conversionCurrency: "USD",
        transactionId: data.purchaseConversion.transactionId,
        ecommerce: {
          value: data.purchaseConversion.value,
          currency: "USD",
          transaction_id: data.purchaseConversion.transactionId,
          items: [{
            item_id: data.purchaseConversion.tier,
            item_name: data.purchaseConversion.tier + " Subscription",
            item_category: "Subscription",
            price: data.purchaseConversion.value,
            quantity: 1,
          }],
        },
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

<SEO title={welcome_seo_title()} description="" />

<main class="text-gray-700 dark:text-zinc-200 w-full min-h-screen pb-20">
  <section
    class="border-b border-gray-300 dark:border-zinc-700 sm:rounded-2xl w-full bg-white/70 dark:bg-zinc-950/40"
  >
    <div class="mx-auto max-w-7xl px-6 py-16 sm:py-12 md:px-8">
      <div class="text-center">
        <img
          class="m-auto w-20 sm:w-24 rounded-full mb-5 mt-3 border border-gray-300 dark:border-zinc-700"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
          loading="lazy"
        />
        <h1
          class="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          {welcome_title({ tier })}
        </h1>
        <p
          class="mx-auto mt-5 max-w-3xl text-base sm:text-lg leading-relaxed md:mt-7 mb-10 text-gray-800 dark:text-zinc-300"
        >
          {welcome_subtitle()}
        </p>
      </div>
    </div>
  </section>

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
    <h2
      class="text-xl font-semibold mb-5 tracking-tight text-gray-900 dark:text-white"
    >
      {welcome_greeting()}
    </h2>

    <p
      class="mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300"
    >
      {@html welcome_thanks()}
    </p>

    <p
      class="mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300"
    >
      {welcome_access_info()}
      <a
        href="mailto:{emailAddress}"
        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
      >
        {emailAddress}
      </a>.
    </p>

    {#if ["Pro", "Lifetime"]?.includes(tier)}
      <p
        class="mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300"
      >
        {welcome_pro_unlocks_title()}
      </p>
      <ul
        class="list-disc list-inside mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300 marker:text-gray-400 dark:marker:text-zinc-600"
      >
        <li>{welcome_pro_feature_1()}</li>
        <li>{welcome_pro_feature_2()}</li>
        <li>{welcome_pro_feature_3()}</li>
        <li>{welcome_pro_feature_4()}</li>
        <li>{welcome_pro_feature_5()}</li>
      </ul>
    {:else if tier === "Plus"}
      <p
        class="mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300"
      >
        {welcome_plus_unlocks_title()}
      </p>
      <ul
        class="list-disc list-inside mb-5 text-sm sm:text-base leading-relaxed text-gray-800 dark:text-zinc-300 marker:text-gray-400 dark:marker:text-zinc-600"
      >
        <li>{welcome_plus_feature_1()}</li>
        <li>{welcome_plus_feature_2()}</li>
        <li>{welcome_plus_feature_3()}</li>
        <li>{welcome_plus_feature_4()}</li>
        <li>{welcome_plus_feature_5()}</li>
        <li>{welcome_plus_feature_6()}</li>
      </ul>
    {/if}

    <a
      href="/"
      class="flex justify-center items-center w-fit px-10 m-auto py-2.5 mt-10 rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200"
    >
      {welcome_cta_button()}
    </a>
  </div>
</main>
