import { registerIndicator, utils } from "klinecharts";
import type { IndicatorTemplate, KLineData } from "klinecharts";
import {
  STATEMENT_INDICATOR_BY_INDEX,
  type StatementIndicatorFormat,
} from "$lib/financials/statementIndicators";
import { getIndicatorEngine } from "./indicatorEngine";

let registered = false;

type IndicatorRecord = Record<string, number | undefined>;
type FinancialIndicatorPeriod = "annual" | "quarterly" | "ttm";

type StatementMetricExtendData = {
  metricIndex?: number;
  period?: FinancialIndicatorPeriod;
};

type FinancialIndicatorExtendData = {
  period?: FinancialIndicatorPeriod;
};

const createWorkerIndicator = <D extends IndicatorRecord, C = number>(
  workerKey: string,
  template: IndicatorTemplate<D, C>,
): IndicatorTemplate<D, C> => ({
  ...template,
  calc: async (dataList, indicator) => {
    try {
      return (await getIndicatorEngine().compute(
        workerKey,
        Array.isArray(indicator.calcParams)
          ? (indicator.calcParams as number[])
          : [],
        dataList,
      )) as D[];
    } catch (error) {
      console.error(`Indicator ${workerKey} failed:`, error);
      return [];
    }
  },
});

function createMaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  const maColors = ["#2962FF", "#FF6D00", "#2E7D32", "#AB47BC"];
  return createWorkerIndicator("ma", {
    name: "SN_MA",
    shortName: "MA",
    series: "price",
    precision: 2,
    calcParams: [20, 50, 100, 200],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const params = indicator.calcParams as number[];
      params.forEach((_, index) => {
        const key = `ma${index + 1}`;
        const points: { x: number; y: number }[] = [];

        for (let i = from; i < to; i++) {
          const data = result[i];
          if (data?.[key] !== undefined) {
            points.push({
              x: xAxis.convertToPixel(i),
              y: yAxis.convertToPixel(data[key] as number),
            });
          }
        }

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = maColors[index % maColors.length];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      return false;
    },
  });
}

function createEmaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  const emaColors = ["#E91E63", "#00BCD4", "#FFC107"];
  return createWorkerIndicator("ema", {
    name: "SN_EMA",
    shortName: "EMA",
    series: "price",
    precision: 2,
    calcParams: [9, 21, 50],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const params = indicator.calcParams as number[];
      params.forEach((_, index) => {
        const key = `ema${index + 1}`;
        const points: { x: number; y: number }[] = [];

        for (let i = from; i < to; i++) {
          const data = result[i];
          if (data?.[key] !== undefined) {
            points.push({
              x: xAxis.convertToPixel(i),
              y: yAxis.convertToPixel(data[key] as number),
            });
          }
        }

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = emaColors[index % emaColors.length];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      return false;
    },
  });
}

function createBollIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("boll", {
    name: "SN_BOLL",
    shortName: "BOLL",
    series: "price",
    precision: 2,
    calcParams: [20, 2],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];

      if (!result || result.length === 0) return false;

      // Collect points for upper, middle, and lower bands
      const upperPoints: { x: number; y: number }[] = [];
      const midPoints: { x: number; y: number }[] = [];
      const lowerPoints: { x: number; y: number }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (data?.upper !== undefined && data?.lower !== undefined) {
          const x = xAxis.convertToPixel(i);
          const upperY = yAxis.convertToPixel(data.upper);
          const lowerY = yAxis.convertToPixel(data.lower);
          upperPoints.push({ x, y: upperY });
          lowerPoints.push({ x, y: lowerY });
        }
        if (data?.mid !== undefined) {
          const x = xAxis.convertToPixel(i);
          const midY = yAxis.convertToPixel(data.mid);
          midPoints.push({ x, y: midY });
        }
      }

      if (upperPoints.length >= 2) {
        // Draw filled area between bands
        ctx.beginPath();
        ctx.moveTo(upperPoints[0].x, upperPoints[0].y);

        // Draw upper band line
        for (let i = 1; i < upperPoints.length; i++) {
          ctx.lineTo(upperPoints[i].x, upperPoints[i].y);
        }

        // Draw lower band line in reverse to close the polygon
        for (let i = lowerPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
        }

        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();

        // Draw upper band line
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
        for (let i = 1; i < upperPoints.length; i++) {
          ctx.lineTo(upperPoints[i].x, upperPoints[i].y);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw lower band line
        ctx.beginPath();
        ctx.moveTo(lowerPoints[0].x, lowerPoints[0].y);
        for (let i = 1; i < lowerPoints.length; i++) {
          ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw the middle line (SMA) as a solid white line
      if (midPoints.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(midPoints[0].x, midPoints[0].y);
        for (let i = 1; i < midPoints.length; i++) {
          ctx.lineTo(midPoints[i].x, midPoints[i].y);
        }
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Return false to skip default figure drawing (which includes lastValueMark)
      return false;
    },
  });
}

function createVwapIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("vwap", {
    name: "SN_VWAP",
    shortName: "VWAP",
    series: "price",
    precision: 2,
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const points: { x: number; y: number }[] = [];
      for (let i = from; i < to; i++) {
        const data = result[i];
        if (data?.vwap !== undefined) {
          points.push({
            x: xAxis.convertToPixel(i),
            y: yAxis.convertToPixel(data.vwap as number),
          });
        }
      }

      if (points.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "#9C27B0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      return false;
    },
  });
}

function createRsiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("rsi", {
    name: "SN_RSI",
    shortName: "RSI",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14],
    figures: [{ key: "rsi", title: "RSI: ", type: "line" }],
  });
}

function createAtrIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("atr", {
    name: "SN_ATR",
    shortName: "ATR",
    series: "normal",
    precision: 2,
    minValue: 0,
    calcParams: [14],
    figures: [{ key: "atr", title: "ATR: ", type: "line" }],
  });
}

function createMacdIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("macd", {
    name: "SN_MACD",
    shortName: "MACD",
    series: "normal",
    precision: 2,
    calcParams: [12, 26, 9],
    figures: [
      { key: "dif", title: "DIF: ", type: "line" },
      { key: "dea", title: "DEA: ", type: "line" },
      {
        key: "macd",
        title: "MACD: ",
        type: "bar",
        baseValue: 0,
        styles: ({ data, defaultStyles }) => {
          const macdValue = data.current?.macd ?? 0;
          const base =
            macdValue >= 0
              ? defaultStyles?.bars?.[0]?.upColor
              : defaultStyles?.bars?.[0]?.downColor;
          const color = typeof base === "string" ? base : "#6b7280";
          return { color, borderColor: color, style: "fill" };
        },
      },
    ],
  });
}

function createStochIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("stoch", {
    name: "SN_STOCH",
    shortName: "STOCH",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14, 3],
    figures: [
      { key: "k", title: "%K: ", type: "line" },
      { key: "d", title: "%D: ", type: "line" },
    ],
  });
}

function createStochCrossoverIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("stoch_crossover", {
    name: "SN_STOCH_X",
    shortName: "STOCH X",
    series: "normal",
    precision: 2,
    minValue: -100,
    maxValue: 100,
    calcParams: [14, 3],
    figures: [{ key: "crossover", title: "%K-%D: ", type: "line" }],
  });
}

function createObvIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("obv", {
    name: "SN_OBV",
    shortName: "OBV",
    series: "normal",
    precision: 0,
    calcParams: [5, 10, 20, 50],
    figures: [
      { key: "obv", title: "OBV: ", type: "line" },
      { key: "ma1", title: "MA5: ", type: "line" },
      { key: "ma2", title: "MA10: ", type: "line" },
      { key: "ma3", title: "MA20: ", type: "line" },
      { key: "ma4", title: "MA50: ", type: "line" },
    ],
    regenerateFigures: (params) => {
      const figures = params.map((period, index) => ({
        key: `ma${index + 1}`,
        title: `MA${period}: `,
        type: "line",
      }));
      figures.unshift({ key: "obv", title: "OBV: ", type: "line" });
      return figures;
    },
  });
}

function createVolumeIndicator(): IndicatorTemplate<
  IndicatorRecord & Pick<KLineData, "open" | "close" | "volume">,
  number
> {
  const getVolumeFigure = () => ({
    key: "volume",
    title: "VOL: ",
    type: "bar",
    styles: ({ data, indicator, defaultStyles }) => {
      const current = data.current;
      let color = utils.formatValue(
        indicator.styles,
        "bars[0].noChangeColor",
        defaultStyles?.bars?.[0]?.noChangeColor,
      );
      if (current) {
        if (current.close > current.open) {
          color = utils.formatValue(
            indicator.styles,
            "bars[0].upColor",
            defaultStyles?.bars?.[0]?.upColor,
          );
        } else if (current.close < current.open) {
          color = utils.formatValue(
            indicator.styles,
            "bars[0].downColor",
            defaultStyles?.bars?.[0]?.downColor,
          );
        }
      }
      return { color: typeof color === "string" ? color : "#6b7280" };
    },
  });

  return createWorkerIndicator("volume", {
    name: "SN_VOL",
    shortName: "VOL",
    series: "volume",
    precision: 0,
    minValue: 0,
    shouldFormatBigNumber: true,
    calcParams: [5, 10, 20],
    figures: [
      { key: "ma1", title: "MA5: ", type: "line" },
      { key: "ma2", title: "MA10: ", type: "line" },
      { key: "ma3", title: "MA20: ", type: "line" },
      getVolumeFigure(),
    ],
    regenerateFigures: (params) => {
      const figures = params.map((period, index) => ({
        key: `ma${index + 1}`,
        title: `MA${period}: `,
        type: "line",
      }));
      figures.push(getVolumeFigure());
      return figures;
    },
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    styles: {
      lastValueMark: {
        show: false,
      },
    },
  });
}

function createCciIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("cci", {
    name: "SN_CCI",
    shortName: "CCI",
    series: "normal",
    precision: 2,
    calcParams: [20],
    figures: [{ key: "cci", title: "CCI: ", type: "line" }],
  });
}

function createWilliamsIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("williams_r", {
    name: "SN_WILLIAMS",
    shortName: "%R",
    series: "normal",
    precision: 2,
    minValue: -100,
    maxValue: 0,
    calcParams: [14],
    figures: [{ key: "williams", title: "%R: ", type: "line" }],
  });
}

function createMfiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("mfi", {
    name: "SN_MFI",
    shortName: "MFI",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14],
    figures: [{ key: "mfi", title: "MFI: ", type: "line" }],
  });
}

function createSarIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("parabolic_sar", {
    name: "SN_SAR",
    shortName: "SAR",
    series: "price",
    precision: 2,
    calcParams: [0.02, 0.2],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (data?.sar !== undefined) {
          const x = xAxis.convertToPixel(i);
          const y = yAxis.convertToPixel(data.sar as number);

          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#FF9800";
          ctx.fill();
        }
      }

      return false;
    },
  });
}

function createDonchianIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("donchian", {
    name: "SN_DONCHIAN",
    shortName: "DON",
    series: "price",
    precision: 2,
    calcParams: [20],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const upperPoints: { x: number; y: number }[] = [];
      const middlePoints: { x: number; y: number }[] = [];
      const lowerPoints: { x: number; y: number }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        const x = xAxis.convertToPixel(i);
        if (data?.upper !== undefined) {
          upperPoints.push({ x, y: yAxis.convertToPixel(data.upper as number) });
        }
        if (data?.middle !== undefined) {
          middlePoints.push({ x, y: yAxis.convertToPixel(data.middle as number) });
        }
        if (data?.lower !== undefined) {
          lowerPoints.push({ x, y: yAxis.convertToPixel(data.lower as number) });
        }
      }

      // Draw upper line
      if (upperPoints.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
        for (let i = 1; i < upperPoints.length; i++) {
          ctx.lineTo(upperPoints[i].x, upperPoints[i].y);
        }
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw middle line
      if (middlePoints.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(middlePoints[0].x, middlePoints[0].y);
        for (let i = 1; i < middlePoints.length; i++) {
          ctx.lineTo(middlePoints[i].x, middlePoints[i].y);
        }
        ctx.strokeStyle = "#FFC107";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw lower line
      if (lowerPoints.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(lowerPoints[0].x, lowerPoints[0].y);
        for (let i = 1; i < lowerPoints.length; i++) {
          ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
        }
        ctx.strokeStyle = "#F44336";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      return false;
    },
  });
}

function createStdIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("std", {
    name: "SN_STD",
    shortName: "STD",
    series: "normal",
    precision: 3,
    calcParams: [20],
    figures: [{ key: "std", title: "STD: ", type: "line" }],
  });
}

function createHistVolIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("hist_vol", {
    name: "SN_HVOL",
    shortName: "HV",
    series: "normal",
    precision: 2,
    calcParams: [20],
    figures: [{ key: "histVol", title: "HV: ", type: "line" }],
  });
}

function createChaikinVolIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("chaikin_vol", {
    name: "SN_CHAIKIN",
    shortName: "CHV",
    series: "normal",
    precision: 2,
    calcParams: [10, 10],
    figures: [{ key: "chaikin", title: "CHV: ", type: "line" }],
  });
}

function createPivotIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("pivot", {
    name: "SN_PIVOT",
    shortName: "PIVOT",
    series: "price",
    precision: 2,
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const lines = [
        { key: "r2", color: "#F44336" },
        { key: "r1", color: "#FF7043" },
        { key: "pivot", color: "#FFFFFF" },
        { key: "s1", color: "#66BB6A" },
        { key: "s2", color: "#4CAF50" },
      ];

      lines.forEach(({ key, color }) => {
        const points: { x: number; y: number }[] = [];
        for (let i = from; i < to; i++) {
          const data = result[i];
          if (data?.[key] !== undefined) {
            points.push({
              x: xAxis.convertToPixel(i),
              y: yAxis.convertToPixel(data[key] as number),
            });
          }
        }

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      return false;
    },
  });
}

function createFibIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("fibonacci", {
    name: "SN_FIB",
    shortName: "FIB",
    series: "price",
    precision: 2,
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const fibLines = [
        { key: "fib236", color: "#B39DDB" },
        { key: "fib382", color: "#90CAF9" },
        { key: "fib500", color: "#FFFFFF" },
        { key: "fib618", color: "#A5D6A7" },
        { key: "fib786", color: "#FFCC80" },
      ];

      fibLines.forEach(({ key, color }) => {
        const points: { x: number; y: number }[] = [];
        for (let i = from; i < to; i++) {
          const data = result[i];
          if (data?.[key] !== undefined) {
            points.push({
              x: xAxis.convertToPixel(i),
              y: yAxis.convertToPixel(data[key] as number),
            });
          }
        }

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      return false;
    },
  });
}

function createPsychIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("psych", {
    name: "SN_PSYCH",
    shortName: "PSY",
    series: "price",
    precision: 2,
    calcParams: [10],
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const points: { x: number; y: number }[] = [];
      for (let i = from; i < to; i++) {
        const data = result[i];
        if (data?.psych !== undefined) {
          points.push({
            x: xAxis.convertToPixel(i),
            y: yAxis.convertToPixel(data.psych as number),
          });
        }
      }

      if (points.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "#26A69A";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      return false;
    },
  });
}

function createRocIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("roc", {
    name: "SN_ROC",
    shortName: "ROC",
    series: "normal",
    precision: 2,
    calcParams: [12],
    figures: [{ key: "roc", title: "ROC: ", type: "line" }],
  });
}

function createTsiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("tsi", {
    name: "SN_TSI",
    shortName: "TSI",
    series: "normal",
    precision: 2,
    calcParams: [25, 13, 7],
    figures: [
      { key: "tsi", title: "TSI: ", type: "line" },
      { key: "signal", title: "Signal: ", type: "line" },
    ],
  });
}

function createAroonIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("aroon", {
    name: "SN_AROON",
    shortName: "AROON",
    series: "normal",
    precision: 2,
    calcParams: [25],
    figures: [
      { key: "up", title: "Up: ", type: "line" },
      { key: "down", title: "Down: ", type: "line" },
      { key: "osc", title: "Osc: ", type: "line" },
    ],
  });
}

// Short Interest external data store
interface ShortInterestDataPoint {
  timestamp: number;
  shortPercentOfFloat: number;
  shortPercentOfOut: number;
  daysToCover: number;
  totalShortInterest: number;
}

let shortInterestData: ShortInterestDataPoint[] = [];

