export const load = async ({ locals }) => {
  const { pb, user } = locals;

  const getAllChats = async () => {
    if (!user) return [];

    const output = await pb.collection("chat").getList(1, 50, {
      sort: "-updated",
      filter: `user="${user.id}"`,
      fields: "id,updated,messages",
    });

    return output.items.map((chat) => ({
      id: chat?.id,
      updated: chat?.updated,
      message: chat?.messages?.at(0)?.content?.slice(0, 100) || null,
    }));
  };

  return {
    allChats: await getAllChats(),
  };
};
