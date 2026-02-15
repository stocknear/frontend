<script lang="ts">
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    landing_seo_title,
    landing_seo_description,
    landing_hero_title,
    landing_hero_subtitle,
    landing_hero_cta_primary,
    landing_hero_cta_secondary,
    landing_hero_badge_investors,
    landing_hero_badge_trustpilot,
    landing_hero_badge_reviews,
    landing_stats_investors,
    landing_stats_investors_label,
    landing_stats_stocks,
    landing_stats_stocks_label,
    landing_stats_tools,
    landing_stats_tools_label,
    landing_stats_articles,
    landing_stats_articles_label,
    landing_features_label,
    landing_features_title,
    landing_features_subtitle,
    landing_feature_ai_title,
    landing_feature_ai_description,
    landing_feature_ai_bullet_1,
    landing_feature_ai_bullet_2,
    landing_feature_ai_bullet_3,
    landing_feature_ai_bullet_4,
    landing_feature_ai_link,
    landing_feature_ai_placeholder,
    landing_feature_flow_title,
    landing_feature_flow_description,
    landing_feature_flow_bullet_1,
    landing_feature_flow_bullet_2,
    landing_feature_flow_bullet_3,
    landing_feature_flow_bullet_4,
    landing_feature_flow_link,
    landing_feature_screener_title,
    landing_feature_screener_description,
    landing_feature_screener_bullet_1,
    landing_feature_screener_bullet_2,
    landing_feature_screener_bullet_3,
    landing_feature_screener_bullet_4,
    landing_feature_screener_link,
    landing_feature_screener_placeholder,
    landing_feature_smart_title,
    landing_feature_smart_description,
    landing_feature_smart_bullet_1,
    landing_feature_smart_bullet_2,
    landing_feature_smart_bullet_3,
    landing_feature_smart_bullet_4,
    landing_feature_smart_link,
    landing_feature_smart_placeholder,
    landing_feature_wiim_title,
    landing_feature_wiim_description,
    landing_feature_wiim_bullet_1,
    landing_feature_wiim_bullet_2,
    landing_feature_wiim_bullet_3,
    landing_feature_wiim_link,
    landing_feature_analyst_title,
    landing_feature_analyst_description,
    landing_feature_analyst_bullet_1,
    landing_feature_analyst_bullet_2,
    landing_feature_analyst_bullet_3,
    landing_feature_analyst_link,
    landing_how_label,
    landing_how_title,
    landing_how_step1_title,
    landing_how_step1_description,
    landing_how_step2_title,
    landing_how_step2_description,
    landing_how_step3_title,
    landing_how_step3_description,
    landing_pricing_label,
    landing_pricing_title,
    landing_pricing_free_title,
    landing_pricing_free_price,
    landing_pricing_free_feature_1,
    landing_pricing_free_feature_2,
    landing_pricing_free_feature_3,
    landing_pricing_free_feature_4,
    landing_pricing_plus_title,
    landing_pricing_plus_price,
    landing_pricing_plus_feature_1,
    landing_pricing_plus_feature_2,
    landing_pricing_plus_feature_3,
    landing_pricing_plus_feature_4,
    landing_pricing_pro_title,
    landing_pricing_pro_price,
    landing_pricing_pro_feature_1,
    landing_pricing_pro_feature_2,
    landing_pricing_pro_feature_3,
    landing_pricing_pro_feature_4,
    landing_pricing_per_month,
    landing_pricing_cta,
    landing_trust_title,
    landing_trust_trustpilot,
    landing_trust_rating,
    landing_trust_reviews,
    landing_faq_title,
    landing_faq_subtitle,
    landing_faq_q1_title,
    landing_faq_q1_answer,
    landing_faq_q2_title,
    landing_faq_q2_answer,
    landing_faq_q3_title,
    landing_faq_q3_answer,
    landing_faq_q4_title,
    landing_faq_q4_answer,
    landing_faq_q5_title,
    landing_faq_q5_answer,
    landing_cta_title,
    landing_cta_description,
    landing_cta_primary,
    landing_cta_secondary,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;

  let LoginPopup: any;

  onMount(async () => {
    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }
  });
</script>

<SEO
  title={landing_seo_title()}
  description={landing_seo_description()}
  keywords="stock analysis, options flow, AI stock research, smart money tracking, stock screener, congress trading, hedge fund tracking, institutional data, free stock tools"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: landing_seo_title(),
    description: landing_seo_description(),
    url: "https://stocknear.com/landing-page",
  }}
/>

