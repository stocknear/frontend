import { json } from "@sveltejs/kit";
import { CF_TURNSTILE_SECRET_KEY } from "$env/static/private";

const TURNSTILE_VERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_SECRET = CF_TURNSTILE_SECRET_KEY;

export const POST = async ({ request, locals, fetch }) => {
  if (!TURNSTILE_SECRET) {
    return json(
      {
        success: false,
        message: "Turnstile secret key is not configured.",
        errorCodes: ["missing-secret"],
      },
      { status: 500 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let token: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    token = body?.token?.toString();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData().catch(() => undefined);
    token = formData?.get("cf-turnstile-response")?.toString();
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => undefined);
    token =
      formData?.get("cf-turnstile-response")?.toString() ??
      formData?.get("token")?.toString();
  }

  if (!token) {
    return json(
      {
        success: false,
        message: "Missing Turnstile token.",
        errorCodes: ["missing-input-response"],
      },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    secret: TURNSTILE_SECRET,
    response: token,
  });

  if (locals?.clientIp) {
    params.append("remoteip", locals.clientIp);
  }

  try {
    const turnstileResponse = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const verification = await turnstileResponse.json();

    return json(
      {
        success: Boolean(verification?.success),
        message: verification?.success
          ? "Turnstile verification succeeded."
          : "Turnstile verification failed.",
        errorCodes: verification?.["error-codes"] ?? [],
      },
      {
        status: verification?.success ? 200 : 400,
      },
    );
  } catch (err) {
    console.error("Cloudflare Turnstile verification failed:", err);
    return json(
      {
        success: false,
        message: "Unable to validate Turnstile token.",
        errorCodes: ["internal-error"],
      },
      { status: 500 },
    );
  }
};
