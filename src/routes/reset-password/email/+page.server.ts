import { redirect, fail } from "@sveltejs/kit";
import { newPasswordSchema } from "$lib/schemas";
import { validateData } from "$lib/utils";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

/**
 * Sanitize form data to remove sensitive fields before returning to client
 * SECURITY: Never return passwords or tokens in error responses
 */
function sanitizeFormData(formData: Record<string, unknown>) {
  const { password, passwordConfirm, token, ...safeData } = formData;
  return safeData;
}

export const load = async ({ locals }) => {
  const { pb } = locals;
  if (pb.authStore.isValid) {
    throw redirect(303, "/");
  }
};

export const actions = {
  newPassword: async ({ request, locals }) => {
    const { pb } = locals;

    // SECURITY: Rate limiting — 5 attempts per 15 minutes
    const clientIp = locals.clientIp;
    const rateLimitResult = checkRateLimit(
      clientIp,
      "passwordReset",
      RATE_LIMITS.passwordReset,
    );

    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil(rateLimitResult.resetIn / 60000);
      return fail(429, {
        rateLimited: true,
        retryAfter: minutesRemaining,
      });
    }

    const { formData, errors } = await validateData(
      await request.formData(),
      newPasswordSchema,
    );

    // SECURITY: Sanitize form data — remove passwords and token
    const safeFormData = sanitizeFormData(formData);

    if (errors) {
      return fail(400, {
        data: safeFormData,
        errors: errors.fieldErrors,
      });
    }

    try {
      await pb
        .collection("users")
        .confirmPasswordReset(
          formData.token,
          formData.password,
          formData.passwordConfirm,
        );

      return { success: true };
    } catch (err: any) {
      // SECURITY: Don't log full error object
      console.error("Password reset confirmation failed");
      return fail(400, {
        data: safeFormData,
        errors: { error: "Failed to reset password. Please try again." },
      });
    }
  },
};
