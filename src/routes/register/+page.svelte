<script>
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  import {
    register_seo_title,
    register_seo_description,
    register_title,
    register_title_logged_in,
    register_subtitle,
    register_email_label,
    register_password_label,
    register_confirm_password_label,
    register_button,
    register_button_loading,
    register_divider,
    register_has_account,
    register_signin_link,
    register_terms_prefix,
    register_terms_link,
    register_terms_middle,
    register_privacy_link,
    register_logged_in_as,
    register_logout_button,
    register_toast_success,
    register_toast_invalid,
    register_toast_email_exists,
    register_toast_disposable_email,
    register_toast_password_mismatch,
    register_toast_weak_password,
    register_toast_invalid_email,
  } from "$lib/paraglide/messages.js";

  export let form;
  export let data;

  let isClicked = false;
  let loading = false;
  let oauthLoading = false;
  let showTurnstile = true;
  
  // Password state for real-time validation
  let password = "";
  let passwordConfirm = "";

  const resetTurnstile = async () => {
    showTurnstile = false;
    await tick();
    showTurnstile = true;
  };

  const submitRegistration = () => {
    loading = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;
      
      switch (result.type) {
        case "success":
        case "redirect":
          isClicked = true;
          toast.success(register_toast_success(), { style: toastStyle });
          await update();
          break;
        case "failure":
          // Handle specific error types with appropriate messages
          if (result.data?.emailExists) {
            toast.error(register_toast_email_exists(), { style: toastStyle });
          } else if (result.data?.disposableEmail) {
            toast.error(register_toast_disposable_email(), { style: toastStyle });
          } else if (result.data?.weakPassword) {
            toast.error(register_toast_weak_password(), { style: toastStyle });
          } else if (result.data?.invalidEmail) {
            toast.error(register_toast_invalid_email(), { style: toastStyle });
          } else if (result.data?.errors?.password || result.data?.errors?.passwordConfirm) {
            // Check if it's a password mismatch from Zod validation
            const passwordError = result.data?.errors?.password?.[0] || result.data?.errors?.passwordConfirm?.[0] || "";
            if (passwordError.toLowerCase().includes("match")) {
              toast.error(register_toast_password_mismatch(), { style: toastStyle });
            } else {
              toast.error(register_toast_weak_password(), { style: toastStyle });
            }
          } else if (result.data?.errors?.email) {
            toast.error(register_toast_invalid_email(), { style: toastStyle });
          } else if (result.data?.errors?.turnstile) {
            // Turnstile error is shown inline, no toast needed
          } else {
            toast.error(register_toast_invalid(), { style: toastStyle });
          }
          await update();
          break;
        case "error":
          toast.error(result.error.message, { style: toastStyle });
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
  title={register_seo_title()}
  description={register_seo_description()}
/>

<div
  class="relative w-full max-w-3xl mx-auto text-gray-700 dark:text-zinc-200 {data?.user
    ? 'min-h-[500px] sm:min-h-[900px]'
    : 'min-h-screen '}  {oauthLoading ? 'opacity-[0.2]' : ''}"
>
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
        class="text-center text-2xl sm:text-3xl pt-4 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {!data?.user ? register_title() : register_title_logged_in()}
      </h1>
    </div>
    {#if !data?.user}
      <span class="text-sm text-gray-500 dark:text-zinc-400 text-center">
        {register_subtitle()}
      </span>

      <form
        action="?/register"
        method="POST"
        use:enhance={submitRegistration}
        class="flex flex-col items-center space-y-3 w-full max-w-lg pt-4 pl-3 pr-3 sm:pl-0 sm:pr-0 ml-auto mr-auto"
      >
        <!--<Input id="name" label="Your first and last name" value={form?.data?.name} errors={form?.errors?.name} />-->

        <Input
          type="email"
          id="email"
          label={register_email_label()}
          value={form?.data?.email}
          errors={form?.errors?.email}
          disabled={loading}
        />

        <PasswordInput
          id="password"
          label={register_password_label()}
          errors={form?.errors?.password}
          disabled={loading}
          showRequirements={true}
          showMatchIndicator={true}
          confirmValue={passwordConfirm}
          on:input={(e) => (password = e.detail)}
        />

        <div class="form-control w-full max-w-2xl mb-2 text-muted dark:text-white">
          <label for="passwordConfirm" class="label pb-1">
            <span class="text-muted dark:text-white">{register_confirm_password_label()}</span>
          </label>
          <div class="relative">
            <input
              class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 rounded-full whitespace-normal pr-12"
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              disabled={loading}
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
          
          {#if form?.errors?.passwordConfirm}
            <label for="passwordConfirm" class="py-0 pt-1 text-xs">
              <span class="text-red-800 font-semibold dark:font-normal dark:text-error">
                {form?.errors?.passwordConfirm}
              </span>
            </label>
          {/if}
        </div>

        <div class="w-full max-w-lg pt-5 m-auto pb-5">
          {#if !loading && !isClicked}
            <button
              type="submit"
              class="cursor-pointer py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem]"
            >
              <span>{register_button()}</span>
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
              <span>{register_button_loading()}</span>
            </button>
          {/if}
        </div>

        {#if showTurnstile}
          <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
        {/if}
        {#if form?.errors?.turnstile}
          <p class="text-center text-sm text-error pt-2">
            {form?.errors?.turnstile?.at(0)}
          </p>
        {/if}
      </form>

      <div class="divider text-gray-800 dark:text-zinc-300 py-6">
        <span class="text-[11px] uppercase tracking-[0.3em] z-10"
          >{register_divider()}</span
        >
      </div>

      <OAuthButtons on:click={() => (oauthLoading = !oauthLoading)} />

      <p
        class="pb-1 text-sm w-full max-w-lg flex m-auto justify-center items-center text-gray-500 dark:text-zinc-400"
      >
        {register_has_account()}
        <a
          href="/login"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition ml-1"
          >{register_signin_link()}</a
        >
      </p>

      <p
        class="pb-1 text-xs text-center pb-20 sm:pb-0 text-gray-800 dark:text-zinc-300"
      >
        {register_terms_prefix()}
        <a
          href="/terms-of-use"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
          >{register_terms_link()}</a
        >
        {register_terms_middle()}
        <a
          href="/privacy-policy"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
          >{register_privacy_link()}</a
        >.
      </p>
    {:else}
      <p class="mt-2 text-center text-sm text-gray-500 dark:text-zinc-400">
        {register_logged_in_as({ email: data?.user?.email })}
      </p>
      <form class="cursor-pointer" action="/logout" method="POST">
        <button
          type="submit"
          aria-label={register_logout_button()}
          class="cursor-pointer mx-auto mt-2 flex w-full max-w-xs justify-center rounded-full
        bg-gray-900 text-white dark:bg-white dark:text-gray-900 border border-transparent px-4 py-2 text-sm font-semibold
        hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none
        focus:ring-offset-0"
          >{register_logout_button()}
        </button>
      </form>
    {/if}
  </div>
</div>

{#if oauthLoading}
  <div class="absolute right-1/2 left-1/2 top-1/2 bottom-1/2">
    <div class="relative">
      <label
        class="shadow-sm bg-white/90 dark:bg-zinc-900/80 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <span
          class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
        ></span>
      </label>
    </div>
  </div>
{/if}

<style>
  .shake-logo {
    animation-name: shake;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(0deg);
    }
    75% {
      transform: rotate(-10deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
