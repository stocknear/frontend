
export const load = async ({locals}) => {
    const { pb } = locals;

    const getBlogPosts = async () => {


      // make the POST request to the endpoint
      let output = await pb.collection("articles").getFullList({
        sort: "-created",
      }) || [];

      for (let i = 0; i < output?.length; i++) {
        output[i].abstract = "" //faster loading set it empty
        output[i].cover = "" //faster loading set it empty
        output[i].description = "" //faster loading set it empty
        output[i].data = "" //faster loading set it empty
      }

    return output;
  };

      const getTutorialPost = async () => {


      // make the POST request to the endpoint
      const output = await pb.collection("tutorials").getFullList({
        sort: "-created",
      }) || [];

    return output;
  };

  // Make sure to return a promise
  return {
    getBlogPosts: await getBlogPosts(),
    getTutorialPost: await getTutorialPost(),
  };
};