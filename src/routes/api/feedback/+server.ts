import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 2;

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const { pb, user: localsUser, clientIp } = locals;

  if (!pb) {
    return json({ error: "Server misconfiguration." }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("Invalid feedback payload:", err);
    return json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  const providedEmail =
    typeof payload.email === "string" && payload.email.trim().length > 0
      ? payload.email.trim().toLowerCase()
      : undefined;
  const providedUser =
    typeof payload.user === "string" && payload.user.trim().length > 0
      ? payload.user.trim()
      : undefined;

  const activeUser = localsUser;
  const userId = activeUser?.id ?? providedUser;
  const email =
    (activeUser?.email && activeUser.email.trim().toLowerCase()) ||
    providedEmail;

  if (!description) {
    return json({ error: "Description is required." }, { status: 400 });
  }

  if (!url) {
    return json({ error: "Feedback URL is required." }, { status: 400 });
  }

  if (!token) {
    return json({ error: "Please confirm you are not a robot." }, { status: 400 });
  }

  if (!email) {
    return json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const response = await fetch("/api/turnstile", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const verification = await response.json().catch(() => ({}));

    if (!response.ok || !verification?.success) {
      return json(
        {
          error:
            verification?.message ??
            "Turnstile verification failed. Please try again.",
        },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return json(
      {
        error:
          "Unable to verify Turnstile response. Please refresh and try again.",
      },
      { status: 500 },
    );
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const identifierFilters: string[] = [];

  if (userId) identifierFilters.push(`user="${userId}"`);
  if (email) identifierFilters.push(`email="${email}"`);
  if (clientIp) identifierFilters.push(`ipAddress="${clientIp}"`);

  if (identifierFilters.length > 0) {
    const filter = `(${identifierFilters.join(
      " || ",
    )}) && created >= "${since}"`;
    try {
      const recentSubmissions = await pb.collection("feedback").getFullList({
        filter,
        sort: "-created",
      });

      if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_WINDOW) {
        return json(
          {
            error:
              "Rate limit exceeded. Please wait before submitting more feedback.",
          },
          { status: 429 },
        );
      }
    } catch (err) {
      console.error("Error checking recent feedback:", err);
      return json({ error: "Server error." }, { status: 500 });
    }
  }

  try {
    await pb.collection("feedback").create({
      user: userId || null,
      description,
      email,
      url,
      ipAddress: clientIp,
    });

    return json({ status: "success" }, { status: 201 });
  } catch (err) {
    console.error("Error creating feedback:", err);
    return json({ error: "Failed to submit feedback." }, { status: 500 });
  }
};
