import { initClientLocalization } from "$lib/i18n.svelte";

/**
 * Client-side init hook.
 * Sets up reactive localization by overwriting Paraglide's getLocale/setLocale.
 */
export async function init() {
  initClientLocalization();
}
