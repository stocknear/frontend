import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachLiveQuotes } from "$lib/realtime/liveQuotes";
import { invalidateWsToken } from "$lib/websocket";

const stores = vi.hoisted(() => ({
  isOpen: undefined as never,
  isWeekend: undefined as never,
  isHoliday: undefined as never,
}));

vi.mock("$lib/store", async () => {
  const { writable } = await import("svelte/store");
  stores.isOpen = writable(false);
  stores.isWeekend = writable(false);
  stores.isHoliday = writable(false);
  return {
    isOpen: stores.isOpen,
    isWeekend: stores.isWeekend,
    isHoliday: stores.isHoliday,
  };
});

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;

  static instances: FakeWebSocket[] = [];
  static last: FakeWebSocket | null = null;

  readyState = FakeWebSocket.CONNECTING;
  url: string;
  sent: string[] = [];
  closed: { code: number; reason: string } | null = null;
  listeners: Record<string, Set<(event: unknown) => void>> = {};

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
    FakeWebSocket.last = this;
  }

  addEventListener(type: string, callback: (event: unknown) => void) {
    (this.listeners[type] ??= new Set()).add(callback);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close(code = 1000, reason = "") {
    this.readyState = FakeWebSocket.CLOSED;
    this.closed = { code, reason };
    for (const callback of this.listeners["close"] ?? []) {
      callback({ code, reason });
    }
  }

  _open() {
    this.readyState = FakeWebSocket.OPEN;
    for (const callback of this.listeners["open"] ?? []) {
      callback({});
    }
  }

  _message(raw: string) {
    for (const callback of this.listeners["message"] ?? []) {
      callback({ data: raw });
    }
  }

  _error() {
    for (const callback of this.listeners["error"] ?? []) {
      callback({});
    }
  }
}

const WS_URL = "ws://127.0.0.1:2000";

type Deferred = {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
};

