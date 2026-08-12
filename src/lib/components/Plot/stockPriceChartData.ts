import type { KLineData } from "klinecharts";
import { parsePriceTimestamp } from "$lib/priceHistory";

export interface RawChartPoint {
  time?: unknown;
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
}

export interface ChartPoint extends KLineData {
  sourceIndex: number;
  isSynthetic: boolean;
}

export interface NormalizedChartData {
  points: ChartPoint[];
  intervalMs: number;
  sessionStart: number | null;
  sessionEnd: number | null;
  realPointCount: number;
}

export interface HoverSummary {
  pointIndex: number;
  timestamp: number;
  price: number;
  absoluteChange: number | null;
  percentChange: number | null;
}

const MINUTE_MS = 60_000;
const ET_TIMEZONE = "America/New_York";
const SAMPLING_STEP_PX = 100;

const etDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ET_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const finiteNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const computeChartIntervalMs = (points: ChartPoint[]): number => {
  const realPoints = points.filter((point) => !point.isSynthetic);
  if (realPoints.length < 2) return MINUTE_MS;
  const differences: number[] = [];
  for (let index = 1; index < Math.min(realPoints.length, 50); index += 1) {
    const difference =
      realPoints[index].timestamp - realPoints[index - 1].timestamp;
    if (difference > 0) differences.push(difference);
  }
  if (differences.length === 0) return MINUTE_MS;
  differences.sort((left, right) => left - right);
  return differences[Math.floor(differences.length / 2)];
};

export const normalizeChartData = (
  rawData: readonly RawChartPoint[] | null | undefined,
  displayRange: string,
): NormalizedChartData => {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return {
      points: [],
      intervalMs: MINUTE_MS,
      sessionStart: null,
      sessionEnd: null,
      realPointCount: 0,
    };
  }

  const byTimestamp = new Map<number, ChartPoint>();
  rawData.forEach((item, sourceIndex) => {
    const timestamp = parsePriceTimestamp(item?.time ?? item?.date);
    const close = finiteNumber(item?.close);
    if (timestamp === null || close === null) return;
    byTimestamp.set(timestamp, {
      timestamp,
      close,
      open: finiteNumber(item?.open) ?? close,
      high: finiteNumber(item?.high) ?? close,
      low: finiteNumber(item?.low) ?? close,
      volume: 0,
      sourceIndex,
      isSynthetic: false,
    });
  });

  const realPoints = [...byTimestamp.values()].sort(
    (left, right) => left.timestamp - right.timestamp,
  );
  const intervalMs = computeChartIntervalMs(realPoints);
  if (realPoints.length === 0 || displayRange !== "1D") {
    return {
      points: realPoints,
      intervalMs,
      sessionStart: null,
      sessionEnd: null,
      realPointCount: realPoints.length,
    };
  }

  const date = etDateFormatter.format(new Date(realPoints[0].timestamp));
  const sessionStart = parsePriceTimestamp(`${date} 09:30:00`);
  const sessionEnd = parsePriceTimestamp(`${date} 16:00:00`);
  if (sessionStart === null || sessionEnd === null) {
    return {
      points: realPoints,
      intervalMs,
      sessionStart: null,
      sessionEnd: null,
      realPointCount: realPoints.length,
    };
  }

  const byMinute = new Map<number, ChartPoint>();
  for (const point of realPoints) {
    const minute = Math.round((point.timestamp - sessionStart) / MINUTE_MS);
    const minuteTimestamp = sessionStart + minute * MINUTE_MS;
    if (
      minuteTimestamp < sessionStart ||
      minuteTimestamp > sessionEnd ||
      Math.abs(point.timestamp - minuteTimestamp) >= MINUTE_MS / 2
    ) {
      continue;
    }
    byMinute.set(minute, { ...point, timestamp: minuteTimestamp });
  }

  const minutes = [...byMinute.keys()].sort((left, right) => left - right);
  if (minutes.length === 0) {
    return {
      points: realPoints,
      intervalMs,
      sessionStart: null,
      sessionEnd: null,
      realPointCount: realPoints.length,
    };
  }

  const points: ChartPoint[] = [];
  let previous: ChartPoint | null = null;
  for (
    let minute = minutes[0];
    minute <= minutes[minutes.length - 1];
    minute += 1
  ) {
    const point = byMinute.get(minute);
    if (point) {
      points.push(point);
      previous = point;
    } else if (previous) {
      points.push({
        timestamp: sessionStart + minute * MINUTE_MS,
        open: previous.close,
        high: previous.close,
        low: previous.close,
        close: previous.close,
        volume: 0,
        sourceIndex: previous.sourceIndex,
        isSynthetic: true,
      });
    }
  }

  return {
    points,
    intervalMs: MINUTE_MS,
    sessionStart,
    sessionEnd,
    realPointCount: byMinute.size,
  };
};

