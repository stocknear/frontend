import { env } from "$env/dynamic/private";

const DEFAULT_POCKETBASE_URL = "http://127.0.0.1:8090";
const REQUEST_TIMEOUT_MS = 8_000;

export class PocketBasePrivateError extends Error {
  constructor(
    public readonly status: number,
    message = "PocketBase private request failed",
  ) {
    super(message);
  }
}

function readPrivateConfig() {
  const key = env.POCKETBASE_FRONTEND_KEY?.trim();
  if (!key || key.length < 32) {
    throw new PocketBasePrivateError(
      503,
      "PocketBase private key is unavailable",
    );
  }

  const baseUrl = new URL(
    env.POCKETBASE_INTERNAL_URL?.trim() || DEFAULT_POCKETBASE_URL,
  );
  if (
    baseUrl.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "localhost"].includes(baseUrl.hostname) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new PocketBasePrivateError(
      503,
      "PocketBase private URL must be loopback HTTP",
    );
  }

  return { baseUrl, key };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function postPrivate<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { baseUrl, key } = readPrivateConfig();
  const response = await fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: "error",
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PocketBasePrivateError(response.ok ? 502 : response.status);
  }
  if (!response.ok) throw new PocketBasePrivateError(response.status);
  return payload as T;
}

export async function registerPocketBaseUser(input: {
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<{ id: string; email: string }> {
  const payload = await postPrivate<unknown>(
    "/api/stocknear/account/register",
    input,
  );
  if (
    !isObject(payload) ||
    Object.keys(payload).length !== 2 ||
    typeof payload.id !== "string" ||
    !/^[a-z0-9]{15}$/.test(payload.id) ||
    typeof payload.email !== "string"
  ) {
    throw new PocketBasePrivateError(502, "Invalid registration response");
  }
  return { id: payload.id, email: payload.email };
}

export async function adjustPocketBaseCredits(input: {
  userId: string;
  creditsDelta?: number;
  downloadCreditsDelta?: number;
}): Promise<{ userId: string; credits: number; downloadCredits: number }> {
  const payload = await postPrivate<unknown>(
    "/api/stocknear/account/credits/adjust",
    {
      userId: input.userId,
      creditsDelta: input.creditsDelta ?? 0,
      downloadCreditsDelta: input.downloadCreditsDelta ?? 0,
    },
  );
  if (
    !isObject(payload) ||
    Object.keys(payload).length !== 3 ||
    payload.userId !== input.userId ||
    !Number.isSafeInteger(payload.credits) ||
    (payload.credits as number) < 0 ||
    !Number.isSafeInteger(payload.downloadCredits) ||
    (payload.downloadCredits as number) < 0
  ) {
    throw new PocketBasePrivateError(502, "Invalid credit response");
  }
  return {
    userId: payload.userId,
    credits: payload.credits as number,
    downloadCredits: payload.downloadCredits as number,
  };
}

export async function applyPocketBaseBilling(input: {
  userId?: string;
  userEmail?: string;
  tier: "Free" | "Plus" | "Pro";
  lifetime: boolean;
  credits: number | null;
  freeTrial: boolean;
  paymentData: Record<string, unknown>;
}): Promise<void> {
  const payload = await postPrivate<unknown>(
    "/api/stocknear/account/billing/apply",
    input,
  );
  if (
    !isObject(payload) ||
    Object.keys(payload).length !== 6 ||
    typeof payload.userId !== "string" ||
    (input.userId !== undefined && payload.userId !== input.userId) ||
    typeof payload.paymentId !== "string" ||
    !new Set(["Free", "Plus", "Pro"]).has(String(payload.tier)) ||
    typeof payload.lifetime !== "boolean" ||
    !Number.isSafeInteger(payload.credits) ||
    (payload.credits as number) < 0 ||
    typeof payload.freeTrial !== "boolean"
  ) {
    throw new PocketBasePrivateError(502, "Invalid billing response");
  }
}
