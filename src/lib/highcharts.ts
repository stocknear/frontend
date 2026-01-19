import { browser } from '$app/environment';

let Highcharts: any = null;
let modulesLoaded = false;
let loadingPromise: Promise<any> | null = null;

// Highcharts v12+: Dynamic imports for SSR compatibility
async function ensureHighcharts() {
  if (Highcharts && modulesLoaded) return Highcharts;

  if (!browser) return null;

  // Prevent multiple simultaneous loads
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Dynamic import of Highcharts core
    const HC = await import('highcharts');
    Highcharts = HC.default;

    // Dynamic import of modules - they auto-register in v12
    await import('highcharts/highcharts-more');
    await import('highcharts/modules/sankey');
    await import('highcharts/modules/heatmap');
    await import('highcharts/modules/stock');

    // Set global options
    Highcharts.setOptions({
      lang: {
        numericSymbols: ['K', 'M', 'B', 'T', 'P', 'E']
      },
    });

    modulesLoaded = true;
    return Highcharts;
  })();

  return loadingPromise;
}

// Pre-load Highcharts in browser context
if (browser) {
  ensureHighcharts();
}

export default (node: HTMLElement, config: any) => {
  const redraw = true;
  const oneToOne = true;
  let chart: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let currentConfig = config;
  let isCreating = false;

  const createChart = async (cfg: any) => {
    if (!cfg || isCreating) return;
    isCreating = true;

    const HC = await ensureHighcharts();
    if (!HC) {
      isCreating = false;
      return;
    }

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
      chart = null;
    }

    chart = HC.chart(node, {
      ...cfg,
      accessibility: { enabled: false },
      chart: {
        ...(cfg.chart || {}),
        style: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
        events: {
          ...(cfg.chart?.events || {}),
          load: function () {
            const chartInstance = this as any;
            const marginX = 10;
            const marginY = 5;

            if (chartInstance.watermark) {
              chartInstance.watermark.destroy();
            }

            const x = chartInstance.chartWidth - marginX;
            const y = chartInstance.chartHeight - marginY;

            chartInstance.watermark = chartInstance.renderer
              .text('', x, y)
              .attr({ align: 'right' })
              .css({
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 'medium',
                pointerEvents: 'none'
              })
              .add();

            HC.addEvent(chartInstance, 'redraw', function () {
              chartInstance.watermark.attr({
                x: chartInstance.chartWidth - marginX,
                y: chartInstance.chartHeight - marginY
              });
            });
          }
        }
      }
    });

    // Setup resize observer after chart is created
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (chart && browser) {
          const newWidth = node.clientWidth;
          const newHeight = currentConfig?.chart?.height == null
            ? node.clientHeight
            : currentConfig?.chart?.height;

          chart?.setSize(newWidth, newHeight, false);
        }
      });
      resizeObserver.observe(node);
    }

    isCreating = false;
  };

  // Create chart if config exists
  if (config) {
    createChart(config);
  }

  return {
    update(newConfig: any) {
      currentConfig = newConfig;
      if (!newConfig) return;

      if (chart) {
        // For gauge and other special chart types, recreate the chart
        // to ensure all plotBands and special features are updated correctly
        const chartType = newConfig?.chart?.type;
        if (chartType === 'gauge' || chartType === 'solidgauge') {
          createChart(newConfig);
        } else {
          chart.update(newConfig, redraw, oneToOne);
        }
      } else {
        // Chart doesn't exist yet, create it
        createChart(newConfig);
      }
    },
    destroy() {
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (chart) {
        chart.destroy();
        chart = null;
      }
    }
  };
};

// Export Highcharts instance for components that need direct access
export { ensureHighcharts };
