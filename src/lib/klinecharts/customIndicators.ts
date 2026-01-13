import { registerIndicator, utils } from "klinecharts";
import type { IndicatorTemplate, KLineData } from "klinecharts";
import { getIndicatorEngine } from "./indicatorEngine";

let registered = false;

type IndicatorRecord = Record<string, number | undefined>;

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

function createShortInterestIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_SHORT_INTEREST",
    shortName: "SI",
    series: "normal",
    precision: 2,
    minValue: 0,
    // figures are required for KlineCharts to calculate y-axis range
    // we use custom draw for step lines, returning false prevents default line drawing
    figures: [
      { key: "siFloat", title: "% Float: ", type: "line" },
      { key: "siOut", title: "% Out: ", type: "line" },
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
      // Map short interest data to price bars
      // Short interest is sparse, so we carry forward the last known values
      const result: IndicatorRecord[] = [];
      let lastFloat: number | undefined;
      let lastOut: number | undefined;

      for (const bar of dataList) {
        // Check if there's short interest data for this bar's date
        const barDate = new Date(bar.timestamp);
        barDate.setHours(0, 0, 0, 0);
        const normalizedTimestamp = barDate.getTime();

        // Check for exact match or within same day
        for (const si of shortInterestData) {
          const siDate = new Date(si.timestamp);
          siDate.setHours(0, 0, 0, 0);
          if (siDate.getTime() === normalizedTimestamp) {
            lastFloat = si.shortPercentOfFloat;
            lastOut = si.shortPercentOfOut;
            break;
          }
        }

        result.push({
          siFloat: lastFloat,
          siOut: lastOut,
        });
      }

      return result;
    },
    draw: ({ ctx, chart, indicator, xAxis, yAxis }) => {
      const { from, to } = chart.getVisibleRange();
      const result = indicator.result as IndicatorRecord[];
      if (!result || result.length === 0) return false;

      // Collect points for each metric
      const floatPoints: { x: number; y: number; value: number }[] = [];
      const outPoints: { x: number; y: number; value: number }[] = [];

      for (let i = from; i < to; i++) {
        const data = result[i];
        if (!data) continue;

        const x = xAxis.convertToPixel(i);

        if (data.siFloat !== undefined && data.siFloat !== null) {
          const y = yAxis.convertToPixel(data.siFloat as number);
          if (typeof y === "number" && !isNaN(y)) {
            floatPoints.push({
              x,
              y,
              value: data.siFloat as number,
            });
          }
        }

        if (data.siOut !== undefined && data.siOut !== null) {
          const y = yAxis.convertToPixel(data.siOut as number);
          if (typeof y === "number" && !isNaN(y)) {
            outPoints.push({
              x,
              y,
              value: data.siOut as number,
            });
          }
        }
      }

      // Helper to draw step line
      const drawStepLine = (points: { x: number; y: number; value: number }[], color: string, lineWidth: number) => {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          // Step line: horizontal first, then vertical
          ctx.lineTo(points[i].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      // Helper to draw dots at data change points
      const drawDots = (points: { x: number; y: number; value: number }[], color: string) => {
        let prevValue: number | null = null;
        for (const point of points) {
          if (prevValue === null || point.value !== prevValue) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            prevValue = point.value;
          }
        }
      };

      // Draw % Outstanding (blue) first so % Float is on top
      drawStepLine(outPoints, "#3B82F6", 1.5);
      drawDots(outPoints, "#3B82F6");

      // Draw % Float (orange, primary)
      drawStepLine(floatPoints, "#F59E0B", 2);
      drawDots(floatPoints, "#F59E0B");

      // Return false to prevent default figure drawing (we drew custom step lines)
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
  registered = true;
}
