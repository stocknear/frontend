import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const NOTE_MAX_LENGTH = 500;

type AlertType = "price" | "movingAverage" | "percentMove" | "volumeSpike";
type AlertCondition = "above" | "below";
type PercentMoveDirection = "up" | "down";
type VolumeSpikePriceFilter = "any" | "up" | "down";

type AlertEntry = {
  symbol: string;
  name: string;
  assetType: string;
  alertType: AlertType;
  targetPrice: number | null;
  priceWhenCreated: number | null;
  condition: AlertCondition;
  movingAveragePeriod: number | null;
  percentMoveDirection: PercentMoveDirection | null;
  percentMoveValue: number | null;
  volumeSpikeMultiplier: number | null;
  volumeSpikePriceFilter: VolumeSpikePriceFilter | null;
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

function normalizeAlertType(value: unknown): AlertType {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "movingaverage") return "movingAverage";
  if (raw === "percentmove") return "percentMove";
  if (raw === "volumespike") return "volumeSpike";
  return "price";
}

function normalizeCondition(value: unknown): AlertCondition {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "below" ? "below" : "above";
}

function normalizePercentMoveDirection(value: unknown): PercentMoveDirection {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "down" ? "down" : "up";
}

function normalizeVolumeSpikePriceFilter(
  value: unknown,
): VolumeSpikePriceFilter {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "up" || raw === "down") return raw;
  return "any";
}

function normalizeMovingAveragePeriod(value: unknown): number | null {
  const period = toNumberOrNull(value);
  return period === 20 || period === 50 || period === 200 ? period : null;
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
      alertType: normalizeAlertType(item.alertType),
      targetPrice: toNumberOrNull(item.targetPrice),
      priceWhenCreated: toNumberOrNull(item.priceWhenCreated),
      condition: normalizeCondition(item.condition),
      movingAveragePeriod: normalizeMovingAveragePeriod(item.movingAveragePeriod),
      percentMoveDirection:
        item.percentMoveDirection == null
          ? null
          : normalizePercentMoveDirection(item.percentMoveDirection),
      percentMoveValue: toNumberOrNull(item.percentMoveValue),
      volumeSpikeMultiplier: toNumberOrNull(item.volumeSpikeMultiplier),
      volumeSpikePriceFilter:
        item.volumeSpikePriceFilter == null
          ? null
          : normalizeVolumeSpikePriceFilter(item.volumeSpikePriceFilter),
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
      alertType: "price",
      targetPrice: toNumberOrNull(record?.target_price ?? record?.targetPrice),
      priceWhenCreated: toNumberOrNull(
        record?.price_when_created ?? record?.priceWhenCreated,
      ),
      condition: normalizeCondition(record?.condition),
      movingAveragePeriod: null,
      percentMoveDirection: null,
      percentMoveValue: null,
      volumeSpikeMultiplier: null,
      volumeSpikePriceFilter: null,
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
  const alertType = normalizeAlertType(data?.alertType);

  const newAlert: AlertEntry = {
    symbol: normalizeSymbol(data?.symbol),
    name: String(data?.name ?? "").trim(),
    assetType: String(data?.assetType ?? "stock").trim().toLowerCase() || "stock",
    alertType,
    targetPrice: alertType === "price" ? toNumberOrNull(data?.targetPrice) : null,
    priceWhenCreated: toNumberOrNull(data?.priceWhenCreated),
    condition:
      alertType === "price" || alertType === "movingAverage"
        ? normalizeCondition(data?.condition)
        : "above",
    movingAveragePeriod:
      alertType === "movingAverage"
        ? normalizeMovingAveragePeriod(data?.movingAveragePeriod)
        : null,
    percentMoveDirection:
      alertType === "percentMove"
        ? normalizePercentMoveDirection(data?.percentMoveDirection)
        : null,
    percentMoveValue:
      alertType === "percentMove" ? toNumberOrNull(data?.percentMoveValue) : null,
    volumeSpikeMultiplier:
      alertType === "volumeSpike"
        ? toNumberOrNull(data?.volumeSpikeMultiplier)
        : null,
    volumeSpikePriceFilter:
      alertType === "volumeSpike"
        ? normalizeVolumeSpikePriceFilter(data?.volumeSpikePriceFilter)
        : null,
    note: normalizedNote,
    triggered: false,
  };

  if (!newAlert.symbol) {
    return new Response(JSON.stringify({ error: "Invalid symbol" }), {
      status: 400,
    });
  }

  if (newAlert.alertType === "price" && (!newAlert.targetPrice || newAlert.targetPrice <= 0)) {
    return new Response(JSON.stringify({ error: "Invalid target price" }), {
      status: 400,
    });
  }

  if (
    newAlert.alertType === "movingAverage" &&
    newAlert.movingAveragePeriod === null
  ) {
    return new Response(JSON.stringify({ error: "Invalid moving average period" }), {
      status: 400,
    });
  }

  if (
    newAlert.alertType === "percentMove" &&
    (
      !newAlert.priceWhenCreated ||
      newAlert.priceWhenCreated <= 0 ||
      !newAlert.percentMoveValue ||
      newAlert.percentMoveValue <= 0
    )
  ) {
    return new Response(JSON.stringify({ error: "Invalid percent move settings" }), {
      status: 400,
    });
  }

  if (
    newAlert.alertType === "volumeSpike" &&
    (!newAlert.volumeSpikeMultiplier || newAlert.volumeSpikeMultiplier <= 0)
  ) {
    return new Response(JSON.stringify({ error: "Invalid volume spike settings" }), {
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
