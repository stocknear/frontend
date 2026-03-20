export const load = async ({locals}) => {
    const { pb } = locals;
  const fields = "title";

  const getTutorialPost = async () => {
    // Get only the 15 titles displayed in the main list.
    const output = await pb.collection("tutorials").getList(1, 15, {
      sort: "-created",
      filter: 'category != "Terms"',
      fields,
      requestKey: "sitemap-tutorials",
    });

    return output?.items || [];
  };

  const getTerms = async () => {
    // Load only the latest 20 term titles for the sitemap terms section.
    const output = await pb.collection("tutorials").getList(1, 20, {
      sort: "-created",
      filter: 'category = "Terms"',
      fields,
      requestKey: "sitemap-terms",
    });

    return output?.items || [];
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
