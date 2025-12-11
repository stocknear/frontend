<script lang="ts">
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import { mode } from "mode-watcher";
    import Input from "$lib/components/Input.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import { page } from "$app/stores";

    export let data;
    export let form;

    let token = $page.url.searchParams.get("token") ?? "";
    let isUpdating = false;

    const submitNewPassword = () => {
        isUpdating = true;
        return async ({ result, update }) => {
            if (result.type === "success" && result.data?.success) {
                toast.success("New Password updated!", {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                });

                setTimeout(() => {
                    const anchor = document.createElement("a");
                    anchor.href = "/login";
                    anchor.dataset.sveltekitReload = true;
                    document.body.appendChild(anchor);
                    anchor.dispatchEvent(new MouseEvent("click"));
                }, 500);
            } else {
                toast.error("Something went wrong. Please try again...", {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                });
            }
            await update();
            isUpdating = false;
        };
    };
</script>

<SEO title="Set New Password" description="" />

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
                    <form
                        action="?/newPassword"
                        method="POST"
                        use:enhance={submitNewPassword}
                        class="flex flex-col space-y-2 w-full max-w-lg m-auto"
                    >
                        <h1
                            class="mb-1 text-2xl sm:text-3xl font-bold mb-6 text-center"
                        >
                            Set New Password
                        </h1>

                        <Input
                            id="password"
                            name="password"
                            label="New Password"
                            type="password"
                            required
                            errors={form?.errors?.password}
                        />
                        <Input
                            id="passwordConfirm"
                            name="passwordConfirm"
                            label="Confirm New Password"
                            type="password"
                            required
                            errors={form?.errors?.passwordConfirm}
                        />
                        <input value={token} name="token" type="hidden" />

                        {#if form?.errors?.error}
                            <div class="text-red-800 dark:text-red-500 text-sm">
                                {form.errors.error}
                            </div>
                        {/if}
                        <div class="w-full max-w-lg pt-3">
                            {#if !isUpdating}
                                <button
                                    type="submit"
                                    class="cursor-pointer py-2.5 bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border-none dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                                >
                                    <span>Confirm new Password</span>
                                </button>
                            {:else}
                                <label
                                    class="cursor-not-allowed btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] opacity-[0.5] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                                >
                                    <div
                                        class="flex flex-row m-auto items-center"
                                    >
                                        <span class="loading loading-infinity"
                                        ></span>
                                        <span class=" ml-1.5">Processing</span>
                                    </div>
                                </label>
                            {/if}
                        </div>
                    </form>
                </main>
            </div>
        </div>
    </div>
</section>
