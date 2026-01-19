import { browser } from '$app/environment';

let Highcharts: any = null;
let modulesLoaded = false;

// Highcharts v12+: Dynamic imports for SSR compatibility
async function ensureHighcharts() {
  if (Highcharts && modulesLoaded) return Highcharts;

  if (!browser) return null;

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

  const createChart = async () => {
    const HC = await ensureHighcharts();
    if (!HC) return;

    chart = HC.chart(node, {
      ...config,
      accessibility: { enabled: false },
      chart: {
        ...(config.chart || {}),
        style: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
        events: {
          ...(config.chart?.events || {}),
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
    resizeObserver = new ResizeObserver(() => {
      if (chart && browser) {
        const newWidth = node.clientWidth;
        const newHeight = config?.chart?.height === null
          ? node.clientHeight
          : (node.clientWidth < 600) ? 300 : config?.chart?.height;

        chart?.setSize(newWidth, newHeight, false);
      }
    });
    resizeObserver.observe(node);
  };

  createChart();

  return {
    update(newConfig: any) {
      if (chart) {
        chart.update(newConfig, redraw, oneToOne);
      }
    },
    destroy() {
      resizeObserver?.disconnect();
      if (chart) chart?.destroy();
    }
  };
};

// Export Highcharts instance for components that need direct access
export { ensureHighcharts };
