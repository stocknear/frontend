<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Input from "$lib/components/Input.svelte";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";
  import { toast } from "svelte-sonner";
  import Discount from "$lib/components/Discount.svelte";

  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  import { dev } from "$app/environment";
  import { openLemonSqueezyUrl } from "$lib/lemonsqueezy";
  import { PURCHASE_COOKIE, PURCHASE_VALUES } from "$lib/constants/tracking";
  import {
    register_seo_title,
    register_seo_description,
    register_email_label,
    register_password_label,
    register_button_loading,
    register_terms_prefix,
    register_terms_link,
    register_terms_middle,
    register_privacy_link,
    register_has_account,
    register_signin_link,
    register_toast_success,
    register_toast_invalid,
    register_toast_disposable_email,
    register_toast_password_mismatch,
    register_toast_weak_password,
    register_toast_invalid_email,
    register_toast_rate_limited,
    register_confirm_password_label,
    register_step1_label,
    register_step1_title,
    register_step1_subtitle,
    register_step1_email_divider,
    register_step1_next,
    register_step2_label,
    register_step2_title,
    register_step2_subtitle,
    register_step2_subtitle_no_trial,
    register_step2_monthly,
    register_step2_annual,
    register_step2_save,
    register_step2_per_month,
    register_step2_billed_annually,
    register_step2_popular,
    register_step2_start_trial,
    register_step2_skip,
    register_step2_plus_title,
    register_step2_plus_subtitle,
    register_step2_pro_title,
    register_step2_pro_subtitle,
    pricing_feature_credits_150,
    pricing_feature_watchlist_unlimited,
    pricing_feature_portfolio_unlimited,
    pricing_feature_alerts_unlimited,
    pricing_feature_screener_unlimited,
    pricing_feature_download_unlimited,
    pricing_feature_notification,
    pricing_feature_hedgefund,
    pricing_feature_congress,
    pricing_feature_no_ads,
    pricing_feature_credits_1000,
    pricing_feature_everything_plus,
    pricing_feature_watchlist_pro,
    pricing_feature_portfolio_pro,
    pricing_feature_options_realtime,
    pricing_feature_options_flow,
    pricing_feature_unusual_orders,
    pricing_feature_pro_chart_unlimited,
    pricing_feature_discord,
    pricing_get_plus,
    pricing_unlock_pro,
    pricing_start_trial,
  } from "$lib/paraglide/messages.js";

  export let form;
  export let data;

  let isClicked = false;
  let loading = false;
  let oauthLoading = false;
  let showTurnstile = true;
  let password = "";
  let confirmPassword = "";
  let pricingAnnual = true;

  $: currentStep = data?.step || 1;

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
          if (result.data?.rateLimited) {
            const minutes = result.data?.retryAfter || 15;
            toast.error(
              register_toast_rate_limited({ minutes: String(minutes) }),
              { style: toastStyle },
            );
          } else if (result.data?.disposableEmail) {
            toast.error(register_toast_disposable_email(), {
              style: toastStyle,
            });
          } else if (result.data?.weakPassword) {
            toast.error(register_toast_weak_password(), {
              style: toastStyle,
            });
          } else if (result.data?.invalidEmail) {
            toast.error(register_toast_invalid_email(), {
              style: toastStyle,
            });
          } else if (
            result.data?.errors?.password ||
            result.data?.errors?.passwordConfirm
          ) {
            const passwordError =
              result.data?.errors?.password?.[0] ||
              result.data?.errors?.passwordConfirm?.[0] ||
              "";
            if (passwordError.toLowerCase().includes("match")) {
              toast.error(register_toast_password_mismatch(), {
                style: toastStyle,
              });
            } else {
              toast.error(register_toast_weak_password(), {
                style: toastStyle,
              });
            }
          } else if (result.data?.errors?.email) {
            toast.error(register_toast_invalid_email(), {
              style: toastStyle,
            });
          } else if (result.data?.errors?.turnstile) {
            // Turnstile error shown inline, no toast
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

  let affiliateScriptLoad: Promise<void> | null = null;

  function loadLemonSqueezyAffiliate() {
    if (affiliateScriptLoad) return affiliateScriptLoad;

    affiliateScriptLoad = new Promise<void>((resolve) => {
      if (typeof window === "undefined") return resolve();
      if (document.querySelector('script[data-ls-affiliate="1"]'))
        return resolve();

      (window as any).lemonSqueezyAffiliateConfig = { store: "Stocknear" };

      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://lmsqueezy.com/affiliate.js";
      script.dataset.lsAffiliate = "1";
      script.onload = () => resolve();
      script.onerror = () => resolve();

      document.head.appendChild(script);
    });

    return affiliateScriptLoad;
  }

  async function purchasePlan(subscriptionType: string) {
    if (!data?.user) return;

    const isPro = subscriptionType?.toLowerCase() === "pro";
    const isPlus = subscriptionType?.toLowerCase() === "plus";
    const isAnnual = Boolean(pricingAnnual);
    const isFreeTrial = !data?.user?.freeTrial;

    let plan = "";

    if (isPro) {
      plan = isAnnual ? "ANNUAL_ID_PRO" : "MONTHLY_ID_PRO";
    } else if (isPlus) {
      plan = isAnnual ? "ANNUAL_ID_PLUS" : "MONTHLY_ID_PLUS";
    }

    const prefix = isFreeTrial
      ? "VITE_LEMON_SQUEEZY_FREE_TRIAL_"
      : "VITE_LEMON_SQUEEZY_";

    const subId = import.meta.env[`${prefix}${plan}`];

    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const checkoutUrl =
      `https://stocknear.lemonsqueezy.com/checkout/buy/${subId}?` +
      new URLSearchParams({
        embed: "1",
        dark: isDarkMode ? "1" : "0",
        "checkout[email]": data?.user?.email,
        "checkout[name]": data?.user?.username,
        "checkout[custom][userId]": data?.user?.id,
      })?.toString();

    // Store purchase value for Google Ads conversion tracking via GTM on /welcome
    const purchaseValue = isPro
      ? (isAnnual ? PURCHASE_VALUES.pro_annual : PURCHASE_VALUES.pro_monthly)
      : isPlus
        ? (isAnnual ? PURCHASE_VALUES.plus_annual : PURCHASE_VALUES.plus_monthly)
        : 0;
    if (purchaseValue > 0) {
      document.cookie = `${PURCHASE_COOKIE}=${purchaseValue}; path=/; max-age=3600; SameSite=Lax`;
    }

    await loadLemonSqueezyAffiliate();
    openLemonSqueezyUrl(checkoutUrl);
  }
</script>

<SEO title={register_seo_title()} description={register_seo_description()} />

<div
  class="min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200"
>
  <div
    class="mx-auto {currentStep === 2
      ? 'max-w-3xl'
      : 'max-w-lg'} px-4 sm:px-6 py-8 sm:py-16"
  >
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

    {#if currentStep === 1}
      <!-- ============================================ -->
      <!-- STEP 1: Create Account                       -->
      <!-- ============================================ -->
      <div>
        <!-- Step indicator -->
        <div class="text-center mb-6">
          <span
            class="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400 tracking-wide"
          >
            {register_step1_label()}
          </span>
        </div>

        <!-- Heading -->
        <h1
          class="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          {register_step1_title()}
        </h1>
        <p
          class="text-center text-sm text-gray-500 dark:text-zinc-400 mt-2 mb-8"
        >
          {register_step1_subtitle()}
        </p>

        <!-- Google OAuth (prominent) -->
        <div class="mb-6">
          <OAuthButtons
            returnUrl={encodeURIComponent("/register?step=2")}
            on:click={() => (oauthLoading = !oauthLoading)}
          />
        </div>

        <!-- Divider -->
        <div class="divider text-gray-800 dark:text-zinc-300 py-4">
          <span class="text-[11px] uppercase tracking-[0.3em] z-10">
            {register_step1_email_divider()}
          </span>
        </div>

        <!-- Email + Password form (no confirm password) -->
        <form
          action="?/register"
          method="POST"
          use:enhance={submitRegistration}
          class="flex flex-col items-center space-y-3 w-full max-w-md mx-auto"
        >
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
            confirmValue={confirmPassword}
            on:input={(e) => (password = e.detail)}
          />

          <div
            class="form-control w-full max-w-2xl mb-2 text-muted dark:text-white"
          >
            <label for="passwordConfirm" class="label pb-1">
              <span class="text-muted dark:text-white"
                >{register_confirm_password_label()}</span
              >
            </label>
            <input
              class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 rounded-full whitespace-normal"
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              disabled={loading}
              bind:value={confirmPassword}
              autocomplete="off"
            />
            {#if form?.errors?.passwordConfirm}
              <label for="passwordConfirm" class="py-0 pt-1 text-xs">
                <span
                  class="text-red-800 font-semibold dark:font-normal dark:text-error"
                >
                  {form?.errors?.passwordConfirm[0]}
                </span>
              </label>
            {/if}
          </div>

          {#if showTurnstile && !dev}
            <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
          {/if}
          {#if form?.errors?.turnstile}
            <p class="text-center text-sm text-error pt-2">
              {form?.errors?.turnstile?.at(0)}
            </p>
          {/if}

          <div class="w-full max-w-lg pt-4 m-auto pb-3">
            <button
              type="submit"
              class="py-3 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-base disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || isClicked}
              aria-busy={loading || isClicked}
            >
              {#if !loading && !isClicked}
                <span>{register_step1_next()}</span>
              {:else}
                <span class="flex items-center justify-center gap-2">
                  <span class="loading loading-infinity"></span>
                  <span>{register_button_loading()}</span>
                </span>
              {/if}
            </button>
          </div>
        </form>

        <!-- Terms -->
        <p class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-4">
          {register_terms_prefix()}
          <a
            href="/terms-of-use"
            class="text-gray-700 dark:text-zinc-300 hover:text-violet-500 transition"
            >{register_terms_link()}</a
          >
          {register_terms_middle()}
          <a
            href="/privacy-policy"
            class="text-gray-700 dark:text-zinc-300 hover:text-violet-500 transition"
            >{register_privacy_link()}</a
          >.
        </p>

        <!-- Sign in link -->
        <p class="text-sm text-center text-gray-500 dark:text-zinc-400 mt-6">
          {register_has_account()}
          <a
            href="/login"
            class="text-violet-700 dark:text-violet-400 hover:underline ml-1"
            >{register_signin_link()}</a
          >
        </p>
      </div>
    {:else if currentStep === 2}
      <!-- ============================================ -->
      <!-- STEP 2: Choose Plan                          -->
      <!-- ============================================ -->
      <div>
        <!-- Step indicator -->
        <div class="text-center mb-6">
          <span
            class="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400 tracking-wide"
          >
            {register_step2_label()}
          </span>
        </div>

        <!-- Heading -->
        <h1
          class="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          {register_step2_title()}
        </h1>
        <p
          class="text-center text-sm text-gray-500 dark:text-zinc-400 mt-2 mb-8"
        >
          {data?.user?.freeTrial
            ? register_step2_subtitle_no_trial()
            : register_step2_subtitle()}
        </p>

        <!-- Monthly / Annual toggle -->
        <div
          class="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold"
        >
          <span
            class={pricingAnnual
              ? "text-gray-400 dark:text-zinc-500"
              : "text-gray-900 dark:text-white"}
          >
            {register_step2_monthly()}
          </span>
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              bind:checked={pricingAnnual}
              class="peer sr-only"
            />
            <span
              class="h-8 w-16 rounded-full border border-gray-300 dark:border-zinc-600 transition {pricingAnnual
                ? 'bg-emerald-500'
                : 'bg-gray-200 dark:bg-zinc-800'}"
            ></span>
            <span
              class="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition peer-checked:translate-x-8"
            ></span>
          </label>
          <span
            class={pricingAnnual
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-zinc-500"}
          >
            {register_step2_annual()}
          </span>
          <span
            class="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
          >
            {register_step2_save()}
          </span>
        </div>

        <Discount />

        <!-- Plan cards -->
        <div class="grid gap-6 sm:grid-cols-2">
          <!-- Plus (highlighted) -->
          <div
            class="rounded-2xl border-2 border-violet-500 dark:border-violet-400 bg-white dark:bg-zinc-900/60 p-6 flex flex-col relative"
          >
            <div
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 dark:bg-violet-500 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider"
            >
              {register_step2_popular()}
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {register_step2_plus_title()}
            </h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {register_step2_plus_subtitle()}
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              {#if pricingAnnual}
                <span
                  class="text-lg text-gray-400 dark:text-zinc-500 line-through"
                  >$10</span
                >
                <span
                  class="text-3xl font-semibold text-gray-900 dark:text-white"
                  >$5</span
                >
              {:else}
                <span
                  class="text-3xl font-semibold text-gray-900 dark:text-white"
                  >$15</span
                >
              {/if}
              <span class="text-sm text-gray-500 dark:text-zinc-400"
                >{register_step2_per_month()}</span
              >
            </div>
            {#if pricingAnnual}
              <p class="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                {register_step2_billed_annually()} (<span class="line-through"
                  >$120</span
                > $60)
              </p>
            {/if}
            <ul class="mt-5 mb-5 space-y-2 text-sm flex-1">
              {#each [pricing_feature_credits_150(), pricing_feature_watchlist_unlimited(), pricing_feature_portfolio_unlimited(), pricing_feature_alerts_unlimited(), pricing_feature_screener_unlimited(), pricing_feature_download_unlimited(), pricing_feature_notification(), pricing_feature_hedgefund(), pricing_feature_congress(), pricing_feature_no_ads()] as feature}
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-600 dark:text-zinc-300">{feature}</span
                  >
                </li>
              {/each}
            </ul>
            <button
              on:click={() => purchasePlan("Plus")}
              class="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 text-white rounded-full font-semibold transition flex items-center justify-center text-sm cursor-pointer"
            >
              {data?.user?.freeTrial
                ? pricing_get_plus()
                : pricing_start_trial()}
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <!-- Pro -->
          <div
            class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6 flex flex-col"
          >
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {register_step2_pro_title()}
            </h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {register_step2_pro_subtitle()}
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              {#if pricingAnnual}
                <span
                  class="text-lg text-gray-400 dark:text-zinc-500 line-through"
                  >$30</span
                >
                <span
                  class="text-3xl font-semibold text-gray-900 dark:text-white"
                  >$15</span
                >
              {:else}
                <span
                  class="text-3xl font-semibold text-gray-900 dark:text-white"
                  >$45</span
                >
              {/if}
              <span class="text-sm text-gray-500 dark:text-zinc-400"
                >{register_step2_per_month()}</span
              >
            </div>
            {#if pricingAnnual}
              <p class="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                {register_step2_billed_annually()} (<span class="line-through"
                  >$360</span
                > $180)
              </p>
            {/if}
            <ul class="mt-5 mb-5 space-y-2 text-sm flex-1">
              {#each [pricing_feature_credits_1000(), pricing_feature_everything_plus(), pricing_feature_watchlist_pro(), pricing_feature_portfolio_pro(), pricing_feature_options_realtime(), pricing_feature_options_flow(), pricing_feature_unusual_orders(), pricing_feature_pro_chart_unlimited(), pricing_feature_discord()] as feature}
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-gray-600 dark:text-zinc-300">{feature}</span
                  >
                </li>
              {/each}
            </ul>
            <button
              on:click={() => purchasePlan("Pro")}
              class="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 text-white rounded-full font-semibold transition flex items-center justify-center text-sm cursor-pointer"
            >
              {data?.user?.freeTrial
                ? pricing_unlock_pro()
                : pricing_start_trial()}
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Skip for now -->
        <div class="text-center mt-8">
          <a
            href="/"
            class="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition"
          >
            {register_step2_skip()}
            <svg
              class="w-3.5 h-3.5 inline-block ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if oauthLoading}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
  >
    <div
      class="bg-white/90 dark:bg-zinc-900/80 border border-gray-300 dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center shadow-lg"
    >
      <span
        class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
      ></span>
    </div>
  </div>
{/if}
