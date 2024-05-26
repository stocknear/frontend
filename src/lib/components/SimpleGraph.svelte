<script lang='ts'>

export let data;
export let displaySection = 'overview';


</script>
 
 
 <!-- Start Graph -->
 {#if displaySection === 'overview'}
 {#if output !== null}
 <div class = 'graph'>
 <Chart {...options} width={width} height={height} autoSize={true} ref={(ref) => chart = ref} on:crosshairMove={handleCrosshairMove} >
     {#if displayData === '3M'}
     <LineSeries data={filteredData.threeMonthsAgo}
     color={colorChange}
     lineWidth={1.5}
     priceScaleId="left"
     crosshairMarkerVisible={false}
     ref={handleSeriesReference}
     priceLineVisible= {false}
     >
     <PriceLine
       price={filteredData.threeMonthsAgo[0].value}
       lineWidth = {1.5}
       color="#d4d9d9"
     />
     <!--
     {#if rawClassifierModel !== null}
     <PriceLine
       title="Prediction price"
       price={rawClassifierModel[1][0].value}
       lineWidth = {1.5}
       color="#661AE6"
       priceScaleId="left"
     />
     {/if}
     -->
     <!--Classifier Model Prediction-->
     <!--
     {#if rawClassifierModel !==null}
       <PriceLine
       price={(filteredData.threeMonthsAgo[filteredData.threeMonthsAgo.length-1].value * (1+priceChangeRangeValue/100)) }
       lineWidth = {1.5}
       color="#367E18"
       title="Price rise"/>
     {/if}
     -->
     </LineSeries>
     {:else if displayData === '6M'}
     <LineSeries data={filteredData.sixMonthsAgo}
     color={colorChange}
     lineWidth={1.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesReference}
     priceLineVisible= {false}
     >
     <PriceLine
       price={filteredData.sixMonthsAgo[0].value}
       lineWidth = {1.5}
       color="#d4d9d9"
     />
     </LineSeries>
     {:else if displayData === '1y'}
     <LineSeries data={filteredData.oneYearAgo}
     color={colorChange}
     lineWidth={1.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesReference}
     priceLineVisible= {false}
     >
     <PriceLine
       price={filteredData.oneYearAgo[0].value}
       lineWidth = {1.5}
       color="#d4d9d9"
     />
     </LineSeries>
     {:else if displayData === '3y'}
     <LineSeries data={filteredData.threeYearsAgo}
     color={colorChange}
     lineWidth={1.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesReference}
     priceLineVisible= {false}
     >
     <PriceLine
       price={filteredData.threeYearsAgo[0].value}
       lineWidth = {1.5}
       color="#d4d9d9"
     />
     </LineSeries>
     {/if}
     
     <!--
     <HistogramSeries
     data={volumeData}
     priceScaleId=""
     priceFormat={{type: 'volume'}}
     scaleMargins={{top: 0.8, bottom: 0}}/>
     -->

     {#if displayBBANDS}
     <LineSeries data={bbup}
     color="#00F13F"
     lineWidth={1.5}
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     <LineSeries data={bbmiddle}
     color="#00F13F"
     lineWidth={1.5}
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     <LineSeries data={bbdown}
     color="#00F13F"
     lineWidth={1.5}
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     {/if}
     
     {#if displaySMA}
     <LineSeries data={SMA}
     color="#039dfc"
     lineWidth={1.8}
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     {/if}

     {#if displayEMA}
     <LineSeries data={EMA}
     color="#fc035a"
     lineWidth={1.8}
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTrainData && displayData === '3M'}
     <LineSeries data={linearRegressionTrainData.threeMonthsAgo}
     color="#9D00A0"
     lineWidth={4.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTrainData && displayData === '6M'}
     <LineSeries data={linearRegressionTrainData.sixMonthsAgo}
     color="#9D00A0"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTrainData && displayData === '1y'}
     <LineSeries data={linearRegressionTrainData.oneYearAgo}
     color="#9D00A0"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTrainData && displayData === '3y'}
     <LineSeries data={linearRegressionTrainData.threeYearsAgo}
     color="#9D00A0"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     <!--Test Data-->
     {#if rawRegressionModel !==null && displayTestData && displayData === '3M'}
     <LineSeries data={linearRegressionTestData.threeMonthsAgo}
     color="#A09D00"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '6M'}
     <LineSeries data={linearRegressionTestData.sixMonthsAgo}
     color="#A09D00"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '1y'}
     <LineSeries data={linearRegressionTestData.oneYearAgo}
     color="#A09D00"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '3y'}
     <LineSeries data={linearRegressionTestData.threeYearsAgo}
     color="#A09D00"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}

     <!--Pred Data-->
     {#if rawRegressionModel !==null && displayTestData && displayData === '3M'}
     <LineSeries data={linearRegressionPredData.threeMonthsAgo}
     color="#4287f5"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesPredReference}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '6M'}
     <LineSeries data={linearRegressionPredData.sixMonthsAgo}
     color="#4287f5"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesPredReference}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '1y'}
     <LineSeries data={linearRegressionPredData.oneYearAgo}
     color="#4287f5"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesPredReference}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}
     {#if rawRegressionModel !==null && displayTestData && displayData === '3y'}
     <LineSeries data={linearRegressionPredData.threeYearsAgo}
     color="#4287f5"
     lineWidth={3.5}
     priceScaleId="right"
     crosshairMarkerVisible={false}
     ref={handleSeriesPredReference}
     priceLineVisible= {false}
     lineStyle = {1}
     />
     {/if}

     <!-- <TimeScale
     fixRightEdge={fixRight} 
     fixLeftEdge={fixLeft} 
     on:visibleLogicalRangeChange={handleChartLogicalRangeChange}
     ref={(ref) => timescale = ref } shiftVisibleRangeOnNewBar={false}/> -->
     <!--Site crashes when i add timescale: Need to fix the bug ASAP -->
 </Chart>

 </div>
 {:else}
 <!-- else output not loaded yet-->
 <div class="graphLoading" style="width: {width}px; height: 400px;">
   <div class="flex justify-center items-center m-auto mt-10 py-20">
     <div class="loader">Loading...</div>
   </div>
 </div>
 {/if}
 {/if}
 <!--End Graph-->








  


<style>
   
    .graph {
        display:block;
        position: relative;
        max-width: 500px;
        max-height: 600px;
        overflow: hidden;
        margin-top: auto;
        margin-right: auto;
        margin-left: auto;
        border-width: thin;
        border-color: #1A1A27;
        background-color: #1A1A27;
        bottom:20px;
  
    }
  
    .graphLoading {
        display:block;
        position: relative;
        max-width: 500px;
        max-height: 600px;
        overflow: hidden;
        margin-top: auto;
        margin-right: auto;
        margin-left: auto;
        border-width: thin;
        border-color: #1A1A27;
        background-color: #1A1A27;
        bottom:20px;
    }
  
  .loader,
  .loader:before,
  .loader:after {
    border-radius: 50%;
    width: 2.5em;
    height: 2.5em;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
    -webkit-animation: load7 0.8s infinite ease-in-out;
    animation: load7 0.8s infinite ease-in-out;
  }
  .loader {
    color: #ffffff;
    font-size: 10px;
    margin: 80px auto;
    position: relative;
    text-indent: -9999em;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation-delay: -0.16s;
    animation-delay: -0.16s;
  }
  .loader:before,
  .loader:after {
    content: '';
    position: absolute;
    top: 0;
  }
  .loader:before {
    left: -3.5em;
    -webkit-animation-delay: -0.32s;
    animation-delay: -0.32s;
  }
  .loader:after {
    left: 3.5em;
  }
  @-webkit-keyframes load7 {
    0%,
    80%,
    100% {
      box-shadow: 0 2.5em 0 -1.3em;
    }
    40% {
      box-shadow: 0 2.5em 0 0;
    }
  }
  @keyframes load7 {
    0%,
    80%,
    100% {
      box-shadow: 0 2.5em 0 -1.3em;
    }
    40% {
      box-shadow: 0 2.5em 0 0;
    }
  }
  
  
  
  .chart-container {
    width: 100%;
    max-width: 800px;
    height: 450px;
    text-align: center;
  }
  
  canvas {
    width: 100%;
    height: 100%;
    max-width: 800px;
    max-height: 450px;
  }
  
  
  
  :root {
    --date-picker-background: #1A1A27;
    --date-picker-foreground: #f7f7f7;
  }
  
  
  
  
  .pulse {
    position: relative;
    animation: pulse-animation 1s forwards cubic-bezier(0.5, 0, 0.5, 1);
  }
  
  @keyframes pulse-animation {
    0% {
      transform: scale(0.9);
      opacity: 1;
    }
    100% {
      transform: scale(0.9);
      opacity: 0;
    }
  }
  
  
  
  
  .info-card {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
  
      animation: fade-in 0.5s ease-out, slide-up var(--animation-delay) ease-out;
      animation-fill-mode: both;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  
    @keyframes slide-up {
      from {
        transform: translate(-50%, 100%);
      }
      to {
        transform: translate(-50%, -50%);
      }
    }
  
    /* Hide the scrollbar when the info card is open */
    .no-scroll {
      overflow: hidden;
    }
  
  
    @font-face {
      font-family: "pixel";
      src: url("$lib/fonts/pixel.ttf");
    }
  
    .pixel {
      font-family: "pixel";
      font-size: 0.8em;
    }
  
  </style>