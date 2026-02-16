import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, user } = locals;

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  const data = await request.json();
  const portfolioId = data?.portfolioId;
  let output;

  try {
    // Verify ownership before deleting
    const record = await pb.collection("portfolio").getOne(portfolioId);
    if (record.user !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    await pb.collection("portfolio").delete(portfolioId);
    output = 'success';
  } catch (e) {
    console.error("Failed to delete portfolio:", e);
    output = 'failure';
  }

  return new Response(JSON.stringify(output));
};
