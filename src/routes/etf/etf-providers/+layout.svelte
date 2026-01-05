<script lang="ts">
  import { page } from "$app/stores";
  import { formatETFName } from "$lib/utils";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  export let data;
  let currentPath = "";

  $: {
    if ($page?.url?.pathname?.startsWith("/etf/etf-providers")) {
      const parts = $page?.url?.pathname.split("/");
      if (parts?.[3]?.length !== 0) {
        currentPath = formatETFName(parts[3]) ?? "";
        console.log(currentPath);
      } else {
        currentPath = "";
      }
    }
  }
</script>

<section
  class="w-full max-w-(--breakpoint-2xl) overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li>
        <a
          href="/etf/etf-providers"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >ETF Providers</a
        >
      </li>
      {#if currentPath?.length !== 0 && typeof currentPath !== undefined}
        <li class="text-gray-800 dark:text-zinc-300">{currentPath}</li>
      {/if}
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              ETF Providers
            </h1>
          </div>

          <div class="w-full m-auto mb-10 overflow-hidden">
            <div class="w-full flex flex-col justify-center items-center">
              <slot />
            </div>
          </div>
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-3">
          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/pricing"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    Pro Subscription
                  </h2>
                  <ArrowLogo
                    class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                  />
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
                >
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href={"/analysts"}
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Top Analyst
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
              >
                Get the latest top Wall Street analyst ratings
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href={"/politicians"}
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Congress Trading
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
              >
                Get the latest top Congress trading insights.
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
