<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import SEO from "$lib/components/SEO.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";
  import { Turnstile } from "svelte-turnstile";
  import { dev } from "$app/environment";
  import {
    login_seo_title,
    login_seo_description,
    login_title,
    login_title_logged_in,
    login_subtitle,
    login_email_label,
    login_password_label,
    login_forgot_password,
    login_button,
    login_button_loading,
    login_divider,
    login_no_account,
    login_signup_link,
    login_logged_in_as,
    login_logout_button,
    login_toast_verify_email,
    login_toast_success,
    login_toast_invalid,
    login_toast_auth_failed,
    login_toast_rate_limited,
  } from "$lib/paraglide/messages.js";

  export let form;
  export let data;

  let isClicked = false;
  let loading = false;
  let oauthLoading = false;
  let showTurnstile = true;

  async function resetTurnstile() {
    showTurnstile = false;
    await new Promise((r) => setTimeout(r, 50));
    showTurnstile = true;
  }

  const submitLogin = () => {
    loading = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

      switch (result.type) {
        case "success":
          if (form?.notVerified) {
            toast.error(login_toast_verify_email(), { style: toastStyle });
            await update();
            break;
          } else form?.notVerified === false;
          {
            toast.success(login_toast_success(), { style: toastStyle });
            await update();
            break;
          }
        case "redirect":
          isClicked = true;
          toast.success(login_toast_success(), { style: toastStyle });
          await update();
          break;
        case "failure":
          if (result.data?.rateLimited) {
            toast.error(login_toast_rate_limited({ minutes: String(result.data?.retryAfter || 15) }), { style: toastStyle });
          } else if (result.data?.authFailed) {
            toast.error(login_toast_auth_failed(), { style: toastStyle });
          } else if (result.data?.errors?.turnstile) {
            toast.error(result.data.errors.turnstile[0], { style: toastStyle });
          } else {
            toast.error(login_toast_invalid(), { style: toastStyle });
          }
          await update();
          break;
        case "error":
          toast.error(login_toast_invalid(), { style: toastStyle });
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
  title={login_seo_title()}
  description={login_seo_description()}
/>

<div class="min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200">
  <div class="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-16">

    <!-- Logo -->
    <div class="text-center mb-8">
      <a href="/" class="inline-block">
        <img
          class="w-14 sm:w-16 rounded-full mx-auto"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
        />
      </a>
    </div>

    {#if !data?.user}
      <div>
        <!-- Heading -->
        <h1 class="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {login_title()}
        </h1>
        <p class="text-center text-sm text-gray-500 dark:text-zinc-400 mt-2 mb-8">
          {login_subtitle()}
        </p>

        <!-- Google OAuth (prominent, at top) -->
        <div class="mb-6">
          <OAuthButtons on:click={() => (oauthLoading = !oauthLoading)} />
        </div>

        <!-- Divider -->
        <div class="divider text-gray-800 dark:text-zinc-300 py-4">
          <span class="text-[11px] uppercase tracking-[0.3em] z-10">
            {login_divider()}
          </span>
        </div>

        <!-- Email + Password form -->
        <form
          action="?/login"
          method="POST"
          use:enhance={submitLogin}
          class="flex flex-col items-center space-y-3 w-full max-w-md mx-auto"
        >
          <Input
            type="email"
            id="email"
            label={login_email_label()}
            value={form?.data?.email ?? ""}
            errors={form?.errors?.email}
          />
          <Input
            type="password"
            id="password"
            label={login_password_label()}
            errors={form?.errors?.password}
          />
          <div class="w-full text-start">
            <a
              href="/reset-password"
              class="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >{login_forgot_password()}</a>
          </div>

          {#if showTurnstile && !dev}
            <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
          {/if}

          <div class="w-full pt-4 m-auto pb-3">
            <button
              type="submit"
              class="py-3 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-base disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || isClicked}
              aria-busy={loading || isClicked}
            >
              {#if !loading && !isClicked}
                <span>{login_button()}</span>
              {:else}
                <span class="flex items-center justify-center gap-2">
                  <span class="loading loading-infinity"></span>
                  <span>{login_button_loading()}</span>
                </span>
              {/if}
            </button>
          </div>
        </form>

        <!-- Sign up link -->
        <p class="text-sm text-center text-gray-500 dark:text-zinc-400 mt-6">
          {login_no_account()}
          <a href="/register" class="text-violet-700 dark:text-violet-400 hover:underline ml-1">{login_signup_link()}</a>
        </p>
      </div>
    {:else}
      <!-- Already logged in -->
      <div class="text-center">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {login_title_logged_in()}
        </h1>
        <p class="mt-3 text-sm text-gray-500 dark:text-zinc-400">
          {login_logged_in_as({ email: data?.user?.email })}
        </p>
        <form class="cursor-pointer" action="/logout" method="POST">
          <button
            type="submit"
            aria-label={login_logout_button()}
            class="cursor-pointer mx-auto mt-4 flex w-full max-w-xs justify-center rounded-full
              bg-gray-900 text-white dark:bg-white dark:text-gray-900 border border-transparent px-4 py-2.5 text-sm font-semibold
              hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none"
          >{login_logout_button()}</button>
        </form>
      </div>
    {/if}
  </div>
</div>

{#if oauthLoading}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
    <div class="bg-white/90 dark:bg-zinc-900/80 border border-gray-300 dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center shadow-lg">
      <span class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"></span>
    </div>
  </div>
{/if}
