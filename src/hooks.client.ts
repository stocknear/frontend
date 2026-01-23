import { getLanguage, initClientLocalization } from "$lib/i18n.svelte";
import { preloadLocaleMessages } from "$lib/paraglide/messages.js";

/**
 * Client-side init hook.
 * Sets up reactive localization by overwriting Paraglide's getLocale/setLocale.
 */
export async function init() {
  initClientLocalization();
  await preloadLocaleMessages(getLanguage());
}
