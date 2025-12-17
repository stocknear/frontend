type RangeSelectorCallbacks = {
  getRange: () => string;
  getMode?: () => string;
};

type RangeSelectorController = {
  sync: (range: string) => void;
  clear: () => void;
  destroy: () => void;
  readonly active: boolean;
  readonly selecting: boolean;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  if (expanded.length !== 6) return `rgba(0, 0, 0, ${alpha})`;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getPointTimeMs = (point: any): number | null => {
  if (!point) return null;
  if (isFiniteNumber(point.category)) return point.category;
  if (isFiniteNumber(point.x)) return point.x;
  return null;
};

const formatRangeTimestamp = (timestampMs: number, range: string): string => {
  const date = new Date(timestampMs);

  if (range === "1D") {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  if (["1W", "1M"].includes(range)) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export function createHighchartsRangeSelector(
  chart: any,
  callbacks: RangeSelectorCallbacks,
): RangeSelectorController {
  const getMode = callbacks.getMode ?? (() => "dark");

  const state = {
    armed: false,
    active: false,
    dragging: false,
    startIndex: null as number | null,
    endIndex: null as number | null,
    startChartX: null as number | null,
    pointerId: null as number | null,
    lastRange: null as string | null,
    highlightGroup: null as any,
    selectionRect: null as any,
    group: null as any,
    startLine: null as any,
    endLine: null as any,
    startMarker: null as any,
    endMarker: null as any,
    label: null as any,
    previousUserSelect: null as string | null,
    previousTouchAction: null as string | null,
  };

  const nf2 = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isSelecting = () => state.dragging || state.active;

  const ensureElements = () => {
    if (state.group) return;

    state.highlightGroup = chart.renderer
      .g("range-selector-highlight")
      .attr({ zIndex: 2 })
      .css({ pointerEvents: "none" })
      .add();

    state.selectionRect = chart.renderer
      .rect(0, 0, 0, 0)
      .attr({ opacity: 0 })
      .add(state.highlightGroup);

    state.group = chart.renderer
      .g("range-selector")
      .attr({ zIndex: 7 })
      .css({ pointerEvents: "none" })
      .add();

    state.startLine = chart.renderer
      .path(["M", 0, 0, "L", 0, 0])
      .attr({
        "stroke-width": 1,
        "stroke-dasharray": "3,3",
        opacity: 0,
      })
      .add(state.group);

    state.endLine = chart.renderer
      .path(["M", 0, 0, "L", 0, 0])
      .attr({
        "stroke-width": 1,
        "stroke-dasharray": "3,3",
        opacity: 0,
      })
      .add(state.group);

    state.startMarker = chart.renderer
      .circle(0, 0, 5)
      .attr({ opacity: 0, "stroke-width": 1 })
      .add(state.group);

    state.endMarker = chart.renderer
      .circle(0, 0, 5)
      .attr({ opacity: 0, "stroke-width": 1 })
      .add(state.group);

    state.label = chart.renderer
      .text("", 0, 0, true)
      .css({ fontSize: "14px" })
      .attr({ opacity: 0 })
      .add(state.group);
  };

  const hideOverlay = () => {
    if (!state.group) return;
    state.selectionRect?.attr({ opacity: 0 });
    state.startLine?.attr({ opacity: 0 });
    state.endLine?.attr({ opacity: 0 });
    state.startMarker?.attr({ opacity: 0 });
    state.endMarker?.attr({ opacity: 0 });
    state.label?.attr({ opacity: 0 });
  };

  const clear = () => {
    state.armed = false;
    state.active = false;
    state.dragging = false;
    state.startIndex = null;
    state.endIndex = null;
    state.startChartX = null;
    state.pointerId = null;

    hideOverlay();

    if (state.previousUserSelect !== null) {
      chart.container.style.userSelect = state.previousUserSelect;
      state.previousUserSelect = null;
    }
    if (state.previousTouchAction !== null) {
      chart.container.style.touchAction = state.previousTouchAction;
      state.previousTouchAction = null;
    }
  };

  const getSeriesPoint = (index: number | null) => {
    const series = chart.series?.[0];
    if (!series || !isFiniteNumber(index)) return null;
    return series.points?.[index] ?? null;
  };

  const updateOverlay = () => {
    if (!state.active) return;

    const rawStart = getSeriesPoint(state.startIndex);
    const rawEnd = getSeriesPoint(state.endIndex);
    if (!rawStart || !rawEnd) {
      clear();
      return;
    }

    if (rawStart === rawEnd) {
      hideOverlay();
      return;
    }

    const startTime = getPointTimeMs(rawStart);
    const endTime = getPointTimeMs(rawEnd);
    const startXValue = startTime ?? rawStart.x;
    const endXValue = endTime ?? rawEnd.x;

    const [p1, p2] =
      isFiniteNumber(startXValue) &&
      isFiniteNumber(endXValue) &&
      endXValue < startXValue
        ? [rawEnd, rawStart]
        : [rawStart, rawEnd];

    const t1 = getPointTimeMs(p1);
    const t2 = getPointTimeMs(p2);

    if (!isFiniteNumber(p1.plotX) || !isFiniteNumber(p1.plotY)) return;
    if (!isFiniteNumber(p2.plotX) || !isFiniteNumber(p2.plotY)) return;

    const x1 = chart.plotLeft + p1.plotX;
    const x2 = chart.plotLeft + p2.plotX;
    const y1 = chart.plotTop + p1.plotY;
    const y2 = chart.plotTop + p2.plotY;
    const top = chart.plotTop;
    const bottom = chart.plotTop + chart.plotHeight;

    const delta = (p2.y ?? 0) - (p1.y ?? 0);
    const pct = isFiniteNumber(p1.y) && p1.y !== 0 ? (delta / p1.y) * 100 : 0;

    const upColor = "#00FC50";
    const downColor = "#FF2F1F";
    const selectionColor = delta >= 0 ? upColor : downColor;

    const markerColor = getMode() === "light" ? "#000000" : "#FFFFFF";
    const guideColor =
      getMode() === "light" ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.35)";
    const highlightAlpha = getMode() === "light" ? 0.12 : 0.16;

    const range = callbacks.getRange();
    const deltaText = `${delta > 0 ? "+" : ""}${nf2.format(delta)}`;
    const pctText = `${nf2.format(pct)}%`;
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "";
    const rangeText =
      isFiniteNumber(t1) && isFiniteNumber(t2)
        ? `${formatRangeTimestamp(t1, range)}–${formatRangeTimestamp(t2, range)}`
        : "";

    const labelText = `<div class="bg-[#000] p-2 border border-gray-300 dark:border-gray-700 rounded">${deltaText} (${pctText})${arrow ? ` ${arrow}` : ""}${
      rangeText ? `  ${rangeText}` : ""
    }</div>`;

    ensureElements();

    const left = Math.min(x1, x2);
    const width = Math.abs(x2 - x1);
    const height = bottom - top;
    state.selectionRect?.attr({
      x: left,
      y: top,
      width,
      height,
      fill: hexToRgba(selectionColor, highlightAlpha),
      opacity: width > 0 ? 1 : 0,
    });

    state.startLine?.attr({
      d: ["M", x1, top, "L", x1, bottom],
      stroke: guideColor,
      opacity: 1,
    });
    state.endLine?.attr({
      d: ["M", x2, top, "L", x2, bottom],
      stroke: guideColor,
      opacity: 1,
    });

    state.startMarker?.attr({
      x: x1,
      y: y1,
      fill: markerColor,
      stroke: markerColor,
      opacity: 1,
      "stroke-width": 2,
    });
    state.endMarker?.attr({
      x: x2,
      y: y2,
      fill: markerColor,
      stroke: markerColor,
      opacity: 1,
      "stroke-width": 2,
    });

    const midX = (x1 + x2) / 2;
    const labelY = chart.plotTop + 26;
    state.label?.attr({
      text: labelText,
      x: midX,
      y: labelY,
      opacity: 1,
      align: "center",
    });
    state.label?.css({ color: selectionColor });

    const bbox = state.label?.getBBox?.();
    if (bbox && isFiniteNumber(bbox.width)) {
      const half = bbox.width / 2;
      const minX = chart.plotLeft + half + 4;
      const maxX = chart.plotLeft + chart.plotWidth - half - 4;
      const clampedX = Math.max(minX, Math.min(maxX, midX));
      state.label?.attr({ x: clampedX });
    }

    chart.tooltip?.hide?.(0);
  };

  const isEventInPlot = (normalizedEvent: any) => {
    const x = normalizedEvent.chartX - chart.plotLeft;
    const y = normalizedEvent.chartY - chart.plotTop;
    return x >= 0 && x <= chart.plotWidth && y >= 0 && y <= chart.plotHeight;
  };

  const getNearestPoint = (evt: PointerEvent) => {
    const series = chart.series?.[0];
    if (!series) return null;

    const normalized = chart.pointer.normalize(evt as any);
    if (!isEventInPlot(normalized)) return null;

    const point = series.searchPoint(normalized, true);
    return point ?? null;
  };

  const startSelection = (evt: PointerEvent) => {
    state.dragging = true;
    state.active = true;

    chart.tooltip?.hide?.(0);

    state.previousUserSelect ??= chart.container.style.userSelect;
    state.previousTouchAction ??= chart.container.style.touchAction;
    chart.container.style.userSelect = "none";
    chart.container.style.touchAction = "none";

    try {
      chart.container.setPointerCapture(evt.pointerId);
    } catch {
      // ignore
    }
  };

  const pointerThresholdPx = 6;

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.isPrimary === false) return;
    if (evt.pointerType === "mouse" && evt.button !== 0) return;

    const point = getNearestPoint(evt);
    if (!point) return;

    state.armed = true;
    state.active = false;
    state.dragging = false;
    state.startIndex = point.index;
    state.endIndex = point.index;
    state.pointerId = evt.pointerId;
    state.startChartX = chart.pointer.normalize(evt as any).chartX;
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (!state.armed || state.pointerId !== evt.pointerId) return;

    const point = getNearestPoint(evt);
    if (!point) return;

    state.endIndex = point.index;

    const chartX = chart.pointer.normalize(evt as any).chartX;
    if (
      !state.dragging &&
      isFiniteNumber(state.startChartX) &&
      Math.abs(chartX - state.startChartX) > pointerThresholdPx
    ) {
      startSelection(evt);
    }

    if (!isSelecting()) return;

    updateOverlay();

    evt.preventDefault();
  };

  const stop = (evt: PointerEvent) => {
    if (!state.armed || state.pointerId !== evt.pointerId) return;

    try {
      chart.container.releasePointerCapture(evt.pointerId);
    } catch {
      // ignore
    }

    clear();
  };

  // Prevent Highcharts from re-showing tooltips/crosshairs while selecting.
  // This is the most reliable way to avoid "tooltip + range overlay" on touch.
  const pointer = chart.pointer;
  const originalRunPointActions = pointer?.runPointActions;
  const originalReset = pointer?.reset;
  if (pointer && originalRunPointActions && originalReset) {
    pointer.runPointActions = function (...args: any[]) {
      if (isSelecting()) return;
      return originalRunPointActions.apply(this, args);
    };
    pointer.reset = function (...args: any[]) {
      if (isSelecting()) return;
      return originalReset.apply(this, args);
    };
  }

  chart.container.addEventListener("pointerdown", onPointerDown);
  chart.container.addEventListener("pointermove", onPointerMove);
  chart.container.addEventListener("pointerup", stop);
  chart.container.addEventListener("pointercancel", stop);

  const destroy = () => {
    clear();

    chart.container.removeEventListener("pointerdown", onPointerDown);
    chart.container.removeEventListener("pointermove", onPointerMove);
    chart.container.removeEventListener("pointerup", stop);
    chart.container.removeEventListener("pointercancel", stop);

    if (pointer && originalRunPointActions)
      pointer.runPointActions = originalRunPointActions;
    if (pointer && originalReset) pointer.reset = originalReset;

    state.group?.destroy?.();
    state.group = null;
    state.highlightGroup?.destroy?.();
    state.highlightGroup = null;
  };

  return {
    sync(range: string) {
      if (state.lastRange && state.lastRange !== range) clear();
      state.lastRange = range;
      if (state.active) updateOverlay();
    },
    clear,
    destroy,
    get active() {
      return state.active;
    },
    get selecting() {
      return isSelecting();
    },
  };
}
