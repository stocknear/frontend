<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { isOpen } from "$lib/store";

  // Data-driven config (sensible defaults; overridable for reuse).
  export let threshold = 60; // px the user must pull before a refresh triggers
  export let maxPull = 90; // visual cap on how far the badge travels
  export let resistance = 2.5; // higher = stiffer rubber-band damping
  export let onRefresh: () => void = () => window.location.reload();

  const BADGE_SIZE = 36; // px (w-9/h-9), used to hide the badge above the top edge
  const ACTIVATION = 6; // px of vertical travel before a pull is recognised

  // --- reactive gesture state ---
  let pull = 0; // current (damped) pull distance in px
  let pulling = false; // finger is actively pulling
  let refreshing = false; // refresh fired; badge spins until reload navigates

  // --- internal gesture bookkeeping ---
  let armed = false; // touchstart passed all guards & page was at the top
  let startY = 0;
  let startX = 0;
  let rafId: number | null = null;
  let moveAttached = false;
  let lastTouchTarget: EventTarget | null = null;
  let multiTouchActive = false;

  // Badge follows the finger 1:1 while pulling; eases back only on release.
  $: badgeTransition = pulling
    ? "none"
    : "transform 0.25s ease, opacity 0.2s ease";
  $: badgeOpacity = refreshing ? 1 : Math.min(1, pull / threshold);
  $: badgeScale = 0.8 + 0.2 * Math.min(1, pull / threshold);
  // Translate from hidden (above the edge) down to the pull distance.
  $: badgeTranslateY = (refreshing ? threshold : pull) - BADGE_SIZE;
  // While pulling, rotate the spinner proportionally as a progress cue.
  $: spinnerRotation = refreshing ? 0 : (pull / threshold) * 270;

  // --- exclusion guards (reused verbatim from the previous implementation) ---
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

  // True only when a pull from the very top is allowed right now.
  const passesGuards = (): boolean => {
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

  // Diminishing-returns rubber band: 1:1 near zero, asymptotes toward maxPull.
  const damp = (raw: number): number =>
    Math.min(maxPull, raw / (1 + raw / (maxPull * resistance)));

  const detachMove = () => {
    if (moveAttached) {
      document.removeEventListener("touchmove", onTouchMove);
      moveAttached = false;
    }
  };

  const reset = () => {
    pulling = false;
    armed = false;
    pull = 0;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    detachMove();
  };

  const onTouchStart = (e: TouchEvent) => {
    lastTouchTarget = e.target;
    if (e.touches.length > 1) {
      multiTouchActive = true;
      reset();
      return;
    }
    if (refreshing) return;

    // Arm a candidate gesture only when a pull is currently allowed.
    if (e.touches.length === 1 && window.scrollY === 0 && passesGuards()) {
      armed = true;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      if (!moveAttached) {
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        moveAttached = true;
      }
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!armed || refreshing || multiTouchActive) return;

    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;

    if (!pulling) {
      // Decide intent on the first meaningful movement.
      if (Math.abs(dy) < ACTIVATION && Math.abs(dx) < ACTIVATION) return;
      // Begin a pull only for a downward, vertical-dominant gesture; anything
      // else (scrolling up, horizontal swipe) disarms so it never refreshes.
      if (dy > 0 && dy > Math.abs(dx)) {
        pulling = true;
      } else {
        reset();
        return;
      }
    }

    // Active pull: suppress native scroll/overscroll and follow the finger.
    if (e.cancelable) e.preventDefault();
    const next = damp(Math.max(0, dy));
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        pull = next;
        rafId = null;
      });
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) multiTouchActive = false;

    if (pulling && !refreshing && pull >= threshold) {
      refreshing = true;
      pulling = false;
      detachMove();
      // Badge keeps spinning until the reload navigates away.
      onRefresh();
      return;
    }
    reset();
  };

  onMount(() => {
    const isTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    if (!isTouch) return;

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
  });

  onDestroy(() => {
    if (typeof document === "undefined") return;
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("touchcancel", onTouchEnd);
    detachMove();
    if (rafId !== null) cancelAnimationFrame(rafId);
  });
</script>

{#if pull > 0 || refreshing}
  <div
    class="pointer-events-none fixed top-0 left-1/2 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-md"
    style="transform: translate(-50%, {badgeTranslateY}px) scale({badgeScale}); opacity: {badgeOpacity}; transition: {badgeTransition};"
    aria-hidden="true"
  >
    <svg
      class="h-5 w-5 text-violet-600 dark:text-zinc-200 {refreshing
        ? 'animate-spin'
        : ''}"
      style={refreshing ? "" : `transform: rotate(${spinnerRotation}deg);`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
{/if}
