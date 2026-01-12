import type { RequestHandler } from "./$types";

const CREDIT_COST = 100;

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;

  // Check if user is logged in
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  // Check if user is Pro tier
  if (user?.tier !== "Pro") {
    return new Response(
      JSON.stringify({ error: "This feature is available for Pro members only" }),
      { status: 403 }
    );
  }

  // Check if user has enough credits
  if (user?.credits < CREDIT_COST) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. You need ${CREDIT_COST} credits but have ${user?.credits}.`,
      }),
      { status: 400 }
    );
  }

  try {
    // Deduct credits
    await pb.collection("users").update(user?.id, {
      credits: user?.credits - CREDIT_COST,
    });

    return new Response(
      JSON.stringify({
        success: true,
        creditsDeducted: CREDIT_COST,
        remainingCredits: user?.credits - CREDIT_COST,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to deduct credits:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process export. Please try again." }),
      { status: 500 }
    );
  }
};
