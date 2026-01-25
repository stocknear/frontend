<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { enhance } from "$app/forms";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  let email: string = "";
  let loading = false;
  let isClicked = false;

  const submitReset = () => {
    loading = true;
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
          toast.success(m.reset_password_success(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "redirect":
          isClicked = true;
          toast.success(m.reset_password_success(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "failure":
          toast.error(m.reset_password_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          toast.error(result.error.message, {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }
      loading = false;
    };
  };
</script>

<SEO
  title={m.reset_password_seo_title()}
  description={m.reset_password_seo_description()}
/>

<div class="flex flex-col items-center min-h-screen w-full max-w-3xl m-auto">
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
  <h2 class="text-center text-2xl font-bold tracking-tight mt-5 mb-2">
    {m.reset_password_title()}
  </h2>
  <p class="text-center mt-1 mb-4">
    {m.reset_password_description()}
  </p>
  <form
    action="?/reset"
    method="POST"
    use:enhance={submitReset}
    class="flex flex-col items-center space-y-2 w-11/12 sm:w-full pt-2"
  >
    <div class="w-full max-w-lg">
      <label class="text-start w-full label pb-1">
        <span class="text-muted dark:text-white">{m.reset_password_email_label()}</span>
      </label>
      <input
        name="email"
        class="input input-lg input-bordered rounded-2xl border border-gray-300 shadow dark:border-gray-600 focus:outline-none w-full max-w-lg bg-white dark:bg-secondary placeholder-gray-600 dark:placeholder-gray-300 whitespace-normal"
        type="email"
        required
        bind:value={email}
        autocomplete="off"
      />
    </div>
    <div class="w-full max-w-lg">
      <div class="w-full max-w-lg pt-2 m-auto pb-5">
        {#if !loading && !isClicked}
          <button
            type="submit"
            class="cursor-pointer py-2.5 bg-black dark:bg-[#fff] border-none sm:hover:bg-default dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded-2xl m-auto text-white dark:text-black font-semibold text-[1rem]"
          >
            <span>{m.reset_password_button()}</span>
          </button>
        {:else}
          <label
            class="cursor-not-allowed btn bg-black dark:bg-[#fff] opacity-[0.5] border border-gray-600 sm:hover:bg-default dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded-2xl m-auto text-white dark:text-black font-semibold text-[1rem]"
          >
            <div class="flex flex-row m-auto items-center">
              <span class="loading loading-infinity"></span>
              <span class="ml-1.5">{m.reset_password_loading()}</span>
            </div>
          </label>
        {/if}
      </div>
    </div>
  </form>
</div>
