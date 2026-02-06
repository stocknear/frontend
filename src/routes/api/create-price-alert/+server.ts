import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const NOTE_MAX_LENGTH = 500;

type AlertEntry = {
  symbol: string;
  name: string;
  assetType: string;
  targetPrice: number | null;
  priceWhenCreated: number | null;
  condition: string;
  note: string;
  triggered: boolean;
};

function normalizeSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function parseDataArray(raw: unknown): AlertEntry[] {
  let parsed: unknown = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      symbol: normalizeSymbol(item.symbol),
      name: String(item.name ?? "").trim(),
      assetType: String(item.assetType ?? "stock").trim().toLowerCase() || "stock",
      targetPrice: toNumberOrNull(item.targetPrice),
      priceWhenCreated: toNumberOrNull(item.priceWhenCreated),
      condition: String(item.condition ?? "above").trim().toLowerCase() || "above",
      note: typeof item.note === "string" ? item.note.slice(0, NOTE_MAX_LENGTH) : "",
      triggered: toBool(item.triggered),
    }))
    .filter((item) => item.symbol.length > 0);
}

function parseLegacyRow(record: any): AlertEntry[] {
  const symbol = normalizeSymbol(record?.symbol);
  if (!symbol) return [];

  return [
    {
      symbol,
      name: String(record?.name ?? "").trim(),
      assetType: String(record?.asset_type ?? record?.assetType ?? "stock")
        .trim()
        .toLowerCase() || "stock",
      targetPrice: toNumberOrNull(record?.target_price ?? record?.targetPrice),
      priceWhenCreated: toNumberOrNull(
        record?.price_when_created ?? record?.priceWhenCreated,
      ),
      condition:
        String(record?.condition ?? "above")
          .trim()
          .toLowerCase() || "above",
      note:
        typeof record?.note === "string"
          ? record.note.slice(0, NOTE_MAX_LENGTH)
          : "",
      triggered: toBool(record?.triggered),
    },
  ];
}

function buildMergedAlerts(records: any[]): AlertEntry[] {
  const merged: AlertEntry[] = [];
  for (const record of records) {
    const fromData = parseDataArray(record?.data);
    if (fromData.length > 0) {
      merged.push(...fromData);
      continue;
    }
    merged.push(...parseLegacyRow(record));
  }
  return merged;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb, clientIp } = locals;
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  // SECURITY: Rate limit price-alert creation similar to register flow.
  const rateLimitIdentifier = clientIp || `user:${user.id}`;
  const rateLimitResult = checkRateLimit(
    rateLimitIdentifier,
    "priceAlertCreate",
    RATE_LIMITS.priceAlertCreate,
  );
  if (!rateLimitResult.allowed) {
    const minutesRemaining = Math.ceil(rateLimitResult.resetIn / 60000);
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Please wait ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"} before creating another price alert.`,
        rateLimited: true,
        retryAfter: minutesRemaining,
      }),
      { status: 429 },
    );
  }

  const data = await request.json();
  const normalizedNote =
    typeof data?.note === "string" ? data.note.trim().slice(0, NOTE_MAX_LENGTH) : "";

  const newAlert: AlertEntry = {
    symbol: normalizeSymbol(data?.symbol),
    name: String(data?.name ?? "").trim(),
    assetType: String(data?.assetType ?? "stock").trim().toLowerCase() || "stock",
    targetPrice: toNumberOrNull(data?.targetPrice),
    condition: String(data?.condition ?? "above").trim().toLowerCase() || "above",
    priceWhenCreated: toNumberOrNull(data?.priceWhenCreated),
    note: normalizedNote,
    triggered: false,
  };

  if (!newAlert.symbol) {
    return new Response(JSON.stringify({ error: "Invalid symbol" }), {
      status: 400,
    });
  }

  try {
    const records = await pb.collection("priceAlert").getFullList({
      filter: `user="${user.id}"`,
      sort: "-updated",
    });

    const merged = buildMergedAlerts(records);
    const activeAlerts = merged.filter(
      (item) => item.symbol.length > 0 && !item.triggered,
    );

    if (!["Pro", "Plus"].includes(user?.tier) && activeAlerts.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Price alert limit reached for non-Pro users" }),
        { status: 403 },
      );
    }

    const updatedAlerts = [...merged, newAlert];

    if (records.length === 0) {
      const output = await pb.collection("priceAlert").create({
        user: user.id,
        data: updatedAlerts,
      });
      return new Response(JSON.stringify(output));
    }

    const canonical = records[0];
    await pb.collection("priceAlert").update(canonical.id, {
      data: updatedAlerts,
    });

    // Keep one canonical row per user.
    for (const record of records.slice(1)) {
      await pb.collection("priceAlert").delete(record.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: `${canonical.id}:${updatedAlerts.length - 1}`,
      }),
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Error creating price alert" }),
      { status: 500 },
    );
  }
};
