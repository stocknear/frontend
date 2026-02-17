export const load = async ({ locals }) => {
  const { pb, user } = locals;

  const getAllChats = async () => {
    if (!user) return [];

    const output = await pb.collection("chat").getList(1, 100, {
      sort: "-updated",
      filter: `user="${user.id}"`,
    });

    return output.items.map((chat) => {
      const firstUserMessage =
        chat.messages?.find((m) => m.role === "user")?.content || null;

      return {
        id: chat?.id,
        updated: chat?.updated,
        message: firstUserMessage,
      };
    });
  };

  return {
    allChats: await getAllChats(),
  };
};
