const usRegion = ['cle1','iad1','pdx1','sfo1'];


export const load = async ({locals}) => {
  const userRegion = locals.region?.split("::")[0];
  let apiURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };

  
    const getBestHedgeFunds = async () => {
      let output = (await import('$lib/hedge-funds/best-hedge-funds.json'))?.default
      output = locals?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;
      
      return output;
    };
    return {
      getBestHedgeFunds: await getBestHedgeFunds()
    };
  };