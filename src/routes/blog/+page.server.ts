export const load = async ({ locals, url }) => {
  const { pb } = locals;

  // Get `page` from query parameters, default to 1
  const page = parseInt(url.searchParams.get('page')) || 1;

  const getAllBlogPost = async () => {
    const output = (await pb.collection("articles").getList(page, 6, {
      sort: "-created",
          filter: "category = 'blog' || category = 'pre-earnings'"
    }))?.items;

    const filteredList = output?.map(({ id, collectionId,title, abstract, created, cover }) => ({
      id,
      collectionId,
      title,
      abstract,
      created,
      cover,

    }));

    return filteredList;
  };

  const getTotalLength = async () => {
    const output = await pb.collection("articles").getFullList( {
          filter: "category = 'blog' || category = 'pre-earnings'"
    });

    return output?.length;
  };


  return {
    getAllBlogPost: await getAllBlogPost(),
    getTotalLength: await getTotalLength(),
  };
};
