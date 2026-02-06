import type { RequestHandler } from "./$types";
import { createHash } from "node:crypto";

const PRICE_ALERT_ID_REGEX = /^[A-Za-z0-9:_-]{1,80}$/;
const MAX_NOTE_LENGTH = 500;
const MAX_ALERTS_PER_REQUEST = 200;

type RawAlertEntry = Record<string, unknown>;

type NormalizedAlertEntry = {
  symbol: string;
  name: string;
  assetType: string;
  targetPrice: number | null;
  priceWhenCreated: number | null;
  condition: "above" | "below";
  note: string;
  triggered: boolean;
};

type TriggeredAlertEvent = {
  entryId: string;
  symbol: string;
  assetType: string;
  condition: "above" | "below";
  targetPrice: number;
  currentPrice: number;
};

function isValidPriceAlertId(id: unknown): id is string {
  return typeof id === "string" && PRICE_ALERT_ID_REGEX.test(id);
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(lowered)) return true;
    if (["0", "false", "no", "n", "off", ""].includes(lowered)) return false;
  }
  return Boolean(value);
}

function normalizeSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function normalizeAssetType(value: unknown, symbol: string): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "stocks") return "stock";
  if (raw === "etfs") return "etf";
  if (raw === "cryptos") return "crypto";
  if (raw === "indices") return "index";
  if (raw.length > 0) return raw;
  if (symbol.startsWith("^")) return "index";
  return "stock";
}

function normalizeCondition(value: unknown): "above" | "below" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["below", "under", "less", "less_than", "lt"].includes(raw)) {
    return "below";
  }
  return "above";
}

function normalizeNote(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_NOTE_LENGTH);
}

function parseDataArray(raw: unknown): RawAlertEntry[] {
  let parsed: unknown = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is RawAlertEntry => Boolean(item && typeof item === "object"),
  );
}

function normalizeAlertEntry(raw: RawAlertEntry): NormalizedAlertEntry | null {
  const symbol = normalizeSymbol(raw?.symbol);
  if (!symbol) return null;

  return {
    symbol,
    name: String(raw?.name ?? "").trim(),
    assetType: normalizeAssetType(raw?.assetType, symbol),
    targetPrice: toNumberOrNull(raw?.targetPrice),
    priceWhenCreated: toNumberOrNull(raw?.priceWhenCreated),
    condition: normalizeCondition(raw?.condition),
    note: normalizeNote(raw?.note),
    triggered: toBool(raw?.triggered),
  };
}

function getEntryId(raw: RawAlertEntry, rowId: string, index: number): string {
  const explicitId = typeof raw?.id === "string" ? raw.id.trim() : "";
  if (explicitId.length > 0) return explicitId;
  return `${rowId}:${index}`;
}

function shouldTrigger(
  condition: "above" | "below",
  targetPrice: number,
  currentPrice: number,
): boolean {
  if (condition === "below") return currentPrice <= targetPrice;
  return currentPrice >= targetPrice;
}

function buildPushHash(
  userId: string,
  rowId: string,
  symbol: string,
  assetType: string,
  condition: "above" | "below",
  targetPrice: number,
): string {
  const raw = `priceAlert|${userId}|${rowId}|${symbol}|${assetType}|${condition}|${targetPrice.toFixed(4)}`;
  return createHash("md5").update(raw).digest("hex");
}

