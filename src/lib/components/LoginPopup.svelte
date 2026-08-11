<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  import { getLocale } from "$lib/paraglide/runtime";
  import { getTurnstileLanguage } from "$lib/i18n/locales";

  import Input from "$lib/components/Input.svelte";
  import PasswordInput from "$lib/components/PasswordInput.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";
  import { screenWidth } from "$lib/store";
  import { page } from "$app/stores";
  import {
    login_popup_sign_in_title,
    login_popup_welcome_back,
    login_popup_email_label,
    login_popup_password_label,
    login_popup_forgot_password,
    login_popup_button,
    login_popup_signing_in,
    login_popup_or_login_using,
    login_popup_no_account,
    login_popup_sign_up_link,
    login_popup_success,
    login_popup_invalid_credentials,
    register_popup_title,
    register_popup_subtitle,
    register_popup_confirm_password_label,
    register_popup_button,
    register_popup_signing_up,
    register_popup_or_register_using,
    register_popup_terms_prefix,
    register_popup_terms_link,
    register_popup_privacy_middle,
    register_popup_privacy_link,
    register_popup_has_account,
    register_popup_sign_in_link,
    register_popup_success,
    register_toast_invalid,
    register_toast_disposable_email,
    register_toast_password_mismatch,
    register_toast_weak_password,
    register_toast_invalid_email,
    register_toast_rate_limited,
    common_close,
  } from "$lib/paraglide/messages";

  export let form;

  let oauthLoading = false;
  let isClicked = false;
  let loading = false;
  let loginToggle: HTMLInputElement;

  const closeModal = () => {
    if (loginToggle) loginToggle.checked = false;
  };

  // Password state for real-time validation
  let password = "";
  let passwordConfirm = "";
  let showTurnstile = true;

  const resetTurnstile = async () => {
    showTurnstile = false;
    await tick();
    showTurnstile = true;
  };

  const submitLogin = () => {
    loading = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

      switch (result.type) {
        case "success":
        case "redirect":
          isClicked = true;
          toast.success(login_popup_success(), { style: toastStyle });
          await update();
          break;
        case "failure":
          toast.error(login_popup_invalid_credentials(), {
            style: toastStyle,
          });
          await update();
          break;
        case "error":
          toast.error(result.error.message, { style: toastStyle });
          break;
        default:
          await update();
      }

      setTimeout(() => {
        if (
          ["redirect", "success"]?.includes(result.type) &&
          $page?.url?.pathname
        ) {
          const anchor = document.createElement("a");
          anchor.href = currentPathWithSearch;
          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent("click"));
        }
      }, 280);

      loading = false;
    };
  };

  const submitRegistration = () => {
    loading = true;
    return async ({ result, update }) => {
      const toastStyle = `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

      switch (result.type) {
        case "success":
        case "redirect":
          isClicked = true;
          toast.success(register_popup_success(), { style: toastStyle });
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

      setTimeout(() => {
        if (
          ["redirect", "success"]?.includes(result.type) &&
          $page?.url?.pathname
        ) {
          const anchor = document.createElement("a");
          anchor.href = currentPathWithSearch;
          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent("click"));
        }
      }, 280);

      loading = false;
    };
  };

  let displaySection = "login";

  // $page.url is populated during SSR too, so guarding on `browser` only made the server
  // render an empty returnUrl that the client then replaced - a divergence in a rendered
  // attribute, and a broken return path for anyone submitting before hydration.
  $: returnUrl = encodeURIComponent($page.url.pathname + $page.url.search);

  $: currentPathWithSearch = $page.url.pathname + $page.url.search;
</script>

<input
  bind:this={loginToggle}
  type="checkbox"
  id="userLogin"
  class="modal-toggle"
  aria-hidden="true"
  tabindex="-1"
/>

<dialog
  id="userLoginDialog"
  aria-labelledby={displaySection === "login"
    ? "user-login-title"
    : "user-register-title"}
  class="modal modal-bottom sm:modal-middle rounded-none sm:rounded-control"
>
  <label
    on:click={() => (form = [])}
    for="userLogin"
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full {$screenWidth < 640
      ? 'min-h-screen'
      : ''} relative bg-surface-card text-fg border border-line rounded-t-2xl sm:rounded-container shadow-2xl"
  >
    <button
      type="button"
      on:click={closeModal}
      class="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-page/90 text-fg shadow-sm transition hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
      aria-label={common_close()}
      title={common_close()}
    >
      <svg
        class="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
      >
    </button>
    {#if displaySection === "login"}
      <div class="grid grid-cols-1 animate-fade-in-once">
        <div class="relative">
          <h2
            id="user-login-title"
            class="text-center text-2xl sm:text-3xl pt-8 sm:pt-4 font-semibold tracking-tight"
          >
            {login_popup_sign_in_title()}
          </h2>
        </div>

        <span class="text-fg text-center text-sm pb-5">
          {login_popup_welcome_back()}
        </span>

        <div class="relative">
          <form
            action="?/login&returnUrl={returnUrl}"
            method="POST"
            use:enhance={submitLogin}
            class="flex flex-col text-start items-center space-y-3 w-full max-w-md md:ml-auto md:mr-auto"
          >
            <Input
              type="email"
              id="email"
              label={login_popup_email_label()}
              value={form?.data?.email ?? ""}
              errors={form?.errors?.email}
            />
            <Input
              type="password"
              id="password"
              label={login_popup_password_label()}
              errors={form?.errors?.password}
            />
            <div class="text-start w-full max-w-lg">
              <a
                href="/reset-password"
                class="text-start text-sm text-fg cursor-pointer sm:hover:text-gray-900 dark:sm:hover:text-white transition"
                >{login_popup_forgot_password()}</a
              >
            </div>
            <div class="w-full max-w-lg pt-5 m-auto pb-5">
              <button
                type="submit"
                class="py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || isClicked}
                aria-busy={loading || isClicked}
              >
                {#if !loading && !isClicked}
                  <span>{login_popup_button()}</span>
                {:else}
                  <span class="flex items-center justify-center gap-2">
                    <span class="loading loading-infinity"></span>
                    <span>{login_popup_signing_in()}</span>
                  </span>
                {/if}
              </button>
            </div>
          </form>

          <div class="divider text-fg-muted py-6">
            <span class="text-[11px] uppercase tracking-[0.3em] z-10"
              >{login_popup_or_login_using()}</span
            >
          </div>

          <OAuthButtons
            {returnUrl}
            on:click={() => (oauthLoading = !oauthLoading)}
          />
          <p
            class="pb-1 text-sm w-full max-w-lg flex justify-center items-center text-fg"
          >
            {login_popup_no_account()}
            <label
              on:click={() => (displaySection = "register")}
              class="text-fg sm:hover:text-violet-500 ml-1 cursor-pointer transition"
              >{login_popup_sign_up_link()}</label
            >
          </p>
        </div>
      </div>
    {:else if displaySection === "register"}
      <div class="grid grid-cols-1 gap-4 animate-fade-in-once">
        <div class="relative">
          <h2
            id="user-register-title"
            class="text-center text-2xl sm:text-3xl pt-8 sm:pt-4 font-semibold tracking-tight"
          >
            {register_popup_title()}
          </h2>
        </div>

        <span class="text-fg text-center text-sm pb-5">
          {register_popup_subtitle()}
        </span>

        <div class="relative">
          <form
            method="POST"
            action="?/register&returnUrl={returnUrl}"
            use:enhance={submitRegistration}
            class="flex flex-col text-start items-center space-y-3 w-full max-w-md pt-2 md:ml-auto md:mr-auto"
          >
            <Input
              type="email"
              id="email"
              label={login_popup_email_label()}
              value={form?.data?.email}
              errors={form?.errors?.email}
              disabled={loading}
            />

            <PasswordInput
              id="password"
              label={login_popup_password_label()}
              errors={form?.errors?.password}
              disabled={loading}
              showRequirements={true}
              showMatchIndicator={true}
              confirmValue={passwordConfirm}
              on:input={(e) => (password = e.detail)}
            />

            <div
              class="form-control w-full max-w-2xl mb-2 text-fg"
            >
              <label for="passwordConfirm" class="label pb-1">
                <span class="text-fg"
                  >{register_popup_confirm_password_label()}</span
                >
              </label>
              <div class="relative">
                <input
                  class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-surface-page/60 text-fg placeholder:text-muted dark:placeholder:text-zinc-300 rounded-full whitespace-normal pr-12"
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
                      <svg
                        class="w-5 h-5 text-emerald-500"
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
                    {:else}
                      <svg
                        class="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    {/if}
                  </div>
                {/if}
              </div>

              {#if form?.errors?.passwordConfirm}
                <label for="passwordConfirm" class="py-0 pt-1 text-xs">
                  <span
                    class="text-red-800 font-semibold dark:font-normal dark:text-error"
                  >
                    {form?.errors?.passwordConfirm}
                  </span>
                </label>
              {/if}
            </div>

            <div class="w-full max-w-lg pt-5 m-auto pb-3">
              <button
                type="submit"
                class="py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || isClicked}
                aria-busy={loading || isClicked}
              >
                {#if !loading && !isClicked}
                  <span>{register_popup_button()}</span>
                {:else}
                  <span class="flex items-center justify-center gap-2">
                    <span class="loading loading-infinity"></span>
                    <span>{register_popup_signing_up()}</span>
                  </span>
                {/if}
              </button>
            </div>

            {#if showTurnstile}
              <Turnstile
                siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY}
                language={getTurnstileLanguage(getLocale())}
              />
            {/if}
            {#if form?.errors?.turnstile}
              <p class="text-center text-sm text-error pt-2">
                {form?.errors?.turnstile?.at(0)}
              </p>
            {/if}
          </form>

          <div class="divider text-fg-muted py-6">
            <span class="text-[11px] uppercase tracking-[0.3em] z-10"
              >{register_popup_or_register_using()}</span
            >
          </div>

          <OAuthButtons
            {returnUrl}
            on:click={() => (oauthLoading = !oauthLoading)}
          />
          <p class="pb-1 text-xs text-center text-fg-muted">
            {register_popup_terms_prefix()}
            <a
              href="/terms-of-use"
              class="text-fg sm:hover:text-violet-500 transition"
              >{register_popup_terms_link()}</a
            >
            {register_popup_privacy_middle()}
            <a
              href="/privacy-policy"
              class="text-fg sm:hover:text-violet-500 transition"
              >{register_popup_privacy_link()}</a
            >.
          </p>

          <p
            class="pt-3 pb-1 text-sm w-full max-w-lg flex justify-center items-center text-fg"
          >
            {register_popup_has_account()}
            <label
              on:click={() => (displaySection = "login")}
              class="text-fg sm:hover:text-violet-500 ml-1 cursor-pointer transition"
              >{register_popup_sign_in_link()}</label
            >
          </p>
        </div>
      </div>
    {/if}

    {#if oauthLoading}
      <div class="absolute right-1/2 left-1/2 top-1/2 bottom-1/2">
        <div class="relative">
          <label
            class="bg-white/90 dark:bg-zinc-900/80 border border-line rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <span
              class="loading loading-spinner loading-md text-fg"
            ></span>
          </label>
        </div>
      </div>
    {/if}
  </div>
</dialog>
