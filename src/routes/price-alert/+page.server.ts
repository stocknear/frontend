export const load = async ({ locals }) => {
  const { apiKey, apiURL, user } = locals;

  const getPriceAlert = async () => {
    if (!user?.id) {
      return { data: [], news: [], earnings: [] };
    }

    const postData = { userId: user?.id };
    const response = await fetch(apiURL + "/get-price-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    output.data = (output?.data || [])
      ?.map((item) => ({
        ...item,
        hasNote: Boolean(item?.note && String(item.note)?.trim()?.length > 0),
      }))
      ?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));
    return output;
  };

  return {
    getPriceAlert: await getPriceAlert(),
  };
};
