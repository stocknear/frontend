import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";
import { applyPocketBaseBilling } from "$lib/server/pocketbasePrivate";

const SECRET_KEY = LEMON_SQUEEZY_SECRET_KEY;
const BILLING_EVENTS = new Set([
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_plan_changed",
]);

if (!SECRET_KEY) throw new Error("Missing Lemon Squeezy secret key.");

function isValidSignature(payload: string, signatureHeader: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signatureHeader)) return false;
  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest();
  const received = Buffer.from(signatureHeader, "hex");
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

function tierForPayment(
  productName: unknown,
  status: unknown,
  refunded: unknown,
): "Free" | "Plus" | "Pro" {
  if (
    refunded === true ||
    typeof status !== "string" ||
    !new Set(["paid", "active", "cancelled", "on_trial"]).has(
      status.toLowerCase(),
    ) ||
    typeof productName !== "string"
  ) {
    return "Free";
  }
  if (/\bPlus\b/.test(productName)) return "Plus";
  if (/\bPro\b/.test(productName) || /\bLife Time\b/.test(productName))
    return "Pro";
  return "Free";
}

function json(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST = async ({ request }) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!signature || !isValidSignature(rawBody, signature)) {
    return json({ error: "Invalid signature" }, 403);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventName = payload?.meta?.event_name;
  if (typeof eventName === "string" && !BILLING_EVENTS.has(eventName)) {
    return json({ message: "Webhook ignored" }, 200);
  }
  const userId = payload?.meta?.custom_data?.userId;
  const attributes = payload?.data?.attributes;
  const userEmail = attributes?.user_email;
  const productName =
    attributes?.first_order_item?.product_name ?? attributes?.product_name;

  if (
    typeof eventName !== "string" ||
    (typeof userId !== "string" && typeof userEmail !== "string") ||
    !attributes ||
    typeof attributes.status !== "string"
  ) {
    return json({ error: "Invalid payload" }, 400);
  }

  const tier =
    eventName === "subscription_expired"
      ? "Free"
      : tierForPayment(productName, attributes.status, attributes.refunded);
  const lifetime =
    tier === "Pro" &&
    typeof productName === "string" &&
    /\bLife Time\b/.test(productName);
  const credits =
    eventName === "order_created"
      ? tier === "Pro"
        ? 1000
        : tier === "Plus"
          ? 150
          : 10
      : tier === "Free"
        ? 10
        : null;

  try {
    await applyPocketBaseBilling({
      ...(typeof userId === "string" ? { userId } : {}),
      ...(typeof userEmail === "string" ? { userEmail } : {}),
      tier,
      lifetime,
      credits,
      freeTrial: true,
      paymentData: payload,
    });
  } catch (error) {
    console.error("Billing apply failed", {
      eventName,
      kind: error instanceof Error ? error.name : "unknown",
    });
    return json({ error: "Billing update failed" }, 502);
  }

  return json({ message: "Payment data received" }, 200);
};
