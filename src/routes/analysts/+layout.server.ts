import { fetchFollowedAnalysts } from "$lib/server/followedAnalysts";

// Load the user's followed analysts once for the whole /analysts subtree
// (leaderboard + individual analyst pages), exposed via $page.data.
export const load = async ({ locals }) => {
  const { pb, user } = locals;

  return {
    getFollowedAnalysts: await fetchFollowedAnalysts(pb, user?.id),
  };
};
