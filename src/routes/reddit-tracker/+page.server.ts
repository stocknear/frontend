import { getAPI } from "$lib/server/api";

export const load = async ({ locals, url }) => {
  const subreddit = url.searchParams.get('subreddit') || 'wallstreetbets';

  const [redditTracker, subreddits] = await Promise.all([
    getAPI(locals, `/reddit-tracker?subreddit=${subreddit}`),
    getAPI(locals, "/reddit-tracker-subreddits").then(o => o?.subreddits || []).catch(() => []),
  ]);

  return {
    getRedditTracker: redditTracker,
    availableSubreddits: subreddits,
    currentSubreddit: subreddit,
  };
};