export function setShortInterestData(data: ShortInterestDataPoint[]) {
  shortInterestData = data;
}

export function clearShortInterestData() {
  shortInterestData = [];
}

// Helper to format large numbers
function formatShortInterest(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return value.toFixed(0);
}

// Generic statement metric data store
interface StatementMetricDataPoint {
  timestamp: number;
  value: number;
  growth?: number;
}

let statementMetricData: Record<number, StatementMetricDataPoint[]> = {};
let statementMetricGrowthSeries: Record<number, Array<number | undefined>> = {};

export function setStatementMetricData(
  metricIndex: number,
  data: StatementMetricDataPoint[],
) {
  statementMetricData[metricIndex] = data;
}

export function clearStatementMetricData(metricIndex: number) {
  delete statementMetricData[metricIndex];
  delete statementMetricGrowthSeries[metricIndex];
}

const formatStatementMetricValue = (
  value: number,
  format: StatementIndicatorFormat,
) => {
  if (format === "currency") {
    const abs = Math.abs(value);
    const prefix = value < 0 ? "-$" : "$";
    return `${prefix}${formatShortInterest(abs)}`;
  }
  if (format === "percent") {
    const scaled = Math.abs(value) <= 1 ? value * 100 : value;
    return `${scaled.toFixed(2)}%`;
  }
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const prefix = value < 0 ? "-" : "";
    return `${prefix}${formatShortInterest(abs)}`;
  }
  return value.toFixed(2);
};

const getGrowthLabelForPeriod = (period?: FinancialIndicatorPeriod) =>
  period === "quarterly" ? "QoQ Growth" : "YoY Growth";

function createStatementMetricIndicator(): IndicatorTemplate<
  IndicatorRecord,
  number,
  StatementMetricExtendData
> {
  return {
    name: "SN_STATEMENT_METRIC",
    shortName: "STAT",
    series: "normal",
    precision: 2,
    shouldFormatBigNumber: true,
    figures: [{ key: "value", title: "", type: "bar", baseValue: 0 }],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || result.value === undefined) return { legends: [] };

      const metricIndex = Number.isFinite(indicator.extendData?.metricIndex)
        ? Number(indicator.extendData?.metricIndex)
        : Array.isArray(indicator.calcParams)
          ? Number(indicator.calcParams[0])
          : NaN;
      const metric = Number.isFinite(metricIndex)
        ? STATEMENT_INDICATOR_BY_INDEX[metricIndex]
        : undefined;
      const label = metric?.label ?? indicator.shortName ?? "Value";
      const format = metric?.format ?? "number";
      const formattedValue = formatStatementMetricValue(
        result.value as number,
        format,
      );
      const color = (result.value as number) >= 0 ? "#22C55E" : "#EF4444";
      const growth = Number.isFinite(metricIndex)
        ? statementMetricGrowthSeries[metricIndex]?.[dataIndex]
        : undefined;
      const growthLabel = getGrowthLabelForPeriod(indicator.extendData?.period);

      return {
        legends: [
          {
            title: `${label}: `,
            value: { text: formattedValue, color },
          },
          ...(Number.isFinite(growth as number)
            ? [
                {
                  title: `${growthLabel}: `,
                  value: {
                    text: `${(growth as number).toFixed(1)}%`,
                    color:
                      (growth as number) >= 0 ? "#22C55E" : "#EF4444",
                  },
                },
              ]
            : []),
        ],
      };
    },
    calc: (dataList, indicator) => {
      const result: IndicatorRecord[] = new Array(dataList.length)
        .fill(null)
        .map(() => ({}));
      const metricIndex = Number.isFinite(indicator.extendData?.metricIndex)
        ? Number(indicator.extendData?.metricIndex)
        : Array.isArray(indicator.calcParams)
          ? Number(indicator.calcParams[0])
          : NaN;
      if (!Number.isFinite(metricIndex)) return result;
      const metricData = statementMetricData[metricIndex] ?? [];
      if (!metricData.length) {
        statementMetricGrowthSeries[metricIndex] = [];
        return result;
      }

      const growthSeries: Array<number | undefined> = new Array(dataList.length);

      for (const point of metricData) {
        const idx = findClosestBarIndex(dataList, point.timestamp);
        if (idx >= 0) {
          result[idx] = {
            value: point.value,
            isDataPoint: 1,
          };
          if (Number.isFinite(point.growth)) {
            growthSeries[idx] = point.growth;
          }
        }
      }

      let lastValue: number | undefined;
      let lastGrowth: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastValue = result[i].value as number;
          lastGrowth = growthSeries[i];
        }
        result[i].value = lastValue;
        growthSeries[i] = lastGrowth;
      }

      statementMetricGrowthSeries[metricIndex] = growthSeries;

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const barWidth = Math.max(
        6,
        (xAxis.convertToPixel(1) - xAxis.convertToPixel(0)) * 0.95,
      );
      const y0 = yAxis.convertToPixel(0);
      if (typeof y0 !== "number" || isNaN(y0)) return false;

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data?.isDataPoint || data.value === undefined) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.value as number);
        if (typeof y !== "number" || isNaN(y)) continue;

        const top = y < y0 ? y : y0;
        const height = Math.max(1, Math.abs(y0 - y));

        ctx.fillStyle = (data.value as number) >= 0 ? "#22C55E" : "#EF4444";
        ctx.fillRect(x - barWidth / 2, top, barWidth, height);
      }

      return true;
    },
  };
}

function createShortInterestIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_SHORT_INTEREST",
    shortName: "SI",
    series: "normal",
    precision: 2,
    minValue: 0,
    figures: [
      { key: "siFloat", title: "% Float: ", type: "bar", baseValue: 0 },
      { key: "siOut", title: "% Out: ", type: "bar", baseValue: 0 },
    ],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || result.siFloat === undefined) return { legends: [] };

      const legends = [
        { title: "% Float: ", value: { text: `${(result.siFloat as number).toFixed(2)}%`, color: "#F59E0B" } },
        { title: "% Out: ", value: { text: `${(result.siOut as number || 0).toFixed(2)}%`, color: "#3B82F6" } },
      ];

      return { legends };
    },
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));

      // Map each short interest data point to the closest bar
      for (const si of shortInterestData) {
        const idx = findClosestBarIndex(dataList, si.timestamp);
        if (idx >= 0) {
          result[idx] = {
            siFloat: si.shortPercentOfFloat,
            siOut: si.shortPercentOfOut,
            isDataPoint: 1,
          };
        }
      }

      // Carry forward values
      let lastFloat: number | undefined;
      let lastOut: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastFloat = result[i].siFloat as number;
          lastOut = result[i].siOut as number;
        }
        result[i].siFloat = lastFloat;
        result[i].siOut = lastOut;
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0 || shortInterestData.length === 0) return false;

      const fullBarWidth = Math.max(
        6,
        (xAxis.convertToPixel(1) - xAxis.convertToPixel(0)) * 0.95,
      );
      const halfBarWidth = Math.max(3, fullBarWidth / 2);
      const y0 = yAxis.convertToPixel(0);
      if (typeof y0 !== "number" || isNaN(y0)) return false;

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data?.isDataPoint) continue;

        const x = xAxis.convertToPixel(i);

        // Draw % Outstanding (blue) on left half
        if (data.siOut !== undefined) {
          const yOut = yAxis.convertToPixel(data.siOut as number);
          if (typeof yOut === "number" && !isNaN(yOut)) {
            const topOut = yOut < y0 ? yOut : y0;
            const heightOut = Math.max(1, Math.abs(y0 - yOut));
            ctx.fillStyle = "#3B82F6";
            ctx.fillRect(x - halfBarWidth, topOut, halfBarWidth - 1, heightOut);
          }
        }

        // Draw % Float (orange) on right half
        if (data.siFloat !== undefined) {
          const yFloat = yAxis.convertToPixel(data.siFloat as number);
          if (typeof yFloat === "number" && !isNaN(yFloat)) {
            const topFloat = yFloat < y0 ? yFloat : y0;
            const heightFloat = Math.max(1, Math.abs(y0 - yFloat));
            ctx.fillStyle = "#F59E0B";
            ctx.fillRect(x + 1, topFloat, halfBarWidth - 1, heightFloat);
          }
        }
      }

      return true;
    },
  };
}

// ===== Fail-to-Deliver External Data =====
interface FTDDataPoint {
  timestamp: number;
  ftdShares: number;
}

let ftdData: FTDDataPoint[] = [];

export function setFTDData(data: FTDDataPoint[]) {
  ftdData = data;
}

export function clearFTDData() {
  ftdData = [];
}

function createFTDIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_FTD",
    shortName: "FTD",
    series: "normal",
    precision: 0,
    minValue: 0,
    shouldFormatBigNumber: true,
    // Figure needed for Y-axis scaling calculation
    figures: [
      { key: "ftdShares", title: "FTD Shares: ", type: "bar", baseValue: 0 },
    ],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || !result.isDataPoint || result.ftdShares === undefined) return { legends: [] };

      return {
        legends: [
          { title: "FTD Shares: ", value: { text: formatShortInterest(result.ftdShares as number), color: "#F97316" } },
        ],
      };
    },
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));

      if (ftdData.length === 0) {
        return result;
      }

      // Map each FTD data point to the closest bar - no carry forward
      for (const ftd of ftdData) {
        if (!ftd || !ftd.timestamp) continue;
        const idx = findClosestBarIndex(dataList, ftd.timestamp);
        if (idx >= 0) {
          result[idx] = {
            ftdShares: ftd.ftdShares,
            isDataPoint: 1,
          };
        }
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0 || ftdData.length === 0) return true;

      const barWidth = Math.max(6, (xAxis.convertToPixel(1) - xAxis.convertToPixel(0)) * 0.95);
      const y0 = yAxis.convertToPixel(0);
      if (typeof y0 !== "number" || isNaN(y0)) return true;

      for (let i = from; i < to; i++) {
        const data = result[i];
        // Only draw bars where we have actual data points
        if (!data || !data.isDataPoint || data.ftdShares === undefined || data.ftdShares === 0) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.ftdShares as number);

        if (typeof y !== "number" || isNaN(y)) continue;

        const height = Math.max(1, Math.abs(y0 - y));
        ctx.fillStyle = "#F97316";
        ctx.fillRect(x - barWidth / 2, Math.min(y, y0), barWidth, height);
      }

      // Return true to prevent default figure rendering (avoids duplicate bars)
      return true;
    },
  };
}

// ===== Max Pain External Data =====
interface MaxPainDataPoint {
  timestamp: number;
  maxPain: number;
  expirationDate: string;
}

let maxPainData: MaxPainDataPoint[] = [];

export function setMaxPainData(data: MaxPainDataPoint[]) {
  maxPainData = data;
}

export function clearMaxPainData() {
  maxPainData = [];
}

function createMaxPainIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_MAX_PAIN",
    shortName: "MP",
    series: "price",
    precision: 2,
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));

      // Map each max pain data point to the closest bar
      for (const mp of maxPainData) {
        const idx = findClosestBarIndex(dataList, mp.timestamp);
        if (idx >= 0) {
          result[idx] = {
            maxPain: mp.maxPain,
            isDataPoint: 1,
          };
        }
      }

      // Carry forward values
      let lastMaxPain: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastMaxPain = result[i].maxPain as number;
        }
        result[i].maxPain = lastMaxPain;
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const points: { x: number; y: number }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data || data.maxPain === undefined) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.maxPain as number);
        if (typeof y === "number" && !isNaN(y)) {
          points.push({ x, y });
        }
      }

      // Draw step line for max pain
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.setLineDash([8, 4]);
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      return false;
    },
  };
}

// ===== Analyst Price Target External Data =====
interface AnalystTargetDataPoint {
  timestamp: number;
  highTarget: number;
  averageTarget: number;
  lowTarget: number;
}

let analystTargetData: AnalystTargetDataPoint[] = [];

export function setAnalystTargetData(data: AnalystTargetDataPoint[]) {
  analystTargetData = data;
}

export function clearAnalystTargetData() {
  analystTargetData = [];
}

function createAnalystTargetIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_ANALYST_TARGET",
    shortName: "PT",
    series: "price",
    precision: 2,
    figures: [],
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));

      // Map each analyst target data point to the closest bar
      for (const at of analystTargetData) {
        const idx = findClosestBarIndex(dataList, at.timestamp);
        if (idx >= 0) {
          result[idx] = {
            highTarget: at.highTarget,
            avgTarget: at.averageTarget,
            lowTarget: at.lowTarget,
            isDataPoint: 1,
          };
        }
      }

      // Carry forward values
      let lastHigh: number | undefined;
      let lastAvg: number | undefined;
      let lastLow: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastHigh = result[i].highTarget as number;
          lastAvg = result[i].avgTarget as number;
          lastLow = result[i].lowTarget as number;
        }
        result[i].highTarget = lastHigh;
        result[i].avgTarget = lastAvg;
        result[i].lowTarget = lastLow;
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      const highPoints: { x: number; y: number }[] = [];
      const avgPoints: { x: number; y: number }[] = [];
      const lowPoints: { x: number; y: number }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data) continue;

        const x = xAxis.convertToPixel(i);

        if (data.highTarget !== undefined) {
          const y = yAxis.convertToPixel(data.highTarget as number);
          if (typeof y === "number" && !isNaN(y)) {
            highPoints.push({ x, y });
          }
        }
        if (data.avgTarget !== undefined) {
          const y = yAxis.convertToPixel(data.avgTarget as number);
          if (typeof y === "number" && !isNaN(y)) {
            avgPoints.push({ x, y });
          }
        }
        if (data.lowTarget !== undefined) {
          const y = yAxis.convertToPixel(data.lowTarget as number);
          if (typeof y === "number" && !isNaN(y)) {
            lowPoints.push({ x, y });
          }
        }
      }

      // Draw band fill between high and low
      if (highPoints.length >= 2 && lowPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(highPoints[0].x, highPoints[0].y);
        for (let i = 1; i < highPoints.length; i++) {
          ctx.lineTo(highPoints[i].x, highPoints[i].y);
        }
        for (let i = lowPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(lowPoints[i].x, lowPoints[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
        ctx.fill();
      }

      // Draw step lines
      const drawStepLine = (points: { x: number; y: number }[], color: string, dash: number[] = []) => {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawStepLine(highPoints, "#22C55E", [4, 4]);
      drawStepLine(avgPoints, "#22C55E");
      drawStepLine(lowPoints, "#22C55E", [4, 4]);

      return false;
    },
  };
}

// ===== Revenue Trend External Data =====
interface RevenueDataPoint {
  timestamp: number;
  revenue: number;
  revenueGrowth: number;
}

let revenueData: RevenueDataPoint[] = [];
let revenueGrowthSeries: Array<number | undefined> = [];

export function setRevenueData(data: RevenueDataPoint[]) {
  revenueData = data;
}

export function clearRevenueData() {
  revenueData = [];
  revenueGrowthSeries = [];
}

const timestampCache = new WeakMap<KLineData[], number[]>();

const getTimestampSeries = (dataList: KLineData[]) => {
  let timestamps = timestampCache.get(dataList);
  if (!timestamps) {
    timestamps = dataList.map((bar, index) =>
      typeof bar?.timestamp === "number" ? bar.timestamp : index,
    );
    timestampCache.set(dataList, timestamps);
  }
  return timestamps;
};

// Helper to find closest bar index for a timestamp
function findClosestBarIndex(
  dataList: KLineData[],
  targetTimestamp: number,
): number {
  if (!dataList.length || !Number.isFinite(targetTimestamp)) return -1;

  const timestamps = getTimestampSeries(dataList);
  const maxDiff = 24 * 60 * 60 * 1000 * 7;

  let left = 0;
  let right = timestamps.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    const value = timestamps[mid];
    if (value === targetTimestamp) return mid;
    if (value < targetTimestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  const rightIndex = Math.min(left, timestamps.length - 1);
  const leftIndex = Math.max(rightIndex - 1, 0);
  const leftDiff = Math.abs(timestamps[leftIndex] - targetTimestamp);
  const rightDiff = Math.abs(timestamps[rightIndex] - targetTimestamp);
  const closestIndex = leftDiff <= rightDiff ? leftIndex : rightIndex;

  return Math.abs(timestamps[closestIndex] - targetTimestamp) < maxDiff
    ? closestIndex
    : -1;
}

function createRevenueIndicator(): IndicatorTemplate<
  IndicatorRecord,
  number,
  FinancialIndicatorExtendData
> {
  return {
    name: "SN_REVENUE",
    shortName: "REV",
    series: "normal",
    precision: 0,
    minValue: 0,
    shouldFormatBigNumber: true,
    figures: [
      { key: "revenue", title: "Revenue: ", type: "bar", baseValue: 0 },
    ],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || result.revenue === undefined) return { legends: [] };

      const growth = revenueGrowthSeries[dataIndex];
      const growthColor =
        Number.isFinite(growth as number) && (growth as number) >= 0
          ? "#22C55E"
          : "#EF4444";
      const growthLabel = getGrowthLabelForPeriod(indicator.extendData?.period);
      const revenueColor = (result.revenue as number) >= 0 ? "#22C55E" : "#EF4444";

      return {
        legends: [
          { title: "Revenue: ", value: { text: `$${formatShortInterest(result.revenue as number)}`, color: revenueColor } },
          ...(Number.isFinite(growth as number)
            ? [
                {
                  title: `${growthLabel}: `,
                  value: {
                    text: `${(growth as number).toFixed(1)}%`,
                    color: growthColor,
                  },
                },
              ]
            : []),
        ],
      };
    },
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));
      const growthSeries: Array<number | undefined> = new Array(
        dataList.length,
      );

      console.log("[SN_REVENUE] calc called, revenueData.length:", revenueData.length, "dataList.length:", dataList.length);

      if (revenueData.length === 0) {
        console.warn("[SN_REVENUE] No revenue data available for calculation");
        revenueGrowthSeries = [];
        return result;
      }

      // Map each revenue data point to the closest bar
      let mappedCount = 0;
      for (const rev of revenueData) {
        if (!rev || !rev.timestamp) continue;
        const idx = findClosestBarIndex(dataList, rev.timestamp);
        if (idx >= 0) {
          result[idx] = {
            revenue: rev.revenue,
            isDataPoint: 1, // Mark actual data points
          };
          growthSeries[idx] = rev.revenueGrowth;
          mappedCount++;
        }
      }

      console.log("[SN_REVENUE] Mapped", mappedCount, "of", revenueData.length, "data points to bars");

      // Carry forward values for step display
      let lastRevenue: number | undefined;
      let lastGrowth: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastRevenue = result[i].revenue as number;
          lastGrowth = growthSeries[i];
        }
        result[i].revenue = lastRevenue;
        growthSeries[i] = lastGrowth;
      }

      revenueGrowthSeries = growthSeries;

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0 || revenueData.length === 0) return false;

      const barWidth = Math.max(
        6,
        (xAxis.convertToPixel(1) - xAxis.convertToPixel(0)) * 0.95,
      );
      const y0 = yAxis.convertToPixel(0);
      if (typeof y0 !== "number" || isNaN(y0)) return false;

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data?.isDataPoint || data.revenue === undefined) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.revenue as number);
        if (typeof y !== "number" || isNaN(y)) continue;

        const top = y < y0 ? y : y0;
        const height = Math.max(1, Math.abs(y0 - y));

        ctx.fillStyle = (data.revenue as number) >= 0 ? "#22C55E" : "#EF4444";
        ctx.fillRect(x - barWidth / 2, top, barWidth, height);
      }

      return true;
    },
  };
}

