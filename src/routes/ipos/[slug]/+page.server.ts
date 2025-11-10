export const load = async ({ locals, params }) => {

  const getYear = async () => {
    return params.slug;
  };

  // Make sure to return a promise
  return {
    getYear: await getYear(),
  };
};
