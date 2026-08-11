import { redirect, fail } from "@sveltejs/kit";
import { LEMON_SQUEEZY_API_KEY } from "$env/static/private";
import {
  getMcpAccount,
  revokeMcpToken,
  rotateMcpToken,
  unlinkMcpOAuth,
} from "$lib/server/mcpAccount";

const setPrivateNoStore = (setHeaders) => {
  setHeaders({
    "cache-control": "private, no-store, max-age=0",
    pragma: "no-cache",
  });
};

export const _subscriptionIdFromPayment = (record) => {
  const payload = record?.data;
  const candidates = [
    payload?.data?.type === "subscriptions" ? payload?.data?.id : null,
    payload?.data?.attributes?.first_subscription_item?.subscription_id,
    payload?.data?.attributes?.first_order_item?.subscription_id,
  ];
  return (
    candidates.find(
      (value) => typeof value === "string" && /^\d+$/.test(value),
    ) ?? null
  );
};

const getOwnedSubscriptionId = async (locals) => {
  if (!locals.pb.authStore.isValid || !locals.user?.id) return null;
  const payments = await locals.pb.collection("payments").getList(1, 20, {
    filter: `user="${locals.user.id}"`,
    sort: "-created",
  });
  return payments.items.map(_subscriptionIdFromPayment).find(Boolean) ?? null;
};

const updateLemonSubscription = async (subscriptionId, method, attributes) => {
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
      },
      body: attributes
        ? JSON.stringify({
            data: { type: "subscriptions", id: subscriptionId, attributes },
          })
        : undefined,
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok)
    throw new Error(`Lemon Squeezy returned ${response.status}`);
};

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
          toDelete.map((item) =>
            pb.collection("pushSubscription").delete(item?.id),
          ),
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
    const userDiscordId = (
      await pb.collection("users")?.listExternalAuths(pb?.authStore?.model?.id)
    )?.find((item) => item?.provider === "discord")?.providerId;

    return !!userDiscordId;
  };

  const getMcpAccountData = async () => {
    if (user?.tier !== "Pro") return { account: null, unavailable: false };
    try {
      return {
        account: await getMcpAccount(pb),
        unavailable: false,
      };
    } catch (err) {
      console.warn("MCP account status unavailable", {
        status:
          typeof err === "object" && err !== null && "status" in err
            ? (err as { status?: unknown }).status
            : undefined,
      });
      return { account: null, unavailable: true };
    }
  };

  const [
    subscriptionData,
    pushSubscriptionData,
    discordAccount,
    mcpAccountData,
  ] = await Promise.all([
    getSubscriptionData(),
    getPushSubscriptionData(),
    getDiscordAccount(),
    getMcpAccountData(),
  ]);

  return {
    getSubscriptionData: subscriptionData,
    getPushSubscriptionData: pushSubscriptionData,
    getDiscordAccount: discordAccount,
    mcpAccount: mcpAccountData.account,
    mcpAccountUnavailable: mcpAccountData.unavailable,
  };
};

export const actions = {
  generateMcpToken: async ({ locals, setHeaders }) => {
    setPrivateNoStore(setHeaders);
    if (!locals.pb.authStore.isValid) {
      return fail(401, { mcpErrorCode: "sign_in" });
    }
    try {
      const created = await rotateMcpToken(locals.pb);
      return {
        mcpTokenGenerated: true,
        mcpRawToken: created.token,
        mcpTokenInfo: created.tokenInfo,
      };
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      if (status === 403) {
        return fail(403, {
          mcpErrorCode: "pro_required",
        });
      }
      return fail(502, {
        mcpErrorCode: "unavailable",
      });
    }
  },

  revokeMcpToken: async ({ locals, setHeaders }) => {
    setPrivateNoStore(setHeaders);
    if (!locals.pb.authStore.isValid) {
      return fail(401, { mcpErrorCode: "sign_in" });
    }
    try {
      await revokeMcpToken(locals.pb);
      return { mcpTokenRevoked: true };
    } catch {
      return fail(502, {
        mcpErrorCode: "unavailable",
      });
    }
  },

  unlinkMcpOAuth: async ({ locals, setHeaders }) => {
    setPrivateNoStore(setHeaders);
    if (!locals.pb.authStore.isValid) {
      return fail(401, { mcpErrorCode: "sign_in" });
    }
    try {
      await unlinkMcpOAuth(locals.pb);
      return { mcpOAuthUnlinked: true };
    } catch {
      return fail(502, {
        mcpErrorCode: "unavailable",
      });
    }
  },

  cancelSubscription: async ({ locals }) => {
    if (!locals.pb.authStore.isValid)
      return fail(401, { subscriptionError: true });
    try {
      const subscriptionId = await getOwnedSubscriptionId(locals);
      if (!subscriptionId) return fail(404, { subscriptionError: true });
      await updateLemonSubscription(subscriptionId, "DELETE");
    } catch {
      return fail(502, { subscriptionError: true });
    }
    redirect(302, "/profile");
  },

  reactivateSubscription: async ({ locals }) => {
    if (!locals.pb.authStore.isValid)
      return fail(401, { subscriptionError: true });
    try {
      const subscriptionId = await getOwnedSubscriptionId(locals);
      if (!subscriptionId) return fail(404, { subscriptionError: true });
      await updateLemonSubscription(subscriptionId, "PATCH", {
        cancelled: false,
      });
    } catch {
      return fail(502, { subscriptionError: true });
    }
    redirect(302, "/profile");
  },

  changeSubscription: async ({ request, locals }) => {
    if (!locals.pb.authStore.isValid)
      return fail(401, { subscriptionError: true });
    const formData = await request?.formData();
    const newPlan = formData?.get("newPlan");
    const variants = {
      plusAnnual: import.meta.env.VITE_LEMON_SQUEEZY_PLUS_ANNUAL_VARIANT_ID,
      proAnnual: import.meta.env.VITE_LEMON_SQUEEZY_PRO_ANNUAL_VARIANT_ID,
    };
    const variantID =
      newPlan === "plusAnnual"
        ? variants.plusAnnual
        : newPlan === "proAnnual"
          ? variants.proAnnual
          : "";
    if (!variantID) {
      return fail(400, { subscriptionError: true });
    }

    try {
      const subscriptionId = await getOwnedSubscriptionId(locals);
      if (!subscriptionId) return fail(404, { subscriptionError: true });
      await updateLemonSubscription(subscriptionId, "PATCH", {
        variant_id: variantID,
      });
    } catch {
      return fail(502, { subscriptionError: true });
    }

    redirect(302, "/profile");
  },

  oauth2: async ({ url, locals, request, cookies }) => {
    const authMethods = (
      await locals?.pb?.collection("users")?.listAuthMethods()
    )?.oauth2;

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
