import { get } from "svelte/store";
import { isOpen, isWeekend, isHoliday } from "$lib/store";
import {
  buildAuthenticatedWsUrl,
  getAuthenticatedWsClosePolicy,
  invalidateWsToken,
} from "$lib/websocket";

/**
 * Shared realtime quote feed for small, visible symbol sets.
 *
 * One WebSocket per page, refcounted across consumers: the first attach opens
 * the connection, the last detach closes it, and every attach re-syncs the
 * server-side room list with the union of all subscribed symbols. The scope
 * follows the product's market rules (same gates as the stock/index/ETF
 * layouts): `/price-data` while the market is open, `/pre-post-quote` while
 * closed on a non-weekend, non-holiday, nothing on weekends or holidays.
 *
 * Both scopes are normalized to one LiveQuote shape so consumers never need
 * to know which one is active:
 *   - price-data  -> { symbol, price: avgPrice ?? lp, changesPercentage: null, time }
 *   - pre-post    -> { symbol, price, changesPercentage, time }
 * `changesPercentage` is null on the price-data path because the raw tick has
 * no reference close; consumers compute it against their REST snapshot with
 * computeLiveChangePercent (the calculateChange baseLine math).
 *
 * Without a wsURL, on the server, or on weekends the attach is a silent
 * no-op: cards simply keep their static values.
 */

type ScopeMode = "price" | "prepost" | "off";

const SCOPES: Record<Exclude<ScopeMode, "off">, string> = {
  price: "/price-data",
  prepost: "/pre-post-quote",
};

export type LiveQuote = {
  symbol: string;
  price: number | null;
  changesPercentage: number | null;
  time: string | number | null;
};

export type LiveQuotesHandle = {
  detach: () => void;
};

type QuoteCallback = (quote: LiveQuote) => void;

type QuoteConnection = {
  key: string;
  wsURL: string;
  mode: ScopeMode;
  subscriptions: Map<string, Set<QuoteCallback>>;
  socket: WebSocket | null;
  // The scope an in-flight connect() is targeting, so a mode flip can cancel
  // exactly that attempt without stomping a newer one.
  connectingFor: ScopeMode | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempt: number;
  ignoredSockets: Set<WebSocket>;
  unsubscribeStores: () => void;
};

const connections = new Map<string, QuoteConnection>();

const NOOP_HANDLE: LiveQuotesHandle = { detach: () => {} };

function toFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveMode(): ScopeMode {
  if (get(isOpen)) {
    return "price";
  }
  if (!get(isWeekend) && !get(isHoliday)) {
    return "prepost";
  }
  return "off";
}

function subscriptionCount(conn: QuoteConnection): number {
  let count = 0;
  for (const callbacks of conn.subscriptions.values()) {
    count += callbacks.size;
  }
  return count;
}

function unionSymbols(conn: QuoteConnection): string[] {
  return Array.from(conn.subscriptions.keys()).sort();
}

function clearReconnectTimer(conn: QuoteConnection) {
  if (conn.reconnectTimer !== null) {
    clearTimeout(conn.reconnectTimer);
    conn.reconnectTimer = null;
  }
}

function ignoreAndCloseSocket(conn: QuoteConnection) {
  clearReconnectTimer(conn);
  conn.connectingFor = null;
  if (!conn.socket) {
    return;
  }
  conn.ignoredSockets.add(conn.socket);
  const socket = conn.socket;
  conn.socket = null;
  try {
    socket.close(1000, "Client closed connection");
  } catch {
    // Closing a socket that already errored can throw; the connection state is
    // already torn down above, so there is nothing left to do.
  }
}

function sendSymbols(conn: QuoteConnection) {
  if (!conn.socket || conn.socket.readyState !== WebSocket.OPEN) {
    return;
  }
  const symbols = unionSymbols(conn);
  if (symbols.length === 0) {
    return;
  }
  const message = conn.mode === "price" ? symbols : { tickers: symbols };
  conn.socket.send(JSON.stringify(message));
}

function handleMessage(conn: QuoteConnection, raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const symbol = String(record.symbol ?? "").trim().toUpperCase();
    if (!symbol) {
      continue;
    }
    const callbacks = conn.subscriptions.get(symbol);
    if (!callbacks || callbacks.size === 0) {
      continue;
    }
    const quote: LiveQuote = {
      symbol,
      price: toFinite(record.avgPrice) ?? toFinite(record.lp) ?? toFinite(record.price),
      changesPercentage: toFinite(record.changesPercentage),
      time: record.time ?? null,
    };
    for (const callback of Array.from(callbacks)) {
      callback(quote);
    }
  }
}

function scheduleReconnect(
  conn: QuoteConnection,
  event?: Pick<CloseEvent, "code">,
) {
  clearReconnectTimer(conn);
  if (subscriptionCount(conn) === 0 || conn.mode === "off") {
    return;
  }

  const scope = SCOPES[conn.mode];
  const policy = getAuthenticatedWsClosePolicy(event, conn.reconnectAttempt);

  if (policy.invalidateToken) {
    invalidateWsToken(scope);
  }
  if (!policy.retry) {
    return;
  }

  conn.reconnectAttempt += 1;
  conn.reconnectTimer = setTimeout(() => {
    conn.reconnectTimer = null;
    connect(conn);
  }, policy.delayMs);
}

