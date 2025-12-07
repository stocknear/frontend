export const load = ({ locals }) => {
  const { user, wsURL, themeMode, cookieConsent } = locals;

  return {
    user: user || undefined,
    cookieConsent, // Parsed JSON object from hooks.server.ts
    wsURL,
    themeMode,
  };
};