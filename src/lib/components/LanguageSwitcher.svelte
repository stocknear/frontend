<script lang="ts">
  import { setLanguage, locales, languageNames, type Locale } from "$lib/i18n.svelte";
  import { getLocale } from "$lib/paraglide/runtime.js";

  // Language flags/icons
  const languageFlags: Record<Locale, string> = {
    en: "🇺🇸",
    de: "🇩🇪"
  };

  // Reactive - getLocale() is wired to our $state via overwriteGetLocale
  let currentLocale = $derived(getLocale());

  function switchLanguage(newLocale: Locale) {
    if (newLocale === currentLocale) return;
    // Set the language (updates cookie)
    setLanguage(newLocale);
    // Reload to get fresh server-rendered content with new locale
    window.location.reload();
  }
</script>

<div class="flex items-center gap-1">
  {#each locales as lang}
    <button
      type="button"
      onclick={() => switchLanguage(lang)}
      class="px-2 py-1 text-sm rounded-md transition-colors {currentLocale === lang
        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}"
      aria-label="Switch to {languageNames[lang]}"
      aria-current={currentLocale === lang ? "true" : undefined}
    >
      <span class="mr-1">{languageFlags[lang]}</span>
      <span class="hidden sm:inline">{lang.toUpperCase()}</span>
    </button>
  {/each}
</div>
