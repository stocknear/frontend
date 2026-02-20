import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SELECTED_DATES = 10;
const MAX_ROWS = 5000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return json({ error: "Authentication required." }, 401);
  }

  if (user?.tier !== "Pro") {
    return json({ error: "This feature is available for Pro members only." }, 403);
  }

  let payload: { selectedDates?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const rawSelectedDates = Array.isArray(payload?.selectedDates)
    ? payload.selectedDates
    : [];

  const selectedDates = Array.from(
    new Set(
      rawSelectedDates
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => DATE_RE.test(value)),
    ),
  ).slice(0, MAX_SELECTED_DATES);

  if (selectedDates.length === 0) {
    return json(
      { error: "At least one valid expiration date is required." },
      400,
    );
  }

  try {
    const output = await postAPI(locals, "/options-screener-data", {
      selectedDates,
    });

    if (Array.isArray(output?.data) && output.data.length > MAX_ROWS) {
      output.data = output.data.slice(0, MAX_ROWS);
      output.truncated = true;
      output.maxRows = MAX_ROWS;
    }

    return json(output);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load screener data.";
    return json({ error: message }, 500);
  }
};
