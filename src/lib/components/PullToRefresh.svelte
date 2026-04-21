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

  const SPINNER = `<span class="loading loading-spinner loading-md text-violet-600 dark:text-zinc-200"></span>`;

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
          instructionsPullToRefresh: "",
          instructionsReleaseToRefresh: "",
          instructionsRefreshing: "",
          iconArrow: SPINNER,
          iconRefreshing: SPINNER,
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

<style>
  :global(.stocknear-ptr--box) {
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  :global(.stocknear-ptr--release .stocknear-ptr--box),
  :global(.stocknear-ptr--refresh .stocknear-ptr--box) {
    opacity: 1;
  }
  :global(.stocknear-ptr--text) {
    display: none;
  }
</style>
