import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { pb, user } = locals;

  let output;

  if(user?.tier === 'Pro') {
        try {
    // Ensure itemIdList is always an array.
    const itemIdList = Array.isArray(data?.itemIdList)
      ? data?.itemIdList
      : [data?.itemIdList];

    const watchList = await pb.collection("optionsWatchlist").getOne(data?.id);

    // Check if all items in itemIdList are already in the watchlist.
    const allItemsInWatchList = itemIdList.every((item) =>
      watchList?.optionsId.includes(item)
    );

    if (allItemsInWatchList) {
      // Remove tickers from the watchlist.
      const newTickerList = watchList?.optionsId.filter(
        (item) => !itemIdList.includes(item)
      );
      output = await pb
        .collection("optionsWatchlist")
        .update(data?.id, { optionsId: newTickerList });
    } else {
      // Add new tickers to the watchlist.
      const newTickerList = Array.from(
        new Set([...watchList?.optionsId, ...itemIdList])
      );
      output = await pb
        .collection("optionsWatchlist")
        .update(data?.id, { optionsId: newTickerList });
    }
  } catch (e) {
    // Handle case where watchlist does not exist.
    output = await pb.collection("optionsWatchlist").create(
      serialize({
        user: locals?.user?.id,
        optionsId: JSON.stringify(data?.itemIdList),
      })
    );
  }

  return new Response(JSON.stringify(output?.id));


  } else {
      return new Response(JSON.stringify("failure"));

  }

};