// ===== EPS Trend External Data =====
interface EPSDataPoint {
  timestamp: number;
  eps: number;
  epsGrowth?: number;
  epsSurprise?: number;
}

let epsData: EPSDataPoint[] = [];
let epsGrowthSeries: Array<number | undefined> = [];

export function setEPSData(data: EPSDataPoint[]) {
  epsData = data;
}

export function clearEPSData() {
  epsData = [];
  epsGrowthSeries = [];
}

function createEPSIndicator(): IndicatorTemplate<
  IndicatorRecord,
  number,
  FinancialIndicatorExtendData
> {
  return {
    name: "SN_EPS",
    shortName: "EPS",
    series: "normal",
    precision: 2,
    figures: [
      { key: "eps", title: "EPS: ", type: "bar", baseValue: 0 },
    ],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || result.eps === undefined) return { legends: [] };

      const epsValue = result.eps as number;
      const epsColor = epsValue >= 0 ? "#22C55E" : "#EF4444";
      const growth = epsGrowthSeries[dataIndex];
      const growthColor =
        Number.isFinite(growth as number) && (growth as number) >= 0
          ? "#22C55E"
          : "#EF4444";
      const growthLabel = getGrowthLabelForPeriod(indicator.extendData?.period);

      const legends = [
        {
          title: "EPS: ",
          value: { text: `$${epsValue.toFixed(2)}`, color: epsColor },
        },
      ];

      if (Number.isFinite(growth as number)) {
        legends.push({
          title: `${growthLabel}: `,
          value: {
            text: `${(growth as number).toFixed(1)}%`,
            color: growthColor,
          },
        });
      }

      return { legends };
    },
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));
      const growthSeries: Array<number | undefined> = new Array(dataList.length);

      // Map each EPS data point to the closest bar
      for (const e of epsData) {
        const idx = findClosestBarIndex(dataList, e.timestamp);
        if (idx >= 0) {
          result[idx] = {
            eps: e.eps,
            isDataPoint: 1,
          };
          growthSeries[idx] = e.epsGrowth;
        }
      }

      // Carry forward values for step display
      let lastEPS: number | undefined;
      let lastGrowth: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastEPS = result[i].eps as number;
          lastGrowth = growthSeries[i];
        }
        result[i].eps = lastEPS;
        growthSeries[i] = lastGrowth;
      }

      epsGrowthSeries = growthSeries;

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0 || epsData.length === 0) return false;

      const barWidth = Math.max(
        6,
        (xAxis.convertToPixel(1) - xAxis.convertToPixel(0)) * 0.95,
      );
      const y0 = yAxis.convertToPixel(0);
      if (typeof y0 !== "number" || isNaN(y0)) return false;

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data?.isDataPoint || data.eps === undefined) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.eps as number);
        if (typeof y !== "number" || isNaN(y)) continue;

        const top = y < y0 ? y : y0;
        const height = Math.max(1, Math.abs(y0 - y));

        ctx.fillStyle = (data.eps as number) >= 0 ? "#22C55E" : "#EF4444";
        ctx.fillRect(x - barWidth / 2, top, barWidth, height);
      }

      return true;
    },
  };
}

