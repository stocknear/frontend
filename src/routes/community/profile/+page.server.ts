import { redirect, error } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { pb, user } = locals;
  if (!pb.authStore.isValid) {
    redirect(303, "/login");
  }

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

  const getModerators = async () => {
    let output;
    try {
      output = await pb.collection("moderators").getFullList({
        expand: "user",
      });
    } catch (e) {
      output = [];
    }
    return output;
  };

  const getUserStats = async () => {
    let output;

    try {
      const getNumberOfPosts = await pb.collection("posts").getList(1, 1, {
        filter: `user="${user?.id}"`,
      });
      const numberOfPosts = getNumberOfPosts?.totalItems;

      const getNumberOfComments = await pb
        .collection("comments")
        .getList(1, 1, {
          filter: `user="${user?.id}"`,
        });
      const numberOfComments = getNumberOfComments?.totalItems;

      output = { numberOfPosts, numberOfComments };
    } catch (e) {
      output = { numberOfPosts: 0, numberOfComments: 0 };
    }

    return output;
  };

  return {
    getSubscriptionData: await getSubscriptionData(),
    getModerators: await getModerators(),
    getUserStats: await getUserStats(),
  };
};

export const actions = {
  cancelSubscription: async ({ request, locals }) => {
    const formData = await request?.formData();

    const apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY;
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
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(302, "/community/profile");
  },

  reactivateSubscription: async ({ request, locals }) => {
    const formData = await request?.formData();

    const apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY;
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
    } catch (err) {
      console.log("Error: ", err);
      error(err.status, err.message);
    }

    redirect(302, "/community/profile");
  },

  changeSubscription: async ({ request, locals }) => {
    const formData = await request?.formData();

    const apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY;
    const subscriptionId = formData?.get("subscriptionId");

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
            variant_id: import.meta.env.VITE_LEMON_SQUEEZY_ANNUAL_VARIANT_ID, // Change from monthly to annually plan
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

    redirect(302, "/community/profile");
  },
};
