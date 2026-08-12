import { error, fail, redirect } from "@sveltejs/kit";
import {
  completeMcpAuthorization,
  getMcpAuthorizationRequest,
  McpOAuthRequestError,
  parseOpaqueOAuthRequest,
} from "$lib/server/mcpOAuth";

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
};

const setPrivateHeaders = (
  setHeaders: (headers: Record<string, string>) => void,
) => setHeaders(privateHeaders);

const authorizationReturnUrl = (url: URL, request: string) =>
  `${url.pathname}?request=${encodeURIComponent(request)}`;

const isProUser = (user: { tier?: unknown } | null | undefined) =>
  user?.tier === "Pro";

const loadErrorCode = (cause: unknown) =>
  cause instanceof McpOAuthRequestError &&
  (cause.code === "invalid_request" || [400, 404, 410].includes(cause.status))
    ? "invalid_request"
    : "unavailable";

function requireRequest(url: URL): string {
  const request = parseOpaqueOAuthRequest(url.searchParams.get("request"));
  if (!request) throw error(400, "Invalid authorization request");
  return request;
}

export const load = async ({ locals, url, fetch, setHeaders }) => {
  setPrivateHeaders(setHeaders);
  const request = parseOpaqueOAuthRequest(url.searchParams.get("request"));
  if (!request) {
    return {
      request: null,
      authorization: null,
      userEmail: locals.user?.email ?? "",
      canApprove: false,
      oauthPageError: "invalid_request",
    };
  }
  let authorization;
  try {
    authorization = await getMcpAuthorizationRequest(fetch, request);
  } catch (cause) {
    return {
      request,
      authorization: null,
      userEmail: locals.user?.email ?? "",
      canApprove: false,
      oauthPageError: loadErrorCode(cause),
    };
  }

  if (!locals.pb.authStore.isValid || !locals.user?.id) {
    const returnUrl = authorizationReturnUrl(url, request);
    throw redirect(303, `/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }
  return {
    request,
    authorization,
    userEmail: locals.user.email ?? "",
    canApprove: isProUser(locals.user),
    oauthPageError: null,
  };
};

const complete =
  (decision: "approve" | "deny") =>
  async ({ locals, url, fetch, setHeaders }) => {
    setPrivateHeaders(setHeaders);
    const request = requireRequest(url);
    const userToken = locals.pb.authStore.token;
    if (!locals.pb.authStore.isValid || !locals.user?.id || !userToken) {
      const returnUrl = authorizationReturnUrl(url, request);
      throw redirect(303, `/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
    if (decision === "approve" && !isProUser(locals.user)) {
      return fail(403, { oauthError: "pro_required" });
    }
    try {
      const redirectUrl = await completeMcpAuthorization(
        fetch,
        request,
        userToken,
        decision,
      );
      throw redirect(303, redirectUrl);
    } catch (cause) {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "status" in cause &&
        Number((cause as { status?: unknown }).status) === 303
      )
        throw cause;
      if (
        cause instanceof McpOAuthRequestError &&
        (cause.code === "entitlement_ineligible" ||
          cause.code === "access_denied")
      )
        return fail(403, { oauthError: "pro_required" });
      if (
        cause instanceof McpOAuthRequestError &&
        (cause.code === "invalid_request" ||
          [400, 404, 410].includes(cause.status))
      )
        return fail(400, { oauthError: "invalid_request" });
      if (
        cause instanceof McpOAuthRequestError &&
        (cause.code === "temporarily_unavailable" ||
          cause.status === 429 ||
          cause.status >= 500)
      )
        return fail(503, { oauthError: "unavailable" });
      return fail(502, { oauthError: "unavailable" });
    }
  };

export const actions = {
  approve: complete("approve"),
  deny: complete("deny"),
};
