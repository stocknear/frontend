export const load = ({ locals, cookies }) => {
    const { user, region, apiURL, fastifyURL, wsURL, apiKey } = locals;
    
    return {
      user: user || undefined,
      region,
      cookieConsent: cookies?.get('cookie-consent'),
      apiURL,
      fastifyURL,
      wsURL,
      apiKey,
    };
  };