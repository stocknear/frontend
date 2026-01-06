<script lang="ts">
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { getCache, setCache } from "$lib/store";
  import { onMount } from "svelte";

  export let title: string;
  export let content: string;
  export let id: string;
  export let callAPI: boolean = false;
  export let parameter: string;

  let infoIcon: HTMLElement;
  let isLoading: boolean = false;
  let equation: string = "";
  let isMobile: boolean = false;

  async function getInfoText(parameter: string) {
    if (isLoading) return; // Prevent multiple simultaneous calls

    isLoading = true;
    try {
      const cachedData = getCache(parameter, "getInfoText");
      if (cachedData) {
        content = cachedData?.text || "No content available";
        equation = cachedData?.equation || "";
      } else {
        const postData = { parameter };
        const response = await fetch("/api/info-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        content = result?.text || "No content available";
        equation = result?.equation || "";
        setCache(parameter, result, "getInfoText");
      }
    } catch (error) {
      console.error("Error fetching info text:", error);
      content = "Error loading content";
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Check if device is mobile
    isMobile = window.matchMedia("(max-width: 640px)").matches;

    // Listen for window resize to update mobile status
    const handleResize = () => {
      isMobile = window.matchMedia("(max-width: 640px)").matches;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  // Initialize tippy only for desktop when infoIcon is available
  $: if (infoIcon && !isMobile && !infoIcon._tippy) {
    tippy(infoIcon, {
      content: "Loading...",
      allowHTML: true,
      placement: "bottom",
      theme: "minimal",
      maxWidth: 360,
      interactive: true,
      trigger: "click mouseenter focus",
      hideOnClick: true,
      touch: ["hold", 500],
      onShow(instance) {
        // If callAPI is true, fetch the content
        if (callAPI && parameter) {
          // Show loading state immediately
          instance.setContent(`
            <div class="info-tooltip">
              <div class="info-tooltip__title ${title ? "" : "hidden"}">${title}</div>
              <div class="info-tooltip__body">Loading...</div>
            </div>
          `);

          getInfoText(parameter).then(() => {
            // Update tooltip content after API call completes
            instance.setContent(`
              <div class="info-tooltip">
                <div class="info-tooltip__title ${title ? "" : "hidden"}">${title}</div>
                <div class="info-tooltip__body">${content}</div>
                ${equation ? `<div class="info-tooltip__equation">${equation}</div>` : ""}
              </div>
            `);
          });
        } else {
          // If callAPI is false, just show the existing content
          instance.setContent(`
            <div class="info-tooltip">
              <div class="info-tooltip__title ${title ? "" : "hidden"}">${title}</div>
              <div class="info-tooltip__body">${content}</div>
              ${equation ? `<div class="info-tooltip__equation">${equation}</div>` : ""}
            </div>
          `);
        }
      },
    });
  }

  // Clean up tippy on mobile
  $: if (infoIcon && isMobile && infoIcon._tippy) {
    infoIcon._tippy.destroy();
  }
</script>

<div class="flex flex-row items-center whitespace-nowrap">
  <!-- For mobile: add label to trigger modal -->
  {#if isMobile}
    <label
      for={id}
      class="cursor-pointer p-1 text-gray-500 dark:text-gray-300 dark:sm:hover:text-white relative"
    >
      <svg
        class="absolute -right-[2px] -top-[10px] size-[10px] text-gray-600 cursor-pointer sm:hover:text-gray-800 dark:text-gray-200 dark:sm:hover:text-white"
        viewBox="0 0 4 16"
        fill="currentColor"
        style="max-width:20px"
        ><path
          d="M0 6h4v10h-4v-10zm2-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"
        ></path></svg
      >
    </label>
  {:else}
    <!-- For desktop: keep existing hover behavior -->
    <div
      bind:this={infoIcon}
      class="cursor-pointer p-1 text-gray-500 dark:text-gray-300 dark:sm:hover:text-white relative"
    >
      <svg
        class="absolute -right-[2px] -top-[10px] h-[9px] w-[9px] text-gray-600 cursor-pointer sm:hover:text-gray-800 dark:text-gray-200 dark:sm:hover:text-white"
        viewBox="0 0 4 16"
        fill="currentColor"
        style="max-width:20px"
        ><path
          d="M0 6h4v10h-4v-10zm2-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"
        ></path></svg
      >
    </div>
  {/if}
</div>

<!-- Mobile modal -->
{#if isMobile}
  <input
    type="checkbox"
    {id}
    class="modal-toggle"
    on:change={(e) => {
      if (callAPI && parameter && e.target.checked) {
        getInfoText(parameter);
      }
    }}
  />

  <dialog {id} class="modal p-3 sm:p-0 text-muted dark:text-white">
    <label
      for={id}
      class="cursor-pointer modal-backdrop bg-black/30"
    ></label>

    <!-- Mobile modal content -->
    <div
      class="modal-box rounded-2xl border border-gray-300 dark:border-zinc-700 w-full bg-white/95 dark:bg-zinc-950/95 shadow-none flex flex-col items-center"
    >
      <div
        class="mx-auto h-1 w-14 shrink-0 rounded-full bg-gray-200 dark:bg-zinc-800"
      />
      <div class="mb-4 mt-3 text-left w-full">
        {#if title}
          <h3 class="font-semibold text-lg sm:text-xl mb-3 text-gray-900 dark:text-zinc-100">
            {title}
          </h3>
        {/if}
        <div class="text-sm leading-relaxed text-gray-700 dark:text-zinc-200">
          {#if isLoading}
            Loading...
          {:else}
            {@html content}
          {/if}
        </div>
        {#if equation}
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 text-sm">
            {@html equation}
          </div>
        {/if}
      </div>

      <div class="w-full">
        <label
          for={id}
          class="mt-2 inline-flex w-full justify-center rounded-full border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-700 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-700/80 transition cursor-pointer"
        >
          Close
        </label>
      </div>
    </div>
  </dialog>
{/if}

<style>
  :global(.tippy-box[data-theme~="minimal"]) {
    background: rgba(255, 255, 255, 0.96);
    color: #111827;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  }

  :global(.dark .tippy-box[data-theme~="minimal"]) {
    background: rgba(9, 9, 11, 0.96);
    color: #e4e4e7;
    border-color: #3f3f46;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  }

  :global(.tippy-box[data-theme~="minimal"] .tippy-content) {
    padding: 0;
  }

  :global(.info-tooltip) {
    padding: 12px 14px;
    max-width: 360px;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :global(.info-tooltip__title) {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 6px;
  }

  :global(.info-tooltip__body) {
    color: inherit;
  }

  :global(.info-tooltip__equation) {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(148, 163, 184, 0.4);
  }

  :global(.dark .info-tooltip__equation) {
    border-top-color: rgba(63, 63, 70, 0.7);
  }
</style>
