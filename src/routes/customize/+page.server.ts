import { redirect } from "@sveltejs/kit";


export async function load({ locals,cookies }) {
  const { pb} = locals;
  
   if (!pb.authStore.isValid) {
    redirect(303, "/login");
  }

  const getCustomSettings = async () => {
    try {
      const raw = cookies.get("custom-dashboard-widget");
      if (!raw || raw === "undefined") return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return {
    getCustomSettings: await getCustomSettings()
  };
}


