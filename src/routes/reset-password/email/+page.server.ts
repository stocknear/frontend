import { redirect, fail } from "@sveltejs/kit";
import { newPasswordSchema } from "$lib/schemas";
import { validateData } from "$lib/utils";


export const load = async ({ locals }) => {
  const { pb } = locals;
  if (pb.authStore.isValid) {
    throw redirect(303, "/");
  }
};

export const actions = {
  newPassword: async ({ request, locals }) => {
    const { pb } = locals;


    const { formData, errors } = await validateData(
          await request.formData(),
          newPasswordSchema,
        );
        if (errors) {
          return fail(400, {
            data: formData,
            errors: errors.fieldErrors,
          });
        }

try {


await pb.collection('users').confirmPasswordReset(
        formData.token,
        formData.password,
        formData.passwordConfirm
      );


        
       return { success: true };

        } catch (error) {
          console.error("Error resetting password:", error);
          return fail(400, {
            data: formData,
            errors: { error: "Failed to reset password. Please try again." },
          });
        }
  }
};
