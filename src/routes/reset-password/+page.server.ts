import { redirect, fail } from "@sveltejs/kit";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const resetEmailSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address." })
    .max(254),
});

export const load = async ({ locals }) => {
  const { pb } = locals;
  if (pb.authStore.isValid) {
    throw redirect(303, "/");
  }
};

export const actions = {
  reset: async ({ request, locals, fetch }) => {
    const { pb } = locals;

    // SECURITY: Rate limiting — 3 attempts per 15 minutes
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

    const requestFormData = await request.formData();
    const turnstileToken =
      requestFormData.get("cf-turnstile-response")?.toString() ?? "";

    // SECURITY: Validate email with Zod
    const rawEmail = requestFormData.get("email")?.toString() ?? "";
    const parseResult = resetEmailSchema.safeParse({ email: rawEmail });

    if (!parseResult.success) {
      return fail(400, {
        data: { email: rawEmail },
        errors: { email: parseResult.error.flatten().fieldErrors.email },
      });
    }

    const email = parseResult.data.email;

    // SECURITY: Turnstile verification (skip in dev mode)
    if (!import.meta.env.DEV) {
      if (!turnstileToken) {
        return fail(400, {
          data: { email },
          errors: {
            turnstile: ["Please confirm you are not a robot."],
          },
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
            data: { email },
            errors: {
              turnstile: [
                turnstileVerification?.message ??
                  "Turnstile verification failed. Please try again.",
              ],
            },
          });
        }
      } catch {
        return fail(400, {
          data: { email },
          errors: {
            turnstile: [
              "Unable to verify Turnstile response. Please refresh and try again.",
            ],
          },
        });
      }
    }

    // SECURITY: Always redirect to login regardless of whether the email exists.
    // This prevents email enumeration attacks.
    try {
      await pb.collection("users").requestPasswordReset(email);
    } catch {
      // Silently ignore errors — don't reveal if email exists or not
    }

    throw redirect(303, "/login");
  },
};
