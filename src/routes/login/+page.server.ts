import { fail, redirect } from "@sveltejs/kit";
import { validateData } from "$lib/utils";
import { loginUserSchema } from "$lib/schemas";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

/**
 * Sanitize form data to remove sensitive fields before returning to client
 * SECURITY: Never return passwords in error responses
 */
function sanitizeFormData(formData: Record<string, unknown>) {
  const { password, ...safeData } = formData;
  return safeData;
}

export const actions = {
  login: async ({ request, locals, fetch }) => {
    // SECURITY: Rate limiting based on client IP
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

    const requestFormData = await request.formData();
    const turnstileToken =
      requestFormData.get("cf-turnstile-response")?.toString() ?? "";

    const { formData, errors } = await validateData(
      requestFormData,
      loginUserSchema,
    );

    // SECURITY: Sanitize form data - remove password before returning
    const safeFormData = sanitizeFormData(formData);

    if (errors) {
      return fail(400, {
        data: safeFormData,
        errors: errors.fieldErrors,
      });
    }

    // SECURITY: Turnstile verification (skip in dev mode)
    if (!import.meta.env.DEV) {
      if (!turnstileToken) {
        return fail(400, {
          data: safeFormData,
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
        console.error("Turnstile verification error");
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

    try {
      await locals.pb
        .collection("users")
        .authWithPassword(formData.email, formData.password);

      /*
      if (!locals.pb?.authStore?.model?.verified) {
        locals.pb.authStore.clear();
        return {
          notVerified: true,
        };
      }
      */
    } catch (err: any) {
      // SECURITY: Only log redacted email, never the full error object
      console.error(
        "Login failed for:",
        formData?.email?.substring(0, 3) + "***",
      );
      // SECURITY: Always return a generic auth failure message
      return fail(400, {
        data: safeFormData,
        authFailed: true,
      });
    }

    redirect(303, "/");
  },

  oauth2: async ({ url, locals, request, cookies }) => {
    const authMethods = (await locals?.pb
      ?.collection("users")
      ?.listAuthMethods())?.oauth2;

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

    cookies.set("path", "/profile", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60,
    });

    redirect(303, authProviderRedirect);
  },
};
