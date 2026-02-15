<script lang="ts">
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Discount from "$lib/components/Discount.svelte";
  import AnimatedList from "$lib/components/magic/AnimatedList.svelte";

  import {
    landing_seo_title,
    landing_seo_description,
    landing_hero_title,
    landing_hero_subtitle,
    landing_hero_cta_primary,
    landing_hero_cta_secondary,
    landing_reviews_label,
    landing_reviews_title,
    landing_review_1_name,
    landing_review_1_role,
    landing_review_1_text,
    landing_review_2_name,
    landing_review_2_role,
    landing_review_2_text,
    landing_review_3_name,
    landing_review_3_role,
    landing_review_3_text,
    landing_review_4_name,
    landing_review_4_role,
    landing_review_4_text,
    landing_review_5_name,
    landing_review_5_role,
    landing_review_5_text,
    landing_review_6_name,
    landing_review_6_role,
    landing_review_6_text,
    landing_stats_investors,
    landing_stats_investors_label,
    landing_stats_filters,
    landing_stats_filters_label,
    landing_stats_stocks,
    landing_stats_stocks_label,
    landing_stats_trial,
    landing_stats_trial_label,
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
    landing_feature_flow_title,
    landing_feature_flow_description,
    landing_feature_flow_bullet_1,
    landing_feature_flow_bullet_2,
    landing_feature_flow_bullet_3,
    landing_feature_flow_bullet_4,
    landing_feature_flow_link,
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
    landing_more_tools_title,
    landing_more_tool_screener_title,
    landing_more_tool_screener_desc,
    landing_more_tool_congress_title,
    landing_more_tool_congress_desc,
    landing_more_tool_darkpool_title,
    landing_more_tool_darkpool_desc,
    landing_more_tool_portfolio_title,
    landing_more_tool_portfolio_desc,
    landing_more_tool_screener_link,
    landing_more_tool_congress_link,
    landing_more_tool_darkpool_link,
    landing_more_tool_portfolio_link,
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
    landing_pricing_subtitle,
    landing_pricing_monthly,
    landing_pricing_annual,
    landing_pricing_save,
    landing_pricing_guarantee_trial,
    landing_pricing_guarantee_cancel,
    landing_pricing_guarantee_fees,
    landing_pricing_per_month,
    landing_pricing_billed_annually,
    landing_pricing_free_title,
    landing_pricing_free_subtitle,
    landing_pricing_free_price,
    landing_pricing_free_feature_1,
    landing_pricing_free_feature_2,
    landing_pricing_free_feature_3,
    landing_pricing_free_feature_4,
    landing_pricing_free_feature_5,
    landing_pricing_free_feature_6,
    landing_pricing_free_cta,
    landing_pricing_plus_title,
    landing_pricing_plus_subtitle,
    landing_pricing_plus_feature_1,
    landing_pricing_plus_feature_2,
    landing_pricing_plus_feature_3,
    landing_pricing_plus_feature_4,
    landing_pricing_plus_feature_5,
    landing_pricing_plus_feature_6,
    landing_pricing_plus_feature_7,
    landing_pricing_plus_cta,
    landing_pricing_pro_title,
    landing_pricing_pro_subtitle,
    landing_pricing_pro_feature_1,
    landing_pricing_pro_feature_2,
    landing_pricing_pro_feature_3,
    landing_pricing_pro_feature_4,
    landing_pricing_pro_feature_5,
    landing_pricing_pro_feature_6,
    landing_pricing_pro_feature_7,
    landing_pricing_pro_cta,
    landing_pricing_cta,
    landing_trust_title,
    landing_trust_trustpilot,
    landing_trust_rating,
    landing_trust_badge_data,
    landing_trust_badge_data_desc,
    landing_trust_badge_refund,
    landing_trust_badge_refund_desc,
    landing_trust_badge_trial,
    landing_trust_badge_trial_desc,
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
    landing_faq_q6_title,
    landing_faq_q6_answer,
    landing_faq_q7_title,
    landing_faq_q7_answer,
    landing_cta_title,
    landing_cta_description,
    landing_cta_primary,
    landing_cta_secondary,
    pricing_free_trial,
    pricing_cancel_anytime,
    pricing_no_hidden_fees,
    pricing_monthly,
    pricing_annual,
    pricing_save,
    pricing_per_month,
    pricing_basic_title,
    pricing_basic_subtitle,
    pricing_plus_title,
    pricing_plus_subtitle,
    pricing_pro_title,
    pricing_pro_subtitle,
    pricing_feature_credits_10,
    pricing_feature_watchlist_1,
    pricing_feature_portfolio_1,
    pricing_feature_alerts_3,
    pricing_feature_notification,
    pricing_get_registered,
    pricing_feature_credits_150,
    pricing_feature_watchlist_unlimited,
    pricing_feature_portfolio_unlimited,
    pricing_feature_alerts_unlimited,
    pricing_feature_screener_unlimited,
    pricing_feature_download_unlimited,
    pricing_feature_hedgefund,
    pricing_feature_congress,
    pricing_feature_no_ads,
    pricing_start_trial,
    pricing_billed_annually_plus,
    pricing_feature_credits_1000,
    pricing_feature_everything_plus,
    pricing_feature_watchlist_pro,
    pricing_feature_portfolio_pro,
    pricing_feature_options_realtime,
    pricing_feature_options_flow,
    pricing_feature_unusual_orders,
    pricing_feature_pro_chart_unlimited,
    pricing_feature_discord,
    pricing_billed_annually_pro,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;

  let pricingAnnual = true;
  let heroVideoEl: HTMLVideoElement;
  let showPlayButton = false;

  type RadialFeatureBadge = {
    label: () => string;
    href: string;
    left: string;
    top: string;
    rotate: number;
    toneClass: string;
  };

  const radialFeatureBadges: RadialFeatureBadge[] = [
    {
      label: landing_feature_ai_title,
      href: "/chat",
      left: "16%",
      top: "33%",
      rotate: -12,
      toneClass:
        "border-violet-300/70 bg-violet-100/85 text-violet-800 dark:border-violet-500/45 dark:bg-violet-500/20 dark:text-violet-200",
    },
    {
      label: landing_feature_flow_title,
      href: "/options-flow",
      left: "81%",
      top: "29%",
      rotate: 10,
      toneClass:
        "border-cyan-300/70 bg-cyan-100/85 text-cyan-800 dark:border-cyan-500/45 dark:bg-cyan-500/20 dark:text-cyan-200",
    },
    {
      label: landing_feature_wiim_title,
      href: "/news-flow",
      left: "12%",
      top: "60%",
      rotate: -8,
      toneClass:
        "border-amber-300/70 bg-amber-100/85 text-amber-800 dark:border-amber-500/45 dark:bg-amber-500/20 dark:text-amber-200",
    },
    {
      label: landing_feature_analyst_title,
      href: "/analysts",
      left: "85%",
      top: "58%",
      rotate: 7,
      toneClass:
        "border-emerald-300/70 bg-emerald-100/85 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      label: landing_more_tool_darkpool_title,
      href: "/unusual-order-flow",
      left: "28%",
      top: "81%",
      rotate: -5,
      toneClass:
        "border-blue-300/70 bg-blue-100/85 text-blue-800 dark:border-blue-500/45 dark:bg-blue-500/20 dark:text-blue-200",
    },
    {
      label: landing_more_tool_portfolio_title,
      href: "/portfolio",
      left: "72%",
      top: "82%",
      rotate: 6,
      toneClass:
        "border-rose-300/70 bg-rose-100/85 text-rose-800 dark:border-rose-500/45 dark:bg-rose-500/20 dark:text-rose-200",
    },
  ];

  type NotificationShowcaseItem = {
    id: string;
    ticker: string;
    title: string;
    detail: string;
    time: string;
    link: string;
    toneClass: string;
  };

  const notificationShowcaseItems: NotificationShowcaseItem[] = [
    {
      id: "nvda-earnings",
      ticker: "NVDA",
      title: "Earnings Release",
      detail: "Quarterly EPS came in 12% above estimates",
      time: "Just now",
      link: "/earnings-calendar",
      toneClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    },
    {
      id: "aapl-alert",
      ticker: "AAPL",
      title: "Price Alert Triggered",
      detail: "AAPL crossed above $230.00",
      time: "1m ago",
      link: "/price-alert",
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    },
    {
      id: "tsla-news",
      ticker: "TSLA",
      title: "News Flow Update",
      detail: "Earnings call sentiment turned bullish",
      time: "2m ago",
      link: "/news-flow",
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      id: "meta-analyst",
      ticker: "META",
      title: "Analyst Rating Change",
      detail: "2 upgrades in the last hour",
      time: "4m ago",
      link: "/analysts",
      toneClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    },
    {
      id: "msft-insider",
      ticker: "MSFT",
      title: "Insider Transaction",
      detail: "Director reported a new open-market buy",
      time: "7m ago",
      link: "/insider-tracker",
      toneClass:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
    },
    {
      id: "amzn-dividend",
      ticker: "AMZN",
      title: "Dividend Update",
      detail: "Dividend payout increased in latest announcement",
      time: "11m ago",
      link: "/dividends-calendar",
      toneClass:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    },
  ];

  onMount(() => {
    const playHeroVideo = async () => {
      if (!heroVideoEl) return;
      try {
        await heroVideoEl.play();
      } catch {
        showPlayButton = true;
      }
    };

    void playHeroVideo();
  });

  function handlePlayClick() {
    if (heroVideoEl) {
      heroVideoEl.play();
      showPlayButton = false;
    }
  }
</script>

<SEO
  title={landing_seo_title()}
  description={landing_seo_description()}
  keywords="stock analysis, options flow, AI stock research, smart money tracking, stock screener, congress trading, hedge fund tracking, institutional data, free stock tools, dark pool data, unusual options activity"
  image="https://stocknear.com/img/landing-page/overview.png"
  twitterCard="summary_large_image"
  structuredData={[
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Stocknear",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://stocknear.com",
      description: landing_seo_description(),
      screenshot: "https://stocknear.com/img/landing-page/overview.png",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.6",
        bestRating: "5",
        ratingCount: "150",
        reviewCount: "150",
      },
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Plus Plan (Annual)",
          price: "5",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "5",
            priceCurrency: "USD",
            unitCode: "MON",
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: "1",
              unitCode: "MON",
            },
          },
        },
        {
          "@type": "Offer",
          name: "Pro Plan (Annual)",
          price: "15",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "15",
            priceCurrency: "USD",
            unitCode: "MON",
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: "1",
              unitCode: "MON",
            },
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: landing_faq_q1_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q1_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q2_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q2_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q3_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q3_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q4_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q4_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q5_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q5_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q6_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q6_answer() },
        },
        {
          "@type": "Question",
          name: landing_faq_q7_title(),
          acceptedAnswer: { "@type": "Answer", text: landing_faq_q7_answer() },
        },
      ],
    },
  ]}
