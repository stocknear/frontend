import { redirect } from "@sveltejs/kit";

export const load = async ({ params, url }) => {
  const restParts = params?.rest ? params.rest.split("/") : [];
  const mergedSlug = [params?.slug, ...restParts]
    .filter((part) => part && part.length > 0)
    .join("-")
    .toLowerCase();

  throw redirect(301, `/learning-center/article/${mergedSlug}${url.search}`);
};
