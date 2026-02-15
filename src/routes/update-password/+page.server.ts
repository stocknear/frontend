import { redirect } from "@sveltejs/kit";
import { updatePasswordSchema } from "$lib/schemas";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

export const load = async ({ locals }) => {
  const { pb } = locals;
  if (!pb.authStore.isValid) {
    redirect(303, "/login");
  }
};

export const actions = {
  updatePassword: async ({ request, locals, fetch }) => {
    const { pb, user } = locals;

    // SECURITY: Rate limiting — 10 attempts per 15 minutes
    const clientIp = locals.clientIp;
    const rateLimitResult = checkRateLimit(
      clientIp,
      "login",
      RATE_LIMITS.login,
    );

    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil(rateLimitResult.resetIn / 60000);
      return fail(429, {
        rateLimited: true,
        retryAfter: minutesRemaining,
      });
    }

    const formData = await request.formData();
    const turnstileToken =
      formData.get("cf-turnstile-response")?.toString() ?? "";

    const postData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && key !== "cf-turnstile-response") {
        postData[key] = value;
      }
    }

    // SECURITY: Turnstile verification (skip in dev mode)
    if (!import.meta.env.DEV) {
      if (!turnstileToken) {
        return fail(400, {
          errors: { turnstile: "Please confirm you are not a robot." },
        });
      }

      try {
        const response = await fetch("/api/turnstile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });

        const turnstileVerification = await response.json();

        if (!response.ok || !turnstileVerification?.success) {
          return fail(400, {
            errors: {
              turnstile:
                turnstileVerification?.message ??
                "Turnstile verification failed. Please try again.",
            },
          });
        }
      } catch {
        return fail(400, {
          errors: {
            turnstile:
              "Unable to verify Turnstile response. Please refresh and try again.",
          },
        });
      }
    }

    try {
      // Validate form data using Zod schema.
      const cleanedData = updatePasswordSchema.parse(postData);

      await pb.collection("users").update(user?.id, cleanedData);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {
          errorOldPassword:
            error.errors?.find((err) => err.path[0] === "oldPassword")
              ?.message || "Your password is wrong",
          errorPassword:
            error.errors?.find((err) => err.path[0] === "password")?.message ||
            "",
          errorPasswordConfirm:
            error.errors?.find((err) => err.path[0] === "passwordConfirm")
              ?.message || "",
        };
        return fail(400, { errors });
      }
      // SECURITY: Don't log full error object — may contain password data
      console.error("Password update failed for user:", user?.id);
      return fail(500, {
        errors: { error: "An unexpected error occurred. Please try again." },
      });
    }
  },
};
