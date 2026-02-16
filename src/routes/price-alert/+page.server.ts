import { postAPI } from "$lib/server/api";

const TRUTHY_VALUES = new Set(["1", "true", "yes", "y", "on"]);

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return TRUTHY_VALUES.has(value.trim().toLowerCase());
  }
  return Boolean(value);
}

function normalizeSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDataArray(raw: unknown): Record<string, unknown>[] {
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
  );
}

function toCanonicalEntry(
  entry: Record<string, unknown>,
): Record<string, unknown> | null {
  const symbol = normalizeSymbol(entry?.symbol);
  if (!symbol) return null;

  return {
    symbol,
    name: String(entry?.name ?? "").trim(),
    assetType:
      String(entry?.assetType ?? "stock").trim().toLowerCase() || "stock",
    targetPrice: toNumberOrNull(entry?.targetPrice),
    priceWhenCreated: toNumberOrNull(entry?.priceWhenCreated),
    condition: String(entry?.condition ?? "above").trim().toLowerCase() || "above",
    note: typeof entry?.note === "string" ? entry.note : "",
    triggered: false,
  };
}

function entryIdentityKey(entry: Record<string, unknown>): string {
  return [
    String(entry?.symbol ?? ""),
    String(entry?.assetType ?? ""),
    String(entry?.targetPrice ?? ""),
    String(entry?.condition ?? ""),
    String(entry?.priceWhenCreated ?? ""),
  ].join("|");
}

function dedupeEntries(
  entries: Record<string, unknown>[],
): Record<string, unknown>[] {
  const merged = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const key = entryIdentityKey(entry);
    if (!key || key === "||||") continue;
    if (!merged.has(key)) {
      merged.set(key, entry);
    }
  }
  return Array.from(merged.values());
}

async function cleanupTriggeredPriceAlerts(pb: any, userId: string): Promise<void> {
  const records = await pb.collection("priceAlert").getFullList({
    filter: `user="${userId}"`,
    sort: "-updated",
  });

  if (!records?.length) return;

  const canonical = records[0];
  const activeEntries: Record<string, unknown>[] = [];
  let removedTriggered = false;
  let foundMalformedData = false;

  for (const record of records) {
    const rawData = record?.data;
    const parsedData = parseDataArray(rawData);

    if (typeof rawData === "string" && rawData.trim().length > 0 && !parsedData.length) {
      foundMalformedData = true;
    }

    for (const rawEntry of parsedData) {
      if (toBool(rawEntry?.triggered)) {
        removedTriggered = true;
        continue;
      }
      const normalized = toCanonicalEntry(rawEntry);
      if (normalized) activeEntries.push(normalized);
    }
  }

  const dedupedActiveEntries = dedupeEntries(activeEntries);
  const canonicalCurrentEntries = dedupeEntries(
    parseDataArray(canonical?.data)
      .filter((entry) => !toBool(entry?.triggered))
      .map((entry) => toCanonicalEntry(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry)),
  );

  const needsWrite =
    records.length > 1 ||
    removedTriggered ||
    foundMalformedData ||
    JSON.stringify(canonicalCurrentEntries) !== JSON.stringify(dedupedActiveEntries);

  if (!needsWrite) return;

  await pb.collection("priceAlert").update(canonical.id, {
    data: dedupedActiveEntries,
  });

  for (const record of records.slice(1)) {
    await pb.collection("priceAlert").delete(record.id);
  }
}

export const load = async ({ locals }) => {
  const { user, pb } = locals;

  const getPriceAlert = async () => {
    if (!user?.id) {
      return { data: [], news: [], earnings: [] };
    }

    try {
      await cleanupTriggeredPriceAlerts(pb, user.id);
    } catch (error) {
      console.error("priceAlert cleanup failed:", error);
    }

    const output = await postAPI(locals, "/get-price-alert", { userId: user.id });

    output.data = (output?.data || [])
      ?.filter((item) => !toBool(item?.triggered))
      ?.map((item) => ({
        ...item,
        hasNote: Boolean(item?.note && String(item.note)?.trim()?.length > 0),
      }))
      ?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));
    return output;
  };

  return {
    getPriceAlert: await getPriceAlert(),
  };
};
