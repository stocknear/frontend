export const load = async ({locals}) => {
    const { pb } = locals;

  const getTutorialPost = async () => {
    // Get all tutorials (excluding Terms for the main list)
    const output = await pb.collection("tutorials").getFullList({
      sort: "-created",
      filter: 'category != "Terms"',
    }) || [];

    return output;
  };

  const getTerms = async () => {
    // Get terms from tutorials collection
    const output = await pb.collection("tutorials").getFullList({
      sort: "title",
      filter: 'category = "Terms"',
    }) || [];

    return output;
  };

  // Make sure to return a promise
  return {
    getTutorialPost: await getTutorialPost(),
    getTerms: await getTerms(),
  };
};
