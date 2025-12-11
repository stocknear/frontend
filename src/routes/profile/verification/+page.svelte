<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    export let data;
    export let form;

    let token = $page.url.searchParams.get("token") ?? "";
    let isLoading = true;

    let displayText = "Processing...";

    onMount(async () => {
        if (token?.length > 0) {
            displayText = "Verifying...";
            try {
                const response = await fetch(`/api/verify-email`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                });

                displayText = await response?.json();
                console.log(displayText);
            } catch (error) {
                console.error("Error during verification:", error);
                displayText = "An error occurred!";
            }
        } else {
            displayText = "No Valid Token!";
        }
        isLoading = false;
    });
</script>

<SEO title="Verify Email" description="" />

<section
    class="flex flex-col items-center min-h-screen w-full max-w-3xl m-auto px-3 sm:px-0"
>
    <div class="relative">
        <a href="/">
            <img
                class="m-auto w-16 sm:w-20 rounded-full pt-4"
                src="/pwa-192x192.png"
                alt="Stocknear Logo"
                loading="lazy"
            />
        </a>
    </div>
    <div class="w-full overflow-hidden m-auto mt-5">
        <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div
                class="relative flex justify-center items-start overflow-hidden w-full"
            >
                <main class="w-full">
                    <div class="flex flex-col space-y-2 w-96 max-w-md m-auto">
                        <h1
                            class="text-center text-2xl sm:text-3xl font-bold pb-3"
                        >
                            {!data?.user?.verified
                                ? " Verify Your Account"
                                : "You are already verified!"}
                        </h1>

                        <div class="w-96 max-w-md pt-3">
                            {#if isLoading && token?.length > 0}
                                <label
                                    class="cursor-not-allowed btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                                >
                                    <div
                                        class="flex flex-row m-auto items-center"
                                    >
                                        <span
                                            class="loading loading-spinner loading-sm"
                                        ></span>
                                        <span class="ml-1">{displayText}</span>
                                    </div>
                                </label>
                            {:else if !isLoading && token?.length > 0}
                                <a
                                    href="/profile"
                                    class="btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                                >
                                    <div
                                        class="flex flex-row m-auto items-center"
                                    >
                                        <span class=" ml-1.5"
                                            >{displayText}</span
                                        >
                                    </div>
                                </a>
                            {:else}
                                <a
                                    href="/profile"
                                    class=" btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                                >
                                    <div
                                        class="flex flex-row m-auto items-center"
                                    >
                                        <span class=" ml-1.5"
                                            >No Valid Token!</span
                                        >
                                    </div>
                                </a>
                            {/if}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    </div>
</section>
