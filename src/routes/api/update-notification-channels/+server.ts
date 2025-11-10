import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb } = locals;

  try {
    const payload = await request.json();
    const { id, ...updateData } = payload;

    if (!id) {
      return new Response(
        JSON.stringify({ status: "failure", message: "Missing id" }),
        { status: 400 }
      );
    }

    await pb.collection("notificationChannels").update(id, updateData);

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response(
      JSON.stringify({ status: "failure", error: e.message }),
      { status: 500 }
    );
  }
};
