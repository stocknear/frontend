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

  const [tutorialPost, terms] = await Promise.all([
    getTutorialPost(),
    getTerms(),
  ]);

  return {
    getTutorialPost: tutorialPost,
    getTerms: terms,
  };
};
