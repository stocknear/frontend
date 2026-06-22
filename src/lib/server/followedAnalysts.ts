// Shared server-side "followed analysts" utilities
// Mirrors lib/server/watchlist.ts but for the analystWatchlist collection
// (one row per user, holding a JSON array of followed analyst objects).

export type FollowedAnalyst = {
  analystId: string;
  analystName: string;
};

/**
 * Fetch the analysts a user follows (lightweight: id + name only).
 * Available to any logged-in user (Free can follow 1, Plus 5, Pro unlimited);
 * logged-out users return an empty array without querying PocketBase.
 * @param pb - PocketBase instance
 * @param user - The authenticated user (needs `id`)
 */
export async function fetchFollowedAnalysts(
  pb: any,
  user: { id?: string; tier?: string } | null | undefined
): Promise<FollowedAnalyst[]> {
  if (!user?.id) return [];

  try {
    const row = await pb
      .collection("analystWatchlist")
      .getFirstListItem(`user="${user.id}"`, { fields: "analysts" });

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
