import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, user } = locals;
  const data = await request.json();

  if (!user) {
    return new Response(JSON.stringify("unauthorized"), { status: 401 });
  }

  let output;

  try {
    const chat = await pb.collection("chat").getOne(data?.threadId);

    if (chat?.user !== user?.id) {
      return new Response(JSON.stringify("forbidden"), { status: 403 });
    }

    await pb.collection("chat").delete(data?.threadId);
    output = "success";
  } catch (e) {
    console.log(e);
    output = "failure";
  }

  return new Response(JSON.stringify(output));
};
