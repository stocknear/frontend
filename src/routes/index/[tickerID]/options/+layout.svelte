<script lang="ts">
  import { indexTicker } from "$lib/store";
  import { page } from "$app/stores";

  export let data;

  let displaySubSection = "overview";

  function changeSubSection(state) {
    const subSectionMap = {
      overview: "/options",
      "max-pain": "/options/max-pain",
      "hottest-contracts": "/options/hottest-contracts",
      "unusual-activity": "/options/unusual-activity",
      "contract-lookup": "/options/contract-lookup",
      volatility: "/options/volatility",
      gex: "/options/gex",
      dex: "/options/dex",
      oi: "/options/oi",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/index/${$indexTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/index/${$indexTicker}/statistics`);
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname.split("/");
      const sectionMap = {
        overview: "overview",
        "max-pain": "max-pain",
        "hottest-contracts": "hottest-contracts",
        "unusual-activity": "unusual-activity",
        "contract-lookup": "contract-lookup",
        volatility: "volatility",
        gex: "gex",
        dex: "dex",
        oi: "oi",
      };

      const foundSection = parts?.find((part) =>
        Object?.values(sectionMap)?.includes(part),
      );

      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "overview";
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <nav
            class="sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
          >
            <ul class="flex flex-row items-center w-full">
              <a
                href={`/index/${$indexTicker}/options`}
                on:click={() => changeSubSection("overview")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'overview'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                Overview
              </a>

              <a
                href={`/index/${$indexTicker}/options/contract-lookup`}
                on:click={() => changeSubSection("contract-lookup")}
                class="p-2 px-5 cursor-pointer {displaySubSection ===
                'contract-lookup'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                Contract Lookup
              </a>

              <a
                href={`/index/${$indexTicker}/options/hottest-contracts`}
                on:click={() => changeSubSection("hottest-contracts")}
                class="p-2 px-5 cursor-pointer {displaySubSection ===
                'hottest-contracts'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                Hottest Contracts
              </a>
              <a
                href={`/index/${$indexTicker}/options/max-pain`}
                on:click={() => changeSubSection("max-pain")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'max-pain'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                Max Pain
              </a>
              <a
                href={`/index/${$indexTicker}/options/volatility`}
                on:click={() => changeSubSection("volatility")}
                class="p-2 px-5 cursor-pointer {displaySubSection ===
                'volatility'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                Volatility
              </a>
              <a
                href={`/index/${$indexTicker}/options/oi`}
                on:click={() => changeSubSection("oi")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'oi'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                OI
              </a>

              <a
                href={`/index/${$indexTicker}/options/gex`}
                on:click={() => changeSubSection("gex")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'gex'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                GEX
              </a>
              <a
                href={`/index/${$indexTicker}/options/dex`}
                on:click={() => changeSubSection("dex")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'dex'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                DEX
              </a>
            </ul>
          </nav>
          <div class="mt-2 sm:mt-0">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
