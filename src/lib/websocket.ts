type WsTokenCacheEntry = {
  expiresAt: number | null;
  token: string;
};

const WS_TOKEN_REFRESH_BUFFER_MS = 30_000;
const WS_TOKEN_FETCH_TIMEOUT_MS = 3_000;
const wsTokenCache = new Map<string, WsTokenCacheEntry>();
const wsTokenRequests = new Map<string, Promise<string | null>>();

export const WS_CLOSE_CODE_AUTH = 4001;
export const WS_CLOSE_CODE_CONNECTION_LIMIT = 4002;
export const WS_CLOSE_CODE_ORIGIN = 4003;
export const WS_CLOSE_CODE_RATE_LIMIT = 4008;

export type PublicWsClosePolicy = {
  delayMs: number;
  invalidateToken: boolean;
  retry: boolean;
};

function normalizeWsScope(scope: string): string {
  const trimmed = String(scope || "").trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function decodeWsTokenExpiry(token: string): number | null {
  try {
    const [payloadBase64] = token.split(".");
    if (!payloadBase64) {
      return null;
    }
    if (typeof atob !== "function") {
      return null;
    }

    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payloadText = atob(padded);
    const payload = JSON.parse(payloadText);
    return typeof payload?.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp
      : null;
  } catch {
    return null;
  }
}

export function buildWsUrl(
  wsURL: string | null | undefined,
  path: string,
  token: string | null | undefined,
): string | null {
  if (!wsURL || !path || !token) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = wsURL.endsWith("/") ? wsURL.slice(0, -1) : wsURL;
  return `${normalizedBase}${normalizedPath}?token=${encodeURIComponent(token)}`;
}

export async function fetchWsToken(
  scope: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedScope = normalizeWsScope(scope);
  const cachedEntry = wsTokenCache.get(normalizedScope);

  if (
    !forceRefresh &&
    cachedEntry?.token &&
    (
      cachedEntry.expiresAt === null ||
      cachedEntry.expiresAt - WS_TOKEN_REFRESH_BUFFER_MS > Date.now()
    )
  ) {
    return cachedEntry.token;
  }

  if (!forceRefresh) {
    const inFlightRequest = wsTokenRequests.get(normalizedScope);
    if (inFlightRequest) {
      return inFlightRequest;
    }
  }

  const tokenRequest = (async () => {
    try {
      const response = await fetch("/api/generate-ws-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scope: normalizedScope }),
        signal: AbortSignal.timeout(WS_TOKEN_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      const token =
        typeof result?.token === "string" && result.token.length > 0
          ? result.token
          : null;
      if (!token) {
        return null;
      }

      wsTokenCache.set(normalizedScope, {
        token,
        expiresAt: decodeWsTokenExpiry(token),
      });
      return token;
    } catch (error) {
      console.error("Failed to fetch WebSocket token:", error);
      return null;
    } finally {
      wsTokenRequests.delete(normalizedScope);
    }
  })();

  wsTokenRequests.set(normalizedScope, tokenRequest);
  return tokenRequest;
}

export function invalidateWsToken(scope: string): void {
  const normalizedScope = normalizeWsScope(scope);
  wsTokenCache.delete(normalizedScope);
  wsTokenRequests.delete(normalizedScope);
}

function withJitter(delayMs: number): number {
  const jitterRange = Math.max(100, Math.round(delayMs * 0.2));
  const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
  return Math.max(250, delayMs + jitter);
}

export function getPublicWsClosePolicy(
  event: Pick<CloseEvent, "code"> | { code?: number } | undefined,
  reconnectAttempt: number,
): PublicWsClosePolicy {
  const code = typeof event?.code === "number" ? event.code : 1006;

  if (code === 1000) {
    return {
      retry: false,
      invalidateToken: false,
      delayMs: 0,
    };
  }

  if (code === WS_CLOSE_CODE_AUTH) {
    return {
      retry: true,
      invalidateToken: true,
      delayMs: 500,
    };
  }

  if (code === WS_CLOSE_CODE_ORIGIN) {
    return {
      retry: false,
      invalidateToken: false,
      delayMs: 0,
    };
  }

  if (code === WS_CLOSE_CODE_CONNECTION_LIMIT) {
    return {
      retry: true,
      invalidateToken: false,
      delayMs: withJitter(30_000),
    };
  }

  if (code === WS_CLOSE_CODE_RATE_LIMIT) {
    return {
      retry: true,
      invalidateToken: false,
      delayMs: withJitter(60_000),
    };
  }

  const cappedAttempt = Math.max(0, Math.min(reconnectAttempt, 5));
  const baseDelayMs = 1_000 * 2 ** cappedAttempt;
  return {
    retry: true,
    invalidateToken: false,
    delayMs: withJitter(Math.min(baseDelayMs, 30_000)),
  };
}

export async function buildAuthenticatedWsUrl(
  wsURL: string | null | undefined,
  path: string,
  token: string | null | undefined,
): Promise<string | null> {
  if (token) {
    return buildWsUrl(wsURL, path, token);
  }

  const resolvedToken = await fetchWsToken(path);
  return buildWsUrl(wsURL, path, resolvedToken);
}
