<script lang="ts">
    import { fade, fly } from "svelte/transition";

    export let thoughtSteps = [];

    let showThoughts = true;
</script>

{#if showThoughts && thoughtSteps?.length > 0}
    <div
        class="mx-0 mb-4 transition-all duration-300 opacity-100 overflow-hidden"
        in:fade={{ duration: 200 }}
    >
        <div
            class="rounded-[5px] py-5 pt-4 pb-0 border border-gray-300 dark:border-gray-700 max-h-[300px] flex flex-col relative transition-all duration-300"
        >
            <div class="flex items-center justify-between px-5 mb-2">
                <div class="flex items-center gap-x-2">
                    <div class="relative">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="w-5 h-5 text-amber-500 dark:text-amber-500 stroke-black dark:stroke-white"
                            aria-hidden="true"
                        >
                            <path
                                d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
                            ></path>
                            <path d="M9 18h6"></path>
                            <path d="M10 22h4"></path>
                        </svg>
                    </div>
                    <span
                        class="text-center text-base font-medium text-neutral-950 dark:text-white"
                    >
                        Planning
                    </span>
                </div>
            </div>

            <div
                class="px-5 pl-6 mb-5 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-600 flex-1"
                style="scrollbar-width: thin; scrollbar-gutter: stable;"
            >
                {#if thoughtSteps && thoughtSteps.length > 0}
                    <!-- Display only thought step content -->
                    <div class="space-y-2">
                        {#each thoughtSteps as step, index (index)}
                            {#if step.content}
                                <div
                                    class="flex items-start"
                                    in:fly={{ y: 20, duration: 100, delay: 50 }}
                                >
                                    <div class="mt-2 mr-3">
                                        <div
                                            class="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
                                        ></div>
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="prose prose-sm max-w-none dark:prose-invert"
                                        >
                                            <p
                                                class="mb-3 text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed"
                                            >
                                                {step?.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
