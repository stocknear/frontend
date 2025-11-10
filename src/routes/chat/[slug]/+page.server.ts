import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url, params }) => {
    const { pb, user } = locals;
   
    // Extract chatId from the URL path
    // Assuming your route is like "/chat/[chatId]" 
    const chatId = url.pathname.split('/').filter(Boolean)[1]; // Gets the segment after "/chat/"
    
    // Alternatively, if you're using SvelteKit with named parameters in your routes
    // you can directly use params.chatId if your route is defined as "/chat/[chatId]"
    // const chatId = params.chatId;
    let editable = true;
    const getChat = async () => {
      try {
        if (!user) {
          editable = false;
        }
        
        // Based on your output, the field is named "user", not "userId"
        const output = await pb.collection("chat").getOne(chatId);

        // Verify the chat belongs to the current user
        if (output?.user !== user?.id) {
          editable = false;
        }
        
        output.editable = editable;

        return output;
      } catch (error) {
        console.error("Error fetching chat:", error);
       redirect(302, "/chat")
      }
    };
   
    return {
      getChat: await getChat(),
    };
  };