<script lang="ts">
  import { browser } from "$app/environment";
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { Button } from "$lib/components/shadcn/button/index.ts";
  import * as Dialog from "$lib/components/shadcn/dialog/index.ts";
  import Cookie from "lucide-svelte/icons/cookie";

  import { showCookiePreferences } from "$lib/store";

  export let cookieConsent: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    consent: { necessary: boolean; analytics: boolean; marketing: boolean };
  }>();

  interface ConsentState {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp?: number;
  }

  // Parse existing consent or default to null (no decision yet)
  let consent: ConsentState | null = null;
  let showBanner = false;
  let showCustomize = false;

  // Customize toggles (necessary is always true and disabled)
  let analyticsEnabled = false;
  let marketingEnabled = false;

  // Track previous showCustomize state to detect dialog close
  let previousShowCustomize = false;

  // Initialize on mount
  $: if (browser) {
    if (cookieConsent) {
      try {
        consent = JSON.parse(cookieConsent);
        showBanner = false;
      } catch {
        consent = null;
        showBanner = true;
      }
    } else {
      consent = null;
      showBanner = true;
    }
  }

  // Watch for external trigger to open preferences (e.g., from privacy policy page)
  $: if ($showCookiePreferences && browser) {
    openCustomize();
    showCookiePreferences.set(false);
  }

  // Re-show banner when customize dialog closes without making a decision
  $: {
    if (
      browser &&
      previousShowCustomize &&
      !showCustomize &&
      consent === null
    ) {
      showBanner = true;
    }
    previousShowCustomize = showCustomize;
  }

  async function saveConsent(consentData: ConsentState) {
    try {
      await fetch("/api/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consentData),
      });
      consent = consentData;
      showBanner = false;
      showCustomize = false;
      dispatch("consent", consentData);
    } catch (error) {
      console.error("Failed to save cookie consent:", error);
    }
  }

  function acceptAll() {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  }

  function rejectAll() {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  }

  function saveCustom() {
    saveConsent({
      necessary: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      timestamp: Date.now(),
    });
  }

  function openCustomize() {
    // Initialize toggles based on current consent or defaults
    analyticsEnabled = consent?.analytics ?? false;
    marketingEnabled = consent?.marketing ?? false;
    showBanner = false; // Hide banner while customize dialog is open
    showCustomize = true;
  }
</script>

{#if showBanner}
  <div
    class="fixed bottom-0 sm:bottom-6 left-0 right-0 z-[9999] p-4 sm:p-5 text-gray-700 dark:text-zinc-200"
    transition:fly={{ y: 100, duration: 300 }}
  >
    <div
      class="w-full max-w-lg m-auto rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4"
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60"
          >
            <Cookie class="h-5 w-5 text-gray-600 dark:text-zinc-300" />
          </div>
          <h3
            class="text-base font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            We value your privacy
          </h3>
        </div>

        <p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          We use cookies to enhance your browsing experience, analyze site
          traffic, and personalize content.
        </p>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            on:click={acceptAll}
            class="w-full rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 sm:w-auto transition"
          >
            Accept All
          </Button>
          <Button
            on:click={rejectAll}
            variant="outline"
            class="w-full rounded-full border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 sm:w-auto transition"
          >
            Reject All
          </Button>
          <Button
            on:click={openCustomize}
            variant="outline"
            class="w-full rounded-full border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 sm:w-auto transition"
          >
            Customize
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<Dialog.Root bind:open={showCustomize}>
  <Dialog.Content
    class="max-h-[90vh] w-[95vw] max-w-lg rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 overflow-y-auto bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 z-[999]"
  >
    <Dialog.Header>
      <Dialog.Title
        class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        >Cookie Preferences</Dialog.Title
      >
      <Dialog.Description class="text-sm text-gray-600 dark:text-zinc-400">
        Manage your cookie preferences. Necessary cookies cannot be disabled as
        they are required for the website to function.
      </Dialog.Description>
    </Dialog.Header>

    <div class="mt-6 space-y-4">
      <!-- Necessary Cookies -->
      <div
        class="flex items-start justify-between rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 p-4"
      >
        <div class="flex items-start gap-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              Necessary Cookies
            </h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              Essential for authentication, security and basic functionality.
              These cannot be disabled.
            </p>
          </div>
        </div>
        <div
          class="opacity-60 ml-4 flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full bg-gray-900 dark:bg-white px-1"
        >
          <div
            class="h-4 w-4 translate-x-5 rounded-full bg-white dark:bg-zinc-900 transition-transform"
          ></div>
        </div>
      </div>

      <!-- Analytics Cookies -->
      <div
        class="flex items-start justify-between rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 p-4"
      >
        <div class="flex items-start gap-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              Analytics Cookies
            </h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              Help us understand how visitors interact with our website to
              improve user experience.
            </p>
          </div>
        </div>
        <button
          on:click={() => (analyticsEnabled = !analyticsEnabled)}
          class="ml-4 flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors {analyticsEnabled
            ? 'bg-gray-900 dark:bg-white'
            : 'bg-gray-200/70 dark:bg-zinc-800/80'}"
          type="button"
          role="switch"
          aria-checked={analyticsEnabled}
        >
          <div
            class="h-4 w-4 rounded-full bg-white dark:bg-zinc-900 transition-transform {analyticsEnabled
              ? 'translate-x-5'
              : 'translate-x-0'}"
          ></div>
        </button>
      </div>

      <!-- Marketing Cookies -->
      <div
        class="flex items-start justify-between rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 p-4"
      >
        <div class="flex items-start gap-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              Marketing Cookies
            </h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              Used to track visitors across websites for personalized
              advertising.
            </p>
          </div>
        </div>
        <button
          on:click={() => (marketingEnabled = !marketingEnabled)}
          class="ml-4 flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors {marketingEnabled
            ? 'bg-gray-900 dark:bg-white'
            : 'bg-gray-200/70 dark:bg-zinc-800/80'}"
          type="button"
          role="switch"
          aria-checked={marketingEnabled}
        >
          <div
            class="h-4 w-4 rounded-full bg-white dark:bg-zinc-900 transition-transform {marketingEnabled
              ? 'translate-x-5'
              : 'translate-x-0'}"
          ></div>
        </button>
      </div>
    </div>

    <Dialog.Footer class="mt-6 flex flex-col gap-2 sm:flex-row">
      <Button
        on:click={rejectAll}
        variant="outline"
        class="w-full rounded-full border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 sm:w-auto transition"
      >
        Reject All
      </Button>
      <Button
        on:click={acceptAll}
        variant="outline"
        class="w-full rounded-full border-gray-200/70 dark:border-zinc-800/80 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 sm:w-auto transition"
      >
        Accept All
      </Button>
      <Button
        on:click={saveCustom}
        class="w-full rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 sm:w-auto transition"
      >
        Save Preferences
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
