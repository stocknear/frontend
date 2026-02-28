<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import BreadCrumb from "$lib/components/BreadCrumb.svelte";
    import { watchlistFullWidth } from "$lib/store";

    export let data;

    $: tabs = [
        {
            title: "Stocks",
            path: "/watchlist/stocks",
        },
        {
            title: "Options",
            path: "/watchlist/options",
        },
    ];

    let activeIdx = 0;

    $: if ($page.url.pathname === "/watchlist/stocks") {
        activeIdx = 0;
    } else if ($page.url.pathname.startsWith("/watchlist/options")) {
        activeIdx = 1;
    }

    function toggleFullWidth() {
        const newVal = !$watchlistFullWidth;
        watchlistFullWidth.set(newVal);
        try {
            localStorage.setItem("watchlist-full-width", String(newVal));
        } catch (e) {}
    }

    onMount(() => {
        try {
            const saved = localStorage?.getItem("watchlist-full-width");
            if (saved !== null) {
                watchlistFullWidth.set(saved === "true");
            }
        } catch (e) {}
    });
</script>

<section
    class="w-full overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200 transition-all duration-300 {$watchlistFullWidth
        ? 'max-w-full'
        : 'max-w-3xl sm:max-w-[1400px]'}"
>
    <BreadCrumb
        containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
        <li>
            <a
                href="/"
                class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >Home</a
            >
        </li>
        <li class="text-gray-800 dark:text-zinc-300">
            {activeIdx === 0 ? "Watchlist" : "Options Watchlist"}
        </li>
    </BreadCrumb>

    <div class="w-full overflow-hidden m-auto mt-5">
        <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div
                class="relative flex justify-center items-start overflow-hidden w-full"
            >
                <main class="w-full lg:pr-5">
                    <div
                        class="mb-2 border-b border-gray-300 dark:border-zinc-700"
                    >
                        <h1
                            class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
                        >
                            {activeIdx === 0
                                ? "Watchlist"
                                : "Options Watchlist"}
                        </h1>
                    </div>

                    <nav
                        class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
                    >
                        <ul
                            class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
                        >
                            {#each tabs as item, index}
                                <a
                                    href={item?.path}
                                    class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                                    index
                                        ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                                        : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                                >
                                    {item.title}
                                </a>
                            {/each}

                            <!-- Full Width Toggle -->
                            <button
                                on:click={toggleFullWidth}
                                title={$watchlistFullWidth
                                    ? "Exit Full Width"
                                    : "Expand Full Width"}
                                class="ml-auto hidden 3xl:flex cursor-pointer transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-violet-800 dark:hover:text-violet-400 flex-row items-center px-3 py-1.5 rounded-full gap-2 {$watchlistFullWidth
                                    ? 'border-violet-400 dark:border-violet-500'
                                    : ''}"
                            >
                                {#if $watchlistFullWidth}
                                    <svg
                                        class="w-4 h-4 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <polyline points="4 14 10 14 10 20" />
                                        <polyline points="20 10 14 10 14 4" />
                                        <line
                                            x1="14"
                                            y1="10"
                                            x2="21"
                                            y2="3"
                                        />
                                        <line
                                            x1="3"
                                            y1="21"
                                            x2="10"
                                            y2="14"
                                        />
                                    </svg>
                                {:else}
                                    <svg
                                        class="w-4 h-4 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <polyline points="15 3 21 3 21 9" />
                                        <polyline points="9 21 3 21 3 15" />
                                        <line
                                            x1="21"
                                            y1="3"
                                            x2="14"
                                            y2="10"
                                        />
                                        <line
                                            x1="3"
                                            y1="21"
                                            x2="10"
                                            y2="14"
                                        />
                                    </svg>
                                {/if}
                                <span class="truncate text-[0.85rem] sm:text-sm"
                                    >{$watchlistFullWidth
                                        ? "Normal Width"
                                        : "Full Width"}</span
                                >
                            </button>
                        </ul>
                    </nav>

                    <slot />
                </main>
            </div>
        </div>
    </div>
</section>
