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
    landing_trust_title,
    landing_trust_trustpilot,
    landing_trust_rating,
    landing_trust_badge_data,
    landing_trust_badge_data_desc,
    landing_trust_badge_refund,
    landing_trust_badge_refund_desc,
    landing_trust_badge_trial,
    landing_trust_badge_trial_desc,
    landing_cta_title,
    landing_cta_description,
    landing_cta_primary,
    landing_cta_secondary,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;

  let heroVideoEl: HTMLVideoElement;
  let showPlayButton = false;
  let heroVideoUnavailable = false;
  let failedMedia = new Set<string>();

  type PainPointCard = {
    title: string;
    detail: string;
  };

  const painPointCards: PainPointCard[] = [
    {
      title: "Too many tabs, no clear signal",
      detail:
        "Retail investors lose time bouncing between scanners, charting apps, and filings before making one decision.",
    },
    {
      title: "Important moves arrive too late",
      detail:
        "By the time alerts hit social feeds, the best entry is often gone. Speed and context matter together.",
    },
    {
      title: "Complex data feels unusable",
      detail:
        "Institutional-style data is powerful, but not if it takes analyst-level effort to decode every signal.",
    },
  ];

  type FeatureMedia =
    | {
        kind: "image" | "video";
        src: string;
        poster?: string;
        alt: string;
        placeholderTitle: string;
        placeholderHint: string;
      }
    | {
        kind: "analyst-preview";
      }
    | {
        kind: "financial-preview";
      }
    | {
        kind: "wiim-preview";
      };

  type FeatureShowcaseBlock = {
    id: string;
    title: () => string;
    description: () => string;
    bullets: Array<() => string>;
    href: string;
    linkLabel: () => string;
    reverse?: boolean;
    media: FeatureMedia;
  };

  const featureShowcaseBlocks: FeatureShowcaseBlock[] = [
    {
      id: "ai-agent",
      title: landing_feature_ai_title,
      description: landing_feature_ai_description,
      bullets: [
        landing_feature_ai_bullet_1,
        landing_feature_ai_bullet_2,
        landing_feature_ai_bullet_3,
        landing_feature_ai_bullet_4,
      ],
      href: "/chat",
      linkLabel: landing_feature_ai_link,
      media: {
        kind: "video",
        src: "/video/ai-agent.mp4",
        poster: "/img/landing-page/ai-agent.png",
        alt: "AI stock research assistant preview",
        placeholderTitle: "AI Research Demo Placeholder",
        placeholderHint:
          "Add a 20-30 second walkthrough video at /static/video/ai-agent.mp4",
      },
    },
    {
      id: "options-flow",
      title: landing_feature_flow_title,
      description: landing_feature_flow_description,
      bullets: [
        landing_feature_flow_bullet_1,
        landing_feature_flow_bullet_2,
        landing_feature_flow_bullet_3,
        landing_feature_flow_bullet_4,
      ],
      href: "/options-flow",
      linkLabel: landing_feature_flow_link,
      reverse: true,
      media: {
        kind: "image",
        src: "/img/landing-page/options-flow.png",
        alt: "Options flow dashboard with sweeps and block trades",
        placeholderTitle: "Options Flow Screenshot Placeholder",
        placeholderHint:
          "Add a high-resolution screenshot at /static/img/landing-page/options-flow.png",
      },
    },
    {
      id: "wiim",
      title: landing_feature_wiim_title,
      description: landing_feature_wiim_description,
      bullets: [
        landing_feature_wiim_bullet_1,
        landing_feature_wiim_bullet_2,
        landing_feature_wiim_bullet_3,
      ],
      href: "/news-flow",
      linkLabel: landing_feature_wiim_link,
      media: {
        kind: "wiim-preview",
      },
    },
    {
      id: "analyst",
      title: landing_feature_analyst_title,
      description: landing_feature_analyst_description,
      bullets: [
        landing_feature_analyst_bullet_1,
        landing_feature_analyst_bullet_2,
        landing_feature_analyst_bullet_3,
      ],
      href: "/analysts",
      linkLabel: landing_feature_analyst_link,
      reverse: true,
      media: {
        kind: "analyst-preview",
      },
    },
    {
      id: "financial-history",
      title: () => "Financial Charts With 30+ Years of History",
      description: () =>
        "Most platforms show a narrow window. Stocknear lets you zoom out across up to 30+ years of revenue, margins, cash flow, and balance-sheet history so you can judge business durability, not just short-term momentum.",
      bullets: [
        () => "Validate long-term growth quality before committing capital.",
        () =>
          "Compare full-cycle performance across bull, bear, and rate regimes.",
        () =>
          "Spot accounting and cash-flow trend shifts earlier with deeper context.",
      ],
      href: "/stocks/AAPL/financials/custom",
      linkLabel: () => "Explore Financial Charting",
      media: {
        kind: "financial-preview",
      },
    },
  ];

  type ToolCard = {
    href: string;
    title: () => string;
    description: () => string;
    cta: () => string;
    iconPath: string;
    iconBgClass: string;
    iconToneClass: string;
  };

  const additionalToolCards: ToolCard[] = [
    {
      href: "/stock-screener",
      title: landing_more_tool_screener_title,
      description: landing_more_tool_screener_desc,
      cta: landing_more_tool_screener_link,
      iconPath:
        "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
      iconBgClass: "bg-violet-100 dark:bg-violet-900/30",
      iconToneClass: "text-violet-600 dark:text-violet-400",
    },
    {
      href: "/politicians",
      title: landing_more_tool_congress_title,
      description: landing_more_tool_congress_desc,
      cta: landing_more_tool_congress_link,
      iconPath:
        "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      iconToneClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      href: "/unusual-order-flow",
      title: landing_more_tool_darkpool_title,
      description: landing_more_tool_darkpool_desc,
      cta: landing_more_tool_darkpool_link,
      iconPath:
        "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
      iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
      iconToneClass: "text-blue-600 dark:text-blue-400",
    },
    {
      href: "/portfolio",
      title: landing_more_tool_portfolio_title,
      description: landing_more_tool_portfolio_desc,
      cta: landing_more_tool_portfolio_link,
      iconPath:
        "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
      iconToneClass: "text-amber-600 dark:text-amber-400",
    },
  ];

  const hasMediaFailed = (id: string) => failedMedia.has(id);

  function markMediaFailed(id: string) {
    if (failedMedia.has(id)) return;
    failedMedia = new Set([...failedMedia, id]);
  }

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
  ];

  type AnalystPreviewMetric = {
    id: string;
    label: string;
    value: string;
    valueClass: string;
    cardClass: string;
  };

  const analystPreviewMetrics: AnalystPreviewMetric[] = [
    {
      id: "accuracy",
      label: "Price Target Accuracy",
      value: "92%",
      valueClass: "text-gray-900 dark:text-zinc-900",
      cardClass: "max-w-[19rem] md:max-w-[22rem]",
    },
    {
      id: "return",
      label: "Average 1-Year Return",
      value: "+43%",
      valueClass: "text-emerald-700",
      cardClass:
        "max-w-[20rem] md:max-w-[24rem] md:ml-[14%] lg:ml-[18%] xl:ml-[22%]",
    },
    {
      id: "win-rate",
      label: "Win Rate",
      value: "78%",
      valueClass: "text-gray-900 dark:text-zinc-900",
      cardClass:
        "max-w-[17rem] md:max-w-[22rem] ml-auto md:mr-[2%] lg:mr-[4%] xl:mr-[7%]",
    },
  ];

  type AnalystPreviewCall = {
    id: string;
    ticker: string;
    company: string;
    action: string;
    target: string;
    toneClass: string;
  };

  const analystPreviewCalls: AnalystPreviewCall[] = [
    {
      id: "nvda-upgrade",
      ticker: "NVDA",
      company: "NVIDIA",
      action: "Upgrade to Buy",
      target: "$1,180 PT",
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      id: "msft-maintain",
      ticker: "MSFT",
      company: "Microsoft",
      action: "Maintain Overweight",
      target: "$530 PT",
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    },
    {
      id: "amzn-raise",
      ticker: "AMZN",
      company: "Amazon",
      action: "Target Raised",
      target: "$245 PT",
      toneClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    },
  ];

  type FinancialPreviewMetric = {
    id: string;
    label: string;
    value: string;
    toneClass: string;
  };

  const financialPreviewMetrics: FinancialPreviewMetric[] = [
    {
      id: "revenue-growth",
      label: "30Y Revenue Growth",
      value: "+5,840%",
      toneClass: "text-emerald-300",
    },
    {
      id: "fcf-margin",
      label: "Avg FCF Margin",
      value: "24.1%",
      toneClass: "text-cyan-300",
    },
    {
      id: "profit-cycles",
      label: "Profit Cycles Tracked",
      value: "7",
      toneClass: "text-blue-300",
    },
    {
      id: "history-window",
      label: "History Window",
      value: "1995-2025",
      toneClass: "text-zinc-100",
    },
  ];

  type FinancialPreviewBar = {
    id: string;
    year: string;
    valueLabel: string;
    height: number;
  };

  const financialPreviewBars: FinancialPreviewBar[] = [
    { id: "y1995", year: "1995", valueLabel: "$7B", height: 24 },
    { id: "y2000", year: "2000", valueLabel: "$18B", height: 38 },
    { id: "y2005", year: "2005", valueLabel: "$42B", height: 56 },
    { id: "y2010", year: "2010", valueLabel: "$92B", height: 78 },
    { id: "y2015", year: "2015", valueLabel: "$188B", height: 104 },
    { id: "y2020", year: "2020", valueLabel: "$274B", height: 130 },
    { id: "y2025", year: "2025", valueLabel: "$392B", height: 150 },
  ];

  type WiimPreviewEvent = {
    id: string;
    time: string;
    title: string;
    detail: string;
    impact: string;
    toneClass: string;
  };

  const wiimPreviewEvents: WiimPreviewEvent[] = [
    {
      id: "pre-market",
      time: "08:31",
      title: "EPS beat vs consensus",
      detail: "Quarterly earnings beat estimates by 11.8%",
      impact: "+2.6%",
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      id: "open",
      time: "09:47",
      title: "Guidance raised for FY26",
      detail: "Management increased full-year revenue outlook",
      impact: "+1.9%",
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    },
    {
      id: "mid-day",
      time: "12:22",
      title: "Analyst target revisions",
      detail: "Multiple brokers raised targets after the call",
      impact: "+1.1%",
      toneClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    },
  ];

  onMount(() => {
    const playHeroVideo = async () => {
      if (!heroVideoEl || heroVideoUnavailable) return;
      try {
        await heroVideoEl.play();
      } catch {
        showPlayButton = true;
      }
    };

    void playHeroVideo();
  });

  function handlePlayClick() {
    if (heroVideoEl && !heroVideoUnavailable) {
      heroVideoEl.play();
      showPlayButton = false;
    }
  }

  function handleHeroVideoError() {
    heroVideoUnavailable = true;
    showPlayButton = false;
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
  ]}
