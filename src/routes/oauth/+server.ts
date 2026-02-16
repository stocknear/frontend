import { redirect } from "@sveltejs/kit";
import { validateReturnUrl } from "$lib/utils";
import { SIGNUP_COOKIE } from "$lib/constants/tracking";

const REGISTER_STEP_2_URL = "/register?step=2";

function clearOAuthCookies(cookies: any) {
  cookies.delete("state", { path: "/" });
  cookies.delete("verifier", { path: "/" });
  cookies.delete("provider", { path: "/" });
}

export const GET = async ({ locals, url, cookies }) => {
  const redirectURL = `${url.origin}/oauth`;

  const expectedState = cookies?.get("state");
  const expectedVerifier = cookies?.get("verifier");
  const providerSelected = cookies?.get("provider");

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  const authMethods = (
    await locals.pb?.collection("users")?.listAuthMethods()
  )?.oauth2;

  if (!authMethods?.providers) {
    clearOAuthCookies(cookies);
    throw redirect(302, "/register");
  }

  const provider = authMethods.providers.find(
    (item) => item?.name === providerSelected,
  );

  if (
    !provider ||
    !code ||
    !expectedState ||
    !expectedVerifier ||
    expectedState !== state
  ) {
    clearOAuthCookies(cookies);
    throw redirect(302, "/register");
  }

  let isNewUser = false;

  try {
    const userLogin = await locals.pb
      .collection("users")
      .authWithOAuth2Code(provider.name, code, expectedVerifier, redirectURL);

    isNewUser = Boolean(userLogin?.meta?.isNew);

    // Don't block signup completion if welcome credits update fails.
    if (isNewUser && userLogin?.record?.id) {
      // Signal GTM conversion tracking (httpOnly — cannot be spoofed by client JS)
      cookies.set(SIGNUP_COOKIE, "1", {
        path: "/",
        maxAge: 120,
        httpOnly: true,
        sameSite: "lax",
        secure: !import.meta.env.DEV,
      });

      try {
        await locals.pb.collection("users").update(userLogin.record.id, {
          credits: 10,
        });
      } catch (creditsErr) {
        console.warn("Failed to set OAuth welcome credits", creditsErr);
      }
    }
  } catch (err) {
    console.log("Error logging in with OAuth2 user", err);
    clearOAuthCookies(cookies);
    throw redirect(302, "/register");
  }

  clearOAuthCookies(cookies);

  // New OAuth users must finish plan selection on register step 2.
  if (isNewUser) {
    cookies.delete("returnUrl", { path: "/" });
    cookies.delete("path", { path: "/" });
    throw redirect(302, REGISTER_STEP_2_URL);
  }

  const returnUrl = cookies?.get("returnUrl");
  cookies.delete("returnUrl", { path: "/" });
  if (returnUrl) {
    throw redirect(302, validateReturnUrl(returnUrl, url.origin));
  }

  const pathCookie = cookies?.get("path");
  cookies.delete("path", { path: "/" });
  if (pathCookie) {
    throw redirect(302, validateReturnUrl(pathCookie, url.origin));
  }

  throw redirect(302, "/");
};
