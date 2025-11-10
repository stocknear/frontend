export const load = async ({ locals }) => {
  const { apiKey, apiURL } = locals;

  const fetchWithAuth = async (endpoint, method = "GET", body = null) => {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${apiURL}${endpoint}`, options);
    return await response.json();
  };

  const getETFBitcoinList = () => fetchWithAuth("/etf-bitcoin-list");
  const getEthereumList = () => fetchWithAuth("/list-category", "POST", { filterList: "ethereum-etfs" });

  const getData = async () => {
    const [bitcoinList, ethereumList] = await Promise.all([
      getETFBitcoinList(),
      getEthereumList(),
    ]);

    return [...bitcoinList, ...ethereumList]
      .sort((a, b) => b?.totalAssets - a?.totalAssets)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };

  return {
    getData: await getData(),
  };
};
