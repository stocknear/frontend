<script lang='ts'>
    import toast from 'svelte-french-toast';
    import {userRegion, screenWidth, openPriceAlert, displayCompanyName, stockTicker, etfTicker, cryptoTicker, assetType} from '$lib/store';
    import RangeSlider from 'svelte-range-slider-pips';
    
    export let data;
    
    let currentPrice = data?.getStockQuote?.price;
    let values = [0];
    let displayPrice = (currentPrice*(1+values?.at(0)/100))?.toFixed(2);

    const usRegion = ['cle1','iad1','pdx1','sfo1'];
    
    let fastifyURL;
    
    userRegion.subscribe(value => {
        if (usRegion.includes(value)) {
        fastifyURL  = import.meta.env.VITE_USEAST_FASTIFY_URL;
        } else {
        fastifyURL  = import.meta.env.VITE_EU_FASTIFY_URL;
        }
    });
        
        
    async function handleCreateAlert()
    {
        if (values?.at(0) === 0)
        {
            toast.error(`Percentage change must not be zero`, {
                style: 'border-radius: 10px; background: #333; color: #fff;  padding: 12px; margin-top: 10px; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);',
            });
        }
        else 
        {
            const postData = {
            'userId': data?.user?.id,
            'symbol': $assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker,
            'name': $displayCompanyName,
            'assetType': $assetType,
            'priceWhenCreated': currentPrice?.toFixed(2),
            'condition': values?.at(0) < 0 ? 'below' : 'above',
            'targetPrice': displayPrice,
        }
    
            // Make the POST request to the endpoint
            const response = await fetch(fastifyURL+'/create-price-alert', {
                method: 'POST',
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify(postData)
            });
    
            const output = (await response.json())?.items
    
            if (output === 'success') {
                toast.success(`Successfully created price alert`, {
                    style: 'border-radius: 10px; background: #333; color: #fff;  padding: 12px; margin-top: 10px; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);',
                });
    
                const closePopup = document.getElementById("priceAlertModal");
                closePopup?.dispatchEvent(new MouseEvent('click'))
                values = [0];
                displayPrice = currentPrice;
    
            }
            else {
                toast.error(`Something went wrong. Please try again!`, {
                    style: 'border-radius: 10px; background: #333; color: #fff;  padding: 12px; margin-top: 10px; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);',
                });
            }
            
        }
    }
        
        
    function numPadInput(number) {

        // Check if the input number is a single digit number
        if ( number >= 0 && number <= 9) {
            
            if(Math?.abs(displayPrice -currentPrice) < 0.001) {
                displayPrice = Number(number);
            }
            else {
                if((String(displayPrice)?.split('.')[1] || '')?.length < 2)
                {
                    displayPrice = Number(String(displayPrice) + String(number));
    
                }
            }
            values[0] = ((displayPrice/currentPrice-1)*100)
    
            const button = document.getElementById(`numPad-${number}`);
            if (button) {
                button.classList.add('bg-white', 'bg-opacity-[0.05]');
                setTimeout(() => {
                    button.classList.remove('bg-white', 'bg-opacity-[0.05]');
                }, 120);
            }
        }
        else if ( number === 'remove') {
            displayPrice = String(displayPrice).slice(0, -1);
            // If displayPrice becomes an empty string, set it to 0
            if (displayPrice === '') {
                displayPrice = 0;
            }
    
            values[0] = ((displayPrice/currentPrice-1)*100)
    
            const button = document.getElementById(`numPad-remove`);
            if (button) {
                button.classList.add('bg-white', 'bg-opacity-[0.05]');
                setTimeout(() => {
                    button.classList.remove('bg-white', 'bg-opacity-[0.05]');
                }, 120);
            }
        }
    
        else if ( number === 'dot') {
            if (!String(displayPrice)?.includes('.') && (String(displayPrice)?.split('.')[1] || '')?.length < 2) {
                displayPrice = String(displayPrice)+'.';
                console.log(displayPrice)
            }
    
            values[0] = ((displayPrice/currentPrice-1)*100)
    
            const button = document.getElementById(`numPad-dot`);
            if (button) {
                button.classList.add('bg-white', 'bg-opacity-[0.05]');
                setTimeout(() => {
                    button.classList.remove('bg-white', 'bg-opacity-[0.05]');
                }, 120);
            }
        }
    }
    

    $: isPositive = values[0] < 0;
	$: origin = isPositive ? '--left: auto; --right: 50%' : '--right: auto; --left: 50%';
	$: color = isPositive ? '#FF2F1F' : '#0DDE00';
    