export const downsampleChartPoints = (
  points: readonly ChartPoint[],
  targetCount: number,
): ChartPoint[] => {
  const length = points.length;
  if (length <= targetCount || targetCount < 3) return [...points];

  const sampled: ChartPoint[] = [points[0]];
  const bucketSize = (length - 2) / (targetCount - 2);
  let selectedIndex = 0;

  for (let bucket = 0; bucket < targetCount - 2; bucket += 1) {
    const averageStart = Math.min(
      Math.floor((bucket + 1) * bucketSize) + 1,
      length,
    );
    const averageEnd = Math.min(
      Math.floor((bucket + 2) * bucketSize) + 1,
      length,
    );
    const averageCount = Math.max(averageEnd - averageStart, 1);
    let averageX = 0;
    let averageY = 0;
    for (let index = averageStart; index < averageEnd; index += 1) {
      averageX += index;
      averageY += points[index].close;
    }
    if (averageEnd === averageStart) {
      averageX = length - 1;
      averageY = points[length - 1].close;
    } else {
      averageX /= averageCount;
      averageY /= averageCount;
    }

    const rangeStart = Math.floor(bucket * bucketSize) + 1;
    const rangeEnd = Math.min(
      Math.floor((bucket + 1) * bucketSize) + 1,
      length - 1,
    );
    const anchor = points[selectedIndex];
    let maximumArea = -1;
    let nextSelectedIndex = rangeStart;
    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const area = Math.abs(
        (selectedIndex - averageX) * (points[index].close - anchor.close) -
          (selectedIndex - index) * (averageY - anchor.close),
      );
      if (area > maximumArea) {
        maximumArea = area;
        nextSelectedIndex = index;
      }
    }
    sampled.push(points[nextSelectedIndex]);
    selectedIndex = nextSelectedIndex;
  }

  sampled.push(points[length - 1]);
  return sampled;
};

export const nearestRealPointIndex = (
  points: readonly ChartPoint[],
  pointIndex: number,
): number | null => {
  if (points.length === 0) return null;
  const start = Math.max(
    0,
    Math.min(Math.round(pointIndex), points.length - 1),
  );
  if (!points[start].isSynthetic) return start;
  for (let distance = 1; distance < points.length; distance += 1) {
    const left = start - distance;
    const right = start + distance;
    if (left >= 0 && !points[left].isSynthetic) return left;
    if (right < points.length && !points[right].isSynthetic) return right;
  }
  return null;
};

export const adjacentRealPointIndex = (
  points: readonly ChartPoint[],
  pointIndex: number,
  direction: -1 | 1,
): number | null => {
  const start = Math.max(
    0,
    Math.min(Math.round(pointIndex), points.length - 1),
  );
  for (
    let index = start + direction;
    index >= 0 && index < points.length;
    index += direction
  ) {
    if (!points[index].isSynthetic) return index;
  }
  return null;
};

export const chartSamplingTarget = (width: number): number => {
  if (!Number.isFinite(width) || width <= 0) return SAMPLING_STEP_PX;
  return Math.max(
    SAMPLING_STEP_PX,
    Math.floor(width / SAMPLING_STEP_PX) * SAMPLING_STEP_PX,
  );
};

export const buildHoverSummary = (
  points: readonly ChartPoint[],
  pointIndex: number,
  displayRange: string,
  previousClose: number | null | undefined,
): HoverSummary | null => {
  const realIndex = nearestRealPointIndex(points, pointIndex);
  if (realIndex === null) return null;
  const point = points[realIndex];
  const firstRealPoint = points.find((candidate) => !candidate.isSynthetic);
  const suppliedBaseline = finiteNumber(previousClose);
  const baseline =
    displayRange === "1D" && suppliedBaseline !== null
      ? suppliedBaseline
      : (firstRealPoint?.close ?? null);
  const absoluteChange = baseline === null ? null : point.close - baseline;
  const percentChange =
    absoluteChange === null || baseline === 0
      ? null
      : (absoluteChange / baseline) * 100;
  return {
    pointIndex: realIndex,
    timestamp: point.timestamp,
    price: point.close,
    absoluteChange,
    percentChange,
  };
};

export const formatEtTimestamp = (
  timestamp: number,
  locale = "en-US",
): { date: string; time: string } => {
  const value = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(value.getTime())) {
    return { date: "", time: "" };
  }
  return {
    date: value.toLocaleDateString(locale, {
      timeZone: ET_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: value.toLocaleTimeString(locale, {
      timeZone: ET_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }),
  };
};

export const sessionPointCount = (
  sessionStart: number | null,
  sessionEnd: number | null,
  intervalMs: number,
): number =>
  sessionStart !== null && sessionEnd !== null && intervalMs > 0
    ? Math.round((sessionEnd - sessionStart) / intervalMs) + 1
    : 0;
