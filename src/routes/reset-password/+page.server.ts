import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { pb } = locals;
  if (pb.authStore.isValid) {
    throw redirect(303, "/");
  }
};

export const actions = {
  reset: async ({ request, locals }) => {
    const { pb } = locals;
    const formData = await request.formData();
    const email = formData.get("email");

    if (!email) {
      return { error: "Email is required" };
    }

    await pb.collection("users").requestPasswordReset(email as string);

    throw redirect(303, "/login");
  }
};
