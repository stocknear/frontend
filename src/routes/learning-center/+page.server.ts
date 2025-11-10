

export const load = async ({ locals, url }) => {
  const { pb } = locals;

  // Get `page` from query parameters, default to 1
  const page = parseInt(url.searchParams.get('page')) || 1;

  const getAllBlogPost = async () => {
    const output = await pb.collection("tutorials").getList(page, 6, {
      sort: "-created",
    });

    return output?.items;
  };

  const getTotalLength = async () => {
    const output = await pb.collection("tutorials").getFullList( );

    return output?.length;
  };


  return {
    getAllBlogPost: await getAllBlogPost(),
    getTotalLength: await getTotalLength(),
  };
};
