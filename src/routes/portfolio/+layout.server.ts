export const load = async ({ locals, url }) => {
  const getAllPortfolio = async () => {
    const { pb, user } = locals;

    try {
      const output = await pb.collection("portfolio").getFullList({
        filter: `user="${user?.id}"`,
        sort: "-updated",
      });
      return output;
    } catch (e) {
      console.log(e);
      return [];
    }
  };

  // Get active portfolio ID from URL params if provided
  const portfolioId = url.searchParams?.get('id');

  return {
    getAllPortfolio: await getAllPortfolio(),
    activePortfolioId: portfolioId,
  };
};
