export const load = async ({ locals }) => {
 

  const getData = async () => {
    const { pb, user } = locals;

    try {
      const output = await pb.collection("watchlist").getFullList({
        filter: `user="${user?.id}"`,
        sort: "-updated",
      });

      return output;


    } catch (e) {
      console.log(e)
      return [];
    }
  };


  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
