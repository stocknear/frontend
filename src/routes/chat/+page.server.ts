import { error, redirect } from "@sveltejs/kit";

  import { getDefaultChats } from "$lib/utils";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ locals }) => {
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

  return {
    getAllChats: await getAllChats(),
        randomChats: getDefaultChats()
    ?.sort(() => 0.5 - Math.random())
    ?.slice(0, 4)
    
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
