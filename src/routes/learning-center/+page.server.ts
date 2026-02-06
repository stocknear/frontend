export const load = async ({ locals, url }) => {
  const { pb } = locals;

  // Get category filter from query parameters
  const categoryFilter = url.searchParams.get('category') || 'all';

  const getTutorials = async () => {
    // Only fetch fields needed for the listing page (exclude description)
    const tutorials = await pb.collection("tutorials").getFullList({
      sort: "-created",
      fields: "id,collectionId,title,abstract,category,tags,cover,created,updated,time",
    });

    // Group by category
    const grouped = {
      Fundamentals: [],
      Features: [],
      Terms: [],
    };

    for (const tutorial of tutorials) {
      const cat = tutorial?.category || 'Features';
      if (grouped[cat]) {
        grouped[cat]?.push(tutorial);
      }
    }

    return { tutorials, grouped };
  };

  const { tutorials, grouped } = await getTutorials();

  return {
    tutorialsByCategory: grouped,
    allTutorials: tutorials,
    categoryFilter,
  };
};
