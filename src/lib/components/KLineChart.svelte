<script lang='ts'>
import { onMount } from 'svelte';

let chart;

const options = {
  grid: {
    show: false,
    horizontal: {
      show: false,
      size: 1,
      color: '#EDEDED',
      style: 'dashed',
      dashedValue: [2, 2]
    },
    vertical: {
      show: false,
      size: 1,
      color: '#EDEDED',
      style: 'dashed',
      dashedValue: [2, 2]
    }
  }
};

onMount(async () => {
  const klinecharts = await import('klinecharts');
  chart = klinecharts.init('k-line-chart', options);
  chart.applyNewData(genData());
});

function genData(timestamp = new Date().getTime(), length = 800) {
    let basePrice = 5000
    timestamp = Math.floor(timestamp / 1000 / 60) * 60 * 1000 - length * 60 * 1000
    const dataList = []
    for (let i = 0; i < length; i++) {
      const prices = []
      for (let j = 0; j < 4; j++) {
        prices.push(basePrice + Math.random() * 60 - 30)
      }
      prices.sort()
      const open = +(prices[Math.round(Math.random() * 3)].toFixed(2))
      const high = +(prices[3].toFixed(2))
      const low = +(prices[0].toFixed(2))
      const close = +(prices[Math.round(Math.random() * 3)].toFixed(2))
      const volume = Math.round(Math.random() * 100) + 10
      const turnover = (open + high + low + close) / 4 * volume
      dataList.push({ timestamp, open, high, low, close, volume, turnover })
 
      basePrice = close
      timestamp += 60 * 1000
    }
    return dataList
}

</script>

    
    <div id="k-line-chart" style="height:430px"/>