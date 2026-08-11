import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";

export type UserWriteBody = Record<string, number>;

const SECRET_KEY = LEMON_SQUEEZY_SECRET_KEY;
const ALLOWED_FIELDS = new Set([
  "credits+",
  "credits-",
  "downloadCredits+",
  "downloadCredits-",
]);

if (!SECRET_KEY) throw new Error("Missing Lemon Squeezy secret key.");

function canonicalBody(body: UserWriteBody): string {
  const sorted: UserWriteBody = {};
  const keys = Object.keys(body).sort();
  if (!keys.length) throw new Error("Invalid protected user write body");
  for (const key of keys) {
    const value = body[key];
    if (!ALLOWED_FIELDS.has(key) || !Number.isSafeInteger(value) ||
        value < 0 || value > 10_000) {
      throw new Error("Invalid protected user write body");
    }
    sorted[key] = value;
  }
  return JSON.stringify(sorted);
}

export function protectedUserWriteHeaders(
  userId: string,
  body: UserWriteBody,
): Record<string, string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomBytes(16).toString("hex");
  const operation = canonicalBody(body);
  const bodyHash = crypto.createHash("sha256").update(operation).digest("hex");
  const canonical = ["v3", timestamp, nonce, userId, bodyHash].join("\n");
  return {
    "X-Stocknear-User-Write-Timestamp": timestamp,
    "X-Stocknear-User-Write-Nonce": nonce,
    "X-Stocknear-User-Write-Operation": operation,
    "X-Stocknear-User-Write-Body-SHA256": bodyHash,
    "X-Stocknear-User-Write-Signature": crypto
      .createHmac("sha256", SECRET_KEY)
      .update(canonical, "utf8")
      .digest("hex"),
  };
}

export async function ensureWelcomeCredits(
  pb: any,
  user: { id?: unknown; credits?: unknown } | null | undefined,
): Promise<void> {
  const userId = typeof user?.id === "string" ? user.id : "";
  const credits = Number(user?.credits ?? 0);
  if (!userId || !Number.isSafeInteger(credits) || credits >= 10) return;
  const body = { "credits+": 10 - credits };
  await pb.collection("users").update(userId, body, {
    headers: protectedUserWriteHeaders(userId, body),
  });
}
