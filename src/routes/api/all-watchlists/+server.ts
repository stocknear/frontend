import type { RequestHandler } from "./$types";

export const GET = (async ({ locals }) => {
  const { user, pb } = locals;
  let output;

  try {
    output = await pb.collection("watchlist").getFullList({
      filter: `user="${user?.id}"`,
    });
  } catch (e) {
    output = [];
  }
  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
