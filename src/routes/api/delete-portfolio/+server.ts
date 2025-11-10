import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb } = locals;
  const data = await request.json();

  const portfolioId = data?.portfolioId;
  let output;

  try {
    await pb.collection("portfolio").delete(portfolioId);
    output = 'success';
  } catch (e) {
    console.error("Failed to delete portfolio:", e);
    output = 'failure';
  }

  return new Response(JSON.stringify(output));
};
