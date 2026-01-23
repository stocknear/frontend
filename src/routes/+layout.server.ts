export const load = ({ locals }) => {
  const { user, wsURL, themeMode, cookieConsent, locale } = locals;

  return {
    user: user || undefined,
    cookieConsent, // Parsed JSON object from hooks.server.ts
    wsURL,
    themeMode,
    locale,
  };
};