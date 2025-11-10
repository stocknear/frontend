import { json } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
  const { pb, user } = locals;

  const getAllChats = async () => {
    if (!user) return [];

    const output = await pb.collection("chat").getList(1, 100, {
      sort: "-updated",
      filter: `user="${user.id}"`,
    });
    const lastUserMessages = output.items.map(chat => {
      const userMessages = chat.messages?.filter(m => m.role === "user");
      const lastMessage = userMessages?.at(-1)?.content || null;

      return {
        id: chat?.id,
        updated: chat?.updated,
        message: lastMessage,
      };
    });

    return lastUserMessages;
  };

  try {
    const getAllChatsData = await getAllChats();

    return json({
      getAllChats: getAllChatsData,
      randomChats: []
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
};