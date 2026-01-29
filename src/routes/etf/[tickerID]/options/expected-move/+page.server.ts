import { error, fail, redirect } from "@sveltejs/kit";
import { validateData, checkDisposableEmail, validateReturnUrl } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const isPro = user?.tier === "Pro";

  const getData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    const response = await fetch(apiURL + "/options-expected-move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    // For non-Pro users, keep all expiration dates visible but only include data for the first one
    if (!isPro && output?.expirations?.length > 0) {
      output.expirations = output.expirations?.map((item, index) => {
        if (index === 0) {
          return item; // First expiration keeps all data
        }
        // Other expirations only keep the expiration date for the dropdown list
        return { expiration: item?.expiration };
      });
    }

    return output;
  };

  return {
    getData: await getData(),
  };
};

export const actions = {
    login: async ({ request, locals, url, cookies }) => {
        const { formData, errors } = await validateData(
            await request.formData(),
            loginUserSchema
        );

        if (errors) {
            return fail(400, {
                data: formData,
                errors: errors.fieldErrors
            });
        }

        try {
            await locals.pb.collection('users')
                .authWithPassword(formData.email, formData.password);
        } catch (err: any) {
            console.log('Error: ', err);
            throw error(err.status || 500, err.message || 'Login failed');
        }

        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/';

        cookies.delete('returnUrl', { path: '/' });
        throw redirect(302, validateReturnUrl(returnUrl, url.origin));
    },

    register: async ({ locals, request, url, cookies }) => {
        const { formData, errors } = await validateData(
            await request.formData(),
            registerUserSchema
        );

        if (errors) {
            return fail(400, {
                data: formData,
                errors: errors.fieldErrors
            });
        }

        const isEmailDisposable = await checkDisposableEmail(formData?.email);
        if (isEmailDisposable === 'true') {
            throw error(400, 'Disposable Email Addresses not allowed!');
        }

        try {
            const newUser = await locals.pb.collection('users').create(formData);
            await locals.pb.collection('users').update(newUser?.id, {
                credits: 10
            });
            await locals.pb.collection('users').requestVerification(formData.email);
            await locals.pb.collection('users')
                .authWithPassword(formData.email, formData.password);
        } catch (err: any) {
            console.log('Error: ', err);
            throw error(err.status || 500, err.message || 'Registration failed');
        }

        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/profile';

        cookies.delete('returnUrl', { path: '/' });
        throw redirect(302, validateReturnUrl(returnUrl, url.origin));
    },

    oauth2: async ({ url, locals, request, cookies }) => {
        const path = url?.href?.replace("/oauth2","")
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

        cookies.set("path", path, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60,
        });

        redirect(302, authProviderRedirect);
    },
};
