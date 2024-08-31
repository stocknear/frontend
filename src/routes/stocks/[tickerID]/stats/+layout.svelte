<script lang="ts">
  import { stockTicker, screenWidth } from "$lib/store";
  import { page } from "$app/stores";

  let displaySubSection = "overview";

  if (displaySubSection) {
    const parts = $page?.url?.pathname.split("/");
    const sectionMap = {
      "market-cap": "market-cap",
      employees: "employees",
      income: "income",
      "balance-sheet": "balance-sheet",
      "cash-flow": "cash-flow",
      ratios: "ratios",
    };

    const foundSection = parts?.find((part) => Object?.values(sectionMap)?.includes(part));

    displaySubSection = Object?.keys(sectionMap)?.find((key) => sectionMap[key] === foundSection) || "overview";
  }

  function changeSubSection(state) {
    const subSectionMap = {
      "market-cap": "/stats/market-cap",
      employees: "/stats/employees",
      income: "/stats/income",
      "balance-sheet": "/stats/balance-sheet",
      "cash-flow": "/stats/cash-flow",
      ratios: "/stats/ratios",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}/stats`);
    }
  }
</script>

<section class="w-auto max-w-5xl bg-[#09090B] overflow-hidden text-black h-full mb-40">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-fit sm:w-full sm:max-w-2xl">
      <div class="m-auto">
        <div class="-ml-2 sm:ml-8 w-screen sm:w-full {$screenWidth < 640 ? 'overflow-auto scrollbar' : 'no-scrollbar'} mb-2">
          <ul class="pr-4 sm:pr-0 w-screen flex flex-row items-center bg-[#09090B] overflow-x-scroll sm:overflow-hidden space-x-4 rtl:space-x-reverse py-2">
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats`}
                on:click={() => changeSubSection("overview")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'overview' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Overview
              </a>
              <div class="{displaySubSection === 'overview' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/ratios`}
                on:click={() => changeSubSection("ratios")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'ratios' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Ratios
              </a>
              <div class="{displaySubSection === 'ratios' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[2rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/income`}
                on:click={() => changeSubSection("income")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'income' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Income
              </a>
              <div class="{displaySubSection === 'income' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[2.5rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/cash-flow`}
                on:click={() => changeSubSection("cash-flow")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'cash-flow' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Cashflow
              </a>
              <div class="{displaySubSection === 'cash-flow' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[2.5rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/balance-sheet`}
                on:click={() => changeSubSection("balance-sheet")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'balance-sheet' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Balance
              </a>
              <div class="{displaySubSection === 'balance-sheet' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[2.5rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/market-cap`}
                on:click={() => changeSubSection("market-cap")}
                class="whitespace-nowrap px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'market-cap' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Market Cap
              </a>
              <div class="{displaySubSection === 'market-cap' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[3.5rem]" />
            </li>
            <li class="cursor-pointer flex flex-col items-center">
              <a
                href={`/stocks/${$stockTicker}/stats/employees`}
                on:click={() => changeSubSection("employees")}
                class="px-2 text-sm sm:text-[1rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'employees' ? 'text-white ' : 'bg-[#09090B]'}"
              >
                Employees
              </a>
              <div class="{displaySubSection === 'employees' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[3.5rem]" />
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
