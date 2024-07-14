<script lang ='ts'>
    import { numberOfUnreadNotification} from '$lib/store';
    import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
    import Katex from "$lib/components/Katex.svelte";
    //import Chart from '$lib/components/Chart.svelte';
    //import greeks from "greeks";

    export let data;



// Sample option contract parameters
/*
const strikePrice = 100; // Strike price of the option
const timeToExpiration = 30 / 365; // Time to expiration in years (30 days)
const volatility = 0.25; // Volatility of the underlying asset
const riskFreeRate = 0.001; // Risk-free interest rate

// Generate sample underlying stock prices
const underlyingPrices = Array.from({ length: 50 }, (_, i) => 80 + i); // Sample prices from 80 to 129

let testList = [];
for(const price of underlyingPrices) {
    testList.push(greeks.getTheta(price, strikePrice,  timeToExpiration, volatility, riskFreeRate, "call"))
}


const options = {
silent: true,
animation: false,
grid: {
    left:'2%',
    right: '2%',
    bottom:'5%',
    containLabel: true
  },
  xAxis: {
    show: false, // Hide the xAxis
    type: 'category',
    data: underlyingPrices
  },
  yAxis: {
    type: 'value',
    splitLine: {
      show: false,
    },
  },
  series: [
    {
      data: testList,
      showSymbol: false,
      type: 'line'
    }
  ]
};
*/

</script>
    
    
    
<svelte:head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Long Call Options · stocknear</title>
    <meta name="description" content="Latest articles on stocks, finance and investing">
    <!-- Other meta tags -->
    <meta property="og:title" content="Long Call Options"/>
    <meta property="og:description" content="Understand what call options are and when they become profitable in your trading strategy."/>
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="article"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Long Call Options"/>
    <meta name="twitter:description" content="Understand what call options are and when they become profitable in your trading strategy."/>
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>

    
                
<section class="w-full max-w-6xl m-auto pt-5 pb-60 min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
    
<div class="text-sm breadcrumbs ml-4 sm:ml-0">
    <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Long Call Options</li>
    </ul>
