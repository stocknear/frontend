import type { RequestHandler } from "./$types";

const PRICE_ALERT_ID_REGEX = /^[A-Za-z0-9:_-]{1,80}$/;
const MAX_NOTE_LENGTH = 500;

function isValidPriceAlertId(id: unknown): id is string {
  return typeof id === "string" && PRICE_ALERT_ID_REGEX.test(id);
}

function sanitizeNote(note: unknown): string {
  if (typeof note !== "string") return "";
  return note.slice(0, MAX_NOTE_LENGTH);
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

  const mode = data?.mode;
  const priceAlertId = data?.priceAlertId;

  if (mode !== "note") {
    return new Response(JSON.stringify({ error: "Unsupported mode" }), {
      status: 400,
    });
  }

  if (!isValidPriceAlertId(priceAlertId)) {
    return new Response(JSON.stringify({ error: "Invalid price alert ID" }), {
      status: 400,
    });
  }

  const note = sanitizeNote(data?.note);

  try {
    const records = await pb.collection("priceAlert").getFullList({
      filter: `user="${user.id}"`,
      sort: "-updated",
    });

    for (const record of records) {
      const rowId = String(record.id);
      const parsedData = parseDataArray(record?.data);

      if (parsedData.length > 0) {
        let updated = false;
        for (let idx = 0; idx < parsedData.length; idx++) {
          const entry = parsedData[idx];
          const entryId =
            (typeof entry?.id === "string" && entry.id.trim().length > 0
              ? entry.id.trim()
              : `${rowId}:${idx}`);
          if (entryId !== priceAlertId) continue;
          entry.note = note;
          updated = true;
          break;
        }

        if (updated) {
          await pb.collection("priceAlert").update(rowId, { data: parsedData });
          return new Response(
            JSON.stringify({
              id: priceAlertId,
              hasNote: note.trim().length > 0,
            }),
          );
        }
      }

      // Legacy flat fallback
      if (rowId === priceAlertId) {
        await pb.collection("priceAlert").update(rowId, { note });
        return new Response(
          JSON.stringify({
            id: priceAlertId,
            hasNote: note.trim().length > 0,
          }),
        );
      }
    }

    return new Response(JSON.stringify({ error: "Price alert not found" }), {
      status: 404,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to update price alert" }),
      {
        status: 500,
      },
    );
  }
}) satisfies RequestHandler;
