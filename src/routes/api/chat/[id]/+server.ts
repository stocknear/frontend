import { json } from '@sveltejs/kit';

export const GET = async ({ locals, params }) => {
  const { pb, user } = locals;
  const { id } = params;

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return json({ error: 'Chat ID is required' }, { status: 400 });
  }

  try {
    // Fetch the specific chat by ID
    const chat = await pb.collection("chat").getOne(id, {
      filter: `user="${user.id}"` // Ensure user can only access their own chats
    });

    return json({
      getChat: {
        id: chat.id,
        messages: chat.messages || [],
        updated: chat.updated,
        editable: true // Assistant is always editable
      }
    });

  } catch (error) {
    console.error('Error fetching chat:', error);
    
    // Check if it's a 404 or permission error
    if (error.status === 404) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
};