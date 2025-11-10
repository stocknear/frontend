

export const load = ({ locals, cookies }) => {
  const { user, wsURL, themeMode } = locals;

  return {
    user: user || undefined,
    cookieConsent: cookies.get("cookie-consent"),
    wsURL,
    themeMode // Add theme mode to returned data
  };
};