</div>


    <main class="grow m-auto "> 
            <div class="w-full max-w-4xl ">
                <div class="sm:flex sm:justify-start">

                <!-- Main content -->
                <div class="md:grow pt-6 pb-12 w-full sm:mr-4 rounded-2xl sm:rounded-none">
                    <div class="sm:pr-5">
                        <!--Start Title-->
                        <h1 class="flex justify-center sm:justify-start mt-5  text-white font-bold text-4xl p-3 mb-6 sm:mb-3">
                        Long Call Options
                        </h1>
                        <!--End Title-->

                        <!--
                        <div class="app w-full h-[400px] sm:h-[500px]">
                            <Chart options={options} class="chart" />
                        </div>
                        -->
                        
                        <!--Start Paragraph-->
                        <div class="text-white text-lg pl-3 pr-3">
                            A call option is one of the two fundamental types of options. The holder of a call option has the option, but not the obligation, to purchase 100 shares of the underlying stock at the strike price in the future.
                            <br>
                            <br>
                            It is useful to understand some basic terminology regarding the strike of a call option: 
                            <ol class="text-white list-disc ml-5 sm:ml-3 p-3 text-[1rem]">
                                <li class="p-1">
                                    <span class="font-semibold">In-The-Money (ITM):</span> The stock price is <span class="italic">greater</span> than the strike price.
                                </li>
                                <li class="p-1">
                                    <span class="font-semibold">At-The-Money (ATM):</span> The stock price is <span class="italic">equal</span> to the strike price.
                                </li>
                                <li class="p-1">
                                    <span class="font-semibold">Out-of-the-money (OTM):</span> The stock price is <span class="italic">less</span> than the strike price.
                                </li>
                            </ol>
                            <div class="flex justify-center items-center w-full sm:w-11/12 pb-10 pt-7 sm:p-10">
                                <svg class="w-full h-full rounded-2xl" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120.3311378717422 595.9446960210801" filter="invert(93%) hue-rotate(180deg)">
                                    <!-- svg-source:excalidraw -->
                                    <defs>
                                      <style class="style-fonts">
                                        @font-face {
                                          font-family: "Virgil";
                                          src: url("https://excalidraw.com/Virgil.woff2");
                                        }
                                        @font-face {
                                          font-family: "Cascadia";
                                          src: url("https://excalidraw.com/Cascadia.woff2");
                                        }
                                        @font-face {
                                          font-family: "Assistant";
                                          src: url("https://excalidraw.com/Assistant-Regular.woff2");
                                        }
                                      </style>
                                      
                                    </defs>
                                    <g stroke-linecap="round"><g transform="translate(127 423.94469602108) rotate(0 479.5 -1.5)"><path d="M-0.5 -0.74 C159.26 -1.58, 799.13 -3.81, 958.85 -4.01 M1.44 1.49 C161 1.28, 798.05 -2.14, 957.82 -3" stroke="#1e1e1e" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(148 513.9446960210801) rotate(0 265 -2.5)"><path d="M-0.42 -0.45 C87.93 -1.38, 442.49 -4.97, 530.7 -5.72 M1.56 -1.73 C89.76 -2.5, 441.85 -4.25, 530.12 -4.56" stroke="#ff0000" stroke-width="4" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(1026 141.94469602108) rotate(0 -173.5 183)"><path d="M0.7 0.28 C-57.08 61.32, -288 304.29, -345.84 365.13 M-0.4 -0.62 C-58.31 60.65, -288.45 305.06, -346.18 366.2" stroke="#2f9e44" stroke-width="4" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(679 506.94469602108) rotate(0 0 -249)"><path d="M-0.66 -0.34 C-0.4 -83.29, 0.31 -413.86, 0.52 -496.94" stroke="#1e1e1e" stroke-width="1.5" fill="none" stroke-dasharray="8 9"></path></g></g><mask></mask><g transform="translate(10 90.94469602108) rotate(0 52.474998474121094 22.5)"><text x="0" y="31.536" font-family="Virgil, Segoe UI Emoji" font-size="36px" fill="#1e1e1e" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Profit</text></g><g transform="translate(23 479.94469602108) rotate(0 40.3125 22.5)"><text x="0" y="31.536" font-family="Virgil, Segoe UI Emoji" font-size="36px" fill="#1e1e1e" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Loss</text></g><g transform="translate(575 540.9446960210801) rotate(0 100.36250305175781 22.5)"><text x="0" y="31.536" font-family="Virgil, Segoe UI Emoji" font-size="36px" fill="#1e1e1e" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Stock Price</text></g><g stroke-linecap="round"><g transform="translate(959 413.94469602108) rotate(0 -48.5 -43.5)"><path d="M0.84 -0.95 C-15.36 -15.56, -81.71 -72.88, -97.96 -87.04" stroke="#2f9e44" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(915 267.94469602108) rotate(0 82 77)"><path d="M-0.95 0.02 C26.52 25.87, 136.81 128.6, 164.2 154.09" stroke="#2f9e44" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(813 374.94469602108) rotate(0 29.5 22.5)"><path d="M0.31 -0.42 C10.13 7, 48.83 36.42, 58.48 44.13" stroke="#2f9e44" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(977 201.94469602108) rotate(0 66.5 59)"><path d="M-0.85 -0.02 C21.37 19.8, 110.88 98.76, 133.33 118.36" stroke="#2f9e44" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(156 508.94469602108) rotate(0 49 -41)"><path d="M0.7 -0.18 C16.79 -13.9, 80.94 -68.33, 97.24 -81.8" stroke="#ff0000" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(216.03025395870213 508.933536529541) rotate(0 49 -41)"><path d="M0.91 0.03 C17.17 -13.64, 81.88 -67.94, 98.22 -81.7" stroke="#ee5365" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(290.03025395870213 506.933536529541) rotate(0 49 -41)"><path d="M-0.19 0.1 C16.41 -13.67, 82.78 -69.24, 99.08 -83.02" stroke="#ff0000" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(363.03025395870213 506.933536529541) rotate(0 49 -41)"><path d="M-0.92 -0.68 C15.55 -14.42, 82.54 -69.14, 99.14 -82.56" stroke="#ff0000" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(447.03025395870213 507.933536529541) rotate(0 49 -41)"><path d="M0.31 0.3 C16.93 -13.51, 82.32 -68.65, 98.61 -82.27" stroke="#ff0000" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(533.0302539587021 508.933536529541) rotate(0 49 -41)"><path d="M-0.2 -0.54 C16.08 -14.31, 82.48 -68.77, 98.86 -82.44" stroke="#ff0000" stroke-width="2.5" fill="none" stroke-dasharray="8 10"></path></g></g><mask></mask></svg>
                            </div>
                                
                            OTM options expire worthless, whereas ITM options hold value at expiration. However, simply being ITM doesn't guarantee profit. You need to consider the price you paid for the option. For instance, if you paid $5 per contract and the option is in the money by $2, you'd incur a $3 loss. 
                            <br>
                            <br>
                            Profiting from the option at expiration requires it to be ITM by more than the amount you paid for it; simple as that.
                        </div>
                        <!--End Paragraph-->

                        <h2 class="mt-10 text-white font-bold text-3xl p-3 mb-3">
                            What's the Goal
                        </h2>

                         <!--Start Paragraph-->
                         <div class="text-white text-lg pl-3 pr-3">
                            To break even at expiration, the underlying stock price must be higher than the strike price plus the premium you paid for the option.
                            <br>
                            <br>
                            For example, if you paid $5.00 for a 100 call and the stock is now worth $103, you will still lose money ($2 x 100 = $200) because you must cover the cost of the option.
                            <br>
                            <br>
                            Because of this, you really want the stock to go well above your strike price (depending on how much you paid for the option). Otherwise you will constantly be worrying if the stock is going to make it, which often leads to panic selling.
                            <br>
                            <br>
                            As a result, you want the stock to rise significantly above your strike price (depending on the amount you paid for the option). Otherwise, you'll be constantly worried about whether the stock will make it, which can lead to panic selling.
                        </div>
                        <!--End Paragraph-->

                        <h2 class="mt-10 text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-3 mb-3  bg-opacity-[0.9]">
                           Effect of Time
                        </h2>

                         <!--Start Paragraph-->
                         <div class="text-white text-lg pl-3 pr-3">
                            A call option will lose value as time passes due to theta decay. The rate of this accelerates as expiration approaches, with the majority of the decay happening in the final days or weeks of the option's lifetime.
                            <br>
                            <br>
                            Time decay occurs because as time passes, the chance of the stock making a large move decreases. An OTM contract can have plenty of value months before expiration, but as the final days approach, it will rapidly lose value if it is still out of the money. Simply put, when there is less time remaining, there is less of a chance that the stock will be able to move in time, making the price that others are willing to pay for the option less.
                            <br>
                            <br>
                            Time decay can be "fought" by other factors. The most obvious of course, is the price of the underlying stock. If the stock moves upwards enough, it can increase the value of the call more than the time decay is taking away from the call. Another factor is implied volatility, which can offset the decay if it increases enough.
                            <br>
                            <br>
                            Absent of these factors, a call will lose value as expiration approaches. The final price of a call will depend on how far ITM it is. All OTM calls, which previously were worth something due to the time value, will be worthless at expiration.
                        </div>
                        <!--End Paragraph-->

                        <h2 class="mt-10 text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-3 mb-3 bg-opacity-[0.9]">
                            Effect of Volatility
                        </h2>
 
                          <!--Start Paragraph-->
                          <div class="text-white text-lg pl-3 pr-3">
                            Volatility is a large unknown when trading options. Like the price of the stock itself, it is one thing that we cannot easily predict. Options will increase in value as implied volatility increases, and decrease when IV decreases. In fact, implied volatility is actually calculated from the price of the option itself compared to the "fair value" price of the option. When other traders are willing to pay more for an option, it increases that gap, which IV represents.
                            <br>
                            <br>
                            Why would an investor pay more for an option than the theoretical fair value? There are many reasons, all of which involve real world events that factor into their decision. The most common reason is that an earnings announcement is upcoming.
                            <br>
                            <br>
                            Typically, a stock moves either up or down a fair bit when earnings are announced, as the company either beats or doesn't meet earning expectations. You might think this would be the perfect time to buy a call, as there is a chance the stock makes a big move in the coming days. Of course, everyone else in the market also thinks this and wants to get in on the action. Demand from lots of buyers of an option will cause the price of the option to go up. (Just like how lots of demand from home buyers or concert-goers allows for sellers to charge more) It goes the other way too, as option sellers know their worth and aren't going to sell an option that could double in the coming days for cheap. 
                            <br>
                            <br>
                            Since there's expectation of a price raise, and therefore higher implied volatility, options are going for more than they usually would. However, after the announcement, implied volatility (and the price of the option) rapidly collapse to typical levels. So even if the price raises a lot as a result of the earnings, the call option might be worth less just because the IV is now lower (no more expectations that the price could raise further).
                         </div>
                         <!--End Paragraph-->
                        
                        <h2 class="mt-10 text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-3  bg-opacity-[0.9]">
                            Pros of Long Call Options
                        </h2>
                         <!--Start Paragraph-->
                         <div class="text-white text-lg pl-3 pr-3">
                            <ol class="text-white list-disc ml-5 sm:ml-3 p-3 text-[1rem]">
                                <li class="p-1">
                                    Buying a call is much cheaper than buying 100 shares of the underlying stock, giving you lots of leverage for relatively little capital.
                                </li>
                                <li class="p-1">
                                    Like owning shares, a long call has no profit cap.
                                </li>
                                <li class="p-1">
                                    You can never lose more than 100% of your investment. (This may sound like a con, but it is a benefit over other option strategies that have uncapped loss potential).
                                </li>
                            </ol>
                         </div>
                         <!--End Paragraph-->

                        <h2 class="mt-10 text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-3  bg-opacity-[0.9]">
                            Cons of Long Call Options
                        </h2>
                         <!--Start Paragraph-->
                         <div class="text-white text-lg pl-3 pr-3">
                            <ol class="text-white list-disc ml-5 sm:ml-3 p-3 text-[1rem]">
                                <li class="p-1">
                                    If the stock doesn't reach your breakeven point, you will lose your entire investment. If you owned shares instead, you may only be down a small amount, as the chance of a stock going to zero is slim. (But don't forget about Lehman Brothers)
                                </li>
                                <li class="p-1">
                                    Being highly leveraged means that even a small downwards move can send the call plummeting, leaving you with a tough decision to cut your losses or hold out for longer.
                                </li>
                            </ol>
                         </div>
                         <!--End Paragraph-->

                        <h2 class="mt-10 text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-3  bg-opacity-[0.9]">
                            Simple Example
                        </h2>
                         <!--Start Paragraph-->
                         <div class="text-white text-lg pl-3 pr-3">
                            When dealing with long call options, it's crucial to understand their value and how they work. At expiration, the value of a call option can be determined using a simple formula, also known as the intrinsic value:
                            <span class="flex justify-center items-center pt-10">
                                <Katex math={"\\text{option price} = \\max(\\text{stock price} - \\text{strike price}, 0)"} />
                            </span>
                            <br>
                            <br>
                            This formula reflects that if the stock price exceeds the strike price, the option is profitable and worth exercising. For instance, if the strike price is $100 and the stock is trading at $105, the option can be exercised to buy shares at $100, resulting in a profit of $5 per share when sold at the market price.
                            <br>
                            <br>
                            The value of a call option prior to expiry consists of both intrinsic value and extrinsic value, commonly referred to as time value. Calculating the extrinsic value manually can be complex, often necessitating the use of option pricing models.
                        
                            <br>
                            <br>
                            To find the breakeven, simply add the price you paid for the contract(s) to the strike price:
                            <span class="flex justify-center items-center pt-10">
                                <Katex math={"\\text{break-even} = \\text{strike price} + \\text{cost basis}"} />
                            </span>
                        </div>
                        
                         <!--End Paragraph-->


                        {#if data?.user?.tier !== 'Pro'}
                        <div class="mt-20">
                            <UpgradeToPro data={data} title="Start investing smarter than everyone else with our platform" />
                        </div>
                        {/if}


                    </div>
                </div>

                

            </div>

        </div>

    </main>
</section>

    




<style>
  .app {
      height: 500px;
      max-width: 1500px;
  }
  
  @media (max-width: 560px) {
      .app {
          max-width: 520px;
          height: 500px;
      }
  }

  .chart {
      width: 100%;
  }
</style>
