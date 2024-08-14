import { getCache, setCache } from '$lib/store';
import { getPartyForPoliticians } from '$lib/utils';



export const load = async ({parent}) => {
  const getPoliticianRSS = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getPoliticianRSS');
    if (cachedData) {
      output = cachedData;
    } else {

      const {apiKey, apiURL} = await parent();

      const response = await fetch(apiURL + '/congress-rss-feed', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getPoliticianRSS'

      output?.forEach(item => {
        let representative = item?.representative || '';
    
        representative = representative?.replace('Jr', '')
            .replace(/Dr./g, '')
            .replace(/Dr_/g, '')
    
        const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_').trim();
        item.representative = fullName?.replace(/_/g, ' ');
        });
    
        output = output?.map(item => {
            const party = getPartyForPoliticians(item?.representative);
            return {
                ...item,
                party: party
            };
      });

      
      setCache('', output, 'getPoliticianRSS');
    }
    return output;
  };

  // Make sure to return a promise
  return {
    getPoliticianRSS: await getPoliticianRSS()
  };
};