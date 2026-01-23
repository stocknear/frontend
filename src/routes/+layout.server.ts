import { CF_TURNSTILE_SITE_KEY, VAPID_PUBLIC_KEY } from "$env/static/private";

export const load = ({ locals }) => {
  const { user, wsURL, themeMode, cookieConsent, locale } = locals;

  return {
    user: user || undefined,
    cookieConsent, // Parsed JSON object from hooks.server.ts
    wsURL,
    themeMode,
    locale,
    // Public keys passed to client (these are safe to expose)
    turnstileSiteKey: CF_TURNSTILE_SITE_KEY,
    vapidPublicKey: VAPID_PUBLIC_KEY,
  };
};