import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";

const SECRET_KEY = LEMON_SQUEEZY_SECRET_KEY;
const BILLING_EVENT_PATH = "/api/stocknear/billing/event";
const MAX_WEBHOOK_BYTES = 900_000;
const ENTITLEMENT_EVENTS = new Set([
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
  "subscription_payment_success",
  "subscription_payment_recovered",
  "subscription_payment_refunded",
]);
const CREDIT_GRANT_EVENTS = new Set([
  "order_created",
  "subscription_payment_success",
  "subscription_payment_recovered",
]);
const DOWNGRADE_EVENTS = new Set([
  "order_refunded",
  "subscription_expired",
  "subscription_payment_refunded",
]);

function eventPrecedence(eventName: string): number {
  // When Lemon reports the same resource timestamp for related events, the
  // state-bearing lifecycle event wins over a payment notification and an
  // explicit refund/expiry wins over both. The event hash remains the final
  // deterministic tie-breaker within the same semantic class.
  if (DOWNGRADE_EVENTS.has(eventName)) return 40;
  if (eventName === "subscription_plan_changed") return 30;
  if (CREDIT_GRANT_EVENTS.has(eventName)) return 10;
  return 20;
}

if (!SECRET_KEY) throw new Error("Missing Lemon Squeezy secret key.");

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function isValidSignature(payload: string, signature: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function determineTier(
  productName: string,
  status: string,
): "Free" | "Plus" | "Pro" | null {
  if (!new Set(["paid", "active", "cancelled", "on_trial"]).has(status.toLowerCase())) {
    return null;
  }
  const normalized = productName.toLowerCase();
  if (/\bplus\b/.test(normalized)) return "Plus";
  if (/\bpro\b/.test(normalized) || normalized.includes("life time")) return "Pro";
  return null;
}

function occurredAt(payload: any): string | null {
  const candidate =
    payload?.data?.attributes?.updated_at ??
    payload?.data?.attributes?.created_at ??
    payload?.meta?.event_created_at;
  if (typeof candidate !== "string") return null;
  const timestamp = Date.parse(candidate);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function billingProofHeaders(event: {
  eventId: string;
  occurredAt: string;
  precedence: number;
  userId: string;
  userEmail: string;
  tier: string;
  lifetime: boolean;
  freeTrial: boolean;
  credits: number | null;
}) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const canonical = [
    "v2",
    timestamp,
    event.eventId,
    event.occurredAt,
    String(event.precedence),
    event.userId,
    event.userEmail,
    event.tier,
    event.lifetime ? "true" : "false",
    event.freeTrial ? "true" : "false",
    String(event.credits),
  ].join("\n");
  return {
    "X-Stocknear-Billing-Timestamp": timestamp,
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", SECRET_KEY)
      .update(canonical, "utf8")
      .digest("hex"),
  };
}

function legacyBillingProofHeaders(userId: string, tier: string, lifetime: boolean) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const canonical = [
    "v1", timestamp, userId, tier, lifetime ? "true" : "false",
  ].join("\n");
  return {
    "X-Stocknear-Billing-Timestamp": timestamp,
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", SECRET_KEY)
      .update(canonical, "utf8")
      .digest("hex"),
  };
}

async function applyLegacyBillingFallback(
  pb: any,
  event: {
    userId: string;
    userEmail: string;
    tier: string;
    lifetime: boolean;
    freeTrial: boolean;
    credits: number | null;
  },
  payload: any,
) {
  const custom = payload?.meta?.custom_data;
  const hasBinding = custom?.accountEmail !== undefined ||
    custom?.accountProof !== undefined;
  let user: any = null;
  if (!hasBinding) throw new Error("Missing legacy billing account binding");
  const accountEmail = typeof custom?.accountEmail === "string"
    ? custom.accountEmail.trim().toLowerCase()
    : "";
  const proof = typeof custom?.accountProof === "string"
    ? custom.accountProof
    : "";
  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`checkout-v1\n${event.userId}\n${accountEmail}`, "utf8")
    .digest("hex");
  if (!event.userId || !/^[a-f0-9]{64}$/.test(proof) ||
      !crypto.timingSafeEqual(Buffer.from(proof, "hex"), Buffer.from(expected, "hex"))) {
    throw new Error("Invalid legacy billing account binding");
  }
  user = await pb.collection("users").getOne(event.userId);
  if (String(user?.email ?? "").trim().toLowerCase() !== accountEmail) {
    throw new Error("Legacy billing account mismatch");
  }
  const body: Record<string, unknown> = {
    tier: event.tier,
    lifetime: event.lifetime,
    freeTrial: event.freeTrial,
  };
  if (event.credits !== null) body.credits = event.credits;
  await pb.collection("users").update(user.id, body, {
    headers: legacyBillingProofHeaders(user.id, event.tier, event.lifetime),
  });
  await pb.collection("payments").create({ user: user.id, data: payload });
}

