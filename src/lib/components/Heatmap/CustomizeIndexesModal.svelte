<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { localizedHref } from "$lib/i18n/navigation";
  import type { HeatmapIndex } from "$lib/heatmap";
  import {
    common_reset,
    heatmap_based_on_etf,
    heatmap_customize_description,
    heatmap_customize_filter_placeholder,
    heatmap_customize_title,
    pricing_pro_title,
    stock_screener_nothing_found,
  } from "$lib/paraglide/messages.js";

  export let indexes: HeatmapIndex[] = [];
  export let selected: string[] = [];
  export let entitled = false;

  const dispatch = createEventDispatcher();

  let searchTerm = "";

  $: term = searchTerm?.trim()?.toLowerCase() ?? "";
  $: filtered =
    indexes?.filter(
      (index) =>
        !term ||
        `${index?.symbol} ${index?.name}`?.toLowerCase()?.includes(term),
    ) ?? [];
</script>

<input type="checkbox" id="heatmapIndexModal" class="modal-toggle" />

<dialog id="heatmapIndexModal" class="modal p-0 sm:p-2 lg:p-0">
  <label
    for="heatmapIndexModal"
    on:click={() => (searchTerm = "")}
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box relative z-20 h-full max-h-none w-full max-w-none overflow-y-auto rounded-none border-0 bg-surface-card text-fg shadow-2xl sm:mx-4 sm:h-auto sm:max-h-[42rem] sm:max-w-2xl sm:rounded-container sm:border sm:border-line"
  >
    <div class="relative flex flex-col w-full">
      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-surface-card pb-4 pt-5 border-line border-b"
      >
        <div class="flex flex-row items-center justify-between mb-1">
          <h2 class="text-[1rem] sm:type-h2 text-fg">
            {heatmap_customize_title()}
          </h2>
          <label
            for="heatmapIndexModal"
            on:click={() => (searchTerm = "")}
            class="inline-block cursor-pointer absolute right-4 top-4 text-fg-muted hover:text-fg transition"
            aria-label="Close modal"
          >
            <svg
              class="w-6 h-6 sm:w-7 sm:h-7"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              /></svg
            >
          </label>
        </div>

        <p class="text-sm text-fg-muted mb-3">
          {heatmap_customize_description()}
        </p>

        <div class="flex flex-row items-center gap-2.5">
          <div class="relative grow">
            <div
              class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-fg-subtle"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            <input
              autocomplete="off"
              id="heatmapIndexFilter"
              class="focus:outline-none placeholder:text-fg-subtle block w-full p-2 ps-10 text-sm border border-line rounded-full bg-surface-page/60"
              placeholder={heatmap_customize_filter_placeholder()}
              bind:value={searchTerm}
            />
          </div>

          <button
            on:click={() => dispatch("reset")}
            class="shrink-0 cursor-pointer rounded-full border border-line bg-surface-card px-4 py-2 text-sm font-medium text-fg-muted transition hover:border-line-strong hover:text-accent"
          >
            {common_reset()}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 pt-3">
        {#each filtered as index (index?.symbol)}
          {@const locked = index?.tier === "pro" && !entitled}
          {#if locked}
            <a
              href={localizedHref("/pricing")}
              class="flex flex-row items-center gap-3 rounded-container border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-raised"
            >
              <svg
                class="w-4 h-4 shrink-0 text-fg-subtle"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                /></svg
              >
              <span class="flex grow flex-col leading-tight">
                <span class="text-[0.95rem] text-fg">{index?.name}</span>
                <span class="text-xs text-fg-muted"
                  >{heatmap_based_on_etf({ symbol: index?.symbol })}</span
                >
              </span>
              <span
                class="shrink-0 rounded-control bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent"
                >{pricing_pro_title()}</span
              >
            </a>
          {:else}
            <label
              for={`heatmap-index-${index?.symbol}`}
              class="flex cursor-pointer flex-row items-center gap-3 rounded-container border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-raised"
            >
              <input
                id={`heatmap-index-${index?.symbol}`}
                type="checkbox"
                checked={selected?.includes(index?.symbol)}
                on:click={() => dispatch("toggle", { symbol: index?.symbol })}
                class="h-[18px] w-[18px] shrink-0 cursor-pointer rounded-control ring-offset-0 border border-line bg-surface-card"
              />
              <span class="flex grow flex-col leading-tight">
                <span class="text-[0.95rem] text-fg">{index?.name}</span>
                <span class="text-xs text-fg-muted"
                  >{heatmap_based_on_etf({ symbol: index?.symbol })}</span
                >
              </span>
            </label>
          {/if}
        {/each}

        {#if term?.length > 0 && filtered?.length === 0}
          <div class="mt-5 font-semibold text-[1rem] sm:text-lg">
            {stock_screener_nothing_found()}
          </div>
        {/if}
      </div>
    </div>
  </div>
</dialog>
