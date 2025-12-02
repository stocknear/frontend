export const load = async ({ locals, url }) => {
  const { apiKey, apiURL } = locals;

  // Get subreddit from URL parameter, default to wallstreetbets
  const subreddit = url.searchParams.get('subreddit') || 'wallstreetbets';

  const getRedditTracker = async () => {
    const response = await fetch(apiURL + `/reddit-tracker?subreddit=${subreddit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    const output = await response.json();

    return output;
  };

  const getAvailableSubreddits = async () => {
    try {
      const response = await fetch(apiURL + "/reddit-tracker-subreddits", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      });

      const output = await response.json();
      return output?.subreddits || [];
    } catch (error) {
      console.error('Error fetching subreddits:', error);
      return [];
    }
  };

  // Make sure to return a promise
  return {
    getRedditTracker: await getRedditTracker(),
    availableSubreddits: await getAvailableSubreddits(),
    currentSubreddit: subreddit,
  };
};
