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
      theme: "light-border",
      maxWidth: 400,
      interactive: true,
      trigger: "click mouseenter focus",
      hideOnClick: true,
      touch: ["hold", 500],
      onShow(instance) {
        // If callAPI is true, fetch the content
        if (callAPI && parameter) {
          // Show loading state immediately
          instance.setContent(`
            <div class="text-sm text-white p-2 w-full ">
              <div class="font-semibold text-lg mb-2  ${title ? "" : "hidden"}">${title}</div>
              <div class="font-normal">Loading...</div>
            </div>
          `);

          getInfoText(parameter).then(() => {
            // Update tooltip content after API call completes
            instance.setContent(`
              <div class="text-sm text-white p-2 w-full ">
                <div class="font-semibold text-lg mb-1 ${title ? "" : "hidden"}">${title}</div>
                <div class="font-normal w-full pt-2 border-t border-gray-500">${content}</div>
                ${equation ? `<div class="mt-2 pt-2 w-full border-t border-gray-500">${equation}</div>` : ""}
              </div>
            `);
          });
        } else {
          // If callAPI is false, just show the existing content
          instance.setContent(`
            <div class="text-sm text-white p-2 w-full ">
              <div class="font-semibold text-lg mb-2 ${title ? "" : "hidden"}">${title}</div>
              <div class="font-normal mb-2">${content}</div>
              ${equation ? `<div class="mt-2 pt-2 w-full border-t border-gray-500">${equation}</div>` : ""}
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
    <label for={id} class="cursor-pointer modal-backdrop bg-[#000]/30"></label>

    <!-- Mobile modal content -->
    <div
      class="modal-box rounded border border-gray-300 dark:border-gray-600 w-full bg-white dark:bg-secondary flex flex-col items-center"
    >
      <div class="mx-auto h-1.5 w-20 shrink-0 rounded-full" />
      <div class="mb-5 text-center">
        {#if title}
          <h3 class="font-bold text-xl sm:text-2xl mb-5">{title}</h3>
        {/if}
        <span class="text-[1rem] font-normal">
          {#if isLoading}
            Loading...
          {:else}
            {@html content}
          {/if}
        </span>
        {#if equation}
          <div class="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
            {@html equation}
          </div>
        {/if}
      </div>

      <div class=" w-full">
        <label
          for={id}
          class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
        >
          Close
        </label>
      </div>
    </div>
  </dialog>
{/if}
