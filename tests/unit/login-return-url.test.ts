import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const state = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  listAuthMethods: vi.fn(),
}));

vi.mock("$lib/utils", async () => {
  const actual = await vi.importActual<any>("$lib/utils");
  return {
    ...actual,
    validateData: vi.fn().mockResolvedValue({
      formData: { email: "pro@example.com", password: "safe-password" },
      errors: null,
    }),
  };
});
vi.mock("$lib/schemas", () => ({ loginUserSchema: {} }));
vi.mock("$lib/server/rateLimit", () => ({
  RATE_LIMITS: { login: {} },
  checkRateLimit: vi.fn(() => ({ allowed: true, resetIn: 0 })),
}));

import { actions, load } from "../../src/routes/login/+page.server";

function event(urlValue: string) {
  const cookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
  return {
    request: new Request(urlValue, { method: "POST", body: new FormData() }),
    locals: {
      clientIp: "127.0.0.1",
      pb: {
        collection: vi.fn(() => ({
          authWithPassword: state.authWithPassword,
          listAuthMethods: state.listAuthMethods,
        })),
      },
    },
    fetch: vi.fn(),
    url: new URL(urlValue),
    cookies,
  };
}

describe("dedicated login continuation", () => {
  beforeEach(() => {
    state.authWithPassword.mockReset().mockResolvedValue(undefined);
    state.listAuthMethods.mockReset().mockResolvedValue({
      oauth2: {
        providers: [
          {
            name: "google",
            authUrl: "https://accounts.google.com/auth?redirect_uri=",
            state: "provider-state",
            codeVerifier: "provider-verifier",
          },
        ],
      },
    });
  });

  it("passes only a validated continuation to both rendered login form actions", () => {
    const returnUrl = "/oauth/authorize?request=oauth_request_1234567890";
    expect(
      load({
        url: new URL(
          `https://stocknear.com/login?returnUrl=${encodeURIComponent(returnUrl)}`,
        ),
      } as any),
    ).toEqual({ loginReturnUrl: returnUrl });
    expect(
      load({
        url: new URL(
          "https://stocknear.com/login?returnUrl=https://evil.example/callback",
        ),
      } as any),
    ).toEqual({ loginReturnUrl: "/" });

    const source = readFileSync(
      new URL("../../src/routes/login/+page.svelte", import.meta.url),
      "utf8",
    );
    expect(source).toContain("action={loginAction}");
    expect(source).toContain("returnUrl={encodedReturnUrl}");
    expect(source).toContain("?/login&returnUrl=${encodedReturnUrl}");
    expect(source).toContain("window.location.assign(target.href)");
  });

  it("returns password login to the exact same-origin authorization request", async () => {
    const returnUrl = "/oauth/authorize?request=oauth_request_1234567890";
    await expect(
      actions.login(
        event(
          `https://stocknear.com/login?returnUrl=${encodeURIComponent(returnUrl)}`,
        ) as any,
      ),
    ).rejects.toMatchObject({ status: 303, location: returnUrl });
  });

  it("rejects an external password-login continuation", async () => {
    await expect(
      actions.login(
        event(
          "https://stocknear.com/login?returnUrl=https://evil.example/callback",
        ) as any,
      ),
    ).rejects.toMatchObject({ status: 303, location: "/" });
  });

  it("stores the same validated continuation for social login", async () => {
    const returnUrl = "/oauth/authorize?request=oauth_request_1234567890";
    const current = event(
      `https://stocknear.com/login?returnUrl=${encodeURIComponent(returnUrl)}`,
    );
    const form = new FormData();
    form.set("provider", "google");
    current.request = new Request(current.url, { method: "POST", body: form });

    await expect(actions.oauth2(current as any)).rejects.toMatchObject({
      status: 303,
    });
    expect(current.cookies.set).toHaveBeenCalledWith(
      "returnUrl",
      returnUrl,
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(current.cookies.set).toHaveBeenCalledWith(
      "path",
      returnUrl,
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
  });
});
