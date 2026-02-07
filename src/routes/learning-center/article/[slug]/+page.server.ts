import { convertToSlug } from "$lib/utils";

export const load = async ({ locals, params }) => {
  const { pb } = locals;

  const getArticleAndRelated = async () => {
    // Step 1: Lightweight lookup - only fetch id, title, tags, category (no description/cover)
    const index = await pb.collection("tutorials").getFullList({
      sort: "-created",
      fields: "id,title,tags,category",
      requestKey: "article-index",
    });

    // Find the matching article by slug
    const match = index?.find(
      (article) => convertToSlug(article?.title) === params?.slug
    );

    if (!match) {
      return { article: null, relatedArticles: [] };
    }

    // Step 2: Fetch the full article by ID
    const article = await pb.collection("tutorials").getOne(match.id, {
      requestKey: "article-full",
    });

    // Step 3: Fetch related articles - filter by matching tags, exclude current
    const currentTags = match.tags || [];
    let relatedArticles: any[] = [];

    if (currentTags.length > 0) {
      // Try to find articles with matching tags
      const tagFilters = currentTags.map(
        (tag: string) => `tags ~ "${tag}"`
      );
      const filter = `id != "${match.id}" && (${tagFilters.join(" || ")})`;

      const related = await pb.collection("tutorials").getList(1, 4, {
        filter,
        sort: "-created",
        fields:
          "id,collectionId,title,abstract,category,tags,cover,created,updated,time",
        requestKey: "article-related",
      });
      relatedArticles = related.items;
    }

    // If we got fewer than 4 related articles, fill with recent ones
    if (relatedArticles.length < 4) {
      const existingIds = [match.id, ...relatedArticles.map((a) => a.id)];
      const excludeFilter = existingIds
        .map((id) => `id != "${id}"`)
        .join(" && ");
      const remaining = 4 - relatedArticles.length;

      const filler = await pb.collection("tutorials").getList(1, remaining, {
        filter: excludeFilter,
        sort: "-created",
        fields:
          "id,collectionId,title,abstract,category,tags,cover,created,updated,time",
        requestKey: "article-filler",
      });
      relatedArticles = [...relatedArticles, ...filler.items];
    }

    return { article, relatedArticles };
  };

  const { article, relatedArticles } = await getArticleAndRelated();

  return {
    getArticle: article,
    getRelatedArticles: relatedArticles,
    getParams: params?.slug,
  };
};