// ===== Market Cap External Data =====
interface MarketCapDataPoint {
  timestamp: number;
  marketCap: number;
}

let marketCapData: MarketCapDataPoint[] = [];

export function setMarketCapData(data: MarketCapDataPoint[]) {
  marketCapData = data;
}

export function clearMarketCapData() {
  marketCapData = [];
}

function createMarketCapIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_MARKET_CAP",
    shortName: "MCAP",
    series: "normal",
    precision: 0,
    minValue: 0,
    shouldFormatBigNumber: true,
    figures: [
      { key: "marketCap", title: "Market Cap: ", type: "line" },
    ],
    createTooltipDataSource: ({ crosshair, indicator }) => {
      const dataIndex = crosshair.dataIndex;
      if (dataIndex === undefined || !indicator.result) return { legends: [] };

      const result = indicator.result[dataIndex] as IndicatorRecord | undefined;
      if (!result || result.marketCap === undefined) return { legends: [] };

      return {
        legends: [
          { title: "Market Cap: ", value: { text: `$${formatShortInterest(result.marketCap as number)}`, color: "#A855F7" } },
        ],
      };
    },
    calc: (dataList) => {
      const result: IndicatorRecord[] = new Array(dataList.length).fill(null).map(() => ({}));

      console.log("[SN_MARKET_CAP] calc called, marketCapData.length:", marketCapData.length, "dataList.length:", dataList.length);

      if (marketCapData.length === 0) {
        console.warn("[SN_MARKET_CAP] No market cap data available for calculation");
        return result;
      }

      // Map each market cap data point to the closest bar
      let mappedCount = 0;
      for (const m of marketCapData) {
        if (!m || !m.timestamp) continue;
        const idx = findClosestBarIndex(dataList, m.timestamp);
        if (idx >= 0) {
          result[idx] = {
            marketCap: m.marketCap,
            isDataPoint: 1,
          };
          mappedCount++;
        }
      }

      console.log("[SN_MARKET_CAP] Mapped", mappedCount, "of", marketCapData.length, "data points to bars");

      // Carry forward values for step display
      let lastMCap: number | undefined;
      for (let i = 0; i < result.length; i++) {
        if (result[i].isDataPoint) {
          lastMCap = result[i].marketCap as number;
        }
        result[i].marketCap = lastMCap;
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0 || marketCapData.length === 0) return false;

      const points: { x: number; y: number; isDataPoint: boolean }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data || data.marketCap === undefined) continue;

        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(data.marketCap as number);
        if (typeof y === "number" && !isNaN(y)) {
          points.push({ x, y, isDataPoint: Boolean(data.isDataPoint) });
        }
      }

      if (points.length >= 2) {
        // Draw area fill under the line
        const chartHeight = chart.getSize()?.height || 0;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, chartHeight);
        ctx.lineTo(points[0].x, chartHeight);
        ctx.closePath();
        ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
        ctx.fill();

        // Draw smooth line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "#A855F7";
        ctx.lineWidth = 2;
        ctx.stroke();

      }

      return false;
    },
  };
}

export function registerCustomIndicators() {
  if (registered) return;
  registerIndicator(createMaIndicator());
  registerIndicator(createEmaIndicator());
  registerIndicator(createBollIndicator());
  registerIndicator(createVwapIndicator());
  registerIndicator(createVolumeIndicator());
  registerIndicator(createRsiIndicator());
  registerIndicator(createMacdIndicator());
  registerIndicator(createAtrIndicator());
  registerIndicator(createStochIndicator());
  registerIndicator(createStochCrossoverIndicator());
  registerIndicator(createObvIndicator());
  registerIndicator(createCciIndicator());
  registerIndicator(createWilliamsIndicator());
  registerIndicator(createMfiIndicator());
  registerIndicator(createSarIndicator());
  registerIndicator(createDonchianIndicator());
  registerIndicator(createStdIndicator());
  registerIndicator(createHistVolIndicator());
  registerIndicator(createChaikinVolIndicator());
  registerIndicator(createPivotIndicator());
  registerIndicator(createFibIndicator());
  registerIndicator(createPsychIndicator());
  registerIndicator(createRocIndicator());
  registerIndicator(createTsiIndicator());
  registerIndicator(createAroonIndicator());
  registerIndicator(createShortInterestIndicator());
  // New fundamental & options indicators
  registerIndicator(createFTDIndicator());
  registerIndicator(createMaxPainIndicator());
  registerIndicator(createAnalystTargetIndicator());
  registerIndicator(createRevenueIndicator());
  registerIndicator(createEPSIndicator());
  registerIndicator(createMarketCapIndicator());
  registerIndicator(createStatementMetricIndicator());
  registered = true;
}
