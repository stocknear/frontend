<script lang="ts">
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  type ItemWithId = {
    id?: string | number;
    [key: string]: unknown;
  };

  export let items: ItemWithId[] = [];
  export let delay = 1400;
  export let maxVisible = 6;
  export let className = "";
  export { className as class };

  let itemsToShow: ItemWithId[] = [];
  let cursor = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isMounted = false;

  let previousItems = items;
  let previousDelay = delay;
  let previousMaxVisible = maxVisible;

  const getItemKey = (item: ItemWithId, index: number) =>
    item?.id ?? `${item?.ticker ?? "item"}-${item?.timestamp ?? ""}-${index}`;

  const getLayer = (position: number) =>
    Math.max(1, Math.floor(Math.max(1, maxVisible)) - position);

  function resetWithItems(sourceItems: ItemWithId[]) {
    cursor = 0;
    itemsToShow = sourceItems?.length > 0 ? [sourceItems[0]] : [];
  }

  function stopTicker() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTicker() {
    stopTicker();

    if (!items?.length || items.length === 1 || delay <= 0) return;

    const visibleLimit = Math.max(1, maxVisible);
    intervalId = setInterval(() => {
      if (!items?.length) return;

      cursor = (cursor + 1) % items.length;
      const nextItem = items[cursor];
      itemsToShow = [nextItem, ...itemsToShow].slice(0, visibleLimit);
    }, delay);
  }

  function refreshTicker() {
    if (!items?.length) {
      cursor = 0;
      itemsToShow = [];
      stopTicker();
      return;
    }

    resetWithItems(items);
    startTicker();
  }

  onMount(() => {
    isMounted = true;
    refreshTicker();

    return () => {
      isMounted = false;
      stopTicker();
    };
  });

  $: if (
    isMounted &&
    (items !== previousItems || delay !== previousDelay || maxVisible !== previousMaxVisible)
  ) {
    previousItems = items;
    previousDelay = delay;
    previousMaxVisible = maxVisible;
    refreshTicker();
  }
</script>

<div class={`relative isolate flex flex-col gap-3 overflow-hidden ${className}`}>
  {#each itemsToShow as item, index (getItemKey(item, index))}
    <div
      animate:flip={{ duration: 300, easing: cubicOut }}
      in:fly={{ y: -8, opacity: 0, duration: 220, easing: cubicOut }}
      out:fly={{ y: 18, opacity: 0, duration: 240, easing: cubicOut }}
      class="relative w-full"
      style={`z-index: ${getLayer(index)};`}
    >
      <slot {item} {index} />
    </div>
  {/each}
</div>
