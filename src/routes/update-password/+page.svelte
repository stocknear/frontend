<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  import Input from "$lib/components/Input.svelte";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  update_password_button,
  update_password_confirm_label,
  update_password_error,
  update_password_loading,
  update_password_new_password_label,
  update_password_old_password_label,
  update_password_seo_description,
  update_password_seo_title,
  update_password_success,
  update_password_title,
} from "$lib/paraglide/messages";

  export let data;
  export let form;
  let isUpdating = false;

  // Password state for real-time validation
  let password = "";
  let passwordConfirm = "";
  let showTurnstile = true;

  const resetTurnstile = async () => {
    showTurnstile = false;
    await tick();
    showTurnstile = true;
  };

  const submitUpdatePassword = () => {
    isUpdating = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

      if (result.type === "success" && result.data?.success) {
        toast.success(update_password_success(), { style: toastStyle });
      } else {
        // Show turnstile error inline, use generic toast for other errors
        if (!result.data?.errors?.turnstile) {
          toast.error(update_password_error(), { style: toastStyle });
        }
      }
      await resetTurnstile();
      await update();
      isUpdating = false;
    };
  };
</script>

<SEO title={update_password_seo_title()} description={update_password_seo_description()} />

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
            action="?/updatePassword"
            method="POST"
            use:enhance={submitUpdatePassword}
            class="flex flex-col space-y-2 w-full max-w-lg m-auto"
          >
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold mb-6 text-center">
              {update_password_title()}
            </h1>

            <Input
              id="oldPassword"
              name="oldPassword"
              label={update_password_old_password_label()}
              type="password"
              required
              errors={form?.errors?.errorOldPassword}
            />
            <PasswordInput
              id="password"
              label={update_password_new_password_label()}
              errors={form?.errors?.errorPassword}
              disabled={isUpdating}
              showRequirements={true}
              showMatchIndicator={true}
              confirmValue={passwordConfirm}
              on:input={(e) => (password = e.detail)}
            />

            <div class="form-control w-full max-w-2xl mb-2 text-muted dark:text-white">
              <label for="passwordConfirm" class="label pb-1">
                <span class="text-muted dark:text-white">{update_password_confirm_label()}</span>
              </label>
              <div class="relative">
                <input
                  class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 rounded-full whitespace-normal pr-12"
                  type="password"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  disabled={isUpdating}
                  bind:value={passwordConfirm}
                  autocomplete="off"
                />

                {#if passwordConfirm.length > 0}
                  <div class="absolute right-4 top-1/2 -translate-y-1/2">
                    {#if password === passwordConfirm && password.length > 0}
                      <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    {:else}
                      <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    {/if}
                  </div>
                {/if}
              </div>

              {#if form?.errors?.errorPasswordConfirm}
                <label for="passwordConfirm" class="py-0 pt-1 text-xs">
                  <span class="text-red-800 font-semibold dark:font-normal dark:text-error">
                    {form?.errors?.errorPasswordConfirm}
                  </span>
                </label>
              {/if}
            </div>

            <div class="w-full max-w-lg pt-3">
              {#if !isUpdating}
                <button
                  type="submit"
                  class="cursor-pointer py-2.5 bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border-none dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded-2xl m-auto font-semibold text-[1rem]"
                >
                  <span>{update_password_button()}</span>
                </button>
              {:else}
                <label
                  class="cursor-not-allowed btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] opacity-[0.5] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded-2xl m-auto font-semibold text-[1rem]"
                >
                  <div class="flex flex-row m-auto items-center">
                    <span class="loading loading-infinity"></span>
                    <span class=" ml-1.5">{update_password_loading()}</span>
                  </div>
                </label>
              {/if}
            </div>

            {#if showTurnstile}
              <div class="flex justify-center">
                <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
              </div>
            {/if}
            {#if form?.errors?.turnstile}
              <p class="text-center text-sm text-error pt-2">
                {form?.errors?.turnstile}
              </p>
            {/if}
          </form>
        </main>
      </div>
    </div>
  </div>
</section>
