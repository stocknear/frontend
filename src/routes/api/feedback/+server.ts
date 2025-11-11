import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 2;

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, user, clientIp } = locals;

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
 
 

  const userId = user?.id?.trim();

  if (!description) {
    return json({ error: "Description is required." }, { status: 400 });
  }

  if (!url) {
    return json({ error: "Feedback URL is required." }, { status: 400 });
  }

  if (!userId ) {
    return json({ error: "Authentication required to submit feedback." }, { status: 401 });
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const identifierFilters: string[] = [];

  if (userId) identifierFilters.push(`user="${userId}"`);
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
      url,
      ipAddress: clientIp,
    });

    return json({ status: "success" }, { status: 201 });
  } catch (err) {
    console.error("Error creating feedback:", err);
    return json({ error: "Failed to submit feedback." }, { status: 500 });
  }
};
