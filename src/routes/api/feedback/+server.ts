import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  // Parse incoming data
  const data = await request.json();
  const { pb } = locals;
  console.log("Incoming feedback data:", data);

  // Ensure user is identified from the request
  const userId = data?.user || locals.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "User identification required" }), { status: 400 });
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  try {
    // Query the feedback collection for entries created by this user in the last 15 minutes
    const feedbackList = await pb.collection("feedback").getFullList({
      filter: `user="${userId}"`
    });

    const recentFeedbacks = feedbackList?.filter(item => new Date(item?.created) >= fifteenMinutesAgo);
    // If the user has already submitted 2 feedback entries, prevent new submission
    if (recentFeedbacks?.length >= 2) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait before submitting more feedback." }),
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("Error checking recent feedback:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }

  // Create the feedback entry since the user hasn't exceeded the limit
  let output = "failure";
  try {
    await pb.collection("feedback").create({
      user: userId,
      description: data.description,
      rating: data.rating,
      category: data.category
    });
    output = "success";
  } catch (e) {
    console.error("Error creating feedback:", e);
    output = "failure";
  }

  return new Response(JSON.stringify({ status: output }));
};
