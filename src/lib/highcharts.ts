import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsSankey from 'highcharts/modules/sankey';
import HighchartsHeatmap from 'highcharts/modules/heatmap';
import HighchartsStock from 'highcharts/modules/stock';

//import Boost from 'highcharts/modules/boost';
 //import HighchartsAnnotations from 'highcharts/modules/annotations';
import { browser } from '$app/environment';

if (browser) {
  // Initialize modules
  HighchartsMore(Highcharts);
  HighchartsSankey(Highcharts);
  HighchartsHeatmap(Highcharts);
  HighchartsStock(Highcharts);

   //HighchartsAnnotations(Highcharts);
  //Boost(Highcharts);
Highcharts.setOptions({
    lang: {
      numericSymbols: ['K', 'M', 'B', 'T', 'P', 'E']
    },
   
  });
}

export default (node, config) => {
  const redraw = true;
  const oneToOne = true;
  let chart = null;

  const createChart = () => {
    chart = Highcharts.chart(node, {
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
            const chart = this;
            const marginX = 10;
            const marginY = 5;

            if (chart.watermark) {
              chart.watermark.destroy();
            }

            const x = chart.chartWidth - marginX;
            const y = chart.chartHeight - marginY;

            chart.watermark = chart.renderer
              .text('', x, y)
              .attr({ align: 'right' })
              .css({
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 'medium',
                pointerEvents: 'none'
              })
              .add();

            Highcharts.addEvent(chart, 'redraw', function () {
              chart.watermark.attr({ x: chart.chartWidth - marginX, y: chart.chartHeight - marginY });
            });
          }
        }
      }
    });
  };

  createChart();

  // Resize observer remains the same
  const resizeObserver = new ResizeObserver(() => {
    if (chart && browser) {
      const newWidth = node.clientWidth;
      // Set height based on viewport width: 300 for mobile, 360 for desktop
      const newHeight = (node.clientWidth < 600) ? 300 : config?.chart?.height;

      chart?.setSize(newWidth, newHeight, false);
    }
  });
  resizeObserver.observe(node);

  return {
    update(newConfig) {
      chart.update(newConfig, redraw, oneToOne);
    },
    destroy() {
      resizeObserver?.disconnect();
      if (chart) chart?.destroy();
    }
  };
};
