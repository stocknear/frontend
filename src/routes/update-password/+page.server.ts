import { redirect, error } from "@sveltejs/kit";
import { updatePasswordSchema } from "$lib/schemas";
import { fail } from "@sveltejs/kit";
import { z } from "zod";

export const load = async ({ locals }) => {
  const { pb } = locals;
  if (!pb.authStore.isValid) {
    redirect(303, "/login");
  }
}


export const actions = {
  updatePassword: async ({ request, locals }) => {
    const { pb, user } = locals;

    const formData = await request.formData();
    const postData: Record<string, string> = {};
    // Build a plain object from the form data.
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        postData[key] = value;
      }
    }

    try {
      // Validate form data using your Zod schema.
      const cleanedData = updatePasswordSchema.parse(postData);

      await pb.collection("users").update(user?.id, cleanedData);
      return { success: true };
    } catch (error) {
      console.log(error)
      if (error instanceof z.ZodError) {
        // Map Zod errors to individual error messages.
        const errors = {
          errorOldPassword:
            error.errors?.find((err) => err.path[0] === "oldPassword")?.message || "You're password is wrong",
          errorPassword:
            error.errors?.find((err) => err.path[0] === "password")?.message || "",
          errorPasswordConfirm:
            error.errors?.find((err) => err.path[0] === "passwordConfirm")?.message || "",
        };
        return fail(400, { errors, zodErrors: error.errors });
      }
      console.error("Unexpected error during password update:", error);
      return fail(500, { error: "An unexpected error occurred" });
    }
  },
};