export const POST = async ({ request, locals }) => {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0 ||
        declaredBytes > MAX_WEBHOOK_BYTES) {
      return json({ error: "Payload too large" }, 413);
    }
  }
  let payloadRaw: string;
  try {
    payloadRaw = await request.text();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (Buffer.byteLength(payloadRaw, "utf8") > MAX_WEBHOOK_BYTES) {
    return json({ error: "Payload too large" }, 413);
  }

  const lemonSignature = request.headers.get("x-signature") ?? "";
  if (!isValidSignature(payloadRaw, lemonSignature)) {
    return json({ error: "Invalid signature" }, 403);
  }

  let payload: any;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return json({ error: "Invalid payload" }, 400);
  }

  const eventName = payload?.meta?.event_name;
  if (typeof eventName !== "string") {
    return json({ error: "Invalid payload structure" }, 400);
  }
  if (!ENTITLEMENT_EVENTS.has(eventName)) {
    return json({ message: "Event ignored" }, 200);
  }
  const attributes = payload?.data?.attributes;
  const eventOccurredAt = occurredAt(payload);
  const customData = payload?.meta?.custom_data;
  const hasAccountBinding =
    customData?.accountEmail !== undefined ||
    customData?.accountProof !== undefined;
  const userId =
    hasAccountBinding && typeof customData?.userId === "string"
      ? customData.userId.trim()
      : "";
  const userEmail =
    typeof attributes?.user_email === "string"
      ? attributes.user_email.trim().toLowerCase()
      : "";
  if (!attributes || !eventOccurredAt || !hasAccountBinding || !userId) {
    return json({ error: "Invalid payload structure" }, 400);
  }

  const productName = String(
    attributes?.first_order_item?.product_name ?? attributes?.product_name ?? "",
  );
  const status = eventName === "subscription_expired"
    ? "expired"
    : String(attributes?.status ?? "");
  const refunded = attributes?.refunded === true;
  const downgrade = DOWNGRADE_EVENTS.has(eventName) || refunded || status === "expired";
  const tier = downgrade ? "Free" : determineTier(productName, status);
  if (tier === null) {
    return json({ message: "Event ignored" }, 200);
  }
  const lifetime = tier === "Pro" && productName.toLowerCase().includes("life time");
  const freeTrial = true;
  const credits = downgrade
    ? 10
    : CREDIT_GRANT_EVENTS.has(eventName)
      ? tier === "Pro" ? 1000 : 150
      : null;
  const eventId = crypto.createHash("sha256").update(payloadRaw).digest("hex");
  const event = {
    eventId,
    occurredAt: eventOccurredAt,
    precedence: eventPrecedence(eventName),
    userId,
    userEmail,
    tier,
    lifetime,
    freeTrial,
    credits,
  };

  try {
    const result = await locals.pb.send(BILLING_EVENT_PATH, {
      method: "POST",
      headers: billingProofHeaders(event),
      body: { ...event, payloadRaw },
    });
    if (!result || typeof result.applied !== "boolean" ||
        typeof result.duplicate !== "boolean") {
      throw new Error("Invalid PocketBase billing response");
    }
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;
    const responseCode =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { code?: unknown } }).response?.code
        : undefined;
    if (status === 404 && responseCode !== "billing_user_not_found") {
      try {
        await applyLegacyBillingFallback(locals.pb, event, payload);
        return json({ message: "Payment event processed" }, 200);
      } catch (fallbackError) {
        console.error("Legacy PocketBase billing fallback failed", fallbackError);
      }
    }
    console.error("PocketBase billing event failed", {
      status,
    });
    return json({ error: "PocketBase error" }, 500);
  }

  return json({ message: "Payment event processed" }, 200);
};