function compareDataEntries(
  left: RawAlertEntry[],
  right: RawAlertEntry[],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function sendPushNotificationForAlert(params: {
  origin: string;
  apiKey: string;
  userId: string;
  symbol: string;
}): Promise<void> {
  const { origin, apiKey, userId, symbol } = params;
  if (!apiKey || !userId || !symbol) return;

  try {
    await fetch(`${origin}/api/sendPushSubscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `🚨 ${symbol} Price Alert triggered`,
        body: "",
        url: `${origin}/notifications`,
        userId,
        key: apiKey,
      }),
    });
  } catch {
    // Best-effort only.
  }
}

export const POST = (async ({ request, locals, url }) => {
  const { user, pb, apiKey } = locals;

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const rawAlerts = Array.isArray((payload as any)?.alerts)
    ? ((payload as any).alerts as unknown[])
    : [];

  const incomingPriceById = new Map<string, number>();
  for (const rawAlert of rawAlerts.slice(0, MAX_ALERTS_PER_REQUEST)) {
    const id =
      typeof (rawAlert as any)?.id === "string" ? (rawAlert as any).id.trim() : "";
    if (!isValidPriceAlertId(id)) continue;

    const currentPrice = toNumberOrNull((rawAlert as any)?.currentPrice);
    if (currentPrice === null || currentPrice <= 0) continue;
    incomingPriceById.set(id, currentPrice);
  }

  if (incomingPriceById.size === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        triggeredIds: [],
        triggeredCount: 0,
      }),
    );
  }

  const records = await pb.collection("priceAlert").getFullList({
    filter: `user="${user.id}"`,
    sort: "-updated",
  });

  if (!records.length) {
    return new Response(
      JSON.stringify({
        success: true,
        triggeredIds: [],
        triggeredCount: 0,
      }),
    );
  }

  const canonical = records[0];
  const nextActiveEntries: RawAlertEntry[] = [];
  const triggeredEvents: TriggeredAlertEvent[] = [];
  let removedTriggeredEntries = false;
  let foundMalformedData = false;

  for (const record of records) {
    const rowId = String(record.id);
    const rawData = record?.data;
    const parsedEntries = parseDataArray(rawData);

    if (typeof rawData === "string" && rawData.trim().length > 0 && !parsedEntries.length) {
      foundMalformedData = true;
      continue;
    }

    for (let index = 0; index < parsedEntries.length; index++) {
      const rawEntry = parsedEntries[index];
      const normalized = normalizeAlertEntry(rawEntry);
      if (!normalized) continue;

      const entryId = getEntryId(rawEntry, rowId, index);
      if (normalized.triggered) {
        removedTriggeredEntries = true;
        continue;
      }

      const currentPrice = incomingPriceById.get(entryId);
      const targetPrice = normalized.targetPrice;

      if (
        currentPrice !== undefined &&
        targetPrice !== null &&
        targetPrice > 0 &&
        shouldTrigger(normalized.condition, targetPrice, currentPrice)
      ) {
        triggeredEvents.push({
          entryId,
          symbol: normalized.symbol,
          assetType: normalized.assetType,
          condition: normalized.condition,
          targetPrice,
          currentPrice,
        });
        continue;
      }

      nextActiveEntries.push({
        symbol: normalized.symbol,
        name: normalized.name,
        assetType: normalized.assetType,
        targetPrice: normalized.targetPrice,
        priceWhenCreated: normalized.priceWhenCreated,
        condition: normalized.condition,
        note: normalized.note,
        triggered: false,
      });
    }
  }

  const canonicalCurrentEntries = parseDataArray(canonical?.data)
    .map((entry) => normalizeAlertEntry(entry))
    .filter((entry): entry is NormalizedAlertEntry => Boolean(entry))
    .filter((entry) => !entry.triggered)
    .map((entry) => ({
      symbol: entry.symbol,
      name: entry.name,
      assetType: entry.assetType,
      targetPrice: entry.targetPrice,
      priceWhenCreated: entry.priceWhenCreated,
      condition: entry.condition,
      note: entry.note,
      triggered: false,
    }));

  const shouldUpdateCanonical =
    records.length > 1 ||
    removedTriggeredEntries ||
    foundMalformedData ||
    triggeredEvents.length > 0 ||
    !compareDataEntries(canonicalCurrentEntries, nextActiveEntries);

  if (shouldUpdateCanonical) {
    await pb.collection("priceAlert").update(canonical.id, {
      data: nextActiveEntries,
    });

    for (const extraRecord of records.slice(1)) {
      await pb.collection("priceAlert").delete(extraRecord.id);
    }
  }

  const existingNotifications = await pb.collection("notifications").getFullList({
    filter: `user="${user.id}" && notifyType="priceAlert"`,
  });
  const existingPushHashes = new Set(
    existingNotifications
      .map((item: any) => String(item?.push_hash ?? item?.pushHash ?? "").trim())
      .filter(Boolean),
  );

  const triggeredIds: string[] = [];
  for (const event of triggeredEvents) {
    const pushHash = buildPushHash(
      user.id,
      canonical.id,
      event.symbol,
      event.assetType,
      event.condition,
      event.targetPrice,
    );

    triggeredIds.push(event.entryId);
    if (existingPushHashes.has(pushHash)) {
      continue;
    }

    existingPushHashes.add(pushHash);
    await pb.collection("notifications").create({
      user: user.id,
      notifyType: "priceAlert",
      priceAlert: canonical.id,
      sent: true,
      pushHash,
      liveResults: {
        symbol: event.symbol,
        assetType: event.assetType,
        condition: event.condition,
        targetPrice: Number(event.targetPrice.toFixed(2)),
        currentPrice: Number(event.currentPrice.toFixed(2)),
      },
    });

    await sendPushNotificationForAlert({
      origin: url.origin,
      apiKey: apiKey ?? "",
      userId: user.id,
      symbol: event.symbol,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      triggeredIds,
      triggeredCount: triggeredIds.length,
      remainingCount: nextActiveEntries.length,
    }),
  );
}) satisfies RequestHandler;