<div class="text-gray-700 dark:text-zinc-200 w-full">

  <!-- Section 1: Hero -->
  <section class="w-full bg-white dark:bg-zinc-950/60">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="flex flex-wrap items-center justify-center gap-3 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.3em]">
        <div class="flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-4 py-2">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"></path>
          </svg>
          <span>{landing_hero_badge_investors()}</span>
        </div>
        <div class="flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-4 py-2">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>4.6/5</span>
          <span class="font-medium">{landing_hero_badge_trustpilot()}</span>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://www.trustpilot.com/review/stocknear.com"
            class="underline underline-offset-4 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            {landing_hero_badge_reviews()}
          </a>
        </div>
      </div>

      <div class="mx-auto mt-10 text-center max-w-3xl">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
          {landing_hero_title()}
        </h1>
        <p class="mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-gray-800 dark:text-zinc-300 max-w-2xl mx-auto">
          {landing_hero_subtitle()}
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {#if !data?.user}
            <label
              for="userLogin"
              class="cursor-pointer inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
            >
              {landing_hero_cta_primary()}
            </label>
          {:else}
            <a
              href="/pricing"
              class="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
            >
              {landing_hero_cta_secondary()}
            </a>
          {/if}
          <a
            href="/pricing"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            {landing_hero_cta_secondary()}
          </a>
        </div>
      </div>

      <div class="mt-12 mx-auto max-w-5xl">
        <img
          class="rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-lg w-full"
          src="/img/landing-page/overview.png"
          alt="Stocknear Dashboard"
          loading="eager"
        />
      </div>
    </div>
  </section>

  <!-- Section 2: Stats Bar -->
  <section class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div class="text-center">
          <div class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{landing_stats_investors()}</div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{landing_stats_investors_label()}</div>
        </div>
        <div class="text-center">
          <div class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{landing_stats_stocks()}</div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{landing_stats_stocks_label()}</div>
        </div>
        <div class="text-center">
          <div class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{landing_stats_tools()}</div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{landing_stats_tools_label()}</div>
        </div>
        <div class="text-center">
          <div class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{landing_stats_articles()}</div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{landing_stats_articles_label()}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Feature Showcases -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-16">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4">
          {landing_features_label()}
        </p>
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {landing_features_title()}
        </h2>
        <p class="mt-4 max-w-2xl text-lg text-gray-800 dark:text-zinc-300 mx-auto">
          {landing_features_subtitle()}
        </p>
      </div>

      <div class="space-y-20 sm:space-y-28">

        <!-- Feature 1: AI Agent (image right) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 order-2 lg:order-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_ai_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_ai_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_ai_bullet_1(), landing_feature_ai_bullet_2(), landing_feature_ai_bullet_3(), landing_feature_ai_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/chat" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_ai_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div class="flex-1 order-1 lg:order-2 w-full">
            <!-- PLACEHOLDER: AI Agent screenshot -->
            <div class="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-900/60 flex items-center justify-center p-6">
              <p class="text-center text-sm text-gray-500 dark:text-zinc-400">{landing_feature_ai_placeholder()}</p>
            </div>
          </div>
        </div>

        <!-- Feature 2: Options Flow (image left) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/options-flow.png"
              alt="Options Flow"
              loading="lazy"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_flow_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_flow_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_flow_bullet_1(), landing_feature_flow_bullet_2(), landing_feature_flow_bullet_3(), landing_feature_flow_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/options-flow" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_flow_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

        <!-- Feature 3: Stock Screener (image right) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 order-2 lg:order-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_screener_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_screener_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_screener_bullet_1(), landing_feature_screener_bullet_2(), landing_feature_screener_bullet_3(), landing_feature_screener_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/stock-screener" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_screener_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div class="flex-1 order-1 lg:order-2 w-full">
            <!-- PLACEHOLDER: Stock Screener screenshot -->
            <div class="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-900/60 flex items-center justify-center p-6">
              <p class="text-center text-sm text-gray-500 dark:text-zinc-400">{landing_feature_screener_placeholder()}</p>
            </div>
          </div>
        </div>

        <!-- Feature 4: Smart Money (image left) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 w-full">
            <!-- PLACEHOLDER: Smart Money screenshot -->
            <div class="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-900/60 flex items-center justify-center p-6">
              <p class="text-center text-sm text-gray-500 dark:text-zinc-400">{landing_feature_smart_placeholder()}</p>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_smart_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_smart_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_smart_bullet_1(), landing_feature_smart_bullet_2(), landing_feature_smart_bullet_3(), landing_feature_smart_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/politicians" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_smart_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

        <!-- Feature 5: Why It Moved (image right) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 order-2 lg:order-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_wiim_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_wiim_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_wiim_bullet_1(), landing_feature_wiim_bullet_2(), landing_feature_wiim_bullet_3()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/market-news" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_wiim_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div class="flex-1 order-1 lg:order-2 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/wiim-chart.png"
              alt="Why It Moved"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Feature 6: Analyst Intelligence (image left) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/analyst-chart.png"
              alt="Analyst Intelligence"
              loading="lazy"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {landing_feature_analyst_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_analyst_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_analyst_bullet_1(), landing_feature_analyst_bullet_2(), landing_feature_analyst_bullet_3()] as bullet}
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a href="/analysts" class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {landing_feature_analyst_link()}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Section 4: How It Works -->
  <section class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4">
          {landing_how_label()}
        </p>
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {landing_how_title()}
        </h2>
      </div>
      <div class="grid gap-10 sm:grid-cols-3">
        <!-- Step 1 -->
        <div class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5">
            <svg class="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">1</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{landing_how_step1_title()}</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">{landing_how_step1_description()}</p>
        </div>
        <!-- Step 2 -->
        <div class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5">
            <svg class="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">2</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{landing_how_step2_title()}</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">{landing_how_step2_description()}</p>
        </div>
        <!-- Step 3 -->
        <div class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5">
            <svg class="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">3</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{landing_how_step3_title()}</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">{landing_how_step3_description()}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 5: Pricing Preview -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4">
          {landing_pricing_label()}
        </p>
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {landing_pricing_title()}
        </h2>
      </div>
      <div class="grid gap-6 sm:grid-cols-3">
        <!-- Free -->
        <div class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{landing_pricing_free_title()}</h3>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-3xl font-bold text-gray-900 dark:text-white">{landing_pricing_free_price()}</span>
            <span class="text-sm text-gray-500 dark:text-zinc-400">{landing_pricing_per_month()}</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm">
            {#each [landing_pricing_free_feature_1(), landing_pricing_free_feature_2(), landing_pricing_free_feature_3(), landing_pricing_free_feature_4()] as feature}
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
        </div>
        <!-- Plus -->
        <div class="rounded-2xl border-2 border-violet-500 dark:border-violet-400 bg-white dark:bg-zinc-900/60 p-6 relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 dark:bg-violet-500 px-3 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">Popular</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{landing_pricing_plus_title()}</h3>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-3xl font-bold text-gray-900 dark:text-white">{landing_pricing_plus_price()}</span>
            <span class="text-sm text-gray-500 dark:text-zinc-400">{landing_pricing_per_month()}</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm">
            {#each [landing_pricing_plus_feature_1(), landing_pricing_plus_feature_2(), landing_pricing_plus_feature_3(), landing_pricing_plus_feature_4()] as feature}
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
        </div>
        <!-- Pro -->
        <div class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{landing_pricing_pro_title()}</h3>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-3xl font-bold text-gray-900 dark:text-white">{landing_pricing_pro_price()}</span>
            <span class="text-sm text-gray-500 dark:text-zinc-400">{landing_pricing_per_month()}</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm">
            {#each [landing_pricing_pro_feature_1(), landing_pricing_pro_feature_2(), landing_pricing_pro_feature_3(), landing_pricing_pro_feature_4()] as feature}
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <div class="mt-10 text-center">
        <a
          href="/pricing"
          class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {landing_pricing_cta()}
          <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </a>
      </div>
    </div>
  </section>

  <!-- Section 6: Trust / Social Proof -->
  <section class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
      <div class="flex items-center justify-center gap-1 mb-4">
        {#each Array(5) as _}
          <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        {/each}
      </div>
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        {landing_trust_rating()}
        <span class="font-medium text-lg text-gray-600 dark:text-zinc-300 ml-2">{landing_trust_trustpilot()}</span>
      </div>
      <p class="mt-4 text-lg text-gray-800 dark:text-zinc-300">
        {landing_trust_title()}
      </p>
      <a
        href="https://www.trustpilot.com/review/stocknear.com"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
      >
        {landing_trust_reviews()}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </div>
  </section>

  <!-- Section 7: FAQ -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {landing_faq_title()}
        </h2>
        <p class="mt-4 text-lg text-gray-800 dark:text-zinc-300">
          {landing_faq_subtitle()}
        </p>
      </div>
      <ul class="space-y-4">
        {#each [
          { q: landing_faq_q1_title(), a: landing_faq_q1_answer() },
          { q: landing_faq_q2_title(), a: landing_faq_q2_answer() },
          { q: landing_faq_q3_title(), a: landing_faq_q3_answer() },
          { q: landing_faq_q4_title(), a: landing_faq_q4_answer() },
          { q: landing_faq_q5_title(), a: landing_faq_q5_answer() },
        ] as faq}
          <li class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 px-4 sm:px-6">
            <details class="collapse collapse-arrow">
              <summary class="font-semibold collapse-title text-base sm:text-lg text-gray-900 dark:text-white cursor-pointer">
                {faq.q}
              </summary>
              <div class="collapse-content">
                <p class="text-gray-700 dark:text-zinc-300 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <!-- Section 8: Final CTA -->
  <section class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50">
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-24 text-center">
      <h2 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        {landing_cta_title()}
      </h2>
      <p class="mt-4 text-lg text-gray-800 dark:text-zinc-300 max-w-2xl mx-auto">
        {landing_cta_description()}
      </p>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        {#if !data?.user}
          <label
            for="userLogin"
            class="cursor-pointer inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
          >
            {landing_cta_primary()}
          </label>
        {:else}
          <a
            href="/pricing"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
          >
            {landing_cta_secondary()}
          </a>
        {/if}
        <a
          href="/pricing"
          class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {landing_cta_secondary()}
        </a>
      </div>
    </div>
  </section>

</div>

{#if LoginPopup}
  <svelte:component this={LoginPopup} {form} />
{/if}
