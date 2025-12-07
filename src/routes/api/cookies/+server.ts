import type { RequestHandler } from "./$types";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp?: number;
}

export const POST = (async ({ request, cookies }) => {
  let output = "error";

  try {
    const data: CookieConsent = await request.json();

    // Validate consent data
    if (typeof data.necessary !== "boolean" ||
        typeof data.analytics !== "boolean" ||
        typeof data.marketing !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid consent data" }), {
        status: 400,
      });
    }

    // Ensure necessary is always true
    const consentData: CookieConsent = {
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      timestamp: data.timestamp || Date.now(),
    };

    cookies.set("cookie-consent", JSON.stringify(consentData), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 Year consent
    });

    output = "success";
  } catch (e) {
    console.log(e);
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
