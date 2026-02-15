<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { enhance } from "$app/forms";
  import SEO from "$lib/components/SEO.svelte";
  import Input from "$lib/components/Input.svelte";
  import { Turnstile } from "svelte-turnstile";
  import { dev } from "$app/environment";
  import {
  reset_password_button,
  reset_password_description,
  reset_password_email_label,
  reset_password_error,
  reset_password_loading,
  reset_password_seo_description,
  reset_password_seo_title,
  reset_password_success,
  reset_password_title,
} from "$lib/paraglide/messages";

  export let form;

  let loading = false;
  let isClicked = false;
  let showTurnstile = true;

  async function resetTurnstile() {
    showTurnstile = false;
    await new Promise((r) => setTimeout(r, 50));
    showTurnstile = true;
  }

  const submitReset = () => {
    loading = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

      switch (result.type) {
        case "success":
          toast.success(reset_password_success(), { style: toastStyle });
          await update();
          break;
        case "redirect":
          isClicked = true;
          toast.success(reset_password_success(), { style: toastStyle });
          await update();
          break;
        case "failure":
          if (result.data?.rateLimited) {
            toast.error(`Too many attempts. Please try again in ${result.data?.retryAfter || 15} minutes.`, { style: toastStyle });
          } else if (result.data?.errors?.turnstile) {
            toast.error(result.data.errors.turnstile[0], { style: toastStyle });
          } else {
            toast.error(reset_password_error(), { style: toastStyle });
          }
          await update();
          break;
        case "error":
          toast.error(reset_password_error(), { style: toastStyle });
          break;
        default:
          await update();
      }
      await resetTurnstile();
      loading = false;
    };
  };
</script>

<SEO
  title={reset_password_seo_title()}
  description={reset_password_seo_description()}
/>

<div class="text-gray-700 dark:text-zinc-200 relative w-full max-w-3xl mx-auto min-h-screen">
  <div class="grid grid-cols-1 gap-4">
    <div class="relative">
      <a href="/">
        <img
          class="m-auto w-16 sm:w-20 rounded-full pt-4"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
          loading="lazy"
        />
      </a>

      <h1
        class="text-center text-2xl sm:text-3xl pt-5 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {reset_password_title()}
      </h1>
    </div>

    <span class="text-sm text-gray-500 dark:text-zinc-400 text-center">
      {reset_password_description()}
    </span>

    <div class="relative w-full max-w-lg m-auto">
      <form
        action="?/reset"
        method="POST"
        use:enhance={submitReset}
        class="flex flex-col items-center space-y-3 pt-4 pl-3 pr-3 sm:pl-0 sm:pr-0 ml-auto mr-auto"
      >
        <Input
          type="email"
          id="email"
          label={reset_password_email_label()}
          value={form?.data?.email ?? ""}
          errors={form?.errors?.email}
        />

        {#if showTurnstile && !dev}
          <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
        {/if}

        <div class="w-full max-w-lg pt-5 m-auto pb-5">
          {#if !loading && !isClicked}
            <button
              type="submit"
              class="cursor-pointer py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem]"
            >
              <span>{reset_password_button()}</span>
            </button>
          {:else}
            <button
              type="submit"
              disabled
              class="w-full rounded-full py-2.5 px-4 font-semibold text-[1rem]
           bg-gray-900 text-white dark:bg-white dark:text-gray-900
           opacity-60 cursor-not-allowed border border-gray-900/10 dark:border-white/10
           flex items-center justify-center gap-1.5"
            >
              <span class="loading loading-infinity"></span>
              <span>{reset_password_loading()}</span>
            </button>
          {/if}
        </div>
      </form>
    </div>
  </div>
</div>
