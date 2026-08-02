<script lang="ts">
  import { onMount } from "svelte";
  import {
    baseLocale,
    cookieName,
    extractLocaleFromUrl,
    type Locale,
  } from "$lib/paraglide/runtime.js";
  import {
    languageNames,
    rememberLanguage,
    setLanguage,
  } from "$lib/i18n.svelte";
  import {
    LANGUAGE_SUGGESTION_DISMISS_COOKIE,
    LANGUAGE_SUGGESTION_DISMISS_SECONDS,
    canonicalizeLocale,
    matchBrowserLocale,
  } from "$lib/i18n/locales";
  import {
    common_language_close,
    common_language_keep_english,
    common_language_suggestion,
    common_language_switch,
  } from "$lib/paraglide/messages.js";

  export let initialLocale: Locale | null = null;

  function hasCookie(name: string): boolean {
    return document?.cookie
      ?.split(";")
      ?.some((part) => part.trim().startsWith(`${name}=`)) ?? false;
  }

  function getCookie(name: string): string | null {
    const prefix = `${name}=`;
    const value = document?.cookie
      ?.split(";")
      ?.map((part) => part.trim())
      ?.find((part) => part.startsWith(prefix))
      ?.slice(prefix.length);
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  function getClientSuggestion(): Locale | null {
    if (
      (extractLocaleFromUrl(new URL(window.location.href)) ?? baseLocale) !== baseLocale ||
      canonicalizeLocale(getCookie(cookieName)) !== null ||
      hasCookie(LANGUAGE_SUGGESTION_DISMISS_COOKIE)
    ) return null;

    const browserLocale = matchBrowserLocale(navigator.languages ?? [navigator.language]);
    return browserLocale && browserLocale !== "en" ? browserLocale : null;
  }

  let suggestedLocale: Locale | null = initialLocale;

  function dismiss() {
    document.cookie = `${LANGUAGE_SUGGESTION_DISMISS_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=${LANGUAGE_SUGGESTION_DISMISS_SECONDS}${location.protocol === "https:" ? "; Secure" : ""}`;
    suggestedLocale = null;
  }

  function keepEnglish() {
    rememberLanguage("en");
    suggestedLocale = null;
  }

  onMount(() => {
    suggestedLocale ??= getClientSuggestion();
  });
</script>

{#if suggestedLocale}
<aside
  class="fixed inset-x-3 bottom-20 z-[70] mx-auto flex max-w-xl flex-col items-stretch gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:inset-x-4 sm:flex-row sm:items-center md:bottom-5"
  role="region"
  aria-labelledby="language-suggestion-message"
>
  <p
    id="language-suggestion-message"
    class="min-w-0 flex-1"
    aria-live="polite"
    aria-atomic="true"
  >
    {common_language_suggestion({ language: languageNames[suggestedLocale] })}
  </p>
  <div class="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
    <button
      class="shrink-0 rounded-lg bg-violet-600 px-3 py-2 font-medium text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      on:click={() =>
        suggestedLocale &&
        setLanguage(
          suggestedLocale,
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        )}
    >
      {common_language_switch()}
    </button>
    <button
      class="min-w-0 rounded-lg px-2 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:text-white"
      on:click={keepEnglish}
    >
      {common_language_keep_english()}
    </button>
    <button
      class="ml-auto shrink-0 rounded p-1 text-xl leading-none text-zinc-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-white"
      aria-label={common_language_close()}
      on:click={dismiss}
    >
      ×
    </button>
  </div>
</aside>
{/if}