/>

<div class="text-gray-700 dark:text-zinc-200 w-full">
  <!-- Section 1: Hero -->
  <section
    class="w-full bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80"
  >
    <div
      class="mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-20"
    >
      <div
        class="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center"
      >
        <div>
          <h1
            class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-gray-900 dark:text-white"
          >
            {landing_hero_title()}
          </h1>
          <p
            class="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-800 dark:text-zinc-300"
          >
            {landing_hero_subtitle()}
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-3.5">
            <a
              href="/register"
              class="cursor-pointer inline-flex items-center justify-center px-7 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-colors"
            >
              {landing_hero_cta_primary()}
            </a>
            <a
              href="/pricing"
              class="inline-flex items-center justify-center gap-2 px-7 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/70 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            >
              {landing_hero_cta_secondary()}
            </a>
          </div>

          <p class="mt-6 text-sm font-medium text-gray-600 dark:text-zinc-400">
            No credit card required. Free forever.
          </p>
        </div>

        <div>
          <div
            class="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/70 shadow-xl"
          >
            {#if heroVideoUnavailable}
              <div
                class="flex min-h-[20rem] items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 p-6 text-center dark:from-zinc-900 dark:to-zinc-950 sm:min-h-[25rem] lg:min-h-[32rem]"
              >
                <div class="max-w-xs">
                  <p
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Hero Walkthrough Placeholder
                  </p>
                  <p
                    class="mt-2 text-xs leading-relaxed text-gray-600 dark:text-zinc-400"
                  >
                    Add product intro video to /static/video/overview.mp4 or
                    replace with /static/img/landing-page/overview.png
                  </p>
                </div>
              </div>
            {:else}
              <video
                bind:this={heroVideoEl}
                class="w-full min-h-[20rem] object-cover sm:min-h-[25rem] xl:min-h-[32rem]"
                src="/video/overview.mp4"
                poster="/img/landing-page/overview.png"
                autoplay
                muted
                loop
                playsinline
                on:error={handleHeroVideoError}
              ></video>
              {#if showPlayButton}
                <button
                  on:click={handlePlayClick}
                  class="absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity hover:bg-black/45"
                  aria-label="Play video"
                >
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6 text-gray-900 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 2: Pain Points -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
      <div class="mx-auto max-w-3xl text-center">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400"
        >
          Why Investors Switch
        </p>
        <h2
          class="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          From noisy workflows to clear decisions
        </h2>
        <p class="mt-4 text-base sm:text-lg text-gray-700 dark:text-zinc-300">
          Stocknear removes the biggest friction points retail traders face
          every day.
        </p>
      </div>

      <div class="mt-10 grid gap-5 md:grid-cols-3">
        {#each painPointCards as card, index}
          <article
            class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-900/55 p-6"
          >
            <div
              class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3
              class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {card.title}
            </h3>
            <p
              class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-400"
            >
              {card.detail}
            </p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <!-- Section 2.5: Real-Time Alerts Showcase -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
      <div
        class="grid gap-8 lg:grid-cols-[1fr_minmax(0,27rem)] lg:items-center"
      >
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
          <p
            class="mt-4 text-base sm:text-lg text-gray-700 dark:text-zinc-300 max-w-2xl"
          >
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
          <div class="space-y-3">
            {#each notificationShowcaseItems as item (item.id)}
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
                      ((e.currentTarget as HTMLImageElement).src =
                        "/pwa-192x192.png")}
                  />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-semibold tracking-tight text-gray-900 dark:text-white"
                    >
                      {item.ticker}
                    </span>
                    <span
                      class={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] ${item.toneClass}`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    class="mt-0.5 truncate text-xs text-gray-600 dark:text-zinc-400"
                  >
                    {item.detail}
                  </p>
                </div>
                <span
                  class="text-[0.68rem] text-gray-500 dark:text-zinc-400 whitespace-nowrap"
                >
                  {item.time}
                </span>
              </a>
            {/each}
          </div>
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

      <div class="space-y-16 sm:space-y-20">
        {#each featureShowcaseBlocks as block}
          <article class="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div class={block.reverse ? "order-1 lg:order-2" : "order-1"}>
              <h3
                class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {block.title()}
              </h3>
              <p class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed">
                {block.description()}
              </p>
              <ul class="mt-6 space-y-3">
                {#each block.bullets as bullet}
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
                    <span class="text-gray-700 dark:text-zinc-200"
                      >{bullet()}</span
                    >
                  </li>
                {/each}
              </ul>
              <a
                href={block.href}
                class="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                {block.linkLabel()}
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

            <div
              class={block.reverse
                ? "order-2 lg:order-1 w-full"
                : "order-2 w-full"}
            >
              {#if block.media.kind === "analyst-preview"}
                <div
                  class="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gradient-to-br from-indigo-950 via-violet-900 to-blue-900 p-4 shadow-sm sm:p-6"
                >
                  <div
                    class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.2),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(255,255,255,0.16),transparent_48%)]"
                  ></div>
                  <div class="relative space-y-3.5 sm:space-y-4">
                    {#each analystPreviewMetrics as metric (metric.id)}
                      <div
                        class={`rounded-2xl border border-white/30 bg-white/95 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.25)] sm:p-5 ${metric.cardClass}`}
                      >
                        <p
                          class="text-sm font-medium text-gray-700 sm:text-base"
                        >
                          {metric.label}
                        </p>
                        <p
                          class={`mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${metric.valueClass}`}
                        >
                          {metric.value}
                        </p>
                      </div>
                    {/each}
                  </div>
                  <div
                    class="relative mt-4 rounded-xl border border-white/20 bg-black/20 p-3 backdrop-blur-sm sm:p-4"
                  >
                    <div class="mb-2.5 flex items-center justify-between">
                      <p
                        class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/70"
                      >
                        Top Analyst Calls
                      </p>
                      <a
                        href="/analysts/58aed4dbb85e9300013bf4d4"
                        class="text-[0.68rem] font-semibold text-violet-100 hover:text-white"
                      >
                        View profile
                      </a>
                    </div>
                    <div class="space-y-2">
                      {#each analystPreviewCalls as call (call.id)}
                        <a
                          href="/analysts/58aed4dbb85e9300013bf4d4"
                          class="flex items-center gap-2.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-white/95 transition hover:border-white/35 hover:bg-white/15"
                        >
                          <img
                            src={`https://financialmodelingprep.com/image-stock/${call.ticker}.png`}
                            alt={`${call.ticker} logo`}
                            class="h-7 w-7 shrink-0 rounded-full border border-white/20 p-0.5"
                            style="clip-path: circle(50%);"
                            loading="lazy"
                            on:error={(e) =>
                              ((e.currentTarget as HTMLImageElement).src =
                                "/pwa-192x192.png")}
                          />
                          <div class="min-w-0 flex-1">
                            <p
                              class="truncate text-xs font-semibold sm:text-sm"
                            >
                              {call.company}
                            </p>
                            <p class="truncate text-[0.7rem] text-white/70">
                              {call.action}
                            </p>
                          </div>
                          <span
                            class={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${call.toneClass}`}
                          >
                            {call.target}
                          </span>
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              {:else if block.media.kind === "wiim-preview"}
                <div
                  class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 sm:p-5"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p
                        class="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-zinc-400"
                      >
                        Why Price Moved
                      </p>
                      <h4
                        class="mt-1 text-base font-semibold text-gray-900 dark:text-white sm:text-lg"
                      >
                        AAPL intraday move explained
                      </h4>
                    </div>
                    <span
                      class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                    >
                      +5.4%
                    </span>
                  </div>

                  <div
                    class="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-950/60"
                  >
                    <svg
                      viewBox="0 0 320 110"
                      class="h-24 w-full text-emerald-500"
                      role="img"
                      aria-label="Price trend line"
                    >
                      <defs>
                        <linearGradient
                          id="wiimTrendGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stop-color="currentColor"
                            stop-opacity="0.25"
                          ></stop>
                          <stop
                            offset="100%"
                            stop-color="currentColor"
                            stop-opacity="0"
                          ></stop>
                        </linearGradient>
                      </defs>
                      <line
                        x1="8"
                        y1="18"
                        x2="312"
                        y2="18"
                        stroke="currentColor"
                        stroke-opacity="0.12"
                        stroke-width="1"
                      ></line>
                      <line
                        x1="8"
                        y1="56"
                        x2="312"
                        y2="56"
                        stroke="currentColor"
                        stroke-opacity="0.12"
                        stroke-width="1"
                      ></line>
                      <line
                        x1="8"
                        y1="94"
                        x2="312"
                        y2="94"
                        stroke="currentColor"
                        stroke-opacity="0.12"
                        stroke-width="1"
                      ></line>
                      <path
                        d="M10 78 C36 80,62 79,90 77 C116 75,142 76,170 74 C176 73,182 66,188 58 C198 49,210 51,220 55 C234 59,246 47,260 44 C278 40,296 42,310 38 L310 94 L10 94 Z"
                        fill="url(#wiimTrendGradient)"
                      ></path>
                      <line
                        x1="184"
                        y1="10"
                        x2="184"
                        y2="94"
                        stroke="#f59e0b"
                        stroke-opacity="0.9"
                        stroke-width="1.5"
                        stroke-dasharray="4 4"
                      ></line>
                      <circle cx="188" cy="58" r="3.2" fill="#f59e0b"></circle>
                      <text
                        x="190"
                        y="14"
                        fill="#f59e0b"
                        font-size="8"
                        font-weight="600"
                      >
                        News hit
                      </text>
                      <path
                        d="M10 78 C36 80,62 79,90 77 C116 75,142 76,170 74 C176 73,182 66,188 58 C198 49,210 51,220 55 C234 59,246 47,260 44 C278 40,296 42,310 38"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </svg>
                  </div>

                  <div class="mt-3 space-y-2">
                    {#each wiimPreviewEvents as event (event.id)}
                      <a
                        href="/news-flow"
                        class="flex items-start gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 transition hover:border-violet-300 dark:border-zinc-700 dark:hover:border-violet-500/50"
                      >
                        <span
                          class="mt-0.5 shrink-0 text-[0.68rem] font-semibold text-gray-500 dark:text-zinc-400"
                        >
                          {event.time}
                        </span>
                        <div class="min-w-0 flex-1">
                          <p
                            class="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100"
                          >
                            {event.title}
                          </p>
                          <p
                            class="truncate text-xs text-gray-600 dark:text-zinc-400"
                          >
                            {event.detail}
                          </p>
                        </div>
                        <span
                          class={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${event.toneClass}`}
                        >
                          {event.impact}
                        </span>
                      </a>
                    {/each}
                  </div>
                </div>
              {:else if block.media.kind === "financial-preview"}
                <div
                  class="relative overflow-hidden rounded-2xl border border-[#1b2538] bg-gradient-to-br from-[#02050c] via-[#060b15] to-[#081225] p-4 shadow-[0_14px_35px_rgba(2,6,23,0.55)] sm:p-6"
                >
                  <div
                    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_88%_8%,rgba(59,130,246,0.19),transparent_42%),radial-gradient(circle_at_70%_95%,rgba(139,92,246,0.14),transparent_46%)]"
                  ></div>
                  <div class="relative">
                    <div class="flex items-center justify-between">
                      <div>
                        <p
                          class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cyan-300/85"
                        >
                          Financial History
                        </p>
                        <h4
                          class="mt-1 text-base font-semibold text-zinc-100 sm:text-lg"
                        >
                          Company Fundamentals Over 30+ Years
                        </h4>
                      </div>
                      <div
                        class="inline-flex items-center gap-1 rounded-full border border-[#22304b] bg-[#091021]/95 px-2 py-1 text-[0.62rem] font-semibold text-zinc-400 shadow-sm"
                      >
                        <span
                          class="rounded-full bg-emerald-500 px-2 py-0.5 text-[#04140c]"
                          >Max</span
                        >
                        <span class="px-1">10Y</span>
                        <span class="px-1">5Y</span>
                      </div>
                    </div>

                    <div
                      class="mt-4 rounded-xl border border-[#1f2a3f] bg-[#060c19]/85 p-3 sm:p-4"
                    >
                      <div
                        class="relative h-44 rounded-lg bg-gradient-to-b from-[#081121] via-[#050b17] to-[#04070f] px-2 pb-2 pt-5"
                      >
                        <div
                          class="pointer-events-none absolute inset-x-0 top-5 h-px bg-[#1b2538]"
                        ></div>
                        <div
                          class="pointer-events-none absolute inset-x-0 top-[45%] h-px bg-[#1b2538]"
                        ></div>
                        <div
                          class="pointer-events-none absolute inset-x-0 bottom-2 h-px bg-[#2a3851]"
                        ></div>
                        <div
                          class="absolute inset-x-2 bottom-6 top-7 flex items-end gap-2 sm:gap-3"
                        >
                          {#each financialPreviewBars as bar (bar.id)}
                            <div
                              class="flex min-w-0 flex-1 flex-col items-center"
                            >
                              <div
                                class="w-full max-w-8 rounded-t-md bg-gradient-to-t from-emerald-500 via-cyan-400 to-blue-500 shadow-[0_8px_18px_rgba(45,212,191,0.3)]"
                                style={`height: ${bar.height}px`}
                              ></div>
                              <p
                                class="mt-1 truncate text-[0.58rem] font-medium text-zinc-500 sm:text-[0.62rem]"
                              >
                                {bar.year}
                              </p>
                            </div>
                          {/each}
                        </div>
                        <div
                          class="absolute left-2 top-1 rounded-md border border-[#1f2b42] bg-[#0b1529] px-2 py-0.5 text-[0.58rem] font-semibold text-zinc-100 sm:text-[0.62rem]"
                        >
                          Revenue
                        </div>
                        <div
                          class="absolute right-2 bottom-8 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[0.58rem] font-semibold text-[#04140c] sm:text-[0.62rem]"
                        >
                          2025: $392B
                        </div>
                      </div>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
                      {#each financialPreviewMetrics as metric (metric.id)}
                        <div
                          class="rounded-lg border border-[#1f2a3f] bg-[#091121]/90 px-3 py-2.5"
                        >
                          <p
                            class="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400"
                          >
                            {metric.label}
                          </p>
                          <p
                            class={`mt-1 text-sm font-semibold sm:text-base ${metric.toneClass}`}
                          >
                            {metric.value}
                          </p>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              {:else if hasMediaFailed(block.id)}
                <div
                  class="flex min-h-[16rem] items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gradient-to-br from-gray-100 to-gray-50 p-6 text-center dark:from-zinc-900 dark:to-zinc-950 sm:min-h-[22rem]"
                >
                  <div class="max-w-xs">
                    <p
                      class="text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {block.media.placeholderTitle}
                    </p>
                    <p
                      class="mt-2 text-xs leading-relaxed text-gray-600 dark:text-zinc-400"
                    >
                      {block.media.placeholderHint}
                    </p>
                  </div>
                </div>
              {:else if block.media.kind === "video"}
                <video
                  class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                  src={block.media.src}
                  poster={block.media.poster}
                  preload="none"
                  autoplay
                  muted
                  loop
                  playsinline
                  on:error={() => markMediaFailed(block.id)}
                ></video>
              {:else}
                <img
                  class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                  src={block.media.src}
                  alt={block.media.alt}
                  loading="lazy"
                  on:error={() => markMediaFailed(block.id)}
                />
              {/if}
            </div>
          </article>
        {/each}
      </div>

      <!-- More Tools compact grid -->
      <div class="mt-20 sm:mt-24">
        <h3
          class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white text-center"
        >
          {landing_more_tools_title()}
        </h3>
        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          {#each additionalToolCards as tool}
            <a
              href={tool.href}
              class="group rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
            >
              <div class="flex items-start gap-4">
                <div
                  class={`flex-shrink-0 h-11 w-11 rounded-xl ${tool.iconBgClass} flex items-center justify-center`}
                >
                  <svg
                    class={`w-6 h-6 ${tool.iconToneClass}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d={tool.iconPath}
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h4
                    class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
                  >
                    {tool.title()}
                  </h4>
                  <p
                    class="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed"
                  >
                    {tool.description()}
                  </p>
                  <span
                    class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 dark:text-violet-400"
                  >
                    {tool.cta()}
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
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: Reviews -->
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
              <svg
                class="w-5 h-5 text-gray-300 dark:text-zinc-600"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.28571 7.6C3.78214 7.6 3.3058 7.70062 2.85714 7.85812V7.6C2.85714 6.05562 4.13839 4.8 5.71429 4.8C6.50313 4.8 7.14286 4.17306 7.14286 3.4C7.14286 2.62694 6.50446 2 5.71429 2C2.56339 2 0 4.51125 0 7.6V11.8C0 14.1196 1.91875 16 4.28571 16C6.65268 16 8.57143 14.1196 8.57143 11.8C8.57143 9.48037 6.65179 7.6 4.28571 7.6ZM15.7143 7.6C15.2107 7.6 14.7344 7.70084 14.2857 7.85721V7.6C14.2857 6.05562 15.567 4.8 17.1429 4.8C17.9317 4.8 18.5714 4.17306 18.5714 3.4C18.5714 2.62694 17.9317 2 17.1429 2C13.992 2 11.4286 4.51212 11.4286 7.6V11.8C11.4286 14.1196 13.3473 16 15.7143 16C18.0813 16 20 14.1196 20 11.8C20 9.48037 18.0804 7.6 15.7143 7.6Z"
                  fill="currentColor"
                />
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

  <!-- Section 5: Trust / Social Proof -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
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
          <span
            class="font-medium text-lg text-gray-600 dark:text-zinc-300 ml-1"
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
        <div
          class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4"
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
            {landing_trust_badge_data()}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {landing_trust_badge_data_desc()}
          </p>
        </div>
        <!-- 30-Day Money Back -->
        <div
          class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4"
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
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
            {landing_trust_badge_refund()}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {landing_trust_badge_refund_desc()}
          </p>
        </div>
        <!-- 7-Day Free Trial -->
        <div
          class="text-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
            {landing_trust_badge_trial()}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {landing_trust_badge_trial_desc()}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 6: Final CTA -->
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
