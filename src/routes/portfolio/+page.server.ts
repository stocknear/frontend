export const load = async ({ locals }) => {
 

  const getAllPortfolio = async () => {
    const { pb, user } = locals;

    try {
      const output = await pb.collection("portfolio").getFullList({
        filter: `user="${user?.id}"`,
        sort: "-updated",
      });
      return output;


    } catch (e) {
      console.log(e)
      return [];
    }
  };


  return {
    getAllPortfolio: await getAllPortfolio(),
  };
};
