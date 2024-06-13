
export const load = ({ locals, cookies }) => {

  const consent = cookies?.get('cookie-consent')

  if (locals.user) {
      return {
          user: locals.user,
          region: locals.region,
          cookieConsent: consent,
      };
  }

 

  return {
      user: undefined,
      region: locals.region,
      cookieConsent: consent,
  };
};

