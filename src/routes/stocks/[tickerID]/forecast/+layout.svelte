<script lang="ts">
  import { stockTicker, screenWidth } from "$lib/store";
  import { onDestroy } from "svelte";
  import { page } from "$app/stores";

  let displaySubSection = "overview";

  if (displaySubSection) {
    const parts = $page?.url?.pathname.split("/");
    const sectionMap = {
      overview: "overview",
      ai: "ai",
      analyst: "analyst",
    };

    const foundSection = parts?.find((part) => Object?.values(sectionMap)?.includes(part));

    displaySubSection = Object?.keys(sectionMap)?.find((key) => sectionMap[key] === foundSection) || "overview";
  }

  function changeSubSection(state) {
    const subSectionMap = {
      overview: "/forecast",
      ai: "/forecast/ai",
      analyst: "/forecast/analyst",
    };

    console.log(state);
    console.log(subSectionMap[state]);

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}/stats`);
    }
  }

  const unsubscribe = page.subscribe(($page) => {
    const splitRoute = $page.url.pathname.split("/");
    const routeState = splitRoute[splitRoute.length - 1] !== "forecast" ? splitRoute[splitRoute.length - 1] : "overview";

    changeSubSection(routeState);
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<section class="w-auto max-w-5xl bg-[#09090B] overflow-hidden text-black h-full mb-40">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-fit sm:w-full sm:max-w-2xl">
      <div class="m-auto">
        <div class="-ml-2 sm:ml-8 w-screen sm:w-full {$screenWidth < 640 ? 'overflow-auto scrollbar' : 'no-scrollbar'} mb-2">
          <ul class="pr-4 sm:pr-0 w-screen flex flex-row items-center bg-[#09090B] overflow-x-scroll sm:overflow-hidden space-x-4 rtl:space-x-reverse py-2">
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/forecast`}
                on:click={() => changeSubSection("overview")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'overview' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Overview
              </a>
              <div class="{displaySubSection === 'overview' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a href={`/stocks/${$stockTicker}/forecast/ai`} on:click={() => changeSubSection("ai")} class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'ai' ? 'text-white ' : 'bg-[#09090B]'}">
                AI
              </a>
              <div class="{displaySubSection === 'ai' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/forecast/analyst`}
                on:click={() => changeSubSection("analyst")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'analyst' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Analysts
              </a>
              <div class="{displaySubSection === 'analyst' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4rem]" />
            </li>
          </ul>
        </div>
      </div>
    </main>

    <slot />
  </div>
</section>

<style>
  .scrollbar {
    display: grid;
    grid-gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }
</style>
