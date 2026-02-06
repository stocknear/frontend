import type { RequestHandler } from "./$types";

const PRICE_ALERT_ID_REGEX = /^[A-Za-z0-9:_-]{1,80}$/;

function isValidPriceAlertId(id: unknown): id is string {
  return typeof id === "string" && PRICE_ALERT_ID_REGEX.test(id);
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

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const priceAlertId = data?.priceAlertId;
  if (!isValidPriceAlertId(priceAlertId)) {
    return new Response(JSON.stringify({ error: "Invalid price alert ID" }), {
      status: 400,
    });
  }

  try {
    const records = await pb.collection("priceAlert").getFullList({
      filter: `user="${user.id}"`,
      sort: "-updated",
    });

    for (const record of records) {
      const rowId = String(record.id);
      const parsedData = parseDataArray(record?.data);

      for (let idx = 0; idx < parsedData.length; idx++) {
        const entry = parsedData[idx];
        const entryId =
          (typeof entry?.id === "string" && entry.id.trim().length > 0
            ? entry.id.trim()
            : `${rowId}:${idx}`);
        if (entryId !== priceAlertId) continue;

        return new Response(
          JSON.stringify({
            id: priceAlertId,
            note: typeof entry?.note === "string" ? entry.note : "",
          }),
        );
      }

      // Legacy flat fallback
      if (rowId === priceAlertId) {
        return new Response(
          JSON.stringify({
            id: priceAlertId,
            note: typeof record?.note === "string" ? record.note : "",
          }),
        );
      }
    }

    return new Response(JSON.stringify({ error: "Price alert not found" }), {
      status: 404,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Price alert not found" }), {
      status: 404,
    });
  }
}) satisfies RequestHandler;
