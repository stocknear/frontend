import { redirect } from "@sveltejs/kit";
import { isLocale } from "$lib/paraglide/runtime.js";

// Keep the visitor in their locale when the chat cannot be loaded. This reads
// the first segment deliberately to detect a locale prefix — `hasLocalePrefix`
// is what tells the i18n audit the positional read is intentional here, rather
// than the accidental kind that broke /de/chat/<id>.
const localizedChatPath = (url: URL) => {
  const [firstSegment] = url.pathname.split("/").filter(Boolean);
  const hasLocalePrefix = Boolean(firstSegment) && isLocale(firstSegment);
  return hasLocalePrefix ? `/${firstSegment}/chat` : "/chat";
};

export const load = async ({ locals, url, params }) => {
    const { pb, user } = locals;
   
    // Use the router's own param. Splitting the pathname and taking segment [1]
    // broke on every localized route: /de/chat/<id> yields "chat", the lookup
    // throws, and the catch below redirects — which is why /de/chat/<id> 302'd.
    const chatId = params.slug;
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
       redirect(302, localizedChatPath(url))
      }
    };
   
    return {
      getChat: await getChat(),
    };
  };