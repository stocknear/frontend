export const load = async ({ locals, url }) => {
  const { pb } = locals;

  // Get category filter from query parameters
  const categoryFilter = url.searchParams.get('category') || 'all';

  const getTutorialsByCategory = async () => {
    // Get all tutorials
    const allTutorials = await pb.collection("tutorials").getFullList({
      sort: "-created",
    });

    // Group by category
    const grouped = {
      Fundamentals: [],
      Concepts: [],
      Strategies: [],
      Features: [],
      Terms: [],
    };

    for (const tutorial of allTutorials) {
      const cat = tutorial.category || 'Concepts';
      if (grouped[cat]) {
        grouped[cat].push(tutorial);
      }
    }

    return grouped;
  };

  const getAllTutorials = async () => {
    const output = await pb.collection("tutorials").getFullList({
      sort: "-created",
    });
    return output;
  };

  return {
    tutorialsByCategory: await getTutorialsByCategory(),
    allTutorials: await getAllTutorials(),
    categoryFilter,
  };
};
