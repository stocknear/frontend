import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";

const SECRET_KEY = LEMON_SQUEEZY_SECRET_KEY;

export function createBillingAccountProof(user: {
  id?: unknown;
  email?: unknown;
} | null | undefined): { accountEmail: string; accountProof: string } | null {
  if (!SECRET_KEY) return null;
  const userId = typeof user?.id === "string" ? user.id.trim() : "";
  const accountEmail = typeof user?.email === "string"
    ? user.email.trim().toLowerCase()
    : "";
  if (!/^[a-z0-9]{15}$/.test(userId) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail) ||
      accountEmail.length > 254) return null;
  const canonical = `checkout-v1\n${userId}\n${accountEmail}`;
  return {
    accountEmail,
    accountProof: crypto
      .createHmac("sha256", SECRET_KEY)
      .update(canonical, "utf8")
      .digest("hex"),
  };
}
