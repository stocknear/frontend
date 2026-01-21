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
      //volatility: "/options/volatility",
      greeks: "/options/greeks",
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
        //volatility: "volatility",
        greeks: "greeks",
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
            class="sm:ml-4 pt-2 text-sm whitespace-nowrap overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base"
            >
              <a
                href={`/index/${$indexTicker}/options`}
                on:click={() => changeSubSection("overview")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'overview'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Overview
              </a>

              <a
                href={`/index/${$indexTicker}/options/contract-lookup`}
                on:click={() => changeSubSection("contract-lookup")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'contract-lookup'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Contract Lookup
              </a>
              <a
                href={`/index/${$indexTicker}/options/unusual-activity`}
                on:click={() => changeSubSection("unusual-activity")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'unusual-activity'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Unusual Activity
              </a>

              <a
                href={`/index/${$indexTicker}/options/hottest-contracts`}
                on:click={() => changeSubSection("hottest-contracts")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'hottest-contracts'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Hottest Contracts
              </a>
              <a
                href={`/index/${$indexTicker}/options/max-pain`}
                on:click={() => changeSubSection("max-pain")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'max-pain'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Max Pain
              </a>
              <a
                href={`/index/${$indexTicker}/options/greeks`}
                on:click={() => changeSubSection("greeks")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'greeks'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Greeks
              </a>
              <!--
              <a
                href={`/index/${$indexTicker}/options/volatility`}
                on:click={() => changeSubSection("volatility")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'volatility'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Volatility
              </a>
              -->
              <a
                href={`/index/${$indexTicker}/options/oi`}
                on:click={() => changeSubSection("oi")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'oi'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                OI
              </a>

              <a
                href={`/index/${$indexTicker}/options/gex/strike`}
                on:click={() => changeSubSection("gex")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'gex'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                GEX
              </a>
              <a
                href={`/index/${$indexTicker}/options/dex/strike`}
                on:click={() => changeSubSection("dex")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'dex'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
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
