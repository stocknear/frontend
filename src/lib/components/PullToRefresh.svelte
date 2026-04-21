<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { isOpen } from "$lib/store";

  let instance: { destroy(): void } | null = null;
  let lastTouchTarget: EventTarget | null = null;
  let multiTouchActive = false;

  const onTouchStart = (e: TouchEvent) => {
    lastTouchTarget = e.target;
    if (e.touches.length > 1) multiTouchActive = true;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) multiTouchActive = false;
  };

  const CHART_SELECTOR =
    "canvas, svg, [class^='klinecharts'], [class*=' klinecharts'], [class*='klinecharts-pro'], .highcharts-container, .highcharts-root";
  const MODAL_SELECTOR =
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-state="open"][data-side]';
  const INPUT_SELECTOR =
    'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

  const startedInsideScrollableContainer = (target: Element): boolean => {
    let el: Element | null = target;
    while (el && el !== document.body && el !== document.documentElement) {
      const style = getComputedStyle(el);
      const scrollable = el as HTMLElement;
      if (
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        scrollable.scrollWidth > scrollable.clientWidth
      ) {
        return true;
      }
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        scrollable.scrollHeight > scrollable.clientHeight &&
        scrollable.scrollTop > 0
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const shouldPullToRefresh = (): boolean => {
    if (window.scrollY > 0) return false;
    if (multiTouchActive) return false;
    if (get(isOpen)) return false;
    if (document.querySelector(MODAL_SELECTOR)) return false;

    const target = lastTouchTarget as Element | null;
    if (target && typeof target.closest === "function") {
      if (target.closest('[data-pull-to-refresh="ignore"]')) return false;
      if (target.closest(CHART_SELECTOR)) return false;
      if (target.closest(INPUT_SELECTOR)) return false;
      if (startedInsideScrollableContainer(target)) return false;
    }

    const active = document.activeElement as HTMLElement | null;
    if (active && active.matches?.(INPUT_SELECTOR)) return false;

    return true;
  };

  const iconArrow = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`;
  const iconRefreshing = `<span class="loading loading-spinner loading-sm text-violet-600 dark:text-zinc-200"></span>`;

  const getMarkup = () =>
    `<div class="__PREFIX__box flex flex-col items-center justify-end gap-1 pb-3 pt-14 bg-white dark:bg-[#131214] border-b border-gray-200 dark:border-zinc-800 text-violet-600 dark:text-zinc-200 shadow-sm">
       <div class="__PREFIX__content flex flex-col items-center justify-center gap-1.5">
         <div class="__PREFIX__icon flex items-center justify-center transition-transform duration-200 ease-out"></div>
         <div class="__PREFIX__text text-[11px] font-medium tracking-wide opacity-80"></div>
       </div>
     </div>`;

  const getStyles = () =>
    `.__PREFIX__ptr{pointer-events:none;font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;top:0;left:0;right:0;position:fixed;z-index:60;overflow:hidden;}
     .__PREFIX__release .__PREFIX__icon{transform:rotate(180deg);}`;

  onMount(() => {
    const isTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    if (!isTouch) return;

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    (async () => {
      try {
        const PullToRefresh = (await import("pulltorefreshjs")).default;
        instance = PullToRefresh.init({
          mainElement: "body",
          triggerElement: "body",
          classPrefix: "stocknear-ptr--",
          distThreshold: 60,
          distMax: 80,
          distReload: 50,
          refreshTimeout: 200,
          passive: true,
          instructionsPullToRefresh: "Pull to refresh",
          instructionsReleaseToRefresh: "Release to refresh",
          instructionsRefreshing: "Refreshing",
          iconArrow,
          iconRefreshing,
          getMarkup,
          getStyles,
          shouldPullToRefresh,
          onRefresh: () => window.location.reload(),
        });
      } catch (err) {
        console.error("PullToRefresh init failed:", err);
      }
    })();
  });

  onDestroy(() => {
    instance?.destroy();
    instance = null;
    if (typeof document !== "undefined") {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    }
  });
</script>
