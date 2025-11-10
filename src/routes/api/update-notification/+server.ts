import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { pb } = locals;

  const notificationList = data?.unreadList;
  let output;

  try {
    const itemsToUpdate = notificationList?.filter((item) => !item.readed);
    // Perform updates in parallel
    await Promise.all(
      itemsToUpdate.map((item) =>
        pb.collection("notifications").update(item, { readed: "true" }),
      ),
    );

    output = "success";
  } catch (e) {
    output = "failure";
  }

  return new Response(JSON.stringify(output));
};
