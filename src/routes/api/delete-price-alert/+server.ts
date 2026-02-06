import type { RequestHandler } from "./$types";

function normalizeSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
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

function parseDataArray(raw: unknown): Record<string, unknown>[] {
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
    (item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
  );
}

function parseLegacyRow(record: any): Record<string, unknown>[] {
  const symbol = normalizeSymbol(record?.symbol);
  if (!symbol) return [];
  return [
    {
      symbol,
      name: String(record?.name ?? "").trim(),
      assetType: String(record?.asset_type ?? record?.assetType ?? "stock")
        .trim()
        .toLowerCase() || "stock",
      targetPrice:
        Number.isFinite(Number(record?.target_price ?? record?.targetPrice))
          ? Number(record?.target_price ?? record?.targetPrice)
          : null,
      priceWhenCreated:
        Number.isFinite(
          Number(record?.price_when_created ?? record?.priceWhenCreated),
        )
          ? Number(record?.price_when_created ?? record?.priceWhenCreated)
          : null,
      condition:
        String(record?.condition ?? "above")
          .trim()
          .toLowerCase() || "above",
      note: typeof record?.note === "string" ? record.note : "",
      triggered: toBool(record?.triggered),
    },
  ];
}

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  const data = await request.json();
  const incomingIds = Array.isArray(data?.priceAlertIdList)
    ? data.priceAlertIdList.filter(
        (item: unknown): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const idsToDelete = new Set(incomingIds);
  if (idsToDelete.size === 0) {
    return new Response(JSON.stringify("success"));
  }

  try {
    const records = await pb.collection("priceAlert").getFullList({
      filter: `user="${user.id}"`,
      sort: "-updated",
    });

    if (records.length === 0) {
      return new Response(JSON.stringify("success"));
    }

    const canonical = records[0];
    const keptEntries: Record<string, unknown>[] = [];

    for (const record of records) {
      const rowId = String(record.id);
      const removeWholeRow = idsToDelete.has(rowId);

      const parsedData = parseDataArray(record?.data);
      if (parsedData.length > 0) {
        for (let idx = 0; idx < parsedData.length; idx++) {
          const entry = parsedData[idx];
          const entryId =
            (typeof entry?.id === "string" && entry.id.trim().length > 0
              ? entry.id.trim()
              : `${rowId}:${idx}`);
          if (removeWholeRow || idsToDelete.has(entryId)) {
            continue;
          }
          const symbol = normalizeSymbol(entry?.symbol);
          if (!symbol) continue;
          keptEntries.push({
            ...entry,
            symbol,
          });
        }
        continue;
      }

      for (const entry of parseLegacyRow(record)) {
        if (removeWholeRow || idsToDelete.has(rowId)) continue;
        if (!normalizeSymbol(entry.symbol)) continue;
        keptEntries.push(entry);
      }
    }

    await pb.collection("priceAlert").update(canonical.id, {
      data: keptEntries,
    });

    // Keep one canonical row per user.
    for (const record of records.slice(1)) {
      await pb.collection("priceAlert").delete(record.id);
    }

    return new Response(JSON.stringify("success"));
  } catch {
    return new Response(JSON.stringify("failure"));
  }
}) satisfies RequestHandler;
