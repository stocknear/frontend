import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  create: vi.fn(),
  requestVerification: vi.fn(),
  authWithPassword: vi.fn(),
  update: vi.fn(),
}));

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "registration-test-secret-0123456789",
}));

vi.mock("$lib/utils", () => ({
  checkDisposableEmail: vi.fn().mockResolvedValue("false"),
  validateReturnUrl: vi.fn((value: string) => value),
  validateData: vi.fn().mockResolvedValue({
    formData: {
      email: "new-user@example.com",
      password: "Correct-password1!",
      passwordConfirm: "Correct-password1!",
    },
    errors: null,
  }),
}));
vi.mock("$lib/schemas", () => ({
  loginUserSchema: {},
  registerUserSchema: {},
}));
vi.mock("$lib/server/rateLimit", () => ({
  RATE_LIMITS: { register: {} },
  checkRateLimit: vi.fn(() => ({ allowed: true, resetIn: 0 })),
}));

import { registerAction } from "$lib/server/authActions";
import { actions as registerPageActions } from "../../src/routes/register/+page.server";

function event() {
  const collection = vi.fn((name: string) => {
    if (name !== "users") throw new Error(`Unexpected collection: ${name}`);
    return {
      create: state.create,
      requestVerification: state.requestVerification,
      authWithPassword: state.authWithPassword,
      update: state.update,
    };
  });
  return {
    locals: { clientIp: "127.0.0.1", pb: { collection } },
    request: new Request("http://localhost/register", {
      method: "POST",
      body: new FormData(),
    }),
    url: new URL("http://localhost/register"),
    cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
    fetch: vi.fn(),
  };
}

describe("direct PocketBase registration", () => {
  beforeEach(() => {
    state.create.mockReset().mockResolvedValue({ id: "a".repeat(15), credits: 10 });
    state.requestVerification.mockReset().mockResolvedValue(undefined);
    state.authWithPassword.mockReset().mockResolvedValue(undefined);
    state.update.mockReset().mockResolvedValue(undefined);
  });

  it("creates and initializes popup registrations without a private service route", async () => {
    await expect(registerAction(event() as any)).rejects.toMatchObject({
      status: 302,
      location: "/register?step=2",
    });

    expect(state.create).toHaveBeenCalledWith({
      email: "new-user@example.com",
      password: "Correct-password1!",
      passwordConfirm: "Correct-password1!",
    });
    expect(state.requestVerification).toHaveBeenCalledWith(
      "new-user@example.com",
    );
    expect(state.authWithPassword).toHaveBeenCalledWith(
      "new-user@example.com",
      "Correct-password1!",
    );
    expect(state.update).toHaveBeenCalledWith("a".repeat(15), { credits: 10 });
  });

  it("creates and initializes dedicated-page registrations directly", async () => {
    await expect(
      registerPageActions.register(event() as any),
    ).rejects.toMatchObject({ status: 302, location: "/register?step=2" });

    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it("preserves the existing registration failure when follow-up work fails", async () => {
    state.requestVerification.mockRejectedValue(new Error("smtp unavailable"));
    state.authWithPassword.mockRejectedValue(new Error("auth unavailable"));

    await expect(registerAction(event() as any)).resolves.toMatchObject({
      status: 400,
    });
    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it("sets the existing welcome credit balance after registration", async () => {
    state.create.mockResolvedValue({ id: "a".repeat(15), credits: 0 });
    await expect(registerAction(event() as any)).rejects.toMatchObject({
      status: 302,
      location: "/register?step=2",
    });
    expect(state.update).toHaveBeenCalledWith("a".repeat(15), { credits: 10 });
  });
});
