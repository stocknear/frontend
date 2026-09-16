/** Lists whose row order a user can rearrange by dragging. */
export type ReorderableList = "watchlist" | "portfolio" | "optionsWatchlist";

// Each list keeps its own endpoint, so no auth, tier gate or rate limit moves.
// Adding a list is one entry here plus a `reorder` branch on its endpoint.
const ENDPOINTS: Record<
  ReorderableList,
  { url: string; body: (recordId: string, order: string[]) => unknown }
> = {
  watchlist: {
    url: "/api/update-watchlist",
    body: (recordId, order) => ({
      mode: "reorder",
      watchListId: recordId,
      ticker: order,
    }),
  },
  portfolio: {
    url: "/api/update-portfolio",
    body: (recordId, order) => ({
      mode: "reorder",
      portfolioId: recordId,
      ticker: order,
    }),
  },
  optionsWatchlist: {
    url: "/api/update-options-watchlist",
    body: (recordId, order) => ({
      mode: "reorder",
      id: recordId,
      itemIds: order,
    }),
  },
};

/**
 * Move one row so it takes the target's position: below the target when
 * dragging down, above it when dragging up. Returns the original array when
 * the move is a no-op, so callers can compare by reference.
 */
export function moveByKey<T>(
  items: T[] | undefined,
  fromKey: string,
  toKey: string,
  keyOf: (item: T) => string,
): T[] {
  const source = items ?? [];
  if (fromKey === toKey) return source;

  const next = [...source];
  const from = next?.findIndex((item) => keyOf(item) === fromKey);
  const to = next?.findIndex((item) => keyOf(item) === toKey);
  if (from < 0 || to < 0) return source;

  // Removing the row first shifts the tail down by one, so splicing back at
  // `to` lands it on the target's own index.
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * Apply an order given as a list of keys. Keys the order does not mention keep
 * their current relative position at the end, so a reorder issued while a
 * filter is active cannot drop rows.
 *
 * Used on the client to mirror a drop, and on the server to permute the stored
 * rows — where only ids cross the wire, because the stored objects carry
 * metadata (notes, cost basis) the client never holds.
 */
export function applyOrder<T>(
  items: T[] | undefined,
  order: string[],
  keyOf: (item: T) => string,
): T[] {
  const rank = new Map(order?.map((key, index) => [key, index]));

  // Unranked items compare NaN, which the spec coerces to +0, and sort is
  // stable — so they keep their existing order.
  return [...(items ?? [])]?.sort(
    (a, b) =>
      (rank.get(keyOf(a)) ?? Infinity) - (rank.get(keyOf(b)) ?? Infinity),
  );
}

// The server is last-write-wins on a whole order array, so a slow earlier save
// must not be allowed to land after a newer one.
const inFlight = new Map<string, number>();

/** Persist a new order. Throws if the write failed and is still current. */
export async function saveOrder(
  list: ReorderableList,
  recordId: string,
  order: string[],
): Promise<void> {
  const ticket = (inFlight.get(`${list}:${recordId}`) ?? 0) + 1;
  inFlight.set(`${list}:${recordId}`, ticket);

  const { url, body } = ENDPOINTS[list];
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(recordId, order)),
    });
  } catch (error) {
    if (inFlight.get(`${list}:${recordId}`) !== ticket) return;
    throw error;
  }

  // Superseded by a newer drag, so this result no longer describes the list.
  if (inFlight.get(`${list}:${recordId}`) !== ticket) return;
  if (!response.ok) throw new Error(`Reorder failed with ${response.status}`);
}
