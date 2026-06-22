// Shared server-side "followed analysts" utilities
// Mirrors lib/server/watchlist.ts but for the analystWatchlist collection
// (one row per user, holding a JSON array of followed analyst objects).

export type FollowedAnalyst = {
  analystId: string;
  analystName: string;
};

/**
 * Fetch the analysts a user follows (lightweight: id + name only).
 * Returns an empty array when the user has no follow row yet.
 * @param pb - PocketBase instance
 * @param userId - User ID to fetch follows for
 */
export async function fetchFollowedAnalysts(
  pb: any,
  userId: string | undefined
): Promise<FollowedAnalyst[]> {
  if (!userId) return [];

  try {
    const row = await pb
      .collection("analystWatchlist")
      .getFirstListItem(`user="${userId}"`, { fields: "analysts" });

    const list = Array.isArray(row?.analysts) ? row.analysts : [];

    return list
      ?.filter((a: any) => a && a.analystId)
      ?.map((a: any) => ({
        analystId: a.analystId,
        analystName: a.analystName ?? "",
      }));
  } catch {
    // 404 (no follow row) or any read error => not following anyone
    return [];
  }
}
