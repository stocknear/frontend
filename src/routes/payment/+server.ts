import crypto from "node:crypto";

// Your secret key provided by Lemon Squeezy
const SECRET_KEY = import.meta.env.VITE_LEMON_SQUEEZY_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("Missing Lemon Squeezy secret key.");
}

/**
 * Verifies that the provided signature matches the HMAC digest for the given payload.
 *
 * @param {string} payload - The raw request body.
 * @param {string} signatureHeader - The signature from the request header.
 * @returns {boolean} - True if the signature is valid; otherwise, false.
 */
function isValidSignature(payload, signatureHeader) {
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  const computedDigestHex = hmac.update(payload).digest("hex");

  // Convert both values to buffers for timing-safe comparison
  const computedBuffer = Buffer.from(computedDigestHex, "utf8");
  const signatureBuffer = Buffer.from(signatureHeader, "utf8");

  // Ensure the buffers are the same length; if not, they can't be equal.
  if (computedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
}

/**
 * Determines the user's tier based on the payment status and refund flag.
 *
 * @param {string} status - The payment status.
 * @param {boolean} refunded - Whether the payment was refunded.
 * @returns {string} - "Pro" if conditions match, otherwise "Free".
 */
function determineTier(productName, status, refunded) {
  // Define statuses that qualify for the "Pro" tier if not refunded.
  const condition = new Set(["paid", "active", "cancelled", "on_trial"]);
  // First, ensure the product is not refunded and the status qualifies.
  if (refunded || !condition.has(status)) {
    return "Free";
  }

  // At this point, refunded is false and the status qualifies.
  // Check productName for tier-specific keywords.
  if (productName) {
    if (productName.includes("Plus")) {
      return "Plus";
    }
    if (productName.includes("Pro") || productName.includes("Life Time")) {
      return "Pro";
    }
  }

  // Fallback: if no product name conditions are met, default to "Pro" (per the original logic).
  return "Pro";
}


export const POST = async ({ request, locals }) => {
  try {
    const bodyText = await request.text();

    // Retrieve the signature header; return early if missing.
    const signatureHeader = request.headers.get("x-Signature");
    if (!signatureHeader) {
      console.error("Missing x-Signature header.");
      return new Response(
        JSON.stringify({ error: "Missing signature header" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!isValidSignature(bodyText, signatureHeader)) {
      console.error("Signature verification failed.");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the JSON payload
    const payload = JSON.parse(bodyText);
    const eventName = payload?.meta?.event_name;
    const userId = payload?.meta?.custom_data?.userId;
    const { status, refunded } = payload?.data?.attributes || {};
    const productName = payload?.data?.attributes?.first_order_item?.product_name;

   
    
    if (!userId || status === undefined) {
      console.error("Missing userId or status in payload:", payload);
      return new Response(
        JSON.stringify({ error: "Invalid payload structure" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }


    //for order created update the AI credit
    if (eventName === "order_created") {
      const tier = determineTier(productName, status, refunded);

      // Define credits for tiers
      let credits = 10;
      if (tier === "Plus") credits = 150;
      if (tier === "Pro") credits = 1000;

      try {
       // Get the current user data first
        const user = await locals.pb.collection("users").getOne(userId);

        // Decide the new freeTrial value
        const freeTrial =
          user.freeTrial === true ? true : status === "on_trial";
        // Update user
        await locals.pb.collection("users").update(userId, {
          tier,
          freeTrial,
          credits,
          lifetime: productName?.includes("Life Time"),
        });


        const paymentData = { user: userId, data: payload };
        await locals.pb.collection("payments").create(paymentData);

        return new Response(
          JSON.stringify({ message: "Payment data received and credit score updated!" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      } catch (dbError) {
        console.error("Database error:", dbError);
        return new Response(JSON.stringify({ error: "Pocketbase error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    //=========================
  
    const tier = determineTier(payload?.data?.attributes?.product_name, status, refunded);
    //console.log(tier, payload?.data?.attributes?.product_name)
    
    // Update the user and log the payment

    try {

        const user = await locals.pb.collection("users").getOne(userId);

        // Decide the new freeTrial value
        const freeTrial =
          user.freeTrial === true ? true : status === "on_trial";

      await locals.pb.collection("users").update(userId, {
        tier,
         freeTrial,
        //credits: tier === 'Pro' ? 1000 : tier === 'Plus' ? 500 : 10,
        credits: tier === 'Free' ? 10 : userId?.credits,
        lifetime: productName?.includes("Life Time"),
      });

      const paymentData = { user: userId, data: payload };
      await locals.pb.collection("payments").create(paymentData);
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      return new Response(
      JSON.stringify({ error: "Pocketbase error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }

    );


    }

    return new Response(
      JSON.stringify({ message: "Payment data received successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
