<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import DashboardView from "$lib/components/Dashboard/DashboardView.svelte";

  import {
    home_seo_description,
    home_seo_keywords,
    home_seo_title,
    home_structured_description,
    home_structured_feature_dark_pool_monitoring,
    home_structured_feature_earnings_volatility,
    home_structured_feature_implied_volatility,
    home_structured_feature_live_options_flow,
    home_structured_feature_market_catalysts,
    home_structured_feature_options_chain,
    home_structured_feature_unusual_options_activity,
    home_structured_name,
    landing_hero_title,
    landing_hero_subtitle,
    landing_hero_cta_primary,
    landing_hero_cta_secondary,
    landing_hero_badge_investors,
    landing_hero_badge_trustpilot,
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
    landing_more_tools_title,
    landing_more_tool_analyst_title,
    landing_more_tool_analyst_desc,
    landing_more_tool_analyst_link,
    landing_more_tool_financial_title,
    landing_more_tool_financial_desc,
    landing_more_tool_financial_link,
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
    landing_trust_reviews,
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
    landing_hero_cta_note,
    landing_card_alert_header,
    landing_card_alert_cat_earnings,
    landing_card_alert_cat_price,
    landing_card_alert_cat_analyst,
    landing_card_alert_1_title,
    landing_card_alert_1_detail,
    landing_card_alert_1_time,
    landing_card_alert_2_title,
    landing_card_alert_2_detail,
    landing_card_alert_2_time,
    landing_card_alert_3_title,
    landing_card_alert_3_detail,
    landing_card_alert_3_time,
    landing_card_alert_footer_pre,
    landing_card_alert_footer_value,
    landing_card_flow_header,
    landing_card_flow_premium_label,
    landing_card_flow_bullish,
    landing_card_flow_bearish,
    landing_card_flow_1_tag,
    landing_card_flow_1_signal,
    landing_card_flow_2_tag,
    landing_card_flow_2_signal,
    landing_card_flow_3_tag,
    landing_card_flow_3_signal,
    landing_card_flow_footer_pre,
    landing_card_flow_footer_value,
    landing_card_flow_footer_post,
    landing_card_wiim_explained,
    landing_card_wiim_accounted,
    landing_card_wiim_cat_earnings,
    landing_card_wiim_cat_analyst,
    landing_card_wiim_cat_whale,
    landing_card_wiim_1_title,
    landing_card_wiim_1_detail,
    landing_card_wiim_2_title,
    landing_card_wiim_2_detail,
    landing_card_wiim_3_title,
    landing_card_wiim_3_detail,
    landing_alerts_stat_speed,
    landing_alerts_stat_types,
    landing_how_label,
    landing_how_title,
    landing_how_step1_title,
    landing_how_step1_description,
    landing_how_step2_title,
    landing_how_step2_description,
    landing_how_step3_title,
    landing_how_step3_description,
    landing_alerts_label,
    landing_alerts_title,
    landing_alerts_description,
    landing_alerts_speed,
    landing_alerts_cta,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;

  let failedMedia = new Set<string>();

  type QuickStartStep = {
    step: string;
    title: string;
    detail: string;
  };

  const quickStartSteps: QuickStartStep[] = [
    {
      step: "01",
      title: landing_how_step1_title(),
      detail: landing_how_step1_description(),
    },
    {
      step: "02",
      title: landing_how_step2_title(),
      detail: landing_how_step2_description(),
    },
    {
      step: "03",
      title: landing_how_step3_title(),
      detail: landing_how_step3_description(),
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
        kind: "wiim-preview";
      }
    | {
        kind: "options-flow-preview";
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
      href: "/register",
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
      href: "/register",
      linkLabel: landing_feature_flow_link,
      reverse: true,
      media: {
        kind: "options-flow-preview",
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
      href: "/register",
      linkLabel: landing_feature_wiim_link,
      media: {
        kind: "wiim-preview",
      },
    },
  ];

  const primaryFeatureShowcaseBlocks = featureShowcaseBlocks.slice(0, 2);

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
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
    {
      href: "/politicians",
      title: landing_more_tool_congress_title,
      description: landing_more_tool_congress_desc,
      cta: landing_more_tool_congress_link,
      iconPath:
        "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
    {
      href: "/unusual-order-flow",
      title: landing_more_tool_darkpool_title,
      description: landing_more_tool_darkpool_desc,
      cta: landing_more_tool_darkpool_link,
      iconPath:
        "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
    {
      href: "/portfolio",
      title: landing_more_tool_portfolio_title,
      description: landing_more_tool_portfolio_desc,
      cta: landing_more_tool_portfolio_link,
      iconPath:
        "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
    {
      href: "/analysts",
      title: landing_more_tool_analyst_title,
      description: landing_more_tool_analyst_desc,
      cta: landing_more_tool_analyst_link,
      iconPath:
        "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
    {
      href: "/stocks/AAPL/financials/custom",
      title: landing_more_tool_financial_title,
      description: landing_more_tool_financial_desc,
      cta: landing_more_tool_financial_link,
      iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      iconBgClass: "bg-gray-100 dark:bg-zinc-800",
      iconToneClass: "text-gray-600 dark:text-zinc-400",
    },
  ];

  const hasMediaFailed = (id: string) => failedMedia.has(id);

  function markMediaFailed(id: string) {
    if (failedMedia.has(id)) return;
    failedMedia.add(id);
    failedMedia = failedMedia;
  }

  type NotificationShowcaseItem = {
    id: string;
    ticker: string;
    category: string;
    title: string;
    detail: string;
    value: string;
    time: string;
    toneClass: string;
  };

  const notificationShowcaseItems: NotificationShowcaseItem[] = [
    {
      id: "nvda-earnings",
      ticker: "NVDA",
      category: landing_card_alert_cat_earnings(),
      title: landing_card_alert_1_title(),
      detail: landing_card_alert_1_detail(),
      value: "+8.2%",
      time: landing_card_alert_1_time(),
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      id: "aapl-price",
      ticker: "AAPL",
      category: landing_card_alert_cat_price(),
      title: landing_card_alert_2_title(),
      detail: landing_card_alert_2_detail(),
      value: "$234.20",
      time: landing_card_alert_2_time(),
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    },
    {
      id: "meta-analyst",
      ticker: "META",
      category: landing_card_alert_cat_analyst(),
      title: landing_card_alert_3_title(),
      detail: landing_card_alert_3_detail(),
      value: "+14.5%",
      time: landing_card_alert_3_time(),
      toneClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    },
  ];

  type OptionsFlowPreviewTrade = {
    id: string;
    ticker: string;
    flowTag: string;
    sentiment: string;
    putCall: "Calls" | "Puts";
    contract: string;
    premiumValue: number;
    signal: string;
    time: string;
    toneClass: string;
    borderColor: string;
  };

  const optionsFlowPreviewTrades: OptionsFlowPreviewTrade[] = [
    {
      id: "nvda-call-sweep",
      ticker: "NVDA",
      flowTag: landing_card_flow_1_tag(),
      sentiment: landing_card_flow_bullish(),
      putCall: "Calls",
      contract: "Sep 20, 2026 $140 Call",
      premiumValue: 22_800_000,
      signal: landing_card_flow_1_signal(),
      time: "09:41 ET",
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
      borderColor: "#10b981",
    },
    {
      id: "tsla-put-block",
      ticker: "TSLA",
      flowTag: landing_card_flow_2_tag(),
      sentiment: landing_card_flow_bearish(),
      putCall: "Puts",
      contract: "Aug 16, 2026 $180 Put",
      premiumValue: 16_400_000,
      signal: landing_card_flow_2_signal(),
      time: "10:18 ET",
      toneClass:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
      borderColor: "#f43f5e",
    },
    {
      id: "aapl-call-block",
      ticker: "AAPL",
      flowTag: landing_card_flow_3_tag(),
      sentiment: landing_card_flow_bullish(),
      putCall: "Calls",
      contract: "Jan 17, 2027 $260 Call",
      premiumValue: 14_700_000,
      signal: landing_card_flow_3_signal(),
      time: "11:03 ET",
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
      borderColor: "#10b981",
    },
  ];

  const optionsFlowPreviewSummary = optionsFlowPreviewTrades.reduce(
    (acc, trade) => {
      acc.totalPremium += trade.premiumValue;
      if (trade.putCall === "Calls") acc.callPremium += trade.premiumValue;
      else acc.putPremium += trade.premiumValue;
      return acc;
    },
    { totalPremium: 0, callPremium: 0, putPremium: 0 },
  );

  const optionsFlowPreviewCallPremiumPct =
    optionsFlowPreviewSummary.totalPremium > 0
      ? Math.round(
          (optionsFlowPreviewSummary.callPremium /
            optionsFlowPreviewSummary.totalPremium) *
            100,
        )
      : 0;

  const optionsFlowPreviewPutPremiumPct =
    optionsFlowPreviewSummary.totalPremium > 0
      ? 100 - optionsFlowPreviewCallPremiumPct
      : 0;

  function formatOptionsFlowPremium(value: number) {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  // --- WIIM Candlestick Chart ---
  type WiimCandle = { o: number; h: number; l: number; c: number };
  const wiimCandles: WiimCandle[] = [
    { o: 224.8, h: 225.3, l: 224.4, c: 225.0 },
    { o: 225.0, h: 225.2, l: 224.5, c: 224.7 },
    { o: 228.2, h: 229.6, l: 227.8, c: 229.3 },
    { o: 229.3, h: 230.1, l: 228.8, c: 229.7 },
    { o: 229.7, h: 230.0, l: 229.0, c: 229.2 },
    { o: 229.2, h: 230.5, l: 229.0, c: 230.3 },
    { o: 230.3, h: 231.0, l: 229.7, c: 230.8 },
    { o: 230.8, h: 231.2, l: 230.2, c: 230.5 },
    { o: 230.5, h: 233.0, l: 230.3, c: 232.8 },
    { o: 232.8, h: 233.5, l: 232.3, c: 233.0 },
    { o: 233.0, h: 233.3, l: 232.4, c: 232.6 },
    { o: 232.6, h: 233.4, l: 232.4, c: 233.2 },
    { o: 233.2, h: 233.5, l: 232.8, c: 233.0 },
    { o: 233.0, h: 233.8, l: 232.9, c: 233.6 },
    { o: 233.6, h: 235.6, l: 233.4, c: 235.3 },
    { o: 235.3, h: 236.0, l: 234.8, c: 235.5 },
    { o: 235.5, h: 235.8, l: 234.9, c: 235.1 },
    { o: 235.1, h: 235.9, l: 234.9, c: 235.7 },
    { o: 235.7, h: 236.1, l: 235.3, c: 235.5 },
    { o: 235.5, h: 236.4, l: 235.3, c: 236.1 },
    { o: 236.1, h: 236.9, l: 235.9, c: 236.7 },
    { o: 236.7, h: 237.6, l: 236.5, c: 237.42 },
  ];

  // Chart geometry (SVG viewBox 0 0 400 180)
  const WIIM_C = { L: 32, R: 8, T: 24, B: 22, W: 400, H: 180 } as const;
  const wiimPMax = 238.5;
  const wiimPRange = 15; // 223.5 → 238.5
  const wiimIW = WIIM_C.W - WIIM_C.L - WIIM_C.R;
  const wiimIH = WIIM_C.H - WIIM_C.T - WIIM_C.B;
  const wiimCS = wiimIW / wiimCandles.length;
  const wiimCW = wiimCS * 0.55;

  function wiimY(price: number) {
    return WIIM_C.T + (wiimIH * (wiimPMax - price)) / wiimPRange;
  }

  const wiimCandlePos = wiimCandles.map((c, i) => {
    const cx = WIIM_C.L + wiimCS * (i + 0.5);
    const g = c.c >= c.o;
    const bt = wiimY(Math.max(c.o, c.c));
    const bb = wiimY(Math.min(c.o, c.c));
    return {
      cx,
      bx: cx - wiimCW / 2,
      wt: wiimY(c.h),
      wb: wiimY(c.l),
      bt,
      bh: Math.max(bb - bt, 1),
      g,
    };
  });

  const wiimGridPrices = [224, 227, 230, 233, 236];
  const wiimTimeLabels = [
    { label: "8:00", i: 0 },
    { label: "9:30", i: 6 },
    { label: "11:00", i: 12 },
    { label: "1:00", i: 20 },
  ].map((t) => ({ label: t.label, x: WIIM_C.L + wiimCS * (t.i + 0.5) }));

  type WiimPreviewEvent = {
    id: string;
    num: number;
    candleIndex: number;
    time: string;
    category: string;
    title: string;
    detail: string;
    impact: string;
    impactValue: number;
    toneClass: string;
  };

  const wiimPreviewEvents: WiimPreviewEvent[] = [
    {
      id: "earnings",
      num: 1,
      candleIndex: 2,
      time: "08:31",
      category: landing_card_wiim_cat_earnings(),
      title: landing_card_wiim_1_title(),
      detail: landing_card_wiim_1_detail(),
      impact: "+2.8%",
      impactValue: 2.8,
      toneClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      id: "analysts",
      num: 2,
      candleIndex: 8,
      time: "10:02",
      category: landing_card_wiim_cat_analyst(),
      title: landing_card_wiim_2_title(),
      detail: landing_card_wiim_2_detail(),
      impact: "+1.6%",
      impactValue: 1.6,
      toneClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    },
    {
      id: "flow",
      num: 3,
      candleIndex: 14,
      time: "11:44",
      category: landing_card_wiim_cat_whale(),
      title: landing_card_wiim_3_title(),
      detail: landing_card_wiim_3_detail(),
      impact: "+0.8%",
      impactValue: 0.8,
      toneClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    },
  ];

  const wiimEventMarkers = wiimPreviewEvents.map((e) => ({
    ...e,
    mx: WIIM_C.L + wiimCS * (e.candleIndex + 0.5),
  }));

  const wiimTotalExplained = wiimPreviewEvents.reduce(
    (s, e) => s + e.impactValue,
    0,
  );
  const wiimTotalMove = 5.6;
  const wiimExplainedPct = Math.round(
    (wiimTotalExplained / wiimTotalMove) * 100,
  );

  const reviewCards = [
    {
      name: landing_review_1_name(),
      role: landing_review_1_role(),
      text: landing_review_1_text(),
      initials: "JG",
      color: "bg-violet-600",
    },
    {
      name: landing_review_2_name(),
      role: landing_review_2_role(),
      text: landing_review_2_text(),
      initials: "RC",
      color: "bg-emerald-600",
    },
    {
      name: landing_review_3_name(),
      role: landing_review_3_role(),
      text: landing_review_3_text(),
      initials: "EB",
      color: "bg-blue-600",
    },
    {
      name: landing_review_4_name(),
      role: landing_review_4_role(),
      text: landing_review_4_text(),
      initials: "GF",
      color: "bg-amber-600",
    },
    {
      name: landing_review_5_name(),
      role: landing_review_5_role(),
      text: landing_review_5_text(),
      initials: "PT",
      color: "bg-rose-600",
    },
    {
      name: landing_review_6_name(),
      role: landing_review_6_role(),
      text: landing_review_6_text(),
      initials: "SS",
      color: "bg-cyan-600",
    },
  ];

  const featuredReviewCards = reviewCards.slice(0, 3);
  const featuredToolCards = additionalToolCards.slice(0, 4);

  const ctaPrimaryClass =
    "inline-flex items-center justify-center rounded-full bg-gray-900 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200";

  const ctaSecondaryClass =
    "inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-7 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900";

  const heroProofBadgeClass =
    "inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200";

  // Hero showcase slides
  const showcaseSlides = [
    {
      title: "Follow the Flow",
      description:
        "Spot unusual options activity in real time and track the contracts that matter most",
      src: "/img/landing-page/options-flow.png",
      alt: "Real-time options flow dashboard",
    },
    {
      title: "Beautiful Financial Charts",
      description:
        "30+ years of financial history in one platform, built for modern fundamental analysis",
      src: "/img/landing-page/financial-chart.png",
      alt: "Beautiful financial charts with 30+ years of company data",
    },
    {
      title: "Congress Trading",
      description:
        "Track portfolios and trading activity of influential political figures and decision makers",
      src: "/img/landing-page/congress-trading.png",
      alt: "Congress trading activity tracker",
    },
  ];

  let activeSlide = 0;
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      activeSlide = (activeSlide + 1) % showcaseSlides.length;
    }, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function selectSlide(index: number) {
    activeSlide = index;
    startAutoplay();
  }

  function nextSlide() {
    activeSlide = (activeSlide + 1) % showcaseSlides.length;
    startAutoplay();
  }

  function prevSlide() {
    activeSlide =
      (activeSlide - 1 + showcaseSlides.length) % showcaseSlides.length;
    startAutoplay();
  }

  onMount(() => {
    startAutoplay();
  });

  onDestroy(() => {
    stopAutoplay();
  });

  function lazyPlayVideo(node: HTMLVideoElement) {
    let sourceLoaded = false;

    const ensureVideoSourceLoaded = () => {
      if (sourceLoaded) return;
      const src = node.dataset.src;
      if (!src) return;

      if (node.dataset.poster) {
        node.poster = node.dataset.poster;
      }

      node.src = src;
      node.load();
      sourceLoaded = true;
    };

    if (typeof IntersectionObserver === "undefined") {
      ensureVideoSourceLoaded();
      node.play().catch(() => {});
      return {
        destroy() {},
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ensureVideoSourceLoaded();
            node.play().catch(() => {});
          } else {
            node.pause();
          }
        }
      },
      { threshold: 0.25, rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      },
    };
  }

  function lazyLoadImage(node: HTMLImageElement) {
    let sourceLoaded = false;

    const ensureImageSourceLoaded = () => {
      if (sourceLoaded) return;
      const src = node.dataset.src;
      if (!src) return;

      if (node.dataset.srcset) {
        node.srcset = node.dataset.srcset;
      }

      node.src = src;
      sourceLoaded = true;
    };

    if (typeof IntersectionObserver === "undefined") {
      ensureImageSourceLoaded();
      return {
        destroy() {},
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ensureImageSourceLoaded();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.01, rootMargin: "180px 0px" },
    );

    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
      },
    };
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://financialmodelingprep.com" />
  <link rel="dns-prefetch" href="https://financialmodelingprep.com" />
</svelte:head>

{#if data?.user}
  <DashboardView {data} {form} />
{:else}
  <!-- Shared SVG symbol definitions (rendered once, referenced via <use>) -->
  <svg class="hidden" aria-hidden="true">
    <symbol id="star-icon" viewBox="0 0 24 24">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </symbol>
  </svg>

  <SEO
    title={home_seo_title()}
    description={home_seo_description()}
    keywords={home_seo_keywords()}
    structuredData={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: home_structured_name(),
      description: home_structured_description(),
      url: "https://stocknear.com",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        home_structured_feature_live_options_flow(),
        home_structured_feature_unusual_options_activity(),
        home_structured_feature_dark_pool_monitoring(),
        home_structured_feature_implied_volatility(),
        home_structured_feature_options_chain(),
        home_structured_feature_earnings_volatility(),
        home_structured_feature_market_catalysts(),
      ],
      provider: {
        "@type": "Organization",
        name: home_structured_name(),
        url: "https://stocknear.com",
      },
    }}
  />

  <div class="text-gray-700 dark:text-zinc-200 w-full">
    <!-- Section 1: Hero -->
    <section
      class="relative w-full overflow-hidden border-b border-gray-300 bg-white dark:border-zinc-700 dark:bg-zinc-950/60"
    >
      <div
        class="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-14 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24"
      >
        <div class="mx-auto max-w-3xl text-center">
          <a
            href="/register"
            class="inline-flex w-fit items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
          >
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Built for retail investors
          </a>

          <h1
            class="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-gray-900 dark:text-white"
          >
            {landing_hero_title()}
          </h1>
          <p
            class="mt-5 text-base sm:text-xl leading-relaxed text-gray-700 dark:text-zinc-300"
          >
            {landing_hero_subtitle()}
          </p>

          <div
            class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a href="/register" class={ctaPrimaryClass}>
              {landing_hero_cta_primary()}
            </a>
            <a href="/pricing" class={ctaSecondaryClass}>
              {landing_hero_cta_secondary()}
            </a>
          </div>

          <p class="mt-4 text-sm font-medium text-zinc-500">
            {landing_hero_cta_note()}
          </p>

          <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span class={heroProofBadgeClass}>
              {landing_hero_badge_investors()}
            </span>
            <a
              href="https://www.trustpilot.com/review/stocknear.com"
              target="_blank"
              rel="noopener noreferrer"
              class={heroProofBadgeClass}
            >
              {landing_trust_rating()}
              {landing_hero_badge_trustpilot()}
            </a>
            <span class={heroProofBadgeClass}>{landing_alerts_speed()}</span>
          </div>
        </div>

      
      </div>
    </section>



    <!-- Section 2.5: Real-Time Alerts Showcase -->
    <section class="border-t border-gray-300 dark:border-zinc-700">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <div
          class="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center"
        >
          <!-- Left copy -->
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
            >
              {landing_alerts_label()}
            </p>
            <h2
              class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              {landing_alerts_title()}
            </h2>
            <p
              class="mt-4 text-base sm:text-lg text-gray-700 dark:text-zinc-300 max-w-2xl"
            >
              {landing_alerts_description()}
            </p>
            <div
              class="mt-5 flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400"
            >
              <div class="flex items-center gap-1.5">
                <svg
                  class="h-4 w-4 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="13 17 18 12 13 7"></polyline><polyline
                    points="6 17 11 12 6 7"
                  ></polyline></svg
                >
                <span class="font-medium">{landing_alerts_stat_speed()}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg
                  class="h-4 w-4 text-violet-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                  ></path><path d="M13.73 21a2 2 0 01-3.46 0"></path></svg
                >
                <span class="font-medium">{landing_alerts_stat_types()}</span>
              </div>
            </div>
            <div class="mt-6">
              <a
                href="/register"
                class={`${ctaPrimaryClass} px-6 py-2.5 text-sm`}
              >
                {landing_alerts_cta()}
              </a>
            </div>
          </div>

          <!-- Right card: notification feed -->
          <div
            class="overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 shadow-sm"
          >
            <!-- Card header -->
            <div
              class="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-4 py-3 sm:px-5"
            >
              <span
                class="text-sm font-bold text-gray-900 dark:text-white sm:text-base"
                >{landing_card_alert_header()}</span
              >
            </div>

            <!-- Notification rows -->
            <div class="divide-y divide-gray-100 dark:divide-zinc-800">
              {#each notificationShowcaseItems as item (item.id)}
                <div class="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <img
                    data-src={`https://financialmodelingprep.com/image-stock/${item.ticker}.png`}
                    alt={`${item.ticker} logo`}
                    class="h-9 w-9 shrink-0 rounded-full border border-gray-200 p-0.5 dark:border-zinc-700"
                    style="clip-path: circle(50%);"
                    loading="lazy"
                    width="36"
                    height="36"
                    use:lazyLoadImage
                    on:error={(e) =>
                      ((e.currentTarget as HTMLImageElement).src =
                        "/pwa-192x192.png")}
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span
                        class="text-sm font-bold text-gray-900 dark:text-white sm:text-base"
                        >{item.ticker}</span
                      >
                      <span
                        class={`rounded px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.04em] sm:text-xs sm:px-2 ${item.toneClass}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p
                      class="mt-0.5 text-[0.82rem] font-semibold text-gray-800 dark:text-zinc-200 sm:text-sm"
                    >
                      {item.title}
                    </p>
                    <p
                      class="text-xs text-gray-500 dark:text-zinc-400 sm:text-[0.8rem]"
                    >
                      {item.detail}
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p
                      class={`text-sm font-bold sm:text-base ${item.value.startsWith("+") ? "text-emerald-700 dark:text-emerald-300" : "text-gray-900 dark:text-white"}`}
                    >
                      {item.value}
                    </p>
                    <p
                      class="mt-0.5 text-[0.72rem] text-gray-400 dark:text-zinc-500 sm:text-xs"
                    >
                      {item.time}
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Footer -->
            <div
              class="border-t border-gray-200 dark:border-zinc-700 px-4 py-2.5 sm:px-5"
            >
              <p class="text-xs text-gray-500 dark:text-zinc-400 sm:text-sm">
                {landing_card_alert_footer_pre()}
                <span class="font-semibold text-gray-700 dark:text-zinc-300"
                  >{landing_card_alert_footer_value()}</span
                >
              </p>
              <p class="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
                Example of live alert layout
              </p>
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
          {#each primaryFeatureShowcaseBlocks as block}
            <article
              class="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center"
            >
              <div class={block.reverse ? "order-1 lg:order-2" : "order-1"}>
                <h3
                  class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {block.title()}
                </h3>
                <p
                  class="mt-4 text-gray-800 dark:text-zinc-300 leading-relaxed"
                >
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
                  class={`${ctaPrimaryClass} mt-6 px-6 py-2.5 text-sm`}
                >
                  {block.linkLabel()}
                </a>
              </div>

              <div
                class={block.reverse
                  ? "order-2 lg:order-1 w-full"
                  : "order-2 w-full"}
              >
                {#if block.media.kind === "options-flow-preview"}
                  <div
                    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                  >
                    <!-- Header -->
                    <div
                      class="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-4 py-3 sm:px-5"
                    >
                      <div>
                        <p
                          class="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-zinc-400 sm:text-sm"
                        >
                          {landing_card_flow_header()}
                        </p>
                        <p
                          class="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl"
                        >
                          {formatOptionsFlowPremium(
                            optionsFlowPreviewSummary.totalPremium,
                          )}
                          <span
                            class="text-sm font-medium text-gray-500 dark:text-zinc-400 ml-1"
                            >{landing_card_flow_premium_label()}</span
                          >
                        </p>
                      </div>
                    </div>

                    <!-- Sentiment bar -->
                    <div class="px-4 pt-3 sm:px-5">
                      <div class="flex items-center justify-between mb-1.5">
                        <div class="flex items-center gap-1.5">
                          🐂
                          <span
                            class="text-xs font-semibold text-gray-700 dark:text-zinc-300 sm:text-sm"
                          >
                            {landing_card_flow_bullish()}
                            {optionsFlowPreviewCallPremiumPct}%
                          </span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span
                            class="text-xs font-semibold text-gray-700 dark:text-zinc-300 sm:text-sm"
                          >
                            {optionsFlowPreviewPutPremiumPct}% {landing_card_flow_bearish()}
                          </span>
                          🐻
                        </div>
                      </div>
                      <div
                        class="flex h-2.5 w-full overflow-hidden rounded-full"
                      >
                        <div
                          class="bg-emerald-500 transition-all"
                          style={`width: ${optionsFlowPreviewCallPremiumPct}%`}
                        ></div>
                        <div
                          class="bg-rose-500 transition-all"
                          style={`width: ${optionsFlowPreviewPutPremiumPct}%`}
                        ></div>
                      </div>
                    </div>

                    <!-- Trade feed -->
                    <div class="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 space-y-2">
                      {#each optionsFlowPreviewTrades as trade (trade.id)}
                        <div
                          class="flex items-center gap-3 rounded-xl border border-gray-200 border-l-[3px] bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900/75"
                          style={`border-left-color: ${trade.borderColor};`}
                        >
                          <img
                            data-src={`https://financialmodelingprep.com/image-stock/${trade.ticker}.png`}
                            alt={`${trade.ticker} logo`}
                            class="h-9 w-9 shrink-0 rounded-full border border-gray-200 p-0.5 dark:border-zinc-700"
                            style="clip-path: circle(50%);"
                            loading="lazy"
                            width="36"
                            height="36"
                            use:lazyLoadImage
                            on:error={(e) =>
                              ((e.currentTarget as HTMLImageElement).src =
                                "/pwa-192x192.png")}
                          />
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span
                                class="text-sm font-bold text-gray-900 dark:text-white sm:text-base"
                                >{trade.ticker}</span
                              >
                              <span
                                class={`rounded px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.04em] sm:text-xs sm:px-2 ${trade.toneClass}`}
                              >
                                {trade.sentiment}
                                {trade.flowTag}
                              </span>
                            </div>
                            <p
                              class="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 sm:text-sm"
                            >
                              {trade.contract}
                              <span
                                class="text-gray-300 dark:text-zinc-600 mx-1"
                                >&middot;</span
                              >
                              {trade.signal}
                            </p>
                          </div>
                          <div class="shrink-0 text-right">
                            <p
                              class={`text-sm font-bold sm:text-base ${trade.putCall === "Calls" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
                            >
                              {formatOptionsFlowPremium(trade.premiumValue)}
                            </p>
                            <p
                              class="text-[0.72rem] text-gray-400 dark:text-zinc-500 sm:text-xs"
                            >
                              {trade.time}
                            </p>
                          </div>
                        </div>
                      {/each}
                    </div>

                    <!-- Footer -->
                    <div
                      class="border-t border-gray-200 dark:border-zinc-700 px-4 py-2.5 sm:px-5"
                    >
                      <p
                        class="text-xs text-gray-500 dark:text-zinc-400 sm:text-sm"
                      >
                        {landing_card_flow_footer_pre()}
                        <span
                          class="font-semibold text-gray-700 dark:text-zinc-300"
                          >{landing_card_flow_footer_value()}</span
                        >
                        {landing_card_flow_footer_post()}
                      </p>
                    </div>
                  </div>
                {:else if block.media.kind === "wiim-preview"}
                  <div
                    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                  >
                    <!-- Stock header -->
                    <div
                      class="flex items-center gap-3 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 sm:px-5"
                    >
                      <img
                        data-src="https://financialmodelingprep.com/image-stock/AAPL.png"
                        alt="AAPL logo"
                        class="h-9 w-9 shrink-0 rounded-full border border-gray-200 p-0.5 dark:border-zinc-700"
                        style="clip-path: circle(50%);"
                        width="36"
                        height="36"
                        loading="lazy"
                        use:lazyLoadImage
                        on:error={(e) =>
                          ((e.currentTarget as HTMLImageElement).src =
                            "/pwa-192x192.png")}
                      />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-sm font-bold text-gray-900 dark:text-white"
                            >AAPL</span
                          >
                          <span class="text-xs text-gray-500 dark:text-zinc-400"
                            >Apple Inc.</span
                          >
                        </div>
                        <div class="flex items-center gap-2 mt-0.5">
                          <span
                            class="text-sm font-semibold text-gray-900 dark:text-zinc-100"
                            >$237.42</span
                          >
                          <span
                            class="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                            >+$12.62 (+5.6%)</span
                          >
                        </div>
                      </div>
                    </div>

                    <!-- Candlestick chart -->
                    <div class="px-3 pt-3 sm:px-4">
                      <svg
                        viewBox="0 0 400 180"
                        class="h-48 w-full sm:h-56"
                        role="img"
                        aria-label="AAPL intraday candlestick chart with catalyst markers"
                      >
                        <!-- Grid lines + Y-axis labels -->
                        {#each wiimGridPrices as price}
                          {@const y = wiimY(price)}
                          <line
                            x1={WIIM_C.L}
                            y1={y}
                            x2={WIIM_C.W - WIIM_C.R}
                            y2={y}
                            stroke="#e5e7eb"
                            stroke-width="0.5"
                            class="dark:stroke-zinc-700/60"
                          ></line>
                          <text
                            x={WIIM_C.L - 4}
                            y={y + 3}
                            fill="#9ca3af"
                            font-size="7"
                            text-anchor="end"
                            class="dark:fill-zinc-500">${price}</text
                          >
                        {/each}

                        <!-- X-axis time labels -->
                        {#each wiimTimeLabels as tl}
                          <text
                            x={tl.x}
                            y={WIIM_C.H - 4}
                            fill="#9ca3af"
                            font-size="7"
                            text-anchor="middle"
                            class="dark:fill-zinc-500">{tl.label}</text
                          >
                        {/each}

                        <!-- Event marker dashed lines (behind candles) -->
                        {#each wiimEventMarkers as em (em.id)}
                          <line
                            x1={em.mx}
                            y1={WIIM_C.T}
                            x2={em.mx}
                            y2={WIIM_C.H - WIIM_C.B}
                            stroke="#a78bfa"
                            stroke-opacity="0.25"
                            stroke-width="1"
                            stroke-dasharray="3 2"
                          ></line>
                        {/each}

                        <!-- Candlesticks -->
                        {#each wiimCandlePos as cd, i}
                          <line
                            x1={cd.cx}
                            y1={cd.wt}
                            x2={cd.cx}
                            y2={cd.wb}
                            stroke={cd.g ? "#10b981" : "#f43f5e"}
                            stroke-width="1.2"
                          ></line>
                          <rect
                            x={cd.bx}
                            y={cd.bt}
                            width={wiimCW}
                            height={cd.bh}
                            fill={cd.g ? "#10b981" : "#f43f5e"}
                            rx="0.8"
                          ></rect>
                        {/each}

                        <!-- Event marker circles (on top of candles) -->
                        {#each wiimEventMarkers as em (em.id)}
                          <circle
                            cx={em.mx}
                            cy={12}
                            r="7.5"
                            fill="white"
                            stroke="#a78bfa"
                            stroke-width="2"
                            class="dark:fill-zinc-900"
                          ></circle>
                          <text
                            x={em.mx}
                            y={15.5}
                            fill="#a78bfa"
                            font-size="8.5"
                            font-weight="700"
                            text-anchor="middle">{em.num}</text
                          >
                        {/each}
                      </svg>
                    </div>

                    <!-- Move explained bar -->
                    <div class="mx-3 mt-2.5 sm:mx-4">
                      <div class="flex items-center justify-between mb-1.5">
                        <span
                          class="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-zinc-400"
                          >{landing_card_wiim_explained()}</span
                        >
                        <span
                          class="text-[0.62rem] font-bold text-emerald-600 dark:text-emerald-400"
                          >{wiimExplainedPct}% of +{wiimTotalMove}% {landing_card_wiim_accounted()}</span
                        >
                      </div>
                      <div
                        class="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden"
                      >
                        <div
                          class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={`width: ${wiimExplainedPct}%`}
                        ></div>
                      </div>
                    </div>

                    <!-- Event timeline — 3 catalysts -->
                    <div class="px-3 pb-4 pt-3 sm:px-4 sm:pb-5 space-y-2">
                      {#each wiimPreviewEvents as event (event.id)}
                        <div
                          class="flex items-start gap-3 rounded-xl border border-gray-200 border-l-[3px] bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/75"
                          style="border-left-color: #10b981;"
                        >
                          <span
                            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.6rem] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200 sm:h-7 sm:w-7 sm:text-xs"
                          >
                            {event.num}
                          </span>
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                              <span
                                class={`rounded px-1.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.06em] sm:text-[0.65rem] sm:px-2 ${event.toneClass}`}
                              >
                                {event.category}
                              </span>
                              <span
                                class="text-[0.62rem] text-gray-400 dark:text-zinc-500 sm:text-xs"
                                >{event.time} ET</span
                              >
                            </div>
                            <p
                              class="mt-0.5 text-[0.82rem] font-semibold leading-tight text-gray-900 dark:text-zinc-100 sm:text-sm"
                            >
                              {event.title}
                            </p>
                            <p
                              class="text-[0.7rem] text-gray-500 dark:text-zinc-400 sm:text-[0.8rem]"
                            >
                              {event.detail}
                            </p>
                          </div>
                          <span
                            class="mt-0.5 shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 sm:text-sm sm:px-3 sm:py-1.5"
                          >
                            {event.impact}
                          </span>
                        </div>
                      {/each}
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
                    data-src={block.media.src}
                    data-poster={block.media.poster}
                    preload="none"
                    muted
                    loop
                    playsinline
                    width="640"
                    height="360"
                    on:error={() => markMediaFailed(block.id)}
                    use:lazyPlayVideo
                  ></video>
                {:else}
                  <img
                    class="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                    data-src={block.media.src}
                    alt={block.media.alt}
                    loading="lazy"
                    on:error={() => markMediaFailed(block.id)}
                    use:lazyLoadImage
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
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {#each featuredToolCards as tool}
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
          {#each featuredReviewCards as review}
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
                      aria-hidden="true"
                    >
                      <use href="#star-icon" />
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
                aria-hidden="true"
              >
                <use href="#star-icon" />
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
          <a
            href="https://www.trustpilot.com/review/stocknear.com"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 inline-flex text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            {landing_trust_reviews()}
          </a>
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
          <a href="/register" class={`${ctaPrimaryClass} px-8 py-3.5`}>
            {landing_cta_primary()}
          </a>
          <a href="/pricing" class={`${ctaSecondaryClass} px-8 py-3.5`}>
            {landing_cta_secondary()}
          </a>
        </div>
      </div>
    </section>
  </div>
{/if}
