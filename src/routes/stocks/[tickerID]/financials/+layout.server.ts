

export const load = async ({ locals, params }) => {
  if (locals.useMockData) {
    return {
      getProfileData: {
        companyName: 'Exxon Mobil Corporation',
        symbol: params.tickerID,
        exchangeShortName: 'NYSE',
        sector: 'Energy',
        industry: 'Oil & Gas Integrated',
        marketCap: 460000000000,
        country: 'US',
        description: 'Exxon Mobil Corporation explores for and produces crude oil and natural gas.',
        ceo: 'Darren W. Woods',
        fullTimeEmployees: 62000,
        website: 'https://corporate.exxonmobil.com',
        ipoDate: '1970-01-02',
        image: '',
      },
    };
  }

  const { apiKey, apiURL } = locals;
  const postData = {
    ticker: params.tickerID,
  };

  const getProfileData = async () => {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getProfileData: await getProfileData(),
  };
};

