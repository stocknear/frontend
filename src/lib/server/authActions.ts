import { error, fail, redirect } from "@sveltejs/kit";
import { validateData, checkDisposableEmail, validateReturnUrl } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

/**
 * Sanitize form data to remove sensitive fields before returning to client
 * SECURITY: Never return passwords in error responses
 */
function sanitizeFormData(formData: Record<string, unknown>) {
  const { password, passwordConfirm, ...safeData } = formData;
  return safeData;
}

/**
 * Shared login action for all pages using LoginPopup.
 * Validates credentials, authenticates with PocketBase, and redirects.
 */
export const loginAction = async ({ request, locals, url, cookies }: any) => {
  const { formData, errors } = await validateData(
    await request.formData(),
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

  try {
    await locals.pb
      .collection("users")
      .authWithPassword(formData.email, formData.password);
  } catch (err: any) {
    // SECURITY: Only log redacted email, never the full error object
    console.error(
      "Login failed for:",
      formData?.email?.substring(0, 3) + "***",
    );
    // SECURITY: Always return generic auth failure, never PocketBase internals
    return fail(400, {
      data: safeFormData,
      authFailed: true,
    });
  }

  // Get return URL from query or cookie
  const returnUrl =
    url.searchParams.get("returnUrl") || cookies.get("returnUrl") || "/";

  // Remove cookie after use
  cookies.delete("returnUrl", { path: "/" });

  // Validate and redirect
  throw redirect(302, validateReturnUrl(returnUrl, url.origin));
};

/**
 * Shared register action for all pages using LoginPopup.
 * Includes rate limiting, Turnstile CAPTCHA, disposable email check,
 * and structured error responses matching LoginPopup's error handling.
 */
export const registerAction = async ({
  locals,
  request,
  url,
  cookies,
  fetch,
}: any) => {
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
        headers: { "content-type": "application/json" },
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
    await locals.pb
      .collection("users")
      .authWithPassword(formData.email, formData.password);
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

  // Get return URL from query or cookie, default to step 2 of registration
  const returnUrl =
    url.searchParams.get("returnUrl") ||
    cookies.get("returnUrl") ||
    "/register?step=2";

  // Remove cookie
  cookies.delete("returnUrl", { path: "/" });

  // Validate and redirect
  throw redirect(302, validateReturnUrl(returnUrl, url.origin));
};

/**
 * Shared OAuth2 action for all pages using LoginPopup.
 */
export const oauth2Action = async ({
  url,
  locals,
  request,
  cookies,
}: any) => {
  const path = url?.href?.replace("/oauth2", "");
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

  cookies.set("path", path, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60,
  });

  redirect(302, authProviderRedirect);
};
