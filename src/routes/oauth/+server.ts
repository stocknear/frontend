import { redirect } from "@sveltejs/kit";



export const GET = async ({ locals, url, cookies }) => {
  //console.log(url.searchParams);
  const redirectURL = `${url.origin}/oauth`;


  let expectedState = cookies?.get("state");
  let expectedVerifier = cookies?.get("verifier");
  let providerSelected = cookies?.get("provider");

  const state = await url.searchParams.get("state");
  const code = await url.searchParams.get("code");


  //as a side effect this will generate a new code verifier, hence why we need to pass the verifier back in through the cookie
  const authMethods = (await locals.pb?.collection("users")?.listAuthMethods())?.oauth2;

  if (!authMethods?.providers) {
    console.log("No Auth Providers");
    redirect(301, "/register");
  }

 const targetItem = authMethods?.providers?.findIndex(
      (item) => item?.name === providerSelected,
    );

  const provider = authMethods?.providers[targetItem];

  if (!provider) {
    console.log("Provider Not Found");
    redirect(301, "/register");
  }

  if (expectedState !== state) {
    console.log("Returned State Does not Match Expected", expectedState, state);
    redirect(301, "/register");
  }

  try {
    //

    const userLogin = await locals.pb
      ?.collection("users")
      .authWithOAuth2Code(provider.name, code, expectedVerifier, redirectURL);

      if (userLogin?.meta?.isNew) {
        await locals.pb.collection("users").update(userLogin?.record?.id, {
          credits: 10,
        })
      }
    
  } catch (err) {
    console.log("Error logging in with OAuth2 user", err);
    redirect(302, "/register");
  }

  // Get return URL from cookie and validate it
  const returnUrl = cookies?.get("returnUrl");
  cookies.delete("returnUrl", { path: "/" });
  
  if (returnUrl) {
    // Validate the return URL to ensure it's safe
    try {
      const targetUrl = new URL(returnUrl, url.origin);
      if (targetUrl.origin === url.origin) {
        redirect(302, targetUrl.pathname + targetUrl.search);
      }
    } catch {
      // Invalid URL, redirect to home
    }
  }
  
  // Fallback to path cookie or home
  if (cookies?.get("path")) {
    redirect(301, cookies?.get("path"));
  } else {
    redirect(302, "/");
  }

 
};