async function connect(conn: QuoteConnection) {
  if (conn.mode === "off" || subscriptionCount(conn) === 0) {
    return;
  }
  if (conn.connectingFor !== null || conn.reconnectTimer) {
    return;
  }
  if (
    conn.socket &&
    (conn.socket.readyState === WebSocket.CONNECTING ||
      conn.socket.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  const modeAtStart = conn.mode;
  conn.connectingFor = modeAtStart;
  try {
    const wsUrl = await buildAuthenticatedWsUrl(conn.wsURL, SCOPES[modeAtStart]);
    if (!wsUrl) {
      if (conn.connectingFor === modeAtStart) {
        conn.connectingFor = null;
        scheduleReconnect(conn);
      }
      return;
    }
    // The market state or the subscriber set can change while the token was
    // being fetched; only this attempt's scope owns the connectingFor flag,
    // so a newer attempt for another scope is never clobbered.
    if (conn.mode !== modeAtStart || subscriptionCount(conn) === 0) {
      if (conn.connectingFor === modeAtStart) {
        conn.connectingFor = null;
      }
      return;
    }
    if (
      conn.socket &&
      (conn.socket.readyState === WebSocket.CONNECTING ||
        conn.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const socket = new WebSocket(wsUrl);
    conn.socket = socket;

    socket.addEventListener("open", () => {
      clearReconnectTimer(conn);
      conn.reconnectAttempt = 0;
      if (conn.connectingFor === modeAtStart) {
        conn.connectingFor = null;
      }
      sendSymbols(conn);
    });

    socket.addEventListener("message", (event) => {
      if (typeof event?.data === "string") {
        handleMessage(conn, event.data);
      }
    });

    socket.addEventListener("close", (event) => {
      const wasCurrent = conn.socket === socket;
      if (wasCurrent) {
        conn.socket = null;
      }
      if (conn.connectingFor === modeAtStart) {
        conn.connectingFor = null;
      }

      if (conn.ignoredSockets.has(socket)) {
        conn.ignoredSockets.delete(socket);
        return;
      }

      // A close from a socket that already lost the slot to a newer one must
      // not schedule a reconnect for the live connection (or invalidate a
      // token it no longer uses).
      if (!wasCurrent) {
        return;
      }

      scheduleReconnect(conn, event);
    });

    socket.addEventListener("error", () => {
      if (conn.connectingFor === modeAtStart) {
        conn.connectingFor = null;
      }
      try {
        socket.close();
      } catch {
        // The close handler above still runs and schedules the reconnect.
      }
    });
  } catch (error) {
    if (conn.connectingFor === modeAtStart) {
      conn.connectingFor = null;
      scheduleReconnect(conn);
    }
  }
}

function syncMode(conn: QuoteConnection) {
  const mode = resolveMode();
  if (mode === conn.mode) {
    return;
  }
  conn.mode = mode;
  ignoreAndCloseSocket(conn);
  if (mode === "off") {
    return;
  }
  if (subscriptionCount(conn) > 0) {
    connect(conn);
  }
}

function closeConnection(conn: QuoteConnection) {
  clearReconnectTimer(conn);
  ignoreAndCloseSocket(conn);
  conn.unsubscribeStores();
  connections.delete(conn.key);
}

function ensureConnection(wsURL: string): QuoteConnection {
  const key = wsURL.trim().replace(/\/+$/, "");
  const existing = connections.get(key);
  if (existing) {
    return existing;
  }

  const conn: QuoteConnection = {
    key,
    wsURL: key,
    mode: "off",
    subscriptions: new Map(),
    socket: null,
    connectingFor: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    ignoredSockets: new Set(),
    unsubscribeStores: () => {},
  };

  // Svelte writable stores invoke the subscriber immediately on subscribe, so
  // the initial syncMode runs right here with the connection fully built.
  const unsubscribeOpen = isOpen.subscribe(() => syncMode(conn));
  const unsubscribeWeekend = isWeekend.subscribe(() => syncMode(conn));
  conn.unsubscribeStores = () => {
    unsubscribeOpen();
    unsubscribeWeekend();
  };

  connections.set(key, conn);
  return conn;
}

export function attachLiveQuotes(options: {
  wsURL?: string | null;
  symbols: string[];
  onQuote: QuoteCallback;
}): LiveQuotesHandle {
  if (typeof window === "undefined") {
    return NOOP_HANDLE;
  }

  const wsURL = String(options.wsURL ?? "").trim();
  if (!wsURL) {
    return NOOP_HANDLE;
  }

  const symbols = Array.from(
    new Set(
      (options.symbols ?? [])
        .map((symbol) => String(symbol).trim().toUpperCase())
        .filter(Boolean),
    ),
  );
  if (symbols.length === 0) {
    return NOOP_HANDLE;
  }

  const conn = ensureConnection(wsURL);
  for (const symbol of symbols) {
    let callbacks = conn.subscriptions.get(symbol);
    if (!callbacks) {
      callbacks = new Set();
      conn.subscriptions.set(symbol, callbacks);
    }
    callbacks.add(options.onQuote);
  }
  sendSymbols(conn);
  if (conn.mode !== "off" && !conn.socket) {
    connect(conn);
  }

  return {
    detach: () => {
      for (const symbol of symbols) {
        const callbacks = conn.subscriptions.get(symbol);
        if (!callbacks) {
          continue;
        }
        callbacks.delete(options.onQuote);
        if (callbacks.size === 0) {
          conn.subscriptions.delete(symbol);
        }
      }
      if (subscriptionCount(conn) === 0) {
        closeConnection(conn);
        return;
      }
      sendSymbols(conn);
    },
  };
}
