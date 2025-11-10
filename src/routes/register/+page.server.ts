import { error, fail, redirect } from "@sveltejs/kit";
import { registerUserSchema } from "$lib/schemas";
import { validateData, checkDisposableEmail} from "$lib/utils";



export const actions = {
  register: async ({ locals, request, fetch }) => {
    const requestFormData = await request.formData();
    const turnstileToken =
      requestFormData.get("cf-turnstile-response")?.toString() ?? "";

    const { formData, errors } = await validateData(
      requestFormData,
      registerUserSchema,
    );

    if (errors) {
      return fail(400, {
        data: formData,
        errors: errors.fieldErrors,
      });
    }

    if (!turnstileToken) {
      return fail(400, {
        data: formData,
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
          data: formData,
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
        data: formData,
        errors: {
          turnstile: [
            "Unable to verify Turnstile response. Please refresh and try again.",
          ],
        },
      });
    }

    const isEmailDisposable = await checkDisposableEmail(formData?.email);

    if (isEmailDisposable === "true") {
      error(400, "Disposable Email Addresses not allowed!");
    }

    //let username = generateUsername(formData.name.split(' ').join('')).toLowerCase();

    try {
       const newUser = await locals.pb.collection("users").create(formData);

      await locals.pb.collection("users").update(newUser?.id, {
        'credits': 10,
      });


      await locals.pb.collection("users").requestVerification(formData.email);
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
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
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(301, "/profile");
  },

   oauth2: async ({ url, locals, request, cookies }) => {
    const authMethods = (await locals?.pb
      ?.collection("users")
      ?.listAuthMethods())?.oauth2;


    const data = await request?.formData();
    const providerSelected = data?.get("provider");

    if (!authMethods) {
      return {
        authProviderRedirect: "",
        authProviderState: "",
      };
    }
    const redirectURL = `${url.origin}/oauth`;

    const targetItem = authMethods?.providers?.findIndex(
      (item) => item?.name === providerSelected,
    );
  

    const provider = authMethods.providers[targetItem];
    const authProviderRedirect = `${provider.authUrl}${redirectURL}`;
    const state = provider.state;
    const verifier = provider.codeVerifier;

    
    
    cookies.set("state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60,
    });

    cookies.set("verifier", verifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60,
    });

    cookies.set("provider", providerSelected, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60,
    });

    cookies.set("path", "/profile", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60,
    });

    redirect(301, authProviderRedirect);
  },
};