$: {
    if ($openPriceAlert === true) {
        $openPriceAlert = false;
        currentPrice = data?.getStockQuote?.price
        values = [0];
        displayPrice = (currentPrice*(1+values?.at(0)/100))?.toFixed(2)
    }
}

</script>
    
<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
</svelte:head>

{#if $screenWidth >= 640}
    
    <!--Start Trade Modal-->
    <input type="checkbox" id="priceAlertModal" class="modal-toggle" />
    
    <dialog id="priceAlertModal" class="modal modal-bottom sm:modal-middle ">
    
    
    <label for="priceAlertModal"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.02]"></label>
    
    
        <div class="modal-box rounded-none w-full bg-[#000] border border-gray-800 h-[450px]" >
    
        <!--Start Trade Modal-->
        <label for="priceAlertModal" class="cursor-pointer absolute right-5 top-5 bg-[#000] text-[1.8rem] text-white">
        <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"/></svg>
        </label>
    
    
    
        <div class="flex flex-col w-full">
            
    
            <h2 class="text-white font-medium text-lg text-center m-auto mb-5 mt-3">
                Price Alerts
            </h2>
    
    
                <div class="flex justify-between items-center ">
    
                    
                    <body class="w-11/12 m-auto ">
                        <div class="mt-8 text-center flex flex-col justify-center items-center mb-14">
                            <div class="text-white font-medium text-5xl">
                                ${displayPrice}
                            </div>
                            <div class="text-sm text-white text-opacity-[0.5] mt-2">
                                Current Price: ${currentPrice}
                            </div>
                        </div>

                        <div class="positive-negative-slider" style="--range: {Math.abs(values[0]/2)}%; {origin}; --range-color: {color};">
                            <RangeSlider id="large" on:change={() => displayPrice = (currentPrice*(1+values?.at(0)/100))?.toFixed(2) } suffix="%" min={-100} max={100}  all={false} first={false} last={false} rest={false} hoverable={false} bind:values />
                        </div>
                        {#if values?.at(0) !== 0}
                            <div class="text-white text-center m-auto text-sm">
                                Triggers once when price moves {values?.at(0) > 0 ? 'above' : 'below'} 
                                {#if values?.at(0) > 0}
                                <svg class="inline-block w-5 h-5 -mr-1 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                <span class="text-[#10DB06] font-medium">+{values?.at(0)?.toFixed(2)}%</span>
                                {:else if values?.at(0) < 0}
                                <svg class="inline-block w-5 h-5 -mr-1 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                <span class="inline-block text-[#FF2F1F] font-medium">{values?.at(0)?.toFixed(2)}% </span> 
                                {/if}
                            </div>
                        {:else}
                        <div class="text-white text-opacity-60 m-auto text-center text-sm">
                            Set a trigger by moving the slider.
                        </div> 
                        {/if}
                    </body>
    
                </div>
    
    
                <div class="w-full pt-8 m-auto flex justify-center items-center">
                    <button on:click={handleCreateAlert} class="m-auto cursor-pointer px-7 py-2 rounded-full transition ease-out {values?.at(0) !== 0 ? 'bg-[#0DDE00]' : 'bg-gray-600'} text-center text-black font-medium">
                        Create
                    </button>
                </div>
    
    
        </div>
        
    
    
        <!--End Trade Modal-->
    
    
            </div>
        </dialog>
    
    
    
    {:else}
    <!--Start Mobile Price Alert-->
    <div class="drawer drawer-end overflow-hidden w-screen z-40">
        <input id="priceAlertModal" type="checkbox" class="drawer-toggle"/>
        <div class="drawer-side overflow-y-scroll overflow-hidden">
        
            
          <div class="bg-[#000] min-h-screen px-5 w-screen pb-20 overflow-y-scroll overflow-hidden">
      
        
         <!--Start Header-->
         <div class="bg-[#000] w-full p-1 flex flex-col items-center pb-5 h-auto">
            <label for="priceAlertModal" class="absolute left-6 top-6">
                <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
              </label>
            <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
              Price Alert
            </h2>
        </div>
        <!--End Header-->
      
        <div class="flex justify-between items-center ">
        
                        
            <body class="w-11/12 m-auto">
                <div class="mt-8 text-center flex flex-col justify-center items-center mb-14">
                    <div class="text-white font-medium text-5xl">
                        ${displayPrice}
                    </div>
                    <div class="text-sm text-white text-opacity-[0.5] mt-2">
                        Current Price: ${currentPrice}
                    </div>
                </div>
                    <div class="text-center font-medium flex justify-center">
                    {#if ((displayPrice/currentPrice-1)*100) > 100}
                        <span class="text-[#10DB06]">{((displayPrice/currentPrice-1)*100)?.toFixed(2)}%</span>
                    {:else if values?.at(0) > 0}
                        <span class="text-[#10DB06]">{values?.at(0)?.toFixed(2)}%</span>
                    {:else if values?.at(0) < 0}
                        <span class="inline-block text-[#FF2F1F]">{values?.at(0)?.toFixed(2)}% </span>
                    {:else}
                        <span class="inline-block text-white text-opacity-[0.6]">0%</span>
                    {/if}
                    </div>
                  

                    <div class="positive-negative-slider" style="--range: {Math.abs(values[0]/2)}%; {origin}; --range-color: {color};">
                        <RangeSlider id="large" on:change={() => displayPrice = (currentPrice*(1+values?.at(0)/100))?.toFixed(2) } suffix="%" min={-100} max={100}  all={false} first={false} last={false} rest={false} hoverable={false} bind:values />
                    </div>
    
                <div class="{values?.at(0) !== 0 ? 'invisible' : ''} text-white text-opacity-60 m-auto text-center text-sm">
                    Set a trigger by moving the slider.
                </div> 
            </body>
    
        </div>
    
    
        <div class="w-full pt-4 flex justify-end items-center ml-auto pr-8">
            <button on:click={handleCreateAlert} class="ml-auto cursor-pointer px-5 py-2 rounded-full transition ease-out {values?.at(0) !== 0 ? 'bg-[#0DDE00]' : 'bg-gray-600'} text-center text-black font-medium">
                Create
            </button>
        </div>
    
        <div class="flex flex-wrap pl-5 rounded-xl bg-[#000] max-w-sm mx-auto mt-5">
            {#each Array.from({ length: 9 }, (_, i) => i + 1) as number}
                <div class="w-1/3">
                    <button id={"numPad-" + number} on:click={() => numPadInput(number)} class="transition ease-out w-20 h-20 text-2xl text-white font-bold rounded-full">{number}</button>
                </div>
            {/each}
            <div class="w-1/3">
                <button id="numPad-dot" on:click={() => numPadInput('dot')} class="transition ease-out w-20 h-20 text-2xl text-white font-bold rounded-full">.</button>
            </div>
            <div class="w-1/3">
                <button id="numPad-0" on:click={() => numPadInput(0)} class="transition ease-out w-20 h-20 text-2xl text-white font-bold rounded-full">0</button>
            </div>
            <div class="w-1/3">
                <button id="numPad-remove" on:click={() => numPadInput('remove')} class="transition ease-out w-20 h-20 text-2xl text-white font-bold rounded-full">
                    <svg class="w-6 h-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="gray" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
                </button>
            </div>
        </div>
      
      
        </div>
        </div>
        </div>
      <!--End Mobile Price Alert-->
        
      
        
        {/if}
    
    
    
    
<style>
#large { 
    font-size: 1em;
    margin-inline: 0;
    --range-handle-focus: gray;
}
#large .rangeFloat { 
    font-size: 1.2em;
}

#x {
    margin-inline: 0;
}

.positive-negative-slider {
    background: white;
    position: relative;
    --range-slider: transparent;
    margin-inline: 1em;
    border-radius: 10px;
}
.positive-negative-slider::after {
    content: "";
    position: absolute;
    left: var(--left);
    right: var(--right);
    top: 0;
    bottom: 0;
    width: var(--range,0);
    background-color: var(--range-color);
    border-radius: inherit;
}

</style>
    