<script lang="ts">
  import { etfTicker } from "$lib/store";
  import { formatString, sectorNavigation } from "$lib/utils";
  import { goto } from "$app/navigation";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let sectorList;

  let showFullStats = false;

  function sectorSelector(sector) {
    const selectedSector = sectorNavigation?.find(
      (item) => item?.title === sector,
    );

    if (selectedSector) {
      goto(selectedSector?.link);
    } else {
      // Handle the case when the sector is not found
      console.error(`Sector not found: ${sector}`);
    }
  }

  $: {
    if (
      $etfTicker &&
      typeof window !== "undefined" &&
      typeof sectorList !== "undefined" &&
      sectorList?.length !== 0
    ) {
      showFullStats = false;
    }
  }
</script>

<section class="bg-default overflow-hidden text-white h-full sm:mb-0">
  <div class="flex justify-center m-auto h-full overflow-hidden">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="w-full">
        <div class="flex flex-row items-center">
          <label
            for="sectorWeightingInfo"
            class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
          >
            Sector Weighting Breakdown
          </label>
          <InfoModal
            title={"Sector Weighting Breakdown"}
            content={"Each ETF possesses unique investment characteristics, with allocations in various sectors. Some sectors inherently carry higher risks, yet they also offer the potential for greater returns."}
            id={"sectorWeightingInfo"}
          />
        </div>
        {#if sectorList?.length !== 0}
          <div class="text-white text-md mt-3">
            Which sectors does <span class="text-blue-400">${$etfTicker}</span>
            invest in? We can break it down into {sectorList?.length} distinct sectors.
          </div>

          <div class="w-full rounded-full flex justify-center items-center">
            <div class="flex flex-col items-center w-full">
              <!--Start Progress-->
              {#each showFullStats ? sectorList : sectorList?.slice(0, 3) as item, index}
                <div
                  on:click={() => sectorSelector(item?.industry)}
                  class="shadow-lg bg-primary w-full rounded p-4 mb-5 flex flex-row items-center {index ===
                  0
                    ? 'mt-4'
                    : ''} {index === 2 &&
                  !showFullStats &&
                  sectorList?.length > 3
                    ? 'opacity-[0.5]'
                    : ''}"
                >
                  <div class="flex flex-col -mt-2 w-full">
                    <div class="flex flex-row items-center w-full">
                      <span
                        class="text-white text-sm sm:text-md text-start mb-2 mr-auto mt-2"
                      >
                        {formatString(item?.industry)}
                      </span>
                      <span class="text-white text-sm sm:text-md ml-auto">
                        {item?.exposure <= 0.01
                          ? "< 0.01%"
                          : item?.exposure?.toFixed(2) + "%"}
                      </span>
                    </div>
                    <progress
                      class="progress [&::-webkit-progress-value]:bg-[#00FC50] [&::-moz-progress-bar]:bg-[#00FC50]"
                      value={item?.exposure}
                      max="100"
                    ></progress>
                  </div>
                </div>
              {/each}

              <!--End Progress-->
            </div>
          </div>

          {#if sectorList?.length >= 4}
            <label
              on:click={() => (showFullStats = !showFullStats)}
              class="cursor-pointer flex justify-center items-center"
            >
              <svg
                class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} "
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="#2A323C"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"
                /></svg
              >
            </label>
          {/if}
        {:else}
          <h2
            class=" mt-10 justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto"
          >
            No data available
            <svg
              class="w-10 sm:w-12 inline-block"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="#334155"
                d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"
              /></svg
            >
          </h2>
        {/if}
      </div>
    </div>
  </div>
</section>
