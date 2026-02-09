import { error, fail, redirect } from "@sveltejs/kit";
import { validateData } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";


export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user } = locals;

  const getAllStrategies = async () => {
    let output = [];
    if (user?.tier === 'Pro') {

   
     try {
        output = await pb.collection("coveredCallScreener").getFullList({
        filter: `user="${user?.id}"`,
        });
            output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));

    }
    catch(e) {
        output = [];
    }
     }
     else {
      output = []
     }


    return output;
  };


  const getScreenerData = async () => {
    const subscriber = user?.tier === "Pro" ? "Pro" : "Free";
    const postData = { selectedDates: [], subscriber };
    const response = await fetch(apiURL + "/covered-call-screener-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();

    return output;
  };


  // Make sure to return a promise
  return {
    getScreenerData: await getScreenerData(),
    getAllStrategies: await getAllStrategies(),
  };
};




export const actions = {
  login: async ({ request, locals }) => {
    const { formData, errors } = await validateData(
      await request.formData(),
      loginUserSchema
    );

    if (errors) {
      return fail(400, {
        data: formData,
        errors: errors.fieldErrors,
      });
    }

    try {
      await locals.pb
        .collection("users")
        .authWithPassword(formData.email, formData.password);

    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(303, "/");
  },

  register: async ({ locals, request }) => {
    const { formData, errors } = await validateData(
      await request.formData(),
      registerUserSchema
    );

    if (errors) {
      return fail(400, {
        data: formData,
        errors: errors.fieldErrors,
      });
    }

    try {
      let newUser = await locals.pb.collection("users").create(formData);

      await locals.pb.collection("users").requestVerification(formData.email);
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    try {
      await locals.pb
        .collection("users")
        .authWithPassword(formData.email, formData.password);
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(303, "/");
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

    cookies.set("path", "/", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60,
    });

    redirect(302, authProviderRedirect);
  },
};
