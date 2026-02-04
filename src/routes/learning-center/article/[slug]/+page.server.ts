import { convertToSlug } from "$lib/utils";

export const load = async ({ locals, params }) => {
  const { pb } = locals;

  const getArticleAndRelated = async () => {
    // Fetch all tutorials sorted by created date
    const output = await pb.collection("tutorials").getFullList({
      sort: "-created",
    });

    // Find the matching article based on params.slug
    const matchingArticle = output?.find(
      (article) => convertToSlug(article?.title) === params?.slug
    );

    if (!matchingArticle) {
      return { article: null, relatedArticles: [] };
    }

    // Get related articles based on tags and recency
    const currentTags = matchingArticle.tags || [];
    
    // Filter out the current article and score remaining articles
    const otherArticles = output.filter(
      (article) => article.id !== matchingArticle.id
    );

    // Score articles by matching tags
    const scoredArticles = otherArticles.map((article) => {
      const articleTags = article.tags || [];
      const matchingTags = currentTags.filter((tag: string) => 
        articleTags.includes(tag)
      ).length;
      return { article, score: matchingTags };
    });

    // Sort by score (matching tags) first, then by created date
    scoredArticles.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If same score, sort by created date (newest first)
      return new Date(b.article.created).getTime() - new Date(a.article.created).getTime();
    });

    // Take top 4 related articles
    const relatedArticles = scoredArticles.slice(0, 4).map((item) => item.article);

    return { article: matchingArticle, relatedArticles };
  };

  const getParams = async () => {
    return params?.slug;
  };

  const { article, relatedArticles } = await getArticleAndRelated();

  // Make sure to return a promise
  return {
    getArticle: article,
    getRelatedArticles: relatedArticles,
    getParams: await getParams(),
  };
};
