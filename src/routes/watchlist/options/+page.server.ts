  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const currentTime = new Date().getTime();
    const difference = targetTime - currentTime;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);

    return daysLeft;
  }
  
export const load = async ({ locals }) => {
  const getOptionsWatchlist = async () => {
    const { apiKey, apiURL, pb, user } = locals;

    try {
      // Fetch the watchlist for the user from the database
      const watchList = (
        await pb.collection("optionsWatchlist").getFullList({
          filter: `user="${user?.id}"`,
        })
      )?.at(0);

      if (watchList !== undefined && watchList?.optionsId?.length !== 0) {
        const postData = { optionsIdList: watchList?.optionsId };
        const response = await fetch(apiURL + "/get-options-watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify(postData),
        });
        const output = await response.json();

        output?.forEach((item) => {
        item.dte = daysLeft(item?.date_expiration);
        item.size = Math.floor(item?.cost_basis / (item?.price * 100));
      });


        return { id: watchList?.id, optionsList: output };
      } else {
        return { id: "", optionsList: [] };
      }
    } catch (e) {
      console.error("Error fetching options watchlist or Benzinga data:", e);
      return { id: "", optionsList: [] };
    }
  };

  return {
    getOptionsWatchlist: await getOptionsWatchlist(),
  };
};
