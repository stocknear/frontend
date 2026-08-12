import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";
import { billingTierWriteHeaders } from "$lib/server/billingUserWrite";

const SECRET_KEY = LEMON_SQUEEZY_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("Missing Lemon Squeezy secret key.");
}

function isValidSignature(payload, signatureHeader) {
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  const computedDigestHex = hmac.update(payload).digest("hex");
  const computedBuffer = Buffer.from(computedDigestHex, "utf8");
  const signatureBuffer = Buffer.from(signatureHeader, "utf8");

  if (computedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
}

function determineTier(productName, status, refunded): "Free" | "Plus" | "Pro" {
  const condition = new Set(["paid", "active", "cancelled", "on_trial"]);
  if (refunded || !condition.has(status)) {
    return "Free";
  }

  if (productName) {
    if (productName.includes("Plus")) {
      return "Plus";
    }
    if (productName.includes("Pro") || productName.includes("Life Time")) {
      return "Pro";
    }
  }

  return "Pro";
}

export const POST = async ({ request, locals }) => {
  try {
    const bodyText = await request.text();
    const signatureHeader = request.headers.get("x-Signature");
    if (!signatureHeader) {
      console.error("Missing x-Signature header.");
      return new Response(
        JSON.stringify({ error: "Missing signature header" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!isValidSignature(bodyText, signatureHeader)) {
      console.error("Signature verification failed.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(bodyText);
    const eventName = payload?.meta?.event_name;
    let userId = payload?.meta?.custom_data?.userId;
    const { status, refunded, user_email } = payload?.data?.attributes || {};
    const productName =
      payload?.data?.attributes?.first_order_item?.product_name;

    if (!userId && user_email) {
      try {
        const users = await locals.pb.collection("users").getList(1, 1, {
          filter: `email = "${user_email}"`,
        });
        if (users.items.length > 0) {
          userId = users.items[0].id;
        }
      } catch (lookupError) {
        console.error("Error looking up user by email:", lookupError);
      }
    }

    if (eventName === "subscription_expired" && userId) {
      try {
        const tier = "Free" as const;
        await locals.pb
          .collection("users")
          .update(
            userId,
            { tier, freeTrial: true, credits: 10 },
            { headers: billingTierWriteHeaders(userId, tier) },
          );

        await locals.pb
          .collection("payments")
          .create({ user: userId, data: payload });

        return new Response(
          JSON.stringify({
            message: "Subscription expired - user downgraded to Free",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (dbError) {
        console.error("Database error handling subscription_expired:", dbError);
        return new Response(JSON.stringify({ error: "Pocketbase error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (!userId || status === undefined) {
      console.error("Missing userId or status in payload:", payload);
      return new Response(
        JSON.stringify({ error: "Invalid payload structure" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (eventName === "order_created") {
      const tier = determineTier(productName, status, refunded);
      let credits = 10;
      if (tier === "Plus") credits = 150;
      if (tier === "Pro") credits = 1000;

      try {
        await locals.pb
          .collection("users")
          .update(
            userId,
            {
              tier,
              freeTrial: true,
              credits,
              lifetime: productName?.includes("Life Time"),
            },
            { headers: billingTierWriteHeaders(userId, tier) },
          );
        await locals.pb
          .collection("payments")
          .create({ user: userId, data: payload });

        return new Response(
          JSON.stringify({
            message: "Payment data received and credit score updated!",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (dbError) {
        console.error("Database error:", dbError);
        return new Response(JSON.stringify({ error: "Pocketbase error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const tier = determineTier(
      payload?.data?.attributes?.product_name,
      status,
      refunded,
    );
    try {
      await locals.pb.collection("users").update(
        userId,
        {
          tier,
          freeTrial: true,
          credits: tier === "Free" ? 10 : userId?.credits,
          lifetime: productName?.includes("Life Time"),
        },
        { headers: billingTierWriteHeaders(userId, tier) },
      );
      await locals.pb
        .collection("payments")
        .create({ user: userId, data: payload });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Pocketbase error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Payment data received successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
