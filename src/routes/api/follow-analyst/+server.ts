import type { RequestHandler } from "./$types";

// Premium-only feature: follow individual analysts and get notified on new ratings.
// Stored as a single per-user row in the analystWatchlist collection, whose
// `analysts` JSON field holds an array of { analystId, analystName, companyName }.

const ANALYST_ID_REGEX = /^[a-zA-Z0-9]{10,40}$/; // Benzinga ids are 24-char hex
const MAX_NAME_LENGTH = 200;

type FollowedAnalyst = {
  analystId: string;
  analystName: string;
  companyName: string;
};

function isValidAnalystId(id: unknown): id is string {
  return typeof id === "string" && ANALYST_ID_REGEX.test(id);
}

function sanitizeName(name: unknown): string {
  return typeof name === "string" ? name.slice(0, MAX_NAME_LENGTH) : "";
}

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;

  // Security: authentication
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  // Premium gate: following analysts is a Pro/Plus feature
  if (!["Pro", "Plus"].includes(user?.tier)) {
    return new Response(
      JSON.stringify({ error: "Following analysts is available on Plus and Pro." }),
      { status: 403 }
    );
  }

  // Tier caps: Plus = up to 5 analysts, Pro = unlimited
  const followLimit = user?.tier === "Pro" ? Infinity : 5;

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 }
    );
  }

  const analystId = data?.analystId;
  if (!isValidAnalystId(analystId)) {
    return new Response(
      JSON.stringify({ error: "Invalid analyst id" }),
      { status: 400 }
    );
  }

  const analystName = sanitizeName(data?.analystName);
  const companyName = sanitizeName(data?.companyName);

  // Load the user's single follow row (if any)
  let row: any = null;
  try {
    row = await pb
      .collection("analystWatchlist")
      .getFirstListItem(`user="${user.id}"`);
  } catch {
    row = null; // no row yet
  }

  const analysts: FollowedAnalyst[] = Array.isArray(row?.analysts)
    ? row.analysts
    : [];

  // Toggle: remove if already followed, otherwise add
  const existingIndex = analysts.findIndex((a) => a?.analystId === analystId);
  if (existingIndex !== -1) {
    analysts.splice(existingIndex, 1);
  } else {
    if (analysts.length >= followLimit) {
      return new Response(
        JSON.stringify({
          error: "Plus members can follow up to 5 analysts. Upgrade to Pro for unlimited.",
        }),
        { status: 403 }
      );
    }
    analysts.push({ analystId, analystName, companyName });
  }

  let output: any;
  try {
    if (row?.id) {
      output = await pb.collection("analystWatchlist").update(row.id, { analysts });
    } else {
      // Always derive the user id server-side, never trust the client
      output = await pb.collection("analystWatchlist").create({
        user: user.id,
        analysts,
      });
    }
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "Failed to update follows" }),
      { status: 500 }
    );
  }

  // Return the lightweight list the client renders follow-state from
  const light = (output?.analysts || [])
    .filter((a: any) => a?.analystId)
    .map((a: any) => ({
      analystId: a.analystId,
      analystName: a.analystName ?? "",
    }));

  return new Response(JSON.stringify({ analysts: light }));
}) satisfies RequestHandler;