function deferred(): Deferred {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const TOKEN_RESPONSE = {
  ok: true,
  json: async () => ({ token: "tok" }),
};

beforeEach(() => {
  FakeWebSocket.instances = [];
  FakeWebSocket.last = null;
  stores.isOpen.set(false);
  stores.isWeekend.set(false);
  stores.isHoliday.set(false);
  globalThis.window = {} as unknown as Window & typeof globalThis;
  (globalThis as Record<string, unknown>).WebSocket = FakeWebSocket;
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ token: "tok" }),
  }));
  invalidateWsToken("/price-data");
  invalidateWsToken("/pre-post-quote");
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("liveQuotes", () => {
  it("is a silent no-op without a wsURL and never fetches a token", async () => {
    const quotes: unknown[] = [];
    const handle = attachLiveQuotes({
      wsURL: null,
      symbols: ["SPY"],
      onQuote: (q) => quotes.push(q),
    });
    handle.detach();
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(quotes).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("is a silent no-op on the server (no window)", async () => {
    delete (globalThis as Record<string, unknown>).window;
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    handle.detach();
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("stays inert on weekends", async () => {
    stores.isWeekend.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    handle.detach();
  });

  it("stays inert on market holidays (closed weekday, no pre-post feed)", async () => {
    stores.isHoliday.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    handle.detach();
  });

  it("fetches a token and opens a /price-data socket during market hours", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/generate-ws-token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(FakeWebSocket.last!.url).toContain("/price-data?token=tok");
    FakeWebSocket.last!._open();
    await tick();
    expect(FakeWebSocket.last!.sent).toEqual([JSON.stringify(["SPY"])]);
    handle.detach();
  });

  it("reuses the cached token: one fetch for multiple attaches of the same scope", async () => {
    stores.isOpen.set(true);
    const h1 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    const h2 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["QQQ"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    h1.detach();
    h2.detach();
  });

  it("does not connect when the token fetch fails, then retries with backoff", async () => {
    stores.isOpen.set(true);
    globalThis.fetch = vi.fn(async () => ({ ok: false }));
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(
      () => expect(globalThis.fetch).toHaveBeenCalledTimes(2),
      { timeout: 4000 },
    );
    expect(FakeWebSocket.instances).toHaveLength(0);
    handle.detach();
  });

  it("re-sends the union when a second symbol attaches", async () => {
    stores.isOpen.set(true);
    const h1 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    const h2 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["QQQ"],
      onQuote: () => {},
    });
    await tick();
    expect(FakeWebSocket.last!.sent).toContain(JSON.stringify(["QQQ", "SPY"]));
    h1.detach();
    h2.detach();
  });

  it("re-sends the reduced union when a symbol detaches", async () => {
    stores.isOpen.set(true);
    const h1 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    const h2 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["QQQ"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    h2.detach();
    await tick();
    expect(FakeWebSocket.last!.sent).toContain(JSON.stringify(["SPY"]));
    h1.detach();
  });

  it("normalizes price-data messages and fans out only to subscribers of that symbol", async () => {
    stores.isOpen.set(true);
    const spyQuotes: unknown[] = [];
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: (q) => spyQuotes.push(q),
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    FakeWebSocket.last!._message(
      JSON.stringify([
        { symbol: "SPY", avgPrice: 773.3, lp: 773.2, type: "Q", time: "2026-08-10 15:11" },
        { symbol: "QQQ", avgPrice: 722.0, lp: 721.9, type: "Q", time: "2026-08-10 15:11" },
      ]),
    );
    await tick();
    expect(spyQuotes).toEqual([
      {
        symbol: "SPY",
        price: 773.3,
        changesPercentage: null,
        time: "2026-08-10 15:11",
      },
    ]);
    handle.detach();
  });

  it("ignores garbage, non-objects, and unsubscribed symbols", async () => {
    stores.isOpen.set(true);
    const quotes: unknown[] = [];
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: (q) => quotes.push(q),
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    FakeWebSocket.last!._message("not json");
    FakeWebSocket.last!._message(JSON.stringify({ symbol: "QQQ", price: 1 }));
    FakeWebSocket.last!._message(
      JSON.stringify([null, 42, { symbol: "  ", price: 1 }, { symbol: "SPY", price: 2.5 }]),
    );
    await tick();
    expect(quotes).toEqual([
      { symbol: "SPY", price: 2.5, changesPercentage: null, time: null },
    ]);
    handle.detach();
  });

  it("uses /pre-post-quote scope with tickers payload when closed on a weekday", async () => {
    const quotes: unknown[] = [];
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: (q) => quotes.push(q),
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    expect(FakeWebSocket.last!.url).toContain("/pre-post-quote?token=tok");
    FakeWebSocket.last!._open();
    expect(FakeWebSocket.last!.sent).toEqual([JSON.stringify({ tickers: ["SPY"] })]);
    FakeWebSocket.last!._message(
      JSON.stringify({
        symbol: "SPY",
        price: 775.67,
        changesPercentage: 0.58,
        time: "Aug 10, 2026, 08:30 AM EDT",
      }),
    );
    await tick();
    expect(quotes).toEqual([
      {
        symbol: "SPY",
        price: 775.67,
        changesPercentage: 0.58,
        time: "Aug 10, 2026, 08:30 AM EDT",
      },
    ]);
    handle.detach();
  });

  it("refcounts: last detach closes the socket, earlier detaches do not", async () => {
    stores.isOpen.set(true);
    const h1 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    const h2 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    FakeWebSocket.last!._open();
    h2.detach();
    await tick();
    expect(FakeWebSocket.last!.closed).toBeNull();
    h1.detach();
    await tick();
    expect(FakeWebSocket.last!.closed).not.toBeNull();
    expect(FakeWebSocket.last!.closed!.code).toBe(1000);

    const h3 = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    h3.detach();
  });

  it("moves from /price-data to /pre-post-quote when the market closes", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    const priceSocket = FakeWebSocket.last!;
    priceSocket._open();
    stores.isOpen.set(false);
    stores.isWeekend.set(false);
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    expect(priceSocket.closed?.code).toBe(1000);
    expect(FakeWebSocket.last!.url).toContain("/pre-post-quote");
    handle.detach();
  });

  it("turns off and closes the socket when the weekend starts mid-session", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    stores.isOpen.set(false);
    stores.isWeekend.set(true);
    await tick();
    expect(FakeWebSocket.last!.closed?.code).toBe(1000);
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(1);
    handle.detach();
  });

  it("survives a mode flip while the token is still being fetched: only the new scope connects", async () => {
    stores.isOpen.set(true);
    const fetchDeferred = deferred();
    globalThis.fetch = vi.fn(() => fetchDeferred.promise);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await tick();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    stores.isOpen.set(false);
    stores.isWeekend.set(false);
    await tick();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    fetchDeferred.resolve(TOKEN_RESPONSE);
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    expect(FakeWebSocket.last!.url).toContain("/pre-post-quote?token=tok");
    FakeWebSocket.last!._open();
    handle.detach();
  });

  it("detaching while the token fetch is in flight creates no socket and no reconnect", async () => {
    stores.isOpen.set(true);
    const fetchDeferred = deferred();
    globalThis.fetch = vi.fn(() => fetchDeferred.promise);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await tick();
    handle.detach();
    fetchDeferred.resolve(TOKEN_RESPONSE);
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("does not reconnect after a clean close (1000)", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    FakeWebSocket.last!.close(1000, "Normal");
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(1);
    handle.detach();
  });

  it("does not reconnect after an origin rejection (4003)", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!.close(4003, "Origin");
    await tick();
    expect(FakeWebSocket.instances).toHaveLength(1);
    handle.detach();
  });

  it("invalidates the token and refetches after an auth close (4001)", async () => {
    stores.isOpen.set(true);
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok2" }),
      });
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    expect(FakeWebSocket.last!.url).toContain("token=tok1");
    FakeWebSocket.last!._open();
    FakeWebSocket.last!.close(4001, "Auth");
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2), {
      timeout: 4000,
    });
    expect(FakeWebSocket.last!.url).toContain("token=tok2");
    handle.detach();
  });

  it("reconnects with backoff after an abnormal close (1006)", async () => {
    stores.isOpen.set(true);
    const handle = attachLiveQuotes({
      wsURL: WS_URL,
      symbols: ["SPY"],
      onQuote: () => {},
    });
    await vi.waitFor(() => expect(FakeWebSocket.last).not.toBeNull());
    FakeWebSocket.last!._open();
    FakeWebSocket.last!.close(1006, "Abnormal");
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2), {
      timeout: 4000,
    });
    expect(FakeWebSocket.last!.url).toContain("/price-data");
    handle.detach();
  });
});
