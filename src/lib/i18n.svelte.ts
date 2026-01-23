/**
 * i18n utilities for SvelteKit + Paraglide.js
 *
 * Uses Svelte 5 reactivity ($state) with Paraglide's overwrite functions
 * for fully-reactive CSR localization with proper SSR support.
 */

import { browser } from '$app/environment';
import {
  getLocale,
  setLocale as paraglideSetLocale,
  overwriteGetLocale,
  overwriteSetLocale,
  locales,
  baseLocale,
  isLocale,
  cookieName,
  type Locale
} from '$lib/paraglide/runtime.js';

// Re-export for convenience
export { locales, baseLocale, isLocale, type Locale };

// Language display names
export const languageNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch'
};

/**
 * Client-side localization class using Svelte 5 $state for reactivity.
 * This integrates with Paraglide's runtime via overwriteGetLocale/overwriteSetLocale.
 */
export class ClientLocalization {
  #locale: Locale = $state(getLocale());

  constructor() {
    if (!browser) {
      throw new Error("Cannot construct ClientLocalization on the server.");
    }
  }

  get current(): Locale {
    return this.#locale;
  }

  set current(value: Locale) {
    if (value === this.#locale) return;
    if (!isLocale(value)) {
      console.warn(`Invalid locale: ${value}`);
      return;
    }

    this.#locale = value;

    // Persist to cookie
    document.cookie = `${cookieName}=${value}; Path=/; SameSite=Lax; Max-Age=34560000`;

    // Update HTML lang attribute
    const html = document.documentElement;
    if (html) {
      html.lang = value;
    }
  }
}

// Singleton instance for client-side (initialized in hooks.client.ts)
let clientLocalization: ClientLocalization | null = null;

/**
 * Initialize client-side localization.
 * Call this from hooks.client.ts init() function.
 */
export function initClientLocalization(): ClientLocalization {
  if (!browser) {
    throw new Error("initClientLocalization can only be called on the client.");
  }

  if (!clientLocalization) {
    clientLocalization = new ClientLocalization();

    // Wire up Paraglide's runtime to use our reactive state
    overwriteGetLocale(() => clientLocalization!.current);
    overwriteSetLocale((newLocale: Locale) => {
      clientLocalization!.current = newLocale;
    });
  }

  return clientLocalization;
}

/**
 * Get the client localization instance.
 * Returns null on server.
 */
export function getClientLocalization(): ClientLocalization | null {
  return clientLocalization;
}

/**
 * Set the current locale (works on both client and server).
 * On client, uses the reactive ClientLocalization.
 * On server, uses Paraglide's setLocale directly.
 */
export function setLanguage(newLocale: Locale): void {
  if (!isLocale(newLocale)) {
    console.warn(`Invalid locale: ${newLocale}`);
    return;
  }

  if (browser && clientLocalization) {
    clientLocalization.current = newLocale;
  } else {
    paraglideSetLocale(newLocale);
  }
}

/**
 * Get the current locale.
 */
export function getLanguage(): Locale {
  return getLocale();
}
