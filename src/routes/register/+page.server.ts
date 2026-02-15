import { fail, redirect } from "@sveltejs/kit";
import { registerUserSchema } from "$lib/schemas";
import { validateData, checkDisposableEmail } from "$lib/utils";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

/**
 * Sanitize form data to remove sensitive fields before returning to client
 * SECURITY: Never return passwords in error responses
 */
function sanitizeFormData(formData: Record<string, unknown>) {
  const { password, passwordConfirm, ...safeData } = formData;
  return safeData;
}

export async function load({ locals, url }) {
  const { pb } = locals;
  const step = url.searchParams.get("step");

  // If user is authenticated and already Pro/Plus, redirect to dashboard
  if (pb.authStore.isValid && ["Pro", "Plus"].includes(locals.user?.tier)) {
    redirect(303, "/dashboard");
  }

  // If user is authenticated and on step 2, let them see plan selection
  if (pb.authStore.isValid && step === "2") {
    return {
      user: locals.user,
      step: 2,
    };
  }

  // If user is authenticated but not on step 2, send to dashboard
  if (pb.authStore.isValid) {
    redirect(303, "/dashboard");
  }

  // Unauthenticated user on step 2 should go back to step 1
  if (step === "2") {
    redirect(303, "/register");
  }

  return {
    user: null,
    step: 1,
  };
}

export const actions = {
  register: async ({ locals, request, fetch, url, cookies }) => {
    // SECURITY: Rate limiting based on client IP
    const clientIp = locals.clientIp;
    const rateLimitResult = checkRateLimit(
      clientIp,
      "register",
      RATE_LIMITS.register,
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

    const { formData, errors } = await validateData(
      requestFormData,
      registerUserSchema,
    );

    // SECURITY: Sanitize form data - remove passwords before returning
    const safeFormData = sanitizeFormData(formData);

    if (errors) {
      return fail(400, {
        data: safeFormData,
        errors: errors.fieldErrors,
      });
    }

    // Skip Turnstile verification in dev mode
    if (!import.meta.env.DEV) {
      if (!turnstileToken) {
        return fail(400, {
          data: safeFormData,
          errors: {
            turnstile: ["Please confirm you are not a robot."],
          },
        });
      }

      let turnstileVerification;
      try {
        const response = await fetch("/api/turnstile", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ token: turnstileToken }),
        });

        turnstileVerification = await response.json();

        if (!response.ok || !turnstileVerification?.success) {
          return fail(400, {
            data: safeFormData,
            errors: {
              turnstile: [
                turnstileVerification?.message ??
                  "Turnstile verification failed. Please try again.",
              ],
            },
          });
        }
      } catch (verificationError) {
        console.error("Turnstile verification error:", verificationError);
        return fail(400, {
          data: safeFormData,
          errors: {
            turnstile: [
              "Unable to verify Turnstile response. Please refresh and try again.",
            ],
          },
        });
      }
    }

    const isEmailDisposable = await checkDisposableEmail(formData?.email);

    if (isEmailDisposable === "true") {
      return fail(400, {
        data: safeFormData,
        disposableEmail: true,
      });
    }

    try {
      const newUser = await locals.pb.collection("users").create(formData);

      await locals.pb.collection("users").update(newUser?.id, {
        credits: 10,
      });

      await locals.pb
        .collection("users")
        .requestVerification(formData.email);
    } catch (err: any) {
      // SECURITY: Don't log full error object, only safe message
      console.error(
        "Registration error for email:",
        formData?.email?.substring(0, 3) + "***",
      );

      const errorMessage = err?.message || "";
      const errorData = err?.data || {};

      // SECURITY: Use generic error for email exists to prevent enumeration
      if (
        errorMessage.includes("already in use") ||
        errorMessage.includes("already exists") ||
        errorData?.email?.code === "validation_not_unique"
      ) {
        return fail(400, {
          data: safeFormData,
          registrationFailed: true,
        });
      }

      // Invalid email format
      if (
        errorData?.email?.code === "validation_is_email" ||
        errorMessage.includes("invalid email")
      ) {
        return fail(400, {
          data: safeFormData,
          invalidEmail: true,
        });
      }

      // Password validation failed
      if (errorData?.password?.code || errorMessage.includes("password")) {
        return fail(400, {
          data: safeFormData,
          weakPassword: true,
        });
      }

      // Generic registration error
      return fail(400, {
        data: safeFormData,
        registrationFailed: true,
      });
    }

    try {
      await locals.pb
        .collection("users")
        .authWithPassword(formData.email, formData.password);
    } catch (err) {
      // User was created but auto-login failed - still redirect to step 2
    }

    // Redirect to step 2 (plan selection) instead of /profile
    redirect(302, "/register?step=2");
  },

  oauth2: async ({ url, locals, request, cookies }) => {
    const authMethods = (
      await locals?.pb?.collection("users")?.listAuthMethods()
    )?.oauth2;

    const data = await request?.formData();
    const providerSelected = data?.get("provider");

    if (!authMethods?.providers) {
      return fail(400, { oauthFailed: true });
    }
    const redirectURL = `${url.origin}/oauth`;

    // SECURITY: Validate provider exists before accessing
    const targetItem = authMethods.providers.findIndex(
      (item: any) => item?.name === providerSelected,
    );

    if (targetItem === -1) {
      return fail(400, { oauthFailed: true });
    }

    const provider = authMethods.providers[targetItem];
    const authProviderRedirect = `${provider.authUrl}${redirectURL}`;
    const state = provider.state;
    const verifier = provider.codeVerifier;

    cookies.set("state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 10,
    });

    cookies.set("verifier", verifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 10,
    });

    cookies.set("provider", providerSelected, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 10,
    });

    // Set returnUrl cookie so OAuth callback redirects to step 2
    cookies.set("returnUrl", "/register?step=2", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 5,
    });

    cookies.set("path", "/register?step=2", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60,
    });

    redirect(302, authProviderRedirect);
  },
};
