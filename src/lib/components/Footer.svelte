<script lang="ts">
  import { setMode, setTheme, mode } from "mode-watcher";
  import { page } from "$app/stores";
  import AnimatedThemeToggler from "$lib/components/magic/AnimatedThemeToggler.svelte";
  import {
    setLanguage,
    locales,
    languageNames,
    type Locale,
  } from "$lib/i18n.svelte";
  import { baseLocale, extractLocaleFromUrl } from "$lib/paraglide/runtime.js";
  import { hrefForLanguageSwitch, localizedHref } from "$lib/i18n/navigation";
  import {
    footer_tagline,
    footer_sections,
    footer_stocks,
    footer_ipos,
    footer_etfs,
    footer_portfolio,
    footer_learning_center,
    footer_services,
    footer_pricing_plan,
    footer_get_support,
    footer_install_app,
    footer_website,
    footer_login,
    footer_faq,
    footer_sitemap,
    footer_light,
    footer_dark,
    footer_company,
    footer_about,
    footer_terms_of_use,
    footer_data_disclaimer,
    mcp_footer_link,
    common_contact_us,
    common_privacy_policy,
    common_imprint,
    common_language_switch,
    common_close,
  } from "$lib/paraglide/messages.js";

  let discordURL = import.meta.env.VITE_DISCORD_URL;

  const flagEmoji: Record<Locale, string> = {
    en: "🇺🇸",
    de: "🇩🇪",
    "zh-CN": "🇨🇳",
    "zh-TW": "🇹🇼",
    es: "🇪🇸",
    fr: "🇫🇷",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ru: "🇷🇺",
    uk: "🇺🇦",
  };

  let currentLocale = $derived(extractLocaleFromUrl($page.url) ?? baseLocale);

  async function handleModeChange(newMode: "light" | "dark") {
    setMode(newMode);
    // Keeps daisyUI's data-theme in step; without it the attribute is blanked.
    setTheme(newMode);

    try {
      await fetch("/api/theme-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  }

  // Source order (en, de, zh-CN, ...) is fine for six entries and unscannable at 28, so
  // order by the label actually rendered. Copied first — `locales` is readonly.
  const localeOptions = [...locales].sort((a, b) =>
    (languageNames?.[a] ?? a).localeCompare(languageNames?.[b] ?? b),
  );

  let langDetails: HTMLDetailsElement | undefined = $state();

  function closeLanguageMenu() {
    if (langDetails) langDetails.open = false;
  }

  function switchLanguage(locale: Locale) {
    if (locale === currentLocale) return;
    setLanguage(
      locale,
      `${$page.url.pathname}${$page.url.search}${$page.url.hash}`,
    );
  }
</script>

<footer
  class="w-full mt-auto bg-[#1e2837] dark:bg-[#131214] border-t border-line"
>
  <div class="mx-auto max-w-7xl px-5 pt-12 sm:px-6 lg:px-8 lg:pb-8">
    <div
      class="flex flex-col md:flex-row md:items-start md:justify-between gap-12"
    >
      <!-- Branding -->
      <div
        class="w-80 flex-shrink-0 flex flex-col sm:flex-row items-start space-x-4"
      >
        <img
          src="/pwa-192x192.png"
          alt="logo"
          class="w-11 h-11 rounded-container"
        />
        <div>
          <span class="text-xl font-semibold text-white">Stocknear</span>
          <p class="mt-2 text-sm text-white dark:text-zinc-300">
            {footer_tagline()}
          </p>
        </div>
      </div>

      <!-- Nav Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full">
        <!-- Repeat this block for each section -->
        <nav class="space-y-3">
          <h6
            class="text-xs font-semibold uppercase tracking-[0.2em] text-white dark:text-zinc-300"
          >
            {footer_sections()}
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/stocks/", currentLocale)}
                >{footer_stocks()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/ipos/", currentLocale)}>{footer_ipos()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/etf/", currentLocale)}>{footer_etfs()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/portfolio/", currentLocale)}
                >{footer_portfolio()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/learning-center/", currentLocale)}
                >{footer_learning_center()}</a
              >
            </li>
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-xs font-semibold uppercase tracking-[0.2em] text-white dark:text-zinc-300"
          >
            {footer_services()}
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/pricing/", currentLocale)}
                >{footer_pricing_plan()}</a
              >
            </li>

            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/support/", currentLocale)}
                >{footer_get_support()}</a
              >
            </li>

            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/mcp", currentLocale)}
                >{mcp_footer_link()}</a
              >
            </li>

            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/app/", currentLocale)}
                >{footer_install_app()}</a
              >
            </li>
            <!--
            <li>
              <a
                class="text-fg-muted hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/advertise">Advertise</a
              >
            </li>
            -->
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-xs font-semibold uppercase tracking-[0.2em] text-white dark:text-zinc-300"
          >
            {footer_website()}
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/login/", currentLocale)}
                >{footer_login()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/faq/", currentLocale)}>{footer_faq()}</a
              >
            </li>

            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/sitemap/", currentLocale)}
                >{footer_sitemap()}</a
              >
            </li>

            <!--
            <li>
              <a
                class="text-fg-muted hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/affiliate-program/">Affiliate Program</a
              >
            </li>
            -->
            <li class="text-te">
              <AnimatedThemeToggler
                modeValue={$mode}
                onToggle={handleModeChange}
                lightLabel={footer_light()}
                darkLabel={footer_dark()}
              />
            </li>

            <li>
              <details class="group relative w-fit" bind:this={langDetails}>
                <summary
                  aria-label={common_language_switch()}
                  class="mt-3 flex list-none items-center gap-2 rounded-full border border-zinc-600 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:bg-white/10 hover:text-white cursor-pointer [&::-webkit-details-marker]:hidden"
                >
                  <span aria-hidden="true">{flagEmoji[currentLocale]}</span>
                  <span class="uppercase font-medium">{currentLocale}</span>
                  <svg
                    class="size-3 opacity-60"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </summary>
                <!-- Tap-anywhere-to-close for the mobile sheet. A <details> has no such
                     affordance of its own, and a 28-item sheet with no way out but the
                     back button is a trap. Hidden on desktop, where the dropdown closes
                     on blur like any other menu.
                     z-[10000]: CookieConsent's banner is `fixed bottom-0 ... z-[9999]`
                     and shows by default for anyone who hasn't answered consent yet —
                     exactly the first-time visitor this switcher is for. At the old
                     z-40/z-50 the banner painted over this sheet and ate its clicks,
                     both being `fixed bottom-0`. Must stay above 9999. -->
                <button
                  type="button"
                  tabindex="-1"
                  aria-label={common_close()}
                  class="fixed inset-0 z-[10000] bg-black/50 sm:hidden"
                  on:click={closeLanguageMenu}
                ></button>

                <!-- Mobile: a bottom sheet. The old panel was anchored `bottom-full`, so
                     it grew *upward* out of the footer — at 28 locales that is ~1100px
                     climbing off the top of the screen, and the rows were 32px, well
                     under the 44px touch target. Fixed to the bottom edge, capped at
                     70vh, two columns of large rows.
                     Desktop (sm+): unchanged dropdown above the trigger, so it keeps the
                     original z-50 there — the cookie banner collision is mobile-only
                     (`sm:bottom-6` gives it a gap on desktop instead of flush bottom-0).
                     `overscroll-contain` keeps the page from scrolling behind it. -->
                <div
                  role="menu"
                  class="fixed inset-x-0 bottom-0 z-[10000] max-h-[70vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border-t border-line bg-surface-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-fg shadow-2xl grid grid-cols-2 gap-1 sm:absolute sm:inset-x-auto sm:bottom-full sm:left-0 sm:z-50 sm:mb-2 sm:max-h-[26rem] sm:w-[min(88vw,28rem)] sm:gap-0 sm:rounded-container sm:border sm:p-1 sm:pb-1 sm:shadow-lg"
                >
                  <div
                    class="col-span-2 flex items-center justify-between px-2 pb-2 pt-1 sm:hidden"
                  >
                    <span class="text-sm font-semibold"
                      >{common_language_switch()}</span
                    >
                    <button
                      type="button"
                      class="rounded-full px-3 py-1 text-xs text-fg-muted"
                      on:click={closeLanguageMenu}>{common_close()}</button
                    >
                  </div>
                  {#each localeOptions as lang}
                    <a
                      role="menuitem"
                      href={hrefForLanguageSwitch(
                        `${$page.url.pathname}${$page.url.search}${$page.url.hash}`,
                        lang,
                      )}
                      data-sveltekit-reload
                      class="flex min-h-11 items-center gap-3 px-3 py-3 text-sm rounded-container cursor-pointer sm:min-h-0 sm:py-2 {currentLocale ===
                      lang
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-accent'
                        : 'hover:bg-gray-100/70 dark:hover:bg-zinc-900/60'} transition"
                      on:click={(event) => {
                        event?.preventDefault();
                        switchLanguage(lang);
                      }}
                    >
                      <span aria-hidden="true">{flagEmoji[lang]}</span>
                      <span class="truncate">{languageNames?.[lang]}</span>
                    </a>
                  {/each}
                </div>
              </details>
            </li>
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-xs font-semibold uppercase tracking-[0.2em] text-white dark:text-zinc-300"
          >
            {footer_company()}
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/about/", currentLocale)}
                >{footer_about()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/contact/", currentLocale)}
                >{common_contact_us()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/terms-of-use/", currentLocale)}
                >{footer_terms_of_use()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/privacy-policy/", currentLocale)}
                >{common_privacy_policy()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/data-disclaimer/", currentLocale)}
                >{footer_data_disclaimer()}</a
              >
            </li>
            <li>
              <a
                class="text-sm text-zinc-300 transition hover:text-white"
                href={localizedHref("/imprint/", currentLocale)}
                >{common_imprint()}</a
              >
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Bottom bar -->
    <div
      class="-mb-8 mt-10 border-t border-zinc-700 pb-6 pt-8 md:flex md:items-center md:justify-between"
    >
      <div class="flex space-x-6 md:order-1">
        <a
          href="https://www.youtube.com/@stocknear"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Reddit"
          class="text-zinc-400 transition hover:text-white"
        >
          <svg
            class="pointer-events-none h-8 w-8"
            viewBox="0 -7 48 48"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            fill="currentColor"
            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g><g id="SVGRepo_iconCarrier">
              <title>Youtube-color</title> <desc>Created with Sketch.</desc>
              <defs> </defs>
              <g
                id="Icons"
                stroke="none"
                stroke-width="1"
                fill="none"
                fill-rule="evenodd"
              >
                <g
                  id="Color-"
                  transform="translate(-200.000000, -368.000000)"
                  fill="currentColor"
                >
                  <path
                    d="M219.044,391.269916 L219.0425,377.687742 L232.0115,384.502244 L219.044,391.269916 Z M247.52,375.334163 C247.52,375.334163 247.0505,372.003199 245.612,370.536366 C243.7865,368.610299 241.7405,368.601235 240.803,368.489448 C234.086,368 224.0105,368 224.0105,368 L223.9895,368 C223.9895,368 213.914,368 207.197,368.489448 C206.258,368.601235 204.2135,368.610299 202.3865,370.536366 C200.948,372.003199 200.48,375.334163 200.48,375.334163 C200.48,375.334163 200,379.246723 200,383.157773 L200,386.82561 C200,390.73817 200.48,394.64922 200.48,394.64922 C200.48,394.64922 200.948,397.980184 202.3865,399.447016 C204.2135,401.373084 206.612,401.312658 207.68,401.513574 C211.52,401.885191 224,402 224,402 C224,402 234.086,401.984894 240.803,401.495446 C241.7405,401.382148 243.7865,401.373084 245.612,399.447016 C247.0505,397.980184 247.52,394.64922 247.52,394.64922 C247.52,394.64922 248,390.73817 248,386.82561 L248,383.157773 C248,379.246723 247.52,375.334163 247.52,375.334163 L247.52,375.334163 Z"
                    id="Youtube"
                  >
                  </path>
                </g>
              </g>
            </g></svg
          >
        </a>

        <a
          href="https://www.reddit.com/r/stocknear/"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Reddit"
          class="text-zinc-400 transition hover:text-white"
        >
          <svg
            class="pointer-events-none h-7 w-7 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            ><path
              fill="currentColor"
              d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286A.72.72 0 0 0 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0m4.388 3.199a1.999 1.999 0 1 1-1.947 2.46v.002a2.37 2.37 0 0 0-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363a2.802 2.802 0 1 1 2.908 4.753c-.088 3.256-3.637 5.876-7.997 5.876c-4.361 0-7.905-2.617-7.998-5.87a2.8 2.8 0 0 1 1.189-5.34c.645 0 1.239.218 1.712.585c1.275-.79 2.881-1.291 4.64-1.365v-.01a3.23 3.23 0 0 1 2.88-3.207a2 2 0 0 1 1.959-1.595m-8.085 8.376c-.784 0-1.459.78-1.506 1.797s.64 1.429 1.426 1.429s1.371-.369 1.418-1.385s-.553-1.841-1.338-1.841m7.406 0c-.786 0-1.385.824-1.338 1.841s.634 1.385 1.418 1.385c.785 0 1.473-.413 1.426-1.429c-.046-1.017-.721-1.797-1.506-1.797m-3.703 4.013c-.974 0-1.907.048-2.77.135a.222.222 0 0 0-.183.305a3.2 3.2 0 0 0 2.953 1.964a3.2 3.2 0 0 0 2.953-1.964a.222.222 0 0 0-.184-.305a28 28 0 0 0-2.769-.135"
            /></svg
          >
        </a>

        <a
          href={discordURL}
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Discord"
          class="h-5 w-5 text-zinc-400 transition hover:text-white"
        >
          <svg
            class="pointer-events-none h-8 w-8 -ml-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"
            /></svg
          >
        </a>

        <a
          href="https://twitter.com/intent/follow?screen_name=stocknear"
          target="_blank"
          rel="noopener noreferrer"
          class="text-zinc-400 transition hover:text-white"
          aria-label="Follow on X"
          ><svg
            class="pointer-events-none h-8 w-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            style="max-width:40px"
            aria-hidden="true"
            ><path
              d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
            ></path></svg
          >
        </a>
      </div>
      <div class="text-sm flex flex-row items-center mt-4 sm:mt-0 text-white">
        © 2026 Stocknear. All rights reserved.
      </div>

      <!--
      <div class="text-sm flex flex-row items-center mt-4 sm:mt-0">
        Made with 🧡 in Germany<img
          class="size-5 ml-1"
          src="https://flagsapi.com/DE/flat/16.png"
        />
      </div>
      -->
    </div>
  </div>
</footer>
