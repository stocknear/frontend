<script lang='ts'>
    import toast from 'svelte-french-toast';
    import {userRegion, screenWidth, currentPortfolioPrice, displayCompanyName, traded, stockTicker, etfTicker, cryptoTicker, assetType} from '$lib/store';
    
    export let data;
    export let availableCash;
    export let holdingShares;
    
    const usRegion = ['cle1','iad1','pdx1','sfo1'];
    
    let fastifyURL;
    
    userRegion.subscribe(value => {
      if (usRegion.includes(value)) {
        fastifyURL  = import.meta.env.VITE_USEAST_FASTIFY_URL;
      } else {
        fastifyURL  = import.meta.env.VITE_EU_FASTIFY_URL;
      }
    });
    
    
    let estimatedTotal = 0;
    let numberOfShares = 0;
    let commissionPrice = 0;
    
    let displayTab = 'changeOrder';
    
    function handleMaxOrder()
    {
        if ($currentPortfolioPrice > availableCash)
        {
            toast.error(`Not enough money to buy ${$stockTicker} shares`, {
                style: 'border-radius: 200px; background: #333; color: #fff;'
            });
        }
        else 
        {
            numberOfShares = Math.floor(availableCash/$currentPortfolioPrice);
            estimatedTotal = (numberOfShares * $currentPortfolioPrice);
        }
    }
    
    
    function handleInputChange(event) {
        const inputValue = event.target.value;
    
        if (!isNaN(inputValue) && Number(inputValue) >= 0) {
            numberOfShares = Number(inputValue);
        } else {
            numberOfShares = 0;
        }
    
        estimatedTotal = numberOfShares * $currentPortfolioPrice;
    }
    
    function handleAppendNumber(num) {
        // Append the clicked number to the current numberOfShares
        numberOfShares = numberOfShares * 10 + num;
    }
    
    function handleRemoveNumber() {
        // Remove the last digit from numberOfShares or set to zero if NaN
        const numStr = numberOfShares.toString();
        numberOfShares = numStr.length > 1 ? parseInt(numStr.slice(0, -1), 10) : 0;
      }
    
    
    function changeTab() {
    
        if(displayTab === 'changeOrder' && numberOfShares > 0 && estimatedTotal <= availableCash)
        {
            displayTab = 'buyOrder';
           
        }
    
        else if (displayTab === 'buyOrder')
        {
            displayTab = 'changeOrder';
        }
    
        else {
            toast.error('Please check your Input values again.', {
                style: 'border-radius: 200px; background: #333; color: #fff;'
            });
        }
    }
    
    async function handleBuyOrder()
    {
    
        const postData = {
            'userId': data?.user?.id,
            'symbol': $assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker,
            'assetType': $assetType,
            'name': $displayCompanyName,
            'numberOfShares': numberOfShares,
            'estimatedTotal': estimatedTotal,
            'boughtPrice': $currentPortfolioPrice,
        }
    
    
    
            // Make the POST request to the endpoint
        const response = await fetch(fastifyURL+'/buy-stock', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
    
        const output = (await response.json())?.items;
    
    
        if (output === 'success')
        {
    
            toast.success(`Successfully bought ${numberOfShares} ${$stockTicker} shares`, {
                style: 'border-radius: 200px; background: #333; color: #fff;'
            });
    
            numberOfShares = 0;
            estimatedTotal = 0;
            displayTab = 'changeOrder';
    
            $traded = true;
    
            const closePopup = document.getElementById("buyTradeModal");
    
            closePopup?.dispatchEvent(new MouseEvent('click'))
            
        }
        else if (output === 'failure')
        {
            toast.error(`Something went wrong. Please try again.`, {
                style: 'border-radius: 200px; background: #333; color: #fff;'
            });
        }
        else if (output === 'marketClosed')
        {
            toast.error(`The market is closed. Please try again later.`, {
                style: 'border-radius: 200px; background: #333; color: #fff;'
            });
        }    
    
        
    }
    
    
    
    $: {
        if(numberOfShares)
        {
            estimatedTotal = (numberOfShares * $currentPortfolioPrice);
        }
    }
    </script>
    
    <svelte:head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
    </svelte:head>
    
    {#if $screenWidth >= 640}
    
    <!--Start Trade Modal-->
    <input type="checkbox" id="buyTradeModal" class="modal-toggle" />
    
    <dialog id="buyTradeModal" class="modal modal-bottom sm:modal-middle ">
    
    
      <label for="buyTradeModal"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.08]"></label>
      
      
      <div class="modal-box rounded-none w-full bg-[#000] h-[500px]" >
    
       <!--Start Trade Modal-->
    
    
    
    
        <div class="flex flex-col w-full">
           
            {#if displayTab === 'changeOrder'}
    
            <div class= "flex flex-col">
                <div class="text-white text-md flex flex-col flex-shrink-0">
                    <div class="rounded-full w-10 h-10 relative bg-[#09090B] mb-2">
                        <img class="rounded-full w-6 h-6 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${$assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker}.png`} loading="lazy"/>
                    </div>
                    <span class="mb-1">
                        {$displayCompanyName?.length > 35 ? $displayCompanyName?.slice(0, 35) + "..." : $displayCompanyName}
                    </span>
                    <span class="mb-1 text-sm font-medium">
                        Current Price: ${$currentPortfolioPrice}
                    </span>
                </div>
                {#if holdingShares !== 0}
                <span class="text-blue-400 text-sm ml-auto font-medium">
                    Holding Shares: {holdingShares}
                </span>
                {/if}
            </div>
    
    
                <div class="flex justify-between items-center mt-2">
    
                    <div class="flex flex-col sm:w-64">
                        <label class="label font-medium">
                            <span class="text-white label-text">Number of Shares</span>
                        </label>
    
                        <input bind:value={numberOfShares} on:input={handleInputChange} type="text" placeholder="Number of Shares" class="text-slate-200 input {estimatedTotal > availableCash ? 'input-error' : ''} bg-gray-900 input-md w-54 sm:w-full max-w-xs" />
                    </div>
                    <label on:click={handleMaxOrder} class="mt-9 btn bg-[#000] hover:bg-[#fff] hover:text-black text-white cursor-pointer sm:px-5 border rounded-lg">
                        Show Max
                    </label>
                </div>
    
                    <span class="{estimatedTotal < availableCash ? 'hidden' : ''} label-text-alt text-error mt-1">
                        Not enough money to buy the amount
                    </span>
    
    
    
                <div class="flex justify-between items-center mt-8 w-full">
                    <div class="flex flex-col sm:flex-row text-blue-400  font-medium text-sm">
                        <span class="mr-0 sm:mr-1">
                            Available Cash:
                        </span>
                        <span>
                            {availableCash?.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                            })}
                        </span>
                    </div>
    
                    <div class="flex flex-col sm:flex-row text-blue-400 text-sm">
                        <span class="mr-0 sm:mr-1">
                            Estimated Total:
                        </span>
                        <span>
                            {estimatedTotal?.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                            })}
                        </span>
                    </div>
                </div>
    
    
              
    
    
    
                <div class="w-5/6 max-w-lg pt-10 pb-20 m-auto">
                    <button on:click={changeTab} class="btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
                        Preview Buy Order
                    </button>
                </div>
    
            {:else if displayTab === 'buyOrder'}
    
            <div class="text-white text-md flex flex-col flex-shrink-0">
                <div class="rounded-full w-10 h-10 relative bg-gray-900 mb-2">
                    <img class="rounded-full w-6 h-6 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${$assetType === 'stock' ? $stockTicker : $etfTicker}.png`} loading="lazy"/>
                </div>
                <span class="mb-1 font-medium text-xl">
                    Buying {numberOfShares} shares of {$displayCompanyName?.length > 35 ? $displayCompanyName?.slice(0, 35) + "..." : $displayCompanyName}
                </span>
                
            </div>
    
    
            <table class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto">
                <tbody>
                <!-- row 1 -->
                <tr class="text-white" style="font-size: 0.8rem">
                    <td class="text-start bg-[#000] text-white font-medium">Price per Share</td>
                    <td class="bg-[#000] whitespace-normal">${$currentPortfolioPrice}</td>
                </tr>
                <tr class="text-white" style="font-size: 0.8rem">
                    <td class="text-start bg-[#000] text-white font-medium">Number of Shares</td>
                    <td class="bg-[#000] whitespace-normal">{numberOfShares}</td>
                </tr>
                <tr class="text-white" style="font-size: 0.8rem">
                    <td class="text-start bg-[#000] text-white font-medium">Commission</td>
                    <td class="bg-[#000] whitespace-normal">${commissionPrice}</td>
                </tr>
                <tr class="text-white" style="font-size: 0.8rem">
                    <td class="text-start bg-[#000] text-white font-medium">Estimated Total</td>
                    <td class="bg-[#000] whitespace-normal">{estimatedTotal?.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                    })}
                    </td>
                </tr>
                <tr class="text-white" style="font-size: 0.8rem">
                    <td class="text-start bg-[#000] text-white font-medium">Available Cash After</td>
                    <td class="bg-[#000] whitespace-normal">{(availableCash-estimatedTotal-commissionPrice)?.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                    })}
                    </td>
                </tr>
                
                </tbody>
            </table>
    
    
                <div class="max-w-lg pt-10 m-auto pb-5 flex flex-row justify-center items-center">
                    <button on:click={changeTab} class="w-3/4 mr-8 btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md rounded-lg text-white font-bold text-md">
                        Change Order
                    </button>    
                    
                    <button on:click={handleBuyOrder} class="w-3/4 btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md rounded-lg text-white font-bold text-md">
                            Buy
                    </button>
                </div>
                
    
            {/if}
    
        </div>
        
    
    
       <!--End Trade Modal-->
    
    
          </div>
      </dialog>
    
    
    
    {:else}
    <!--Start Drawer Sidewise for mobile-->
    
    
    <div class="drawer drawer-end z-40">
      <input id="buyTradeModal" type="checkbox" class="drawer-toggle"/>
      
        <div class="drawer-side">
        
        
            <div class="modal-box overflow-hidden rounded-xl bg-[#000] min-h-screen w-screen" >
               
    
    
                <div class="flex flex-col w-full mt-14">
           
                    {#if displayTab === 'changeOrder'}
            
                    <div class= "flex flex-col">
                        <div class="text-white text-md flex flex-col flex-shrink-0">
                            <div class="rounded-full w-10 h-10 relative bg-[#09090B] mb-2">
                                <img class="rounded-full w-6 h-6 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${$assetType === 'stock' ? $stockTicker : $etfTicker}.png`} loading="lazy"/>
                            </div>
                            <span class="mb-1">
                                {$displayCompanyName?.length > 35 ? $displayCompanyName?.slice(0, 35) + "..." : $displayCompanyName}
                            </span>
                            <span class="mb-1 text-sm font-medium">
                                Current Price: ${$currentPortfolioPrice}
                            </span>
                        </div>
                        {#if holdingShares !== 0}
                        <span class="text-blue-400 text-sm ml-auto font-medium">
                            Holding Shares: {holdingShares}
                        </span>
                        {/if}
                    </div>
            
            
                        <div class="flex justify-between items-center mt-2">
            
                            <div class="flex flex-col sm:w-64">
                                <label class="label font-medium">
                                    <span class="text-white label-text">Number of Shares</span>
                                </label>
            
                                <input inputmode="tel" pattern="[0-9]*" bind:value={numberOfShares} on:input={handleInputChange} type="text" placeholder="Number of Shares" class="text-slate-200 input {estimatedTotal > availableCash ? 'input-error' : ''} bg-gray-900 input-md w-54 sm:w-full max-w-xs" />
                            </div>
                            <label on:click={handleMaxOrder} class="mt-9 btn bg-[#000] hover:bg-[#fff] hover:text-black text-white cursor-pointer sm:px-5 border rounded-lg">
                                Show Max
                            </label>
                        </div>
            
                            <span class="{estimatedTotal < availableCash ? 'hidden' : ''} label-text-alt text-error mt-1">
                                Not enough money to buy the amount
                            </span>
            
            
            
                        <div class="flex justify-between items-center mt-8 w-full">
                            <div class="flex flex-col sm:flex-row text-blue-400  font-medium text-sm">
                                <span class="mr-0 sm:mr-1">
                                    Available Cash:
                                </span>
                                <span>
                                    {availableCash?.toLocaleString(undefined, {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
            
                            <div class="flex flex-col sm:flex-row text-blue-400 text-sm">
                                <span class="mr-0 sm:mr-1">
                                    Estimated Total:
                                </span>
                                <span>
                                    {estimatedTotal?.toLocaleString(undefined, {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
                        </div>
            
            
                        <!--
                        <div class="grid grid-cols-3 gap-x-6 gap-y-2 text-white font-bold text-lg m-auto mt-14">
                            {#each Array.from({ length: 10 }, (_, index) => index+1) as num}
                            {#if num < 10}
                                <label on:click={() => handleAppendNumber(num)} class="rounded-full flex justify-center items-center w-16 h-16">
                                {num}
                                </label>
                            {/if}
                            {/each}
                            <div class="rounded-full flex justify-center items-center w-16 h-16">
                            </div>
                            <div class="rounded-full flex justify-center items-center w-16 h-16 hover:bg-gray-600 hover:bg-opacity-[0.4]">
                                0
                            </div>
                            <label on:click={() => handleRemoveNumber()} class="rounded-full flex justify-center items-center w-16 h-16 hover:bg-gray-600 hover:bg-opacity-[0.4]">
                                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(-90 12 12)"><path fill="white" d="M13 7.828V20h-2V7.828l-5.364 5.364l-1.414-1.414L12 4l7.778 7.778l-1.414 1.414L13 7.828Z"/></g></svg>
                            </label>
                        </div>
                        -->
                
            
            
            
                        <div class="w-5/6 max-w-lg pt-16 pb-10 m-auto">
                            <button on:click={changeTab} class="btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
                                Preview Buy Order
                            </button>
                        </div>
            
                    {:else if displayTab === 'buyOrder'}
            
            
                    <div class="text-white text-md flex flex-col flex-shrink-0">
                        <div class="rounded-full w-10 h-10 relative bg-gray-900 mb-2">
                            <img class="rounded-full w-6 h-6 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${$assetType === 'stock' ? $stockTicker : $etfTicker}.png`} loading="lazy"/>
                        </div>
                        <span class="mb-1 font-medium text-xl">
                            Buying {numberOfShares} shares of {$displayCompanyName?.length > 35 ? $displayCompanyName?.slice(0, 35) + "..." : $displayCompanyName}
                        </span>
                        
                    </div>
            
            
                    <table class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto">
                        <tbody>
                        <!-- row 1 -->
                        <tr class="text-white" style="font-size: 0.8rem">
                            <td class="text-start bg-[#000] text-white font-medium">Price per Share</td>
                            <td class="bg-[#000] whitespace-normal">${$currentPortfolioPrice}</td>
                        </tr>
                        <tr class="text-white" style="font-size: 0.8rem">
                            <td class="text-start bg-[#000] text-white font-medium">Number of Shares</td>
                            <td class="bg-[#000] whitespace-normal">{numberOfShares}</td>
                        </tr>
                        <tr class="text-white" style="font-size: 0.8rem">
                            <td class="text-start bg-[#000] text-white font-medium">Commission</td>
                            <td class="bg-[#000] whitespace-normal">${commissionPrice}</td>
                        </tr>
                        <tr class="text-white" style="font-size: 0.8rem">
                            <td class="text-start bg-[#000] text-white font-medium">Estimated Total</td>
                            <td class="bg-[#000] whitespace-normal">{estimatedTotal?.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                            })}
                            </td>
                        </tr>
                        <tr class="text-white" style="font-size: 0.8rem">
                            <td class="text-start bg-[#000] text-white font-medium">Available Cash After</td>
                            <td class="bg-[#000] whitespace-normal">{(availableCash-estimatedTotal-commissionPrice)?.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                            })}
                            </td>
                        </tr>
                        
                        </tbody>
                    </table>
            
            
                    
            
                        <div class="w-5/6 max-w-lg pt-10 m-auto pb-5 flex flex-col items-center">
                            <button on:click={changeTab} class="btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
                                Change Order
                            </button> 
    
                            <button on:click={handleBuyOrder} class="mt-6 btn bg-[#000] hover:bg-[#fff] hover:text-black border border-slate-500 btn-md w-full rounded-lg m-auto text-white font-bold text-md">
                                Buy Order
                            </button>
                        </div>
    
                       
                    {/if}
    
                    
    
    
    
                </div>
    
                <label for="buyTradeModal" class="absolute left-6 top-4 sm:hidden">
                    <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
                    <span class="text-white text-md font-medium">
                      Return
                    </span>
                </label>
    
            </div>
        </div>
    </div>
    
    {/if}