/>

<div class="text-gray-700 dark:text-zinc-200 w-full">
  <!-- Section 1: Hero -->
  <section class="w-full bg-white dark:bg-zinc-950/60">
    <div class="relative overflow-hidden">
      <div class="radial-grid pointer-events-none absolute inset-0"></div>
      <div
        class="pointer-events-none absolute left-1/2 top-[35%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl"
      ></div>

      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div class="mx-auto max-w-4xl text-center">
          <h1
            class="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white leading-tight"
          >
            {landing_hero_title()}
          </h1>
          <p
            class="mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-gray-800 dark:text-zinc-300 max-w-3xl mx-auto"
          >
            {landing_hero_subtitle()}
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              class="cursor-pointer inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
            >
              {landing_hero_cta_primary()}
            </a>
            <a
              href="/pricing"
              class="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/70 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            >
              {landing_hero_cta_secondary()}
            </a>
          </div>
        </div>

        <div class="relative mt-12 mx-auto max-w-5xl">
          <div
            class="pointer-events-none absolute left-1/2 top-[46%] hidden h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <div class="radial-ring absolute inset-0 rounded-full"></div>
            <div class="radial-ring radial-ring-delay absolute inset-[14%] rounded-full"></div>
            <div class="radial-ring radial-ring-delay-2 absolute inset-[28%] rounded-full"></div>
          </div>

          <div class="pointer-events-none absolute inset-0 hidden lg:block">
            {#each radialFeatureBadges as badge}
              <a
                href={badge.href}
                style={`left:${badge.left}; top:${badge.top}; transform: translate(-50%, -50%) rotate(${badge.rotate}deg);`}
                class="radial-float pointer-events-auto absolute rounded-full border px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] shadow-sm backdrop-blur {badge.toneClass}"
              >
                {badge.label()}
              </a>
            {/each}
          </div>

          <div
            class="relative z-10 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl overflow-hidden bg-white/90 dark:bg-zinc-900/70"
          >
            <video
              bind:this={heroVideoEl}
              class="w-full"
              src="/video/overview.mp4"
              poster="/img/landing-page/overview.png"
              autoplay
              muted
              loop
              playsinline
            ></video>
            {#if showPlayButton}
              <button
                on:click={handlePlayClick}
                class="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                aria-label="Play video"
              >
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <svg class="w-7 h-7 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            {/if}
          </div>
        </div>

        <div class="mt-6 flex flex-wrap justify-center gap-2.5 lg:hidden">
          {#each radialFeatureBadges as badge}
            <a
              href={badge.href}
              class="rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] {badge.toneClass}"
            >
              {badge.label()}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- Section 2: Stats Bar -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div class="text-center">
          <div
            class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            {landing_stats_investors()}
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {landing_stats_investors_label()}
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            {landing_stats_filters()}
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {landing_stats_filters_label()}
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            {landing_stats_stocks()}
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {landing_stats_stocks_label()}
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400"
          >
            {landing_stats_trial()}
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {landing_stats_trial_label()}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 2.5: Real-Time Alerts Showcase -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
      <div class="grid gap-8 lg:grid-cols-[1fr_minmax(0,27rem)] lg:items-center">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
          >
            Notifications
          </p>
          <h2
            class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            Real-Time Alerts That Surface What Matters
          </h2>
          <p class="mt-4 text-base sm:text-lg text-gray-700 dark:text-zinc-300 max-w-2xl">
            See high-signal events the moment they happen, from earnings
            releases and analyst changes to price and news alerts.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a
              href="/notifications"
              class="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Open Notifications
            </a>
            <a
              href="/price-alert"
              class="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Create Alert
            </a>
          </div>
        </div>

        <div
          class="overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-3 sm:p-4 shadow-sm"
        >
          <AnimatedList items={notificationShowcaseItems} delay={1450} maxVisible={5}>
            <svelte:fragment let:item>
              <a
                href={item.link}
                class="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/75 px-3 py-2.5 hover:border-violet-300 dark:hover:border-violet-500/45 transition"
              >
                <span
                  class="avatar h-8 w-8 shrink-0 rounded-full border border-gray-300 bg-gray-100/70 shadow dark:border-zinc-700 dark:bg-zinc-900/60"
                >
                  <img
                    src={`https://financialmodelingprep.com/image-stock/${item.ticker}.png`}
                    alt={`${item.ticker} logo`}
                    class="inline-block h-8 w-8 shrink-0 rounded-full p-0.5"
                    style="clip-path: circle(50%);"
                    loading="lazy"
                    on:error={(e) =>
                      ((e.currentTarget as HTMLImageElement).src = "/pwa-192x192.png")}
                  />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                      {item.ticker}
                    </span>
                    <span
                      class={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] ${item.toneClass}`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p class="mt-0.5 truncate text-xs text-gray-600 dark:text-zinc-400">
                    {item.detail}
                  </p>
                </div>
                <span class="text-[0.68rem] text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                  {item.time}
                </span>
              </a>
            </svelte:fragment>
          </AnimatedList>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Feature Showcases -->
  <section
    id="features"
    class="border-t border-gray-300 dark:border-zinc-700 scroll-mt-16"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-16">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
        >
          {landing_features_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {landing_features_title()}
        </h2>
        <p
          class="mt-4 max-w-2xl text-lg text-gray-800 dark:text-zinc-300 mx-auto"
        >
          {landing_features_subtitle()}
        </p>
      </div>

      <div class="space-y-20 sm:space-y-28">
        <!-- Feature 1: AI Agent (image right) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 order-2 lg:order-1">
            <h3
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {landing_feature_ai_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_ai_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_ai_bullet_1(), landing_feature_ai_bullet_2(), landing_feature_ai_bullet_3(), landing_feature_ai_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg
                    class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a
              href="/chat"
              class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {landing_feature_ai_link()}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
          <div class="flex-1 order-1 lg:order-2 w-full">
            <video
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/video/ai-agent.mp4"
              poster="/img/landing-page/ai-agent.png"
              preload="none"
              autoplay
              muted
              loop
              playsinline
            ></video>
          </div>
        </div>

        <!-- Feature 2: Options Flow (image left) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/options-flow.png"
              alt="Real-time options flow dashboard showing institutional sweep orders, block trades, and sentiment data"
              loading="lazy"
            />
          </div>
          <div class="flex-1">
            <h3
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {landing_feature_flow_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_flow_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_flow_bullet_1(), landing_feature_flow_bullet_2(), landing_feature_flow_bullet_3(), landing_feature_flow_bullet_4()] as bullet}
                <li class="flex items-start gap-3">
                  <svg
                    class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a
              href="/options-flow"
              class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {landing_feature_flow_link()}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
        </div>

        <!-- Feature 3: Why It Moved (image right) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 order-2 lg:order-1">
            <h3
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {landing_feature_wiim_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_wiim_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_wiim_bullet_1(), landing_feature_wiim_bullet_2(), landing_feature_wiim_bullet_3()] as bullet}
                <li class="flex items-start gap-3">
                  <svg
                    class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a
              href="/news-flow"
              class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {landing_feature_wiim_link()}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
          <div class="flex-1 order-1 lg:order-2 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/wiim-chart.png"
              alt="Why It Moved chart showing stock price catalysts with dollar impact breakdown"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Feature 4: Analyst Intelligence (image left) -->
        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div class="flex-1 w-full">
            <img
              class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
              src="/img/landing-page/analyst-chart.png"
              alt="Wall Street analyst ratings dashboard with accuracy rankings and consensus price targets"
              loading="lazy"
            />
          </div>
          <div class="flex-1">
            <h3
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {landing_feature_analyst_title()}
            </h3>
            <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
              {landing_feature_analyst_description()}
            </p>
            <ul class="mt-6 space-y-3">
              {#each [landing_feature_analyst_bullet_1(), landing_feature_analyst_bullet_2(), landing_feature_analyst_bullet_3()] as bullet}
                <li class="flex items-start gap-3">
                  <svg
                    class="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-700 dark:text-zinc-200">{bullet}</span>
                </li>
              {/each}
            </ul>
            <a
              href="/analysts"
              class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {landing_feature_analyst_link()}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
        </div>
      </div>

      <!-- More Tools compact grid -->
      <div class="mt-20 sm:mt-28">
        <h3
          class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white text-center mb-10"
        >
          {landing_more_tools_title()}
        </h3>
        <div class="grid gap-6 sm:grid-cols-2">
          <!-- Stock Screener -->
          <a
            href="/stock-screener"
            class="group rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex-shrink-0 h-11 w-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-violet-600 dark:text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4
                  class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                >
                  {landing_more_tool_screener_title()}
                </h4>
                <p
                  class="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                >
                  {landing_more_tool_screener_desc()}
                </p>
                <span
                  class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 dark:text-violet-400"
                >
                  {landing_more_tool_screener_link()}
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    /></svg
                  >
                </span>
              </div>
            </div>
          </a>
          <!-- Congress & Insider Trading -->
          <a
            href="/politicians"
            class="group rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex-shrink-0 h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4
                  class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                >
                  {landing_more_tool_congress_title()}
                </h4>
                <p
                  class="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                >
                  {landing_more_tool_congress_desc()}
                </p>
                <span
                  class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 dark:text-violet-400"
                >
                  {landing_more_tool_congress_link()}
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    /></svg
                  >
                </span>
              </div>
            </div>
          </a>
          <!-- Dark Pool Tracker -->
          <a
            href="/unusual-order-flow"
            class="group rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex-shrink-0 h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4
                  class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                >
                  {landing_more_tool_darkpool_title()}
                </h4>
                <p
                  class="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                >
                  {landing_more_tool_darkpool_desc()}
                </p>
                <span
                  class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 dark:text-violet-400"
                >
                  {landing_more_tool_darkpool_link()}
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    /></svg
                  >
                </span>
              </div>
            </div>
          </a>
          <!-- Portfolio Tracker -->
          <a
            href="/portfolio"
            class="group rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex-shrink-0 h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4
                  class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                >
                  {landing_more_tool_portfolio_title()}
                </h4>
                <p
                  class="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                >
                  {landing_more_tool_portfolio_desc()}
                </p>
                <span
                  class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 dark:text-violet-400"
                >
                  {landing_more_tool_portfolio_link()}
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    /></svg
                  >
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: How It Works -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700"
  >
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-14">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
        >
          {landing_how_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {landing_how_title()}
        </h2>
      </div>
      <div class="grid gap-10 sm:grid-cols-3">
        <!-- Step 1 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5"
          >
            <svg
              class="w-7 h-7 text-violet-600 dark:text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div
            class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2"
          >
            1
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {landing_how_step1_title()}
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            {landing_how_step1_description()}
          </p>
        </div>
        <!-- Step 2 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5"
          >
            <svg
              class="w-7 h-7 text-violet-600 dark:text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div
            class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2"
          >
            2
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {landing_how_step2_title()}
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            {landing_how_step2_description()}
          </p>
        </div>
        <!-- Step 3 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 mb-5"
          >
            <svg
              class="w-7 h-7 text-violet-600 dark:text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div
            class="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2"
          >
            3
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {landing_how_step3_title()}
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            {landing_how_step3_description()}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 5: Pricing -->
  <section
    id="pricing"
    class="border-t border-gray-300 dark:border-zinc-700 scroll-mt-16"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-10">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
        >
          {landing_pricing_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {landing_pricing_title()}
        </h2>
        <p class="mt-3 text-base text-gray-600 dark:text-zinc-400">
          {landing_pricing_subtitle()}
        </p>

        <!-- Guarantee badges -->
        <div
          class="mt-5 flex flex-wrap items-center justify-center gap-2 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em]"
        >
          <span
            class="rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-3 py-1"
            >{pricing_free_trial()}</span
          >
          <span
            class="rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-3 py-1"
            >{pricing_cancel_anytime()}</span
          >
          <span
            class="rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 px-3 py-1"
            >{pricing_no_hidden_fees()}</span
          >
        </div>
      </div>

      <Discount />

      <!-- Monthly / Annual toggle -->
      <div
        class="mb-10 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold"
      >
        <span
          class={pricingAnnual
            ? "text-gray-400 dark:text-zinc-500"
            : "text-gray-900 dark:text-white"}
        >
          {pricing_monthly()}
        </span>
        <label class="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            bind:checked={pricingAnnual}
            class="peer sr-only"
          />
          <span
            class="h-8 w-16 rounded-full border border-gray-300 dark:border-zinc-600 transition {pricingAnnual
              ? 'bg-emerald-500'
              : 'bg-gray-200 dark:bg-zinc-800'}"
          ></span>
          <span
            class="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition peer-checked:translate-x-8"
          ></span>
        </label>
        <span
          class={pricingAnnual
            ? "text-gray-900 dark:text-white"
            : "text-gray-400 dark:text-zinc-500"}
        >
          {pricing_annual()}
        </span>
        <span
          class="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
        >
          {pricing_save()}
        </span>
      </div>

      <!-- Pricing cards -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Free -->
        <div
          class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 flex flex-col"
        >
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">
            {pricing_basic_title()}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {pricing_basic_subtitle()}
          </p>
          <div class="mt-5 flex items-baseline justify-center gap-1">
            <span class="text-4xl font-semibold text-gray-900 dark:text-white"
              >$0</span
            >
            <span class="text-sm text-gray-500 dark:text-zinc-400"
              >{pricing_per_month()}</span
            >
          </div>
          <ul class="mt-6 mb-6 space-y-2.5 text-sm flex-1">
            {#each [pricing_feature_credits_10(), pricing_feature_watchlist_1(), pricing_feature_portfolio_1(), pricing_feature_alerts_3(), pricing_feature_notification()] as feature}
              <li class="flex items-start gap-2.5">
                <svg
                  class="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
          <div
            class="mt-auto pt-5 border-t border-gray-100 dark:border-zinc-800"
          >
            <a
              href="/register"
              class="cursor-pointer w-full py-3 px-4 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 rounded-full font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition flex items-center justify-center text-sm"
            >
              {pricing_get_registered()}
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
        </div>

        <!-- Plus (highlighted) -->
        <div
          class="rounded-2xl border-2 border-violet-500 dark:border-violet-400 bg-white dark:bg-zinc-900/60 p-6 flex flex-col relative"
        >
          <div
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 dark:bg-violet-500 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider"
          >
            Popular
          </div>
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">
            {pricing_plus_title()}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {pricing_plus_subtitle()}
          </p>
          <div class="mt-5 flex items-baseline justify-center gap-2">
            {#if pricingAnnual && !["Pro", "Plus"]?.includes(data?.user?.tier)}
              <span
                class="text-xl text-gray-400 dark:text-zinc-500 line-through"
                >$10</span
              >
              <span class="text-4xl font-semibold text-gray-900 dark:text-white"
                >$5</span
              >
            {:else}
              <span class="text-4xl font-semibold text-gray-900 dark:text-white"
                >{pricingAnnual ? "$10" : "$15"}</span
              >
            {/if}
            <span class="text-sm text-gray-500 dark:text-zinc-400"
              >{pricing_per_month()}</span
            >
          </div>
          {#if pricingAnnual}
            <p
              class="mt-1 text-xs text-gray-500 dark:text-zinc-500 text-center"
            >
              {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                Billed Annually (<span class="line-through">$120</span> $60)
              {:else}
                {pricing_billed_annually_plus()}
              {/if}
            </p>
          {/if}
          <ul class="mt-6 mb-6 space-y-2.5 text-sm flex-1">
            {#each [pricing_feature_credits_150(), pricing_feature_watchlist_unlimited(), pricing_feature_portfolio_unlimited(), pricing_feature_alerts_unlimited(), pricing_feature_screener_unlimited(), pricing_feature_download_unlimited(), pricing_feature_notification(), pricing_feature_hedgefund(), pricing_feature_congress(), pricing_feature_no_ads()] as feature}
              <li class="flex items-start gap-2.5">
                <svg
                  class="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-700 dark:text-zinc-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
           <div
            class="mt-auto pt-5 border-t border-gray-100 dark:border-zinc-800"
          >
            <a
              href="/register"
              class="cursor-pointer w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 text-white rounded-full font-semibold transition flex items-center justify-center text-sm"
            >
              {pricing_start_trial()}
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
           </div>
        </div>

        <!-- Pro -->
        <div
          class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 flex flex-col"
        >
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">
            {pricing_pro_title()}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {pricing_pro_subtitle()}
          </p>
          <div class="mt-5 flex items-baseline justify-center gap-2">
            {#if pricingAnnual && !["Pro", "Plus"]?.includes(data?.user?.tier)}
              <span
                class="text-xl text-gray-400 dark:text-zinc-500 line-through"
                >$30</span
              >
              <span class="text-4xl font-semibold text-gray-900 dark:text-white"
                >$15</span
              >
            {:else}
              <span class="text-4xl font-semibold text-gray-900 dark:text-white"
                >{pricingAnnual ? "$30" : "$45"}</span
              >
            {/if}
            <span class="text-sm text-gray-500 dark:text-zinc-400"
              >{pricing_per_month()}</span
            >
          </div>
          {#if pricingAnnual}
            <p
              class="mt-1 text-xs text-gray-500 dark:text-zinc-500 text-center"
            >
              {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                Billed Annually (<span class="line-through">$360</span> $180)
              {:else}
                {pricing_billed_annually_pro()}
              {/if}
            </p>
          {/if}
          <ul class="mt-6 mb-6 space-y-2.5 text-sm flex-1">
            {#each [pricing_feature_credits_1000(), pricing_feature_everything_plus(), pricing_feature_watchlist_pro(), pricing_feature_portfolio_pro(), pricing_feature_options_realtime(), pricing_feature_options_flow(), pricing_feature_unusual_orders(), pricing_feature_pro_chart_unlimited(), pricing_feature_discord()] as feature}
              <li class="flex items-start gap-2.5">
                <svg
                  class="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-700 dark:text-zinc-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-600 dark:text-zinc-300">{feature}</span>
              </li>
            {/each}
          </ul>
          <div
            class="mt-auto pt-5 border-t border-gray-100 dark:border-zinc-800"
          >
            <a
              href="/register"
              class="cursor-pointer w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-gray-900 rounded-full font-semibold transition flex items-center justify-center text-sm"
            >
              {pricing_start_trial()}
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                /></svg
              >
            </a>
          </div>
        </div>
      </div>

      <div class="mt-10 text-center">
        <a
          href="/pricing"
          class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {landing_pricing_cta()}
          <svg
            class="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            /></svg
          >
        </a>
      </div>
    </div>
  </section>

  <!-- Section 6: Reviews -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div class="text-center mb-12">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
        >
          {landing_reviews_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {landing_reviews_title()}
        </h2>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each [{ name: landing_review_1_name(), role: landing_review_1_role(), text: landing_review_1_text(), initials: "JG", color: "bg-violet-600" }, { name: landing_review_2_name(), role: landing_review_2_role(), text: landing_review_2_text(), initials: "RC", color: "bg-emerald-600" }, { name: landing_review_3_name(), role: landing_review_3_role(), text: landing_review_3_text(), initials: "EB", color: "bg-blue-600" }, { name: landing_review_4_name(), role: landing_review_4_role(), text: landing_review_4_text(), initials: "GF", color: "bg-amber-600" }, { name: landing_review_5_name(), role: landing_review_5_role(), text: landing_review_5_text(), initials: "PT", color: "bg-rose-600" }, { name: landing_review_6_name(), role: landing_review_6_role(), text: landing_review_6_text(), initials: "SS", color: "bg-cyan-600" }] as review}
          <div
            class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 flex flex-col"
          >
            <!-- Quotation mark + Stars -->
            <div class="flex items-center justify-between mb-4">
              <svg class="w-5 h-5 text-gray-300 dark:text-zinc-600" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.28571 7.6C3.78214 7.6 3.3058 7.70062 2.85714 7.85812V7.6C2.85714 6.05562 4.13839 4.8 5.71429 4.8C6.50313 4.8 7.14286 4.17306 7.14286 3.4C7.14286 2.62694 6.50446 2 5.71429 2C2.56339 2 0 4.51125 0 7.6V11.8C0 14.1196 1.91875 16 4.28571 16C6.65268 16 8.57143 14.1196 8.57143 11.8C8.57143 9.48037 6.65179 7.6 4.28571 7.6ZM15.7143 7.6C15.2107 7.6 14.7344 7.70084 14.2857 7.85721V7.6C14.2857 6.05562 15.567 4.8 17.1429 4.8C17.9317 4.8 18.5714 4.17306 18.5714 3.4C18.5714 2.62694 17.9317 2 17.1429 2C13.992 2 11.4286 4.51212 11.4286 7.6V11.8C11.4286 14.1196 13.3473 16 15.7143 16C18.0813 16 20 14.1196 20 11.8C20 9.48037 18.0804 7.6 15.7143 7.6Z" fill="currentColor" />
              </svg>
              <div class="flex gap-0.5">
                {#each Array(5) as _}
                  <svg
                    class="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                {/each}
              </div>
            </div>
            <!-- Review text -->
            <p
              class="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed flex-1"
            >
              {review.text}
            </p>
            <!-- Author -->
            <div
              class="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800"
            >
              <div
                class="flex-shrink-0 h-10 w-10 rounded-full {review.color} flex items-center justify-center"
              >
                <span class="text-xs font-bold text-white"
                  >{review.initials}</span
                >
              </div>
              <div>
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {review.name}
                </div>
                <div class="text-xs text-gray-500 dark:text-zinc-400">
                  {review.role}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Section 7: Trust / Social Proof -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div
      class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
    >
      <!-- Trustpilot rating -->
      <div class="text-center mb-12">
        <div class="flex items-center justify-center gap-1 mb-3">
          {#each Array(5) as _}
            <svg
              class="w-6 h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          {/each}
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {landing_trust_rating()}
          <span class="font-medium text-lg text-gray-600 dark:text-zinc-300 ml-1"
            >{landing_trust_trustpilot()}</span
          >
        </div>
        <p class="mt-3 text-lg text-gray-800 dark:text-zinc-300">
          {landing_trust_title()}
        </p>
      </div>

      <!-- Trust badges -->
      <div class="grid gap-6 sm:grid-cols-3">
        <!-- Institutional-Grade Data -->
        <div class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
            <svg class="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{landing_trust_badge_data()}</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">{landing_trust_badge_data_desc()}</p>
        </div>
        <!-- 30-Day Money Back -->
        <div class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{landing_trust_badge_refund()}</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">{landing_trust_badge_refund_desc()}</p>
        </div>
        <!-- 7-Day Free Trial -->
        <div class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{landing_trust_badge_trial()}</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">{landing_trust_badge_trial_desc()}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 8: FAQ -->
  <section
    id="faq"
    class="border-t border-gray-300 dark:border-zinc-700 scroll-mt-16"
  >
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-12">
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {landing_faq_title()}
        </h2>
        <p class="mt-4 text-lg text-gray-800 dark:text-zinc-300">
          {landing_faq_subtitle()}
        </p>
      </div>
      <ul class="space-y-4">
        {#each [{ q: landing_faq_q1_title(), a: landing_faq_q1_answer() }, { q: landing_faq_q2_title(), a: landing_faq_q2_answer() }, { q: landing_faq_q3_title(), a: landing_faq_q3_answer() }, { q: landing_faq_q4_title(), a: landing_faq_q4_answer() }, { q: landing_faq_q5_title(), a: landing_faq_q5_answer() }, { q: landing_faq_q6_title(), a: landing_faq_q6_answer() }, { q: landing_faq_q7_title(), a: landing_faq_q7_answer() }] as faq}
          <li
            class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 px-4 sm:px-6"
          >
            <details class="collapse collapse-arrow">
              <summary
                class="font-semibold collapse-title text-base sm:text-lg text-gray-900 dark:text-white cursor-pointer"
              >
                {faq.q}
              </summary>
              <div class="collapse-content">
                <p class="text-gray-700 dark:text-zinc-300 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </details>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <!-- Section 9: Final CTA -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-24 text-center">
      <h2
        class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
      >
        {landing_cta_title()}
      </h2>
      <p
        class="mt-4 text-lg text-gray-800 dark:text-zinc-300 max-w-2xl mx-auto"
      >
        {landing_cta_description()}
      </p>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/register"
          class="cursor-pointer inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
        >
          {landing_cta_primary()}
        </a>
        <a
          href="/pricing"
          class="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {landing_cta_secondary()}
        </a>
      </div>
    </div>
  </section>
</div>

<style lang="scss">
  .radial-grid {
    background-image:
      linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.9), transparent 85%);
    opacity: 0.7;
  }

  :global(.dark) .radial-grid {
    background-image:
      linear-gradient(to right, rgba(63, 63, 70, 0.45) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(63, 63, 70, 0.45) 1px, transparent 1px);
    opacity: 0.6;
  }

  .radial-ring {
    border: 1px solid rgba(139, 92, 246, 0.25);
    animation: radialPulse 5.8s ease-in-out infinite;
  }

  .radial-ring-delay {
    animation-delay: 0.8s;
  }

  .radial-ring-delay-2 {
    animation-delay: 1.6s;
  }

  .radial-float {
    animation: radialFloat 6s ease-in-out infinite;
  }

  .radial-float:nth-child(even) {
    animation-duration: 6.8s;
    animation-delay: 0.4s;
  }

  @keyframes radialPulse {
    0%,
    100% {
      opacity: 0.2;
      transform: scale(0.96);
    }
    50% {
      opacity: 0.45;
      transform: scale(1.04);
    }
  }

  @keyframes radialFloat {
    0%,
    100% {
      margin-top: 0;
    }
    50% {
      margin-top: -6px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .radial-ring,
    .radial-float {
      animation: none;
    }
  }
</style>
