import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const MARKET_TIME_ZONE = "America/New_York";

export type PriceHistoryPoint = {
  time?: string | number;
  date?: string | number;
  close: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
};

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const zonelessDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const explicitZonePattern = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const numericPattern = /^\d+(?:\.\d+)?$/;

function hasValidCalendarParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): boolean {
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return false;
  }
  return new Date(Date.UTC(year, month - 1, day)).getUTCDate() === day;
}

function parseEpoch(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const timestamp = value < 1e11 ? value * 1000 : value;
  return Number.isFinite(timestamp) ? Math.trunc(timestamp) : null;
}

export function parsePriceTimestamp(value: unknown): number | null {
  if (typeof value === "number") return parseEpoch(value);
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;
  if (numericPattern.test(raw)) return parseEpoch(Number(raw));

  const dateMatch = raw.match(calendarDatePattern);
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    const parts = [y, m, d].map(Number);
    if (!hasValidCalendarParts(parts[0], parts[1], parts[2])) return null;
    const timestamp = fromZonedTime(`${raw}T00:00:00`, MARKET_TIME_ZONE).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  const zonelessMatch = raw.match(zonelessDateTimePattern);
  if (zonelessMatch) {
    const [, y, m, d, h, min, sec = "0", millis = "0"] = zonelessMatch;
    const parts = [y, m, d, h, min, sec].map(Number);
    if (!hasValidCalendarParts(...(parts as [number, number, number, number, number, number]))) {
      return null;
    }
    const normalized = `${y}-${m}-${d}T${h}:${min}:${sec}.${millis.padEnd(3, "0")}`;
    const date = fromZonedTime(normalized, MARKET_TIME_ZONE);
    const expected = `${y}-${m}-${d} ${h}:${min}:${sec}`;
    if (
      !Number.isFinite(date.getTime()) ||
      formatInTimeZone(date, MARKET_TIME_ZONE, "yyyy-MM-dd HH:mm:ss") !== expected
    ) {
      return null;
    }
    return date.getTime();
  }

  if (!explicitZonePattern.test(raw)) return null;
  const calendarPrefix = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (
    calendarPrefix &&
    !hasValidCalendarParts(
      Number(calendarPrefix[1]),
      Number(calendarPrefix[2]),
      Number(calendarPrefix[3]),
      Number(calendarPrefix[4]),
      Number(calendarPrefix[5]),
      Number(calendarPrefix[6] ?? 0),
    )
  ) {
    return null;
  }
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isPriceHistoryPoint(value: unknown): value is PriceHistoryPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as PriceHistoryPoint;
  const close =
    typeof point.close === "number"
      ? point.close
      : typeof point.close === "string" && point.close.trim() !== ""
        ? Number(point.close)
        : Number.NaN;
  return (
    Number.isFinite(close) &&
    parsePriceTimestamp(point.time ?? point.date) !== null
  );
}

export function mergeLatestPricePoint(
  historical: PriceHistoryPoint[],
  latest: PriceHistoryPoint | null | undefined,
): PriceHistoryPoint[] {
  const sorted = [...historical].sort(
    (left, right) =>
      (parsePriceTimestamp(left.time ?? left.date) ?? 0) -
      (parsePriceTimestamp(right.time ?? right.date) ?? 0),
  );
  if (!latest || !isPriceHistoryPoint(latest)) return sorted;
  const latestTimestamp = parsePriceTimestamp(latest.time ?? latest.date)!;
  const last = sorted.at(-1);
  const lastTimestamp = last
    ? parsePriceTimestamp(last.time ?? last.date)
    : null;
  return lastTimestamp === null || latestTimestamp > lastTimestamp
    ? [...sorted, latest]
    : sorted;
}

export function createPriceHistoryLoader(fetcher: FetchLike = fetch) {
  const pending = new Map<string, Promise<PriceHistoryPoint[]>>();

  const load = (
    ticker: string,
    timePeriod: string,
    latest: PriceHistoryPoint | null | undefined,
    signal?: AbortSignal,
  ): Promise<PriceHistoryPoint[]> => {
    const key = `${ticker}\u0000${timePeriod}`;
    const existing = pending.get(key);
    if (existing) return existing.then((history) => mergeLatestPricePoint(history, latest));

    const request = (async () => {
      const response = await fetcher("/api/historical-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, timePeriod }),
        signal,
      });
      if (!response.ok) {
        throw new Error(`Historical price request failed (${response.status})`);
      }
      const payload: unknown = await response.json();
      if (!Array.isArray(payload) || !payload.every(isPriceHistoryPoint)) {
        throw new Error("Historical price response is invalid");
      }
      return payload;
    })().finally(() => pending.delete(key));

    pending.set(key, request);
    return request.then((history) => mergeLatestPricePoint(history, latest));
  };

  return { load };
}
