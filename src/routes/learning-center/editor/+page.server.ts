import { fail } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { pb } = locals;

  // Get all articles
  const getArticles = async () => {
    try {
      const articles = await pb.collection("tutorials").getFullList({
        sort: "-created",
      });
      return articles;
    } catch (error) {
      console.error("Error fetching articles:", error);
      return [];
    }
  };

  return {
    articles: await getArticles(),
  };
};

export const actions = {
  // Delete article
  deleteArticle: async ({ request, locals }) => {
    const { pb } = locals;
    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) {
      return fail(400, { error: "Article ID is required" });
    }

    try {
      await pb.collection("tutorials").delete(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting article:", error);
      return fail(500, { error: "Failed to delete article" });
    }
  },
};
