import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { user } = locals;

  // Only allow admin users to access the editor
  if (!user?.admin) {
    throw redirect(303, "/learning-center");
  }

  return {
    user,
  };
};
