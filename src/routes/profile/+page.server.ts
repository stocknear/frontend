import { redirect, error } from "@sveltejs/kit";
import { LEMON_SQUEEZY_API_KEY } from "$env/static/private";

export const load = async ({ locals }) => {
  const { pb, user } = locals;
  if (!pb.authStore.isValid) {
    redirect(303, "/login");
  }



const getPushSubscriptionData = async () => {
  let output = {};
  try {
    output = await pb.collection("pushSubscription").getFullList({
      filter: `user="${user?.id}"`,
      sort: "-created", // Sorts newest first
    });

    if (output?.length > 1) {
      const [, ...toDelete] = output; // Keep the first item, delete the rest
      await Promise.all(
        toDelete.map((item) => pb.collection("pushSubscription").delete(item?.id))
      );
    }
  } catch (err) {
    console.log(err);
  }

  return output?.at(0) || null; // Return only the latest item
};


  const getSubscriptionData = async () => {
    const output =
      (
        await pb.collection("payments").getFullList({
          filter: `user="${user.id}" `,
          sort: "-created",
        })
      )?.at(0)?.data?.data?.attributes ?? {};

    //console.log(output)

    return output;
  };

  const getDiscordAccount = async () => {
    const userDiscordId = (await pb.collection('users')
      ?.listExternalAuths(pb?.authStore?.model?.id))
      ?.find(item => item?.provider === 'discord')?.providerId;
    
    
    return !!userDiscordId;
  };
  


  const [subscriptionData, pushSubscriptionData, discordAccount] = await Promise.all([
    getSubscriptionData(),
    getPushSubscriptionData(),
    getDiscordAccount(),
  ]);

  return {
    getSubscriptionData: subscriptionData,
    getPushSubscriptionData: pushSubscriptionData,
    getDiscordAccount: discordAccount,
  };

};

export const actions = {
  cancelSubscription: async ({ request, locals }) => {
    const formData = await request?.formData();

    const apiKey = LEMON_SQUEEZY_API_KEY;
    const subscriptionId = formData?.get("subscriptionId");

    try {
      const url = `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`;
      const headers = {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      };

      const response = await fetch(url, {
        method: "DELETE",
        headers: headers,
      });

      console.log(await response.json());

    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(302, "/profile");
  },

  reactivateSubscription: async ({ request }) => {
    const formData = await request?.formData();

    const apiKey = LEMON_SQUEEZY_API_KEY;
    const subscriptionId = formData?.get("subscriptionId");

    try {
      const url = `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`;
      const headers = {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      };

      const payload = {
        data: {
          type: "subscriptions",
          id: `${subscriptionId}`,
          attributes: {
            cancelled: false,
          },
        },
      };

      const response = await fetch(url, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(payload),
      });

      console.log(await response.json());

    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(302, "/profile");
  },

  changeSubscription: async ({ request }) => {
    const formData = await request?.formData();

    const apiKey = LEMON_SQUEEZY_API_KEY;
    const subscriptionId = formData?.get("subscriptionId");
    const newPlan = formData?.get("newPlan")

    const variantID = newPlan === 'plusAnnual' ? import.meta.env.VITE_LEMON_SQUEEZY_PLUS_ANNUAL_VARIANT_ID : newPlan === 'proAnnual' ? import.meta.env.VITE_LEMON_SQUEEZY_PRO_ANNUAL_VARIANT_ID : '';

    try {
      const url = `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`;
      const headers = {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      };

      // Create the data payload
      const payload = {
        data: {
          type: "subscriptions",
          id: subscriptionId,
          attributes: {
            variant_id: variantID, // Change from monthly to annually plan
          },
        },
      };

      const response = await fetch(url, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(payload),
      });

      console.log(await response.json());
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(302, "/profile");
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
