<script lang="ts">
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";
  import { screenWidth } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { mode } from "mode-watcher";
  import SEO from "$lib/components/SEO.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { onMount, onDestroy } from "svelte";

  export let data;
  let config;
  let configBarChart;
  let configOI;
  let configOIPutCall;
  let configVolume;
  let configVolumePutCall;
  let configFearAndGreed = null;
  let configHeatmap = null;

  let marketTideData = Array.isArray(data?.getData?.marketTide)
    ? (data?.getData?.marketTide ?? [])
    : [];
  let sectorFlow = Array.isArray(data?.getData?.sectorFlow)
    ? (data?.getData?.sectorFlow ?? [])
    : [];
  let overview = data?.getData?.overview ?? {};
  let marketFlowDate =
    typeof data?.getData?.date === "string" ? data.getData.date : "";

  let fearAndGreedValue = data?.getFearAndGreed?.current?.value || 50;
  let currentCategory = data?.getFearAndGreed?.current?.category || "Neutral";

  let isPro = data?.user?.tier === "Pro";

  let marketFlowSocket: WebSocket | null = null;
  let marketFlowReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastMarketFlowSignature: string | null = null;
  let marketFlowSocketEnabled = false;
  let marketFlowRefreshInterval: ReturnType<typeof setInterval> | null = null;

  const MARKET_FLOW_RECONNECT_DELAY = 5000;
  const MARKET_FLOW_REFRESH_INTERVAL_MS = 10000;

  function cleanupMarketFlowSocket() {
    if (marketFlowReconnectTimer) {
      clearTimeout(marketFlowReconnectTimer);
      marketFlowReconnectTimer = null;
    }

    if (marketFlowRefreshInterval) {
      clearInterval(marketFlowRefreshInterval);
      marketFlowRefreshInterval = null;
    }

    if (marketFlowSocket) {
      try {
        marketFlowSocket.close();
      } catch (error) {
        console.error("Error closing market flow socket:", error);
      }
    }

    marketFlowSocket = null;
    lastMarketFlowSignature = null;
  }

  function scheduleMarketFlowReconnect() {
    if (!marketFlowSocketEnabled || marketFlowReconnectTimer) {
      return;
    }

    marketFlowReconnectTimer = setTimeout(() => {
      marketFlowReconnectTimer = null;
      if (typeof window !== "undefined") {
        connectMarketFlowSocket();
      }
    }, MARKET_FLOW_RECONNECT_DELAY);
  }

  function handleMarketFlowMessage(raw: unknown) {
    if (typeof raw !== "string" || raw.length === 0) {
      return;
    }

    if (lastMarketFlowSignature === raw) {
      return;
    }
    lastMarketFlowSignature = raw;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.error("Failed parsing market flow payload:", error);
      return;
    }

    if (Array.isArray(payload?.marketTide)) {
      marketTideData = payload.marketTide;
    }

    if (Array.isArray(payload?.sectorFlow)) {
      sectorFlow = payload.sectorFlow;
    }

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      overview = payload?.overview ?? overview;
      if (typeof payload?.date === "string") {
        marketFlowDate = payload.date;
      }
    }
  }

  function connectMarketFlowSocket() {
    if (!marketFlowSocketEnabled) {
      return;
    }
    if (
      typeof window === "undefined" ||
      !data?.wsURL ||
      (marketFlowSocket &&
        (marketFlowSocket.readyState === WebSocket.CONNECTING ||
          marketFlowSocket.readyState === WebSocket.OPEN))
    ) {
      return;
    }

    cleanupMarketFlowSocket();

    try {
      marketFlowSocket = new WebSocket(`${data.wsURL}/market-flow`);
    } catch (error) {
      console.error("Failed establishing market flow socket:", error);
      scheduleMarketFlowReconnect();
      return;
    }

    marketFlowSocket.addEventListener("open", () => {
      if (marketFlowReconnectTimer) {
        clearTimeout(marketFlowReconnectTimer);
        marketFlowReconnectTimer = null;
      }
      if (!marketFlowRefreshInterval) {
        marketFlowRefreshInterval = setInterval(() => {
          if (
            marketFlowSocket &&
            marketFlowSocket.readyState === WebSocket.OPEN
          ) {
            try {
              marketFlowSocket.send(JSON.stringify({ type: "refresh" }));
            } catch (error) {
              console.error(
                "Failed sending market flow refresh request:",
                error,
              );
            }
          } else if (!marketFlowReconnectTimer) {
            connectMarketFlowSocket();
          }
        }, MARKET_FLOW_REFRESH_INTERVAL_MS);
      }
    });

    marketFlowSocket.addEventListener("message", (event) => {
      handleMarketFlowMessage(event?.data);
    });

    marketFlowSocket.addEventListener("close", () => {
      cleanupMarketFlowSocket();
      scheduleMarketFlowReconnect();
    });

    marketFlowSocket.addEventListener("error", (error) => {
      console.error("Market flow socket error:", error);
      if (marketFlowSocket) {
        try {
          marketFlowSocket.close();
        } catch (closeError) {
          console.error(
            "Failed closing errored market flow socket:",
            closeError,
          );
        }
      }
    });
  }

  onMount(() => {
    marketFlowSocketEnabled = isPro;
    if (isPro) {
      connectMarketFlowSocket();
    }

    return () => {
      marketFlowSocketEnabled = false;
      cleanupMarketFlowSocket();
    };
  });

  onDestroy(() => {
    marketFlowSocketEnabled = false;
    cleanupMarketFlowSocket();
  });

  function findLastNonNull(dataArray, key) {
    if (!Array.isArray(dataArray)) {
      return null;
    }

    for (let i = dataArray.length - 1; i >= 0; i--) {
      if (
        dataArray[i]?.net_call_premium !== null &&
        dataArray[i]?.net_call_premium !== undefined
      ) {
        return dataArray[i][key];
      }
    }
    return null; // Return null if no non-null value is found.
  }

  function plotFearAndGreed() {
    const inactiveColor = $mode === "light" ? "#EFEFEF" : "#2E2E2E";
    const getSegmentColor = (segmentName) => {
      if (fearAndGreedValue <= 25 && segmentName === "extremeFear")
        return "#EA6A47";
      if (
        fearAndGreedValue > 25 &&
        fearAndGreedValue <= 45 &&
        segmentName === "fear"
      )
        return "#F89E4F";
      if (
        fearAndGreedValue > 45 &&
        fearAndGreedValue <= 55 &&
        segmentName === "neutral"
      )
        return "#FDDD5C";
      if (
        fearAndGreedValue > 55 &&
        fearAndGreedValue <= 75 &&
        segmentName === "greed"
      )
        return "#93D3C1";
      if (fearAndGreedValue > 75 && segmentName === "extremeGreed")
        return "#5AC864";
      return inactiveColor;
    };

    // border color for the active band (mint outline shown on screenshot)
    const getBorderColor = (segmentName) => {
      // only return visible border for the currently active segment
      if (fearAndGreedValue <= 25 && segmentName === "extremeFear")
        return "#D94A30";
      if (
        fearAndGreedValue > 25 &&
        fearAndGreedValue <= 45 &&
        segmentName === "fear"
      )
        return "#D87A2B";
      if (
        fearAndGreedValue > 45 &&
        fearAndGreedValue <= 55 &&
        segmentName === "neutral"
      )
        return "#CFAF2A";
      if (
        fearAndGreedValue > 55 &&
        fearAndGreedValue <= 75 &&
        segmentName === "greed"
      )
        return "#26A892"; // mint/teal border
      if (fearAndGreedValue > 75 && segmentName === "extremeGreed")
        return "#47B84A";
      return "transparent";
    };

    // helper to check whether a segment is currently active
    const isActive = (segmentName) => {
      if (segmentName === "extremeFear") return fearAndGreedValue <= 25;
      if (segmentName === "fear")
        return fearAndGreedValue > 25 && fearAndGreedValue <= 45;
      if (segmentName === "neutral")
        return fearAndGreedValue > 45 && fearAndGreedValue <= 55;
      if (segmentName === "greed")
        return fearAndGreedValue > 55 && fearAndGreedValue <= 75;
      if (segmentName === "extremeGreed") return fearAndGreedValue > 75;
      return false;
    };

    // helper to return label text (or null when inactive). Accepts an optional HTML label for multi-line labels.
    const getLabelText = (segmentName, labelHtml) => {
      // hide label entirely on small screens as before
      if ($screenWidth < 640) return null;
      return isActive(segmentName) ? labelHtml : null;
    };

    const options = {
      credits: { enabled: false },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false, // disable chart-level animation
      },

      // Disable animations globally for series/gauge and disable hover states
      plotOptions: {
        series: {
          animation: false,
          states: {
            hover: { enabled: false },
            inactive: { enabled: false },
          },
          dataLabels: {
            animation: false,
          },
        },
        gauge: {
          animation: false,
        },
      },

      title: {
        text: `
    <div class="text-center mt-3 -mb-12">
        <!-- Circle wrapper -->
        <div
            class="w-[55px] h-[55px] sm:w-[70px] sm:h-[70px] rounded-full
                   ${
                     $mode === "light"
                       ? "bg-black shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
                       : "bg-[#fff] shadow-[0_6px_16px_rgba(0,0,0,0.4)]"
                   }
                   flex items-center justify-center mx-auto"
        >
            <div class="text-xl font-extrabold ${$mode === "light" ? "text-white" : "text-black"}">
                ${fearAndGreedValue}
            </div>
        </div>

        <!-- Subtitle -->
        <div class="text-sm sm:hidden capitalize ${$mode === "light" ? "text-gray-800" : "text-gray-100"} mt-2">
            ${currentCategory}
        </div>
    </div>
    `,
        useHTML: true,
        verticalAlign: "middle",
        y: 70,
      },
      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            backgroundColor: "transparent",
            borderWidth: 0,
            outerRadius: "100%",
          },
          {
            backgroundColor: $mode === "light" ? "#ffffff" : "#18181b",
            borderWidth: 0,
            innerRadius: "60%",
            outerRadius: "60%",
            shape: "arc",
          },
        ],
        center: ["50%", "75%"],
        size: "100%",
      },
      yAxis: {
        min: 0,
        max: 100,
        tickPositions: [0, 25, 50, 75, 100],
        minorTickInterval: null,
        tickLength: 0,
        tickWidth: 0,
        labels: {
          distance: 20,
          style: {
            color: $mode === "light" ? "#6b7280" : "#d1d5db",
            fontSize: "13px",
            fontWeight: "600",
          },
          formatter: function () {
            return [0, 25, 50, 75, 100].includes(this.value) ? this.value : "";
          },
        },
        lineWidth: 0,
        plotBands: [
          {
            from: 0,
            to: 25,
            color: getSegmentColor("extremeFear"),
            thickness: 36,
            borderColor: getBorderColor("extremeFear"),
            borderWidth:
              getBorderColor("extremeFear") === "transparent" ? 0 : 3,
            label: {
              text: getLabelText("extremeFear", "EXTREME<br/>FEAR"),
              useHTML: true,
              align: "center",
              verticalAlign: "middle",
              x: 40,
              y: -22,
              style: {
                color: isActive("extremeFear")
                  ? "#fff"
                  : $mode === "light"
                    ? "#000"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
              },
            },
          },
          {
            from: 25,
            to: 45,
            color: getSegmentColor("fear"),
            thickness: 36,
            borderColor: getBorderColor("fear"),
            borderWidth: getBorderColor("fear") === "transparent" ? 0 : 3,
            label: {
              text: getLabelText("fear", "FEAR"),
              align: "center",
              verticalAlign: "middle",
              x: 55,
              y: -44,
              style: {
                color: isActive("fear")
                  ? "#fff"
                  : $mode === "light"
                    ? "#000"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: "600",
              },
            },
          },
          {
            from: 45,
            to: 55,
            color: getSegmentColor("neutral"),
            thickness: 36,
            borderColor: getBorderColor("neutral"),
            borderWidth: getBorderColor("neutral") === "transparent" ? 0 : 3,
            label: {
              text: getLabelText("neutral", "NEUTRAL"),
              align: "center",
              verticalAlign: "middle",
              x: -200,
              y: -40,
              style: {
                color: isActive("neutral")
                  ? $mode === "light"
                    ? "#333"
                    : "#e5e7eb"
                  : $mode === "light"
                    ? "#000"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: "600",
              },
            },
          },
          {
            from: 55,
            to: 75,
            color: getSegmentColor("greed"),
            thickness: 36,
            borderColor: getBorderColor("greed"),
            borderWidth: getBorderColor("greed") === "transparent" ? 0 : 3,
            label: {
              text: getLabelText("greed", "GREED"),
              align: "center",
              verticalAlign: "middle",
              x: -30,
              y: -44,
              style: {
                color: isActive("greed")
                  ? $mode === "light"
                    ? "#333"
                    : "#e5e7eb"
                  : $mode === "light"
                    ? "#000"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: "600",
              },
            },
          },
          {
            from: 75,
            to: 100,
            color: getSegmentColor("extremeGreed"),
            thickness: 36,
            borderColor: getBorderColor("extremeGreed"),
            borderWidth:
              getBorderColor("extremeGreed") === "transparent" ? 0 : 3,
            label: {
              text: getLabelText("extremeGreed", "EXTREME<br/>GREED"),
              useHTML: true,
              align: "center",
              verticalAlign: "middle",
              x: -50,
              y: -22,
              style: {
                color: isActive("extremeGreed")
                  ? "#fff"
                  : $mode === "light"
                    ? "#000"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
              },
            },
          },
        ],
      },
      series: [
        {
          name: "Fear & Greed",
          data: [fearAndGreedValue],
          animation: false, // disable series-level animation
          tooltip: { valueSuffix: "" },
          dataLabels: { enabled: false, animation: false },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#161616" : "#fff", // black vs golden needle
            baseWidth: 10,
            baseLength: "10%",
            rearLength: "-10%",
            topWidth: 1,
          },
          pivot: {
            backgroundColor: $mode === "light" ? "#fff" : "#1f2937",
            radius: 6,
            borderColor: $mode === "light" ? "#000" : "#e5e7eb",
            borderWidth: 1,
          },
          states: {
            hover: { enabled: false },
          },
        },
      ],
      tooltip: { enabled: false },
    };

    return options;
  }

  function plotDataFlow() {
    // Determine the base date (using the first data point, or fallback to today)
    const baseDate =
      marketTideData && marketTideData.length
        ? new Date(marketTideData[0]?.time)
        : new Date();

    // Set the fixed start and end times (9:30 and 16:10)
    const startTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      9,
      30,
    ).getTime();
    const endTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      16,
      10,
    ).getTime();

    // Create series arrays with x (timestamp) and y values.
    const priceSeries =
      marketTideData?.map((item) => ({
        x: new Date(item.time).getTime(),
        y: item.close,
      })) || [];

    const netCallPremSeries =
      marketTideData?.map((item) => ({
        x: new Date(item.time).getTime(),
        y: item.net_call_premium,
      })) || [];

    const netPutPremSeries =
      marketTideData?.map((item) => ({
        x: new Date(item.time).getTime(),
        y: item.net_put_premium,
      })) || [];

    // Function to detect crossing points between two series
    function findCrossingPoints(series1, series2, priceSeries) {
      const crossingPoints = [];

      for (let i = 1; i < series1.length && i < series2.length; i++) {
        const prev1 = series1[i - 1]?.y;
        const curr1 = series1[i]?.y;
        const prev2 = series2[i - 1]?.y;
        const curr2 = series2[i]?.y;

        // Check if lines crossed
        const prevDiff = prev1 - prev2;
        const currDiff = curr1 - curr2;

        // If the sign changed, there was a crossing
        if (prevDiff * currDiff < 0 || currDiff === 0) {
          // Calculate the intersection point using linear interpolation
          let intersectionY;
          if (currDiff === 0) {
            // Lines meet exactly at this point
            intersectionY = curr1;
          } else {
            // Interpolate to find the exact crossing point
            const t =
              Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff));
            intersectionY = prev1 + t * (curr1 - prev1);
          }

          // Find corresponding price at this time for the tooltip
          const pricePoint = priceSeries.find((p) => p.x === series1[i].x);

          crossingPoints.push({
            x: series1[i].x,
            y: intersectionY, // Use the actual intersection point
            z: Math.abs(intersectionY), // Use crossing level for bubble size
            crossType: curr1 > curr2 ? "bullish" : "bearish", // Bullish if calls cross above puts
            callValue: curr1,
            putValue: curr2,
            spyPrice: pricePoint?.y || 0, // Store SPY price for tooltip
          });
        }
      }

      return crossingPoints;
    }

    // Find crossing points
    const crossingBubbles = findCrossingPoints(
      netCallPremSeries,
      netPutPremSeries,
      priceSeries,
    );

    // Calculate min/max for bubble sizing based on crossing levels
    const crossingLevels = crossingBubbles.map((p) => p.z);
    const maxCrossingLevel = Math.max(...crossingLevels, 1);
    const minCrossingLevel = Math.min(...crossingLevels, 0);

    const options = {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },

      title: {
        text: `<h3 class="mt-3 -mb-2">S&P500 Flow</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },

      credits: {
        enabled: false,
      },

      tooltip: {
        shared: false,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "14px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this?.x,
          )?.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}</span><br>`;

          // Handle bubble series differently
          if (this.series.type === "bubble") {
            const point = this.point;
            tooltipContent += `<span class="text-white text-sm font-[501]">Crossing Level: ${abbreviateNumber(point.y)}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[501]">SPY Price: ${point.spyPrice?.toFixed(2)}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[501]">Type: ${point.crossType === "bullish" ? "🟢 Bullish" : "🔴 Bearish"}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[400]">Call Prem: ${abbreviateNumber(point.callValue)}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[400]">Put Prem: ${abbreviateNumber(point.putValue)}</span>`;
          } else {
            // Regular series tooltip
            tooltipContent += `
              <span style="display:inline-block; width:10px; height:10px; background-color:${this.color}; border-radius:50%; margin-right:5px;"></span>
              <span class="font-semibold text-sm">${this.series.name}:</span> 
              <span class="font-normal text-sm">${this.series.name === "SPY Price" ? "$" + this.y?.toFixed(2) : abbreviateNumber(this.y)}</span>`;
          }

          return tooltipContent;
        },
      },

      xAxis: {
        type: "datetime",
        min: startTime,
        max: endTime,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          distance: 10,
          formatter: function () {
            const date = new Date(this?.value);
            const timeString = date?.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            });
            return `<span class="text-xs">${timeString.replace(/\s/g, " ")}</span>`;
          },
        },
        tickPositioner: function () {
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5;
          const interval = (info.max - info.min) / tickCount;

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },

      yAxis: [
        {
          title: {
            text: null,
          },
          labels: {
            enabled: false,
          },
          gridLineWidth: 0,
          opposite: false,
        },
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            style: { color: $mode === "light" ? "#545454" : "white" },
          },
          title: { text: null },
          opposite: true,
        },
      ],

      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
        spline: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
        },
        bubble: {
          minSize: 5,
          maxSize: 20,
          opacity: 0.85,
          marker: {
            enabled: true,
            fillOpacity: 0.85,
            lineWidth: 2,
            lineColor:
              $mode === "light" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)",
          },
          dataLabels: {
            enabled: false,
          },
          sizeBy: "z",
          zMin: minCrossingLevel,
          zMax: maxCrossingLevel,
          sizeByAbsoluteValue: false,
        },
      },

      series: [
        {
          name: "SPY Price",
          type: "spline",
          data: priceSeries,
          yAxis: 0,
          color: $mode === "light" ? "#000" : "#fff",
          lineWidth: 2,
          zIndex: 10,
        },
        {
          name: "Net Call Prem",
          type: "spline",
          data: netCallPremSeries,
          yAxis: 1,
          color: $mode === "light" ? "#208646" : "#90EE90",
        },
        {
          name: "Net Put Prem",
          type: "spline",
          data: netPutPremSeries,
          yAxis: 1,
          color: $mode === "light" ? "#DC2626" : "#FF6B6B",
        },
        {
          name: "Premium Crossings",
          type: "bubble",
          data: crossingBubbles.map((point) => ({
            x: point.x,
            y: point.y,
            z: point.z,
            crossType: point.crossType,
            callValue: point.callValue,
            putValue: point.putValue,
            spyPrice: point.spyPrice,
            marker: {
              fillColor:
                point.crossType === "bullish"
                  ? $mode === "light"
                    ? "#10b981"
                    : "#34d399"
                  : $mode === "light"
                    ? "#ef4444"
                    : "#f87171",
            },
          })),
          color: $mode === "light" ? "#6366f1" : "#818cf8",
          yAxis: 1, // Place bubbles on the premium axis
          animation: false,
          zIndex: 15, // Highest z-index to appear on top
          showInLegend: false,
        },
      ],
    };

    return options;
  }
  function plotBarChart() {
    const categories = sectorFlow?.map((item) => item?.sector);

    // Prepare callPrem and putPrem data separately
    const callData = sectorFlow?.map((item) => ({
      y: item.callPrem,
      originalData: item,
      color: "#34d399", // green
    }));

    const putData = sectorFlow?.map((item) => ({
      y: item.putPrem,
      originalData: item,
      color: "#f87171", // red
    }));

    const options = {
      credits: { enabled: false },

      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 360,
        animation: false,
      },
      title: { text: null },
      xAxis: {
        categories,
        labels: {
          style: {
            color: $mode === "light" ? "#09090B" : "white",
            fontSize: "12px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          },
          useHTML: true,
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        title: null,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        series: { pointWidth: 10 },
        legendSymbol: "rectangle",
        bar: {
          stacking: "normal", // <-- enables stacking
          dataLabels: {
            enabled: true,
            inside: false,
            align: "right",
            style: {
              color: "#000",
              fontSize: "12.5px",
              fontWeight: "550",
              textOutline: "none",
            },
            formatter: function () {
              if (this.series.name === "Total") {
                return this.y?.toLocaleString("en-US");
              }
              return null;
            },
          },
          borderWidth: 0,
          pointPadding: $screenWidth < 640 ? 0.02 : 0.18,
          groupPadding: $screenWidth < 640 ? 0.4 : -0.1,
          animation: false,
          states: {
            hover: { enabled: false },
            inactive: { enabled: false },
          },
        },
      },
      tooltip: {
        shared: true, // now makes sense for stacked
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "8px" },
        borderRadius: 4,
        formatter: function () {
          const sector = this.x;
          const call =
            this.points.find((p) => p.series.name === "Call Prem")?.y || 0;
          const put =
            this.points.find((p) => p.series.name === "Put Prem")?.y || 0;
          const total = call + put;

          return `
          <span class="m-auto text-xs font-semibold">${sector}</span><br>
          <span class="text-green-400">Call Prem: ${call.toLocaleString("en-US")}</span><br>
          <span class="text-red-400">Put Prem: ${put.toLocaleString("en-US")}</span><br>
          <span class="text-white font-bold">Total Prem: ${total.toLocaleString("en-US")}</span>
        `;
        },
      },
      series: [
        {
          name: "Call Prem",
          data: callData,
          color: "#34d399",
          animation: false,
        },
        {
          name: "Put Prem",
          data: putData,
          color: "#f87171", // red
          animation: false,
        },
      ],
      legend: {
        enabled: true,
        align: "center", // left side
        verticalAlign: "top", // top edge
        layout: "horizontal",
        squareSymbol: false, // use our rectangle shape
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,

        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
    };

    return options;
  }

  function plotOI() {
    const currentOI = overview?.putOI + overview?.callOI ?? 0;
    const benchmarkOI =
      overview?.avg30OI * 2 > currentOI ? overview?.avg30OI * 2 : currentOI;

    // Define band breakpoints as fractions of benchmarkOI
    const band1 = benchmarkOI * 0.2;
    const band2 = benchmarkOI * 0.4;
    const band3 = benchmarkOI * 0.6;
    const band4 = benchmarkOI * 0.8;

    const optionsOI = {
      credits: { enabled: false },

      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false,
      },

      title: {
        text: `<h3 class="">Open Interest</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null,
        ],
      },

      yAxis: {
        min: 0,
        max: benchmarkOI,
        tickPosition: "outside",
        tickLength: 0,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
          y: 0,
        },
        plotBands: [
          { from: 0, to: band1, color: "#55BF3B", thickness: 20 },
          { from: band1, to: band2, color: "#55BF3B", thickness: 20 },
          { from: band2, to: band3, color: "#DDDF0D", thickness: 20 },
          { from: band3, to: band4, color: "#DF5353", thickness: 20 },
          { from: band4, to: benchmarkOI, color: "#DF5353", thickness: 20 },
        ],
      },

      series: [
        {
          name: "OI",
          data: [currentOI],
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              return `<span class="text-lg font-bold">${abbreviateNumber(this.y)}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    const actualValue = overview?.pcOI ?? 0;

    const optionsOIPutCall = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false, // Disable initial animation
      },

      title: {
        text: `<h3 class="">Put-Call Ratio</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            // Outer circle (black line)
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null, // keep existing null if needed
        ],
      },

      // the value axis
      yAxis: {
        min: 0,
        max: 2,
        tickPosition: "outside",
        tickLength: 10,
        tickWidth: 0,
        tickPositions: [0, 1, 2],
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20, // move closer to the center
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return this.value;
          },
          y: -0, // adjust vertical position upward
        },
        plotBands: [
          {
            from: 0,
            to: 0.49,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.49,
            to: 0.5,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.5,
            to: 0.99,
            color: "#DDDF0D",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.99,
            to: 1,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 1,
            to: 2,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
        ],
      },

      series: [
        {
          name: "OI P/C",
          data: [Math.min(actualValue, 2)], // dial limited to 2
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              // Show actual value even if >2
              return `<span class="text-lg font-bold">${actualValue}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    return { optionsOI, optionsOIPutCall };
  }

  function plotVolume() {
    const currentVol = overview?.putVol + overview?.callVol ?? 0;
    const benchmarkVol =
      overview?.avg30Vol * 2 > currentVol ? overview?.avg30Vol * 2 : currentVol;

    const band1 = benchmarkVol * 0.2;
    const band2 = benchmarkVol * 0.4;
    const band3 = benchmarkVol * 0.6;
    const band4 = benchmarkVol * 0.8;

    const optionsVolume = {
      credits: { enabled: false },

      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false,
      },

      title: {
        text: `<h3 class="">Volume</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null,
        ],
      },

      yAxis: {
        min: 0,
        max: benchmarkVol,
        tickPosition: "outside",
        tickLength: 0,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
          y: 0,
        },
        plotBands: [
          { from: 0, to: band1, color: "#55BF3B", thickness: 20 },
          { from: band1, to: band2, color: "#55BF3B", thickness: 20 },
          { from: band2, to: band3, color: "#DDDF0D", thickness: 20 },
          { from: band3, to: band4, color: "#DF5353", thickness: 20 },
          { from: band4, to: benchmarkVol, color: "#DF5353", thickness: 20 },
        ],
      },

      series: [
        {
          name: "Vol",
          data: [currentVol],
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              return `<span class="text-lg font-bold">${abbreviateNumber(this.y)}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    const actualValue = overview?.pcVol ?? 0;

    const optionsVolumePutCall = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false, // Disable initial animation
      },

      title: {
        text: `<h3 class="">Put-Call Ratio</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            // Outer circle (black line)
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null, // keep existing null if needed
        ],
      },

      // the value axis
      yAxis: {
        min: 0,
        max: 2,
        tickPosition: "outside",
        tickLength: 10,
        tickWidth: 0,
        tickPositions: [0, 1, 2],
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20, // move closer to the center
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return this.value;
          },
          y: -0, // adjust vertical position upward
        },
        plotBands: [
          {
            from: 0,
            to: 0.49,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.49,
            to: 0.5,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.5,
            to: 0.99,
            color: "#DDDF0D",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.99,
            to: 1,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 1,
            to: 2,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
        ],
      },

      series: [
        {
          name: "Vol P/C",
          data: [Math.min(actualValue, 2)], // dial limited to 2
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              // Show actual value even if >2
              return `<span class="text-lg font-bold">${actualValue}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    return { optionsVolume, optionsVolumePutCall };
  }

  function plotHeatmap() {
    // 1. Define Categories based on the image
    const xCategories = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const yCategories = [
      "SPY",
      "IWM",
      "QQQ",
      "XLB",
      "XLC",
      "XLE",
      "XLF",
      "XLI",
      "XLK",
      "XLP",
      "XLRE",
      "XLU",
      "XLV",
      "XLY",
    ];

    const generateData = () => {
      const data = [];
      for (let y = 0; y < yCategories.length; y++) {
        for (let x = 0; x < xCategories?.length; x++) {
          const randomValue = Math.random() * 7 - 2.5;
          data.push([x, y, parseFloat(randomValue.toFixed(2))]);
        }
      }
      return data;
    };

    const options = {
      credits: { enabled: false },
      chart: {
        type: "heatmap",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 3, // Adjust as needed usually pixel strings e.g. "600px" or strict numbers
        animation: false,
      },

      title: { text: "" },

      xAxis: {
        categories: xCategories,
        opposite: true,
        labels: {
          enabled: true,
          style: {
            color: $mode === "light" ? "#333" : "#ccc",
            fontWeight: "bold",
          },
        },
        tickLength: 0,
        lineWidth: 0,
        gridLineWidth: 0,
      },

      yAxis: {
        categories: yCategories,
        title: null,
        reversed: true,
        labels: {
          useHTML: true, // Essential to render the link
          style: {
            cursor: "pointer",
          },
          // We use a formatter to inject the <a> tag
          formatter: function () {
            // 'this.value' contains the label text (e.g., "SPY")
            // We apply the blue color (#3b82f6) directly to the <a> tag
            return `<a href="/etf/${this.value}" class="sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400">${this.value}</a>`;
          },
        },
      },
      // -----------------------

      colorAxis: {
        min: -1,
        max: 1,
        stops: [
          [0, "#c10007"],
          [1, "#008236"],
        ],
        visible: false,
      },

      legend: { enabled: false },

      tooltip: {
        backgroundColor: $mode === "light" ? "#fff" : "#000",
        borderColor: "#333",
        style: {
          color: $mode === "light" ? "#000" : "#fff",
        },
        format:
          "<b>{series.yAxis.categories.(point.y)}</b> in <b>{series.xAxis.categories.(point.x)}</b><br>" +
          "Return: <b>{point.value:.2f}%</b>",
      },

      series: [
        {
          name: "Monthly Return",
          borderWidth: 1,
          borderColor: $mode === "light" ? "#fff" : "#18181b",
          data: generateData(),
          dataLabels: {
            enabled: true,
            color: "#ffffff",
            textOutline: "none",
            style: {
              fontWeight: "normal",
              textOutline: "none",
              fontSize: "11px",
            },
            format: "{point.value:.2f}%",
          },
        },
      ],
    };

    return options;
  }

  $: {
    if ($mode) {
      config = marketTideData ? plotDataFlow() : null;
      configBarChart = sectorFlow?.length > 0 ? plotBarChart() : null;
      configFearAndGreed = plotFearAndGreed();
      configHeatmap = plotHeatmap();
      const { optionsOI, optionsOIPutCall } = plotOI();
      const { optionsVolume, optionsVolumePutCall } = plotVolume();

      configOI = optionsOI;
      configOIPutCall = optionsOIPutCall;
      configVolume = optionsVolume;
      configVolumePutCall = optionsVolumePutCall;
    }
  }
</script>

<SEO
  title="Market Flow - Real-Time S&P 500 Options Sentiment & Market Tide "
  description="Track real-time S&P 500 market flow and options sentiment analysis. Monitor call/put premium flows, market tide indicators, and institutional options activity. Free market sentiment tracker with live data."
  keywords="market flow, options sentiment, market tide, S&P 500 flow, call put ratio, options premium flow, market sentiment, institutional flow, SPX options flow"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Market Flow Tracker",
    description: "Real-time S&P 500 market flow and options sentiment analysis",
    url: "https://stocknear.com/market-flow",
    applicationCategory: "FinanceApplication",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Market Flow",
          item: "https://stocknear.com/market-flow",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
/>

<section class="w-full overflow-hidden text-muted dark:text-white">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto">
            {#if config !== null}
              <p class="mb-10">
                Overview for all option chains of <strong>S&P500</strong>. As of
                <strong>{marketFlowDate}</strong>, the total volume is
                <strong>
                  {#if isPro}
                    {(overview?.putVol + overview?.callVol)?.toLocaleString(
                      "en-US",
                    ) || "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                contracts, which is
                <strong>
                  {#if isPro}
                    {overview?.avg30Vol && overview?.avg30Vol > 0
                      ? (
                          ((overview?.callVol + overview?.putVol) /
                            overview?.avg30Vol) *
                          100
                        )?.toFixed(2) + "%"
                      : "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                of average daily volume of
                <strong>
                  {#if isPro}
                    {overview?.avg30Vol?.toLocaleString("en-US") || "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                contracts. The volume put-call ratio is
                <strong>
                  {#if isPro}
                    {overview?.pcVol?.toFixed(2) || "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>. Current net call premium flow is
                <strong>
                  {#if isPro}
                    {abbreviateNumber(
                      findLastNonNull(marketTideData, "net_call_premium"),
                    ) || "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                and net put premium flow is
                <strong>
                  {#if isPro}
                    {abbreviateNumber(
                      findLastNonNull(marketTideData, "net_put_premium"),
                    ) || "n/a"}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>, indicating a
                <strong>
                  {#if isPro}
                    {(() => {
                      const netCallPremium = findLastNonNull(
                        marketTideData,
                        "net_call_premium",
                      );
                      const netPutPremium = findLastNonNull(
                        marketTideData,
                        "net_put_premium",
                      );

                      if (netCallPremium == null || netPutPremium == null) {
                        return "unknown";
                      }

                      const netPremiumDiff = netCallPremium - netPutPremium;
                      const totalPremium =
                        Math.abs(netCallPremium) + Math.abs(netPutPremium);

                      if (totalPremium === 0) {
                        return "neutral";
                      }

                      const premiumRatio = netPremiumDiff / totalPremium;

                      if (premiumRatio > 0.2) {
                        return "bullish";
                      } else if (premiumRatio < -0.2) {
                        return "bearish";
                      } else {
                        return "neutral";
                      }
                    })()}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                sentiment in the market.
              </p>

              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div
                  class="net-volume-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div
                    class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center"
                  >
                    <span>Net Volume</span>
                  </div>
                  <div class="flex items-baseline">
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-xl font-bold">
                        {abbreviateNumber(
                          findLastNonNull(marketTideData, "net_volume"),
                        )}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>

                <div
                  class="net-call-premium-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div
                    class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center"
                  >
                    <span>Net Call Prem</span>
                  </div>
                  <div class="flex items-baseline">
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-xl font-bold">
                        {abbreviateNumber(
                          findLastNonNull(marketTideData, "net_call_premium"),
                        )}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>

                <div
                  class="net-put-premium-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div
                    class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center"
                  >
                    <span>Net Put Prem</span>
                  </div>
                  <div class="flex items-baseline">
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-xl font-bold">
                        {abbreviateNumber(
                          findLastNonNull(marketTideData, "net_put_premium"),
                        )}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>

                <div class=" shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4">
                  <div
                    class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center"
                  >
                    <span>Most Active Sector</span>
                  </div>
                  <div class="flex items-baseline">
                    {#if data?.user?.tier === "Pro"}
                      <a
                        href={sectorNavigation?.find(
                          (listItem) =>
                            listItem?.title === sectorFlow?.at(0)?.sector,
                        )?.link}
                        class="text-xl font-bold text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                      >
                        {sectorFlow?.length > 0
                          ? sectorFlow?.at(0)?.sector
                          : "n/a"}
                      </a>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-4">
                <div class="grow chart-driver">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    <div
                      class="{!['Pro']?.includes(data?.user?.tier)
                        ? 'blur-[3px]'
                        : ''}  border border-gray-300 dark:border-gray-800 rounded"
                      use:highcharts={config}
                    ></div>
                    <!-- Overlay with "Upgrade to Pro" -->
                    {#if !["Pro"]?.includes(data?.user?.tier)}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                      >
                        <a
                          href="/pricing"
                          class="sm:hover:text-blue-800 dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                        >
                          <span>Upgrade</span>
                          <svg
                            class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            /></svg
                          >
                        </a>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="grow">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    <div
                      class="{!['Pro']?.includes(data?.user?.tier)
                        ? 'blur-[3px]'
                        : ''}  border border-gray-300 dark:border-gray-800 rounded"
                      use:highcharts={configBarChart}
                    ></div>
                    <!-- Overlay with "Upgrade to Pro" -->
                    {#if !["Pro"]?.includes(data?.user?.tier)}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                      >
                        <a
                          href="/pricing"
                          class="sm:hover:text-blue-800 dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                        >
                          <span>Upgrade</span>
                          <svg
                            class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            /></svg
                          >
                        </a>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-4">
                <div class="order-1 sm:order-0">
                  <div
                    class="flex flex-row items-center justify-between mb-2 mt-5"
                  >
                    <h2 class=" text-lg sm:text-xl font-bold w-fit">
                      Fear & Greed Index
                    </h2>
                    <h3 class=" text-xs italic w-fit">
                      Last Update: {new Date(
                        data?.getFearAndGreed?.current?.date,
                      )?.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                  </div>

                  <div class="grow mt-1">
                    <div class="relative">
                      <!-- Apply the blur class to the chart -->
                      <div
                        class="border border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={configFearAndGreed}
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="order-0 sm:order-1">
                  <h2 class="mb-2 mt-5 text-lg sm:text-xl font-bold w-fit">
                    Avg. Market Seasonality
                  </h2>

                  <div class="grow mt-1">
                    <div class="relative">
                      <!-- Apply the blur class to the chart -->
                      <div
                        class="{!['Pro']?.includes(data?.user?.tier)
                          ? 'blur-[3px]'
                          : ''}  border border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={configHeatmap}
                      ></div>
                      <!-- Overlay with "Upgrade to Pro" -->
                      {#if !["Pro"]?.includes(data?.user?.tier)}
                        <div
                          class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                        >
                          <a
                            href="/pricing"
                            class="sm:hover:text-blue-800 dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                          >
                            <span>Upgrade</span>
                            <svg
                              class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="currentColor"
                                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                              /></svg
                            >
                          </a>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            {#if Object?.keys(overview)?.length > 0}
              <div class="w-full m-auto mt-10">
                <div
                  class="flex flex-wrap sm:flex-row items-center sm:justify-between mb-4"
                >
                  <h2 class="mb-6 text-xl sm:text-2xl font-bold w-fit">
                    Open Interest (OI)
                  </h2>
                  <div
                    class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
                  >
                    <!-- Gauge -->
                    <div
                      class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                      use:highcharts={configOI}
                    ></div>

                    <div
                      class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                      use:highcharts={configOIPutCall}
                    ></div>

                    <!-- Stats -->
                    <div
                      class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
                    >
                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Today's Open Interest</span>
                          <InfoModal
                            id="todaysOI"
                            content="Open Interest (OI) is the total number of outstanding options contracts (both calls and puts) that are still open.  
                    High OI means more market activity and liquidity.  
                    Low OI means less interest and lower liquidity."
                          />
                        </div>
                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {(
                              overview?.putOI + overview?.callOI
                            )?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Put-Call Ratio</span>
                          <InfoModal
                            id="putCallRatio"
                            content="The Open Interest (OI) Put-Call Ratio compares the number of open put contracts to open call contracts.  
      A high ratio (>1) suggests more puts than calls — often seen as bearish.  
      A low ratio (<1) suggests more calls than puts — often seen as bullish."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.pcOI?.toFixed(2)}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Put Open Interest</span>
                          <InfoModal
                            id="putCallOI"
                            content="Put Open Interest is the total number of open put option contracts on a stock.  
                  High put OI suggests more traders are buying protection or betting on a decline — often seen as bearish.  
                  Low put OI suggests less demand for downside protection — often seen as bullish or neutral."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.putOI?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Call Open Interest</span>
                          <InfoModal
                            id="callOI"
                            content="Call Open Interest is the total number of open call option contracts on a stock.  
                  High call OI suggests more traders expect the stock to rise or are speculating — often seen as bullish.  
                  Low call OI suggests less demand for upside bets — often seen as bearish or neutral."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.callOI?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Open Interest Avg (30-day)</span>
                          <InfoModal
                            id="avgOI"
                            content="The average Open Interest over the past 30 days shows typical market activity in options contracts."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.avg30OI?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Today vs Open Interest Avg (30-day)</span>
                          <InfoModal
                            id="todayvsAvgOI"
                            content="This compares today's Open Interest to the 30-day average.  
                  Higher today’s OI than average suggests increased trader interest or unusual activity — possibly signaling a bigger move.  
                  Lower today’s OI than average suggests less activity or fading interest."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.avg30OI && overview?.avg30OI > 0
                              ? (
                                  ((overview?.callOI + overview?.putOI) /
                                    overview?.avg30OI) *
                                  100
                                )?.toFixed(2) + "%"
                              : "n/a"}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h2 class="mb-6 text-xl sm:text-2xl font-bold w-fit">
                    Option Order Volume
                  </h2>
                  <div
                    class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full"
                  >
                    <!-- Gauge -->
                    <div
                      class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                      use:highcharts={configVolume}
                    ></div>

                    <div
                      class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                      use:highcharts={configVolumePutCall}
                    ></div>

                    <!-- Stats -->
                    <div
                      class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
                    >
                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Today's Volume</span>
                          <InfoModal
                            id="volume"
                            content="Today's Volume is the total number of options contracts (calls and puts) traded during the current trading day.  
                    High volume shows strong market activity and interest.  
                    Low volume suggests less trading and lower interest."
                          />
                        </div>
                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {(
                              overview?.callVol + overview?.putVol
                            )?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Put-Call Ratio</span>
                          <InfoModal
                            id="putCallRatio"
                            content="The Put-Call Ratio compares the volume of traded put options to call options during a period.  
      A high ratio (>1) means more puts traded — often seen as bearish sentiment.  
      A low ratio (<1) means more calls traded — often seen as bullish sentiment."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.pcVol?.toFixed(2)}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Put Volume</span>
                          <InfoModal
                            id="putVolume"
                            content="Put Volume is the total number of put option contracts traded today.  
                    High put volume suggests many traders are buying protection or betting on a decline — often seen as bearish.  
                    Low put volume suggests less demand for downside protection — often seen as bullish or neutral."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.putVol?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Call Volume</span>
                          <InfoModal
                            id="callVolume"
                            content="Call Volume is the total number of call option contracts traded today.  
                    High call volume suggests many traders expect the stock to rise or are speculating — often seen as bullish.  
                    Low call volume suggests less demand for upside bets — often seen as bearish or neutral."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.callVol?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Volume Avg (30-day)</span>
                          <InfoModal
                            id="volumeAvg"
                            content="The average Volume over the past 30 days shows typical market activity in options contracts."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.avg30Vol?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
                        >
                          <span>Today vs Volume Avg (30-day)</span>
                          <InfoModal
                            id="todayvsAvgVol"
                            content="This compares today's trading volume to the 30-day average volume.  
      Higher volume today than average suggests increased trader interest or unusual activity — possibly signaling a bigger move.  
      Lower volume today than average suggests less activity or fading interest."
                          />
                        </div>

                        <span class="font-semibold text-sm sm:text-[1rem]">
                          {#if isPro}
                            {overview?.avg30Vol && overview?.avg30Vol > 0
                              ? (
                                  ((overview?.callVol + overview?.putVol) /
                                    overview?.avg30Vol) *
                                  100
                                )?.toFixed(2) + "%"
                              : "n/a"}
                          {:else}
                            <a
                              href="/pricing"
                              class="sm:hover:text-default dark:sm:hover:text-blue-400"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
