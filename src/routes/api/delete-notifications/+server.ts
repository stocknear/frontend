import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
  const { pb, user } = locals;

  if (!pb?.authStore?.isValid || !user?.id) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401 },
    );
  }

  try {
    const notifications = await pb
      ?.collection("notifications")
      ?.getFullList({
        filter: `user="${user?.id}"`,
        sort: "-created",
      });

    const ids = notifications?.map((item) => item?.id).filter(Boolean);

    if (ids?.length > 0) {
      const chunks: string[][] = [];
      const chunkSize = 25;

      for (let i = 0; i < ids.length; i += chunkSize) {
        chunks?.push(ids.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        await Promise?.all(
          chunk?.map((id) => pb.collection("notifications").delete(id)),
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, deleted: ids.length }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete notifications", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to delete notifications",
      }),
      { status: 500 },
    );
  }
};
