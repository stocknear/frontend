<script lang='ts'>
    import { onMount } from 'svelte';
    
    //import proTierLogo from "$lib/images/pro_tier_logo.png";
    
    export let data;
    export let form;

    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;
    
    let mode = true;
    
    function toggleMode()
    {
        mode = !mode;
    }
    
    
    let LoginPopup;
    
    
onMount(async () => {
    LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
});

</script>

<section class="bg-[#000000] min-h-screen max-w-7xl w-full pt-24 m-auto">
    <div class="px-3">
        <div class="mx-auto text-center mb-8 ">
            
            
            <h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#E8BB28] to-purple-500 bg-clip-text text-transparent pb-4">
                Flexible plans and features
            </h1>
            <div class="w-full flex justify-center items-center h-16 bg-[#000000] rounded-lg">
                <p class="font-medium font-serif text-center w-3/4 sm:w-full text-white text-[1rem] sm:text-xl italic">
                    Simple pricing. No hidden fees. Cancel anytime.
                </p>
            </div>

            
            <div class="flex flex-row items-center justify-center mt-6 pb-5">
                <span class="text-sm font-medium text-white text-opacity-[0.6] mr-3">
                    Pay Monthly
                </span>
    
                <label class="inline-flex cursor-pointer relative ">
                    
                    <input on:click={toggleMode} type="checkbox" checked={mode} value={mode} class="sr-only peer">
                    <div class="w-14 h-7 bg-gray-400 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[0.40rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1563F9] {mode === false ? 'after:translate-x-[-0.2rem]' : ''} "></div>
                </label>
                
                <div class="ml-3 -mb-4 flex flex-col items-start">
                    <span class="text-sm font-medium text-white text-opacity-[0.6]">
                        Pay Yearly
                    </span>
                    <span class="text-[#FBCE3C] text-sm font-semibold">
                        Save up 50%
                    </span>
                </div>
              
            </div>
            
         
        </div>


        <!--<Discount/>-->




        <div class="flex flex-col sm:flex-row items-center gap-10 sm:gap-5 w-full max-w-7xl m-auto mt-10 sm:mt-20">
            <!-- Pricing Card -->
            <div class="order-last sm:order-1 flex flex-col p-6 lg:p-8 mx-auto w-full text-center text-white border border-gray-800 bg-[#000000] rounded-lg">


                <div class="flex flex-row items-center justify-start items-center mt-2">
                    <img src={cloudFrontUrl+"/assets/free_tier_logo.png"} class="w-16 transform ease-in-out duration-300" loading="lazy" alt="free tier" />
                    <h2 class="m-auto sm:ml-8 text-4xl font-bold text-white">
                        Free Tier
                    </h2>
                </div>
                


                <div class="flex flex-col mt-8 mb-6">

                    <div class="flex flex-row items-center">
                        <span class="mr-2 text-4xl font-bold">$0</span>
                        <span class="text-gray-300 text-xl">/month</span>
                    </div> 
                </div>


                <ol class="mb-8 space-y-4 text-left">
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Stock Screener Strategy</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Financial history.</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Hedge Funds Portfolio.</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Wall Street Analysts Ratings</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Watchlist Strategy</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Price Alerts</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="orange" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-1-4h2V7h-2v6Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                        <span class="text-white text-sm font-medium">Limited Options Data</span>
                    </li>
                </ol>

        

                <div class="divider"></div>
                <div class="m-auto w-full text-white font-medium text-sm mb-6">
                    + Limited feature updates
                </div>  

                {#if !data?.user}
                <label for="userLogin" class="btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group">
                    Get Sign In
                </label>
                {/if}

               
            </div>
            <!--End Pricing Card-->
            
        

            <!-- Pricing Card -->
            <div class="relative sm:order-2 light-box-1 box sm:-mt-10 flex flex-col p-6 lg:p-8 mx-auto ring-[1px] ring-[#FF2F1F] w-full text-center text-white bg-gradient-to-r from-orange-600 to-purple-800">
                <div class="{!mode ? 'hidden' : ''} ribbon ribbon-top-right"><span class="text-white">Discount</span></div>

                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-2xl flex flex-row items-center bg-red-600 p-2">
                    <svg class="w-6 h-6 mr-2" fill="#D6D6DC" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" stroke=""><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>star-solid</title> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="icons_Q2" data-name="icons Q2"> <path d="M24,3a2.1,2.1,0,0,0-1.8,1.1L16.5,15.7,3.7,17.5A2.1,2.1,0,0,0,2.6,21l9.2,8.9L9.7,42.7A2,2,0,0,0,11.6,45l1-.2,11.4-6,11.4,6,1,.2a2,2,0,0,0,1.9-2.3L36.2,29.9,45.4,21a2.1,2.1,0,0,0-1.1-3.5L31.5,15.7,25.8,4.1A2.1,2.1,0,0,0,24,3Z"></path> </g> </g> </g></svg>
                    <span class="text-white text-md font-medium">
                        Most Popular
                    </span>
                </div>                

                <div class="flex flex-row justify-start items-center mt-10 mb-3">
                    <img src={cloudFrontUrl+"/assets/pro_tier_logo.png"} class="w-28 transform ease-in-out duration-300" style="transform: rotate(23deg);" loading="lazy" alt="pro tier" />
                    <h2 class="text-4xl font-bold text-white">
                        Pro Tier
                    </h2>
                </div>
                


                <div class="flex flex-col  mb-6 items-center">

                    <div class="flex flex-row items-center">
                        <span class="mr-2 text-4xl font-bold">{mode ? '$24.92' : '$49.99'}</span>
                        <span class="text-white text-xl">/month</span>
                    </div>
                    <!--
                    <div class="flex flex-col items-center">
                        <div class="flex flex-row items-center">
                            <span class="mr-2 text-[#FFF374] text-3xl font-bold">{mode ? '$124.75' : '$12.50'}</span>
                            <span class="text-[#FFF374] text-xl">{mode ? '/year' : '/month'}</span>
                        </div>
                        <span class="text-white font-bold text-xl mt-3">
                            Promo Code: SUMMER75
                        </span>
                    </div>
                    -->

                    <!--
                    <div class="flex items-center mt-2 text-[1rem] text-center">
                        only ${mode ? (7.5/4)?.toFixed(2) : (9.99/4)?.toFixed(2)} / week, less than a
                        {#if mode}
                        <svg fill="#000000" class="w-7 h-7 inline-block ml-2" viewBox="0 0 64 64" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:serif="http://www.serif.com/" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="matrix(1,0,0,1,-192,-384)"> <g id="Icon"> <g transform="matrix(1.88491,0,0,2.02804,-563.297,366.103)"> <path d="M406.242,19.317L405.521,17.726C405.376,17.406 405.302,17.063 405.302,16.716L405.302,15.133C405.302,14.861 405.064,14.64 404.771,14.64C404.478,14.64 404.241,14.861 404.241,15.133C404.241,15.133 404.241,16.063 404.241,16.716C404.241,17.194 404.344,17.668 404.543,18.109L405.265,19.7C405.378,19.951 405.69,20.069 405.959,19.963C406.229,19.857 406.356,19.568 406.242,19.317Z" style="fill:#4a2401;"></path> </g> <g transform="matrix(2.02492,0,6.74129e-17,0.517887,-103.544,366.884)"> <path d="M150.985,122.829C150.985,122.829 151.287,121.782 151.669,120.456C152.571,117.323 153.916,117.152 154.868,120.048C154.953,120.307 155.039,120.567 155.123,120.825C156.027,123.575 157.294,123.575 158.198,120.825C158.318,120.46 158.439,120.091 158.559,119.726C159.463,116.976 160.729,116.976 161.633,119.726C161.753,120.091 161.874,120.46 161.994,120.825C162.898,123.575 164.164,123.575 165.068,120.825C165.188,120.46 165.31,120.091 165.43,119.726C166.334,116.976 167.6,116.976 168.504,119.726C168.613,120.058 168.723,120.394 168.833,120.727C169.752,123.522 171.042,123.471 171.947,120.603C172.351,119.321 172.676,118.29 172.676,118.29" style="stroke:black;stroke-width:1.35px;"></path> </g> <path d="M252.15,423.893C252.15,423.341 251.702,422.893 251.15,422.893L197.15,422.893C196.598,422.893 196.15,423.341 196.15,423.893L196.15,434.452C196.15,435.005 196.598,435.452 197.15,435.452L251.15,435.452C251.702,435.452 252.15,435.005 252.15,434.452L252.15,423.893Z" style="fill:#f8ac3a;"></path> <path d="M248,423.081L248,431.418C248,431.971 247.552,432.418 247,432.418L196.15,432.23L196.15,434.452C196.15,435.005 196.598,435.452 197.15,435.452L251.15,435.452C251.702,435.452 252.15,435.005 252.15,434.452L252.15,423.893C252.15,423.341 251.702,422.893 251.15,422.893L248,423.081Z" style="fill:#f39404;"></path> <path d="M251.15,424.893C251.702,424.893 252.15,424.446 252.15,423.893L252.15,417.973C252.15,417.42 251.702,416.973 251.15,416.973L197.15,416.973C196.598,416.973 196.15,417.42 196.15,417.973L196.15,423.893C196.15,424.446 196.598,424.893 197.15,424.893L251.15,424.893Z" style="fill:#633001;"></path> <path d="M247.785,416.973L247.785,422.393C247.785,422.946 247.337,423.393 246.785,423.393L196.15,423.393L196.15,423.893C196.15,424.446 196.598,424.893 197.15,424.893L251.15,424.893C251.702,424.893 252.15,424.446 252.15,423.893L252.15,417.973C252.15,417.42 251.702,416.973 251.15,416.973L247.785,416.973Z" style="fill:#4a2401;"></path> <path d="M196.396,417.394C196.138,417.69 196.078,418.109 196.24,418.466C196.403,418.822 196.76,419.051 197.152,419.05L251.152,418.972C251.63,418.971 252.041,418.631 252.132,418.161C252.223,417.691 251.968,417.223 251.524,417.044L211.575,400.968C211.18,400.809 210.727,400.918 210.447,401.239L196.396,417.394Z" style="fill:#f8ac3a;"></path> <path d="M250.284,416.545C250.136,416.92 249.771,417.176 249.356,417.176L196.518,417.253L196.396,417.394C196.138,417.69 196.078,418.109 196.24,418.466C196.403,418.822 196.76,419.051 197.152,419.05L251.152,418.972C251.63,418.971 252.041,418.631 252.132,418.161C252.223,417.691 251.968,417.223 251.524,417.044L250.284,416.545Z" style="fill:#f39404;"></path> <g transform="matrix(-0.772662,0.119061,0.399687,-0.671887,523.886,376.884)"> <path d="M409.114,24.501L411.281,26.668C412.109,27.495 413.098,27.85 413.488,27.46C413.878,27.07 413.523,26.081 412.696,25.254L410.528,23.086C409.701,22.259 408.712,21.904 408.322,22.294C407.931,22.684 408.286,23.673 409.114,24.501Z" style="fill:#633001;"></path> </g> <g transform="matrix(-0.456347,-0.634767,0.780068,0.0517307,390.464,672.695)"> <path d="M409.114,24.501L411.281,26.668C412.109,27.495 413.098,27.85 413.488,27.46C413.878,27.07 413.523,26.081 412.696,25.254L410.528,23.086C409.701,22.259 408.712,21.904 408.322,22.294C407.931,22.684 408.286,23.673 409.114,24.501Z" style="fill:#633001;"></path> </g> <g transform="matrix(0.684962,-0.289867,-0.289867,0.733294,-50.9722,516.046)"> <path d="M420.323,27.794L422.323,29.634C423.294,30.528 424.386,30.923 424.759,30.517C425.133,30.111 424.648,29.056 423.677,28.162L421.677,26.322C420.706,25.429 419.614,25.033 419.241,25.439C418.867,25.845 419.352,26.901 420.323,27.794Z" style="fill:#633001;"></path> </g> <g transform="matrix(0.614789,-0.531458,0.159337,0.807329,-40.7207,606.391)"> <path d="M405.432,29.315L407.302,31.139C407.982,31.802 408.847,32.019 409.232,31.624C409.618,31.229 409.378,30.37 408.698,29.707L406.828,27.883C406.148,27.22 405.283,27.003 404.898,27.398C404.512,27.793 404.752,28.652 405.432,29.315Z" style="fill:#633001;"></path> </g> <path d="M205.515,402.587C202.265,402.587 199.628,405.22 199.628,408.461C199.628,411.702 202.265,414.334 205.515,414.334C208.765,414.334 211.402,411.702 211.402,408.461C211.402,405.22 208.765,402.587 205.515,402.587Z" style="fill:#f0682d;"></path> </g> </g> </g></svg>
                        {:else}
                        <svg class="w-6 h-6 inline-block ml-2" viewBox="0 0 47.5 47.5" id="svg2" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs id="defs6"> <clipPath clipPathUnits="userSpaceOnUse" id="clipPath16"> <path d="M 0,38 38,38 38,0 0,0 0,38 Z" id="path18"></path> </clipPath> <clipPath clipPathUnits="userSpaceOnUse" id="clipPath40"> <path d="M 0,38 38,38 38,0 0,0 0,38 Z" id="path42"></path> </clipPath> </defs> <g id="g10" transform="matrix(1.25,0,0,-1.25,0,47.5)"> <g id="g12"> <g clip-path="url(#clipPath16)" id="g14"> <g id="g20" transform="translate(37,11)"> <path d="m 0,0 c 0,-5.522 -8.059,-10 -18,-10 -9.941,0 -18,4.478 -18,10 0,5.522 8.059,10 18,10 C -8.059,10 0,5.522 0,0" id="path22" style="fill:#99aab5;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> <g id="g24" transform="translate(37,13)"> <path d="m 0,0 c 0,-5.522 -8.059,-10 -18,-10 -9.941,0 -18,4.478 -18,10 0,5.522 8.059,10 18,10 C -8.059,10 0,5.522 0,0" id="path26" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> <g id="g28" transform="translate(19,6)"> <path d="m 0,0 c -14.958,0 -17,15 -17,19 l 34,0 C 17,17 15.042,0 0,0" id="path30" style="fill:#f5f8fa;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> <g id="g32" transform="translate(32.8818,30.0483)"> <path d="M 0,0 C -1.357,0.938 -3.103,1.694 -5.121,2.25 -3.246,2.826 -0.57,2.559 0,0 M 2.503,-2.692 C 4.945,7.43 -7.278,5.014 -9.701,3.106 c -1.34,0.149 -2.736,0.234 -4.181,0.234 -9.389,0 -17,-3.228 -17,-8.444 0,-5.216 7.611,-9.444 17,-9.444 9.389,0 17,4.228 17,9.444 0,0.862 -0.225,1.664 -0.615,2.412" id="path34" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> </g> </g> <g id="g36"> <g clip-path="url(#clipPath40)" id="g38"> <g id="g44" transform="translate(34,24)"> <path d="m 0,0 c 0,-3.866 -6.716,-7 -15,-7 -8.284,0 -15,3.134 -15,7 0,3.866 6.716,7 15,7 C -6.716,7 0,3.866 0,0" id="path46" style="fill:#8a4b38;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> <g id="g48" transform="translate(21,20)"> <path d="m 0,0 c -0.256,0 -0.512,0.098 -0.707,0.293 -2.337,2.337 -2.376,4.885 -0.125,8.262 0.739,1.109 0.9,2.245 0.478,3.377 -0.461,1.235 -1.438,1.996 -1.731,2.076 -0.553,0 -0.958,0.444 -0.958,0.996 C -3.043,15.557 -2.552,16 -2,16 -1.003,16 0.395,14.847 1.183,13.375 2.217,11.442 2.093,9.336 0.832,7.445 -1.129,4.503 -0.699,3.113 0.707,1.707 1.098,1.316 1.098,0.684 0.707,0.293 0.512,0.098 0.256,0 0,0" id="path50" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> <g id="g52" transform="translate(15,22)"> <path d="m 0,0 c -0.256,0 -0.512,0.098 -0.707,0.293 -2.337,2.337 -2.376,4.885 -0.125,8.262 0.727,1.091 0.894,2.082 0.494,2.947 -0.444,0.961 -1.431,1.469 -1.684,1.499 -0.552,0 -0.989,0.447 -0.989,0.999 0,0.553 0.459,1 1.011,1 0.997,0 2.584,-0.974 3.36,-2.423 C 1.841,11.678 2.413,9.816 0.832,7.445 -1.129,4.503 -0.699,3.113 0.707,1.707 1.098,1.316 1.098,0.684 0.707,0.293 0.512,0.098 0.256,0 0,0" id="path54" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none"></path> </g> </g> </g> </g> </g></svg>
                        {/if}
                    </div>
                    -->
                </div>

            

                 <!-- List -->
 
                 <ol class="mb-8 space-y-4 text-left">
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Stock Screener Strategy</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Financial history</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Hedge Funds Portfolio</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Wall Street Analysts Ratings</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Watchlist Strategy</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Price Alerts</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        <!-- Icon -->
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Unlimited Options Data</span>
                    </li>
                    <!--
                    <li class="flex items-center space-x-3 ">
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">{mode ? '14 Days Free Trial' : '7 Days Free Trial'}  </span>
                    </li>
                    -->
                </ol>
                <div class="divider"></div>
                <div class="m-auto w-full text-white font-medium text-sm mb-6">
                    + Unlimited feature updates
                </div>  
                <label for={'userLogin'} class="btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group">
                    7 Days Free Trial
                     <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                         <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
                     </span>
                 </label>

                <div class="m-auto w-full text-white font-medium text-[¹rem] mt-4">
                    30 Day Money Back Guarantee
                </div>  

               
            </div>
            <!--End Pricing Card-->


             <!--Start Pricing Card-->
             
             <div class="relative sm:h-[660px] sm:order-2 box sm:-mt-10 flex flex-col p-6 lg:p-8 mx-auto ring-[1px] ring-gray-400 rounded-lg w-full text-center text-white">

                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-2xl flex flex-row border border-gray-300 items-center p-2">
                    <span class="text-white text-md font-semibold px-3">
                        Best Value
                    </span>
                </div>          

                <div class="flex flex-row justify-start items-center mt-10">
                    <img src={cloudFrontUrl+"/assets/life_time_access_logo.png"} class="mr-4 w-28 transform ease-in-out duration-300" loading="lazy" alt="Lifetime tier" />
                    <h2 class="text-4xl text-center font-bold text-white">
                        Lifetime
                    </h2>
                </div>
                

                <div class="flex flex-col mb-6 items-center">

                    <div class="flex flex-row items-center">
                        <span class="mr-2 text-4xl font-bold">$599</span>
                    </div>
                  
                </div>


                <ol class="mb-8 space-y-4 text-left mt-6">
                    <li class="flex items-center space-x-3 ">
                        
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Everything in Pro Tier.</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Pay Once and use forever.</span>
                    </li>
                    <li class="flex items-center space-x-3 ">
                        
                        <svg class="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSSuccess0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012L24 4Z"/><path stroke="#09090B" d="m17 24l5 5l10-10"/></g></mask><path fill="#10db06" d="M0 0h48v48H0z" mask="url(#ipSSuccess0)"/></svg>
                        <span class="text-white text-[1rem] font-semibold">Only Best Value.</span>
                    </li>
                </ol>

                <div class="divider"></div>
                <div class="m-auto w-full text-white font-medium text-sm mb-6">
                    + Unlimited feature updates
                </div>  

                <label for={'userLogin'} class="btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group">
                    7 Days Free Trial
                   <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                       <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
                   </span>
                </label>
               
            </div>
          
            <!--End Pricing Card-->



        </div>


</section>


<!--Start Login Modal-->
{#if LoginPopup}
  <LoginPopup form={form}/> 
{/if}   
<!--End Login Modal-->


<style lang='scss'>

    @import url(https://fonts.googleapis.com/css?family=Lato:700);
    @import url(https://fonts.googleapis.com/css?family=Lato:700);
    
    
    .box {
    position: relative;
    width: 100%;
    }
    /* common */
    .ribbon {
    width: 100px; /* Adjusted width for mobile */
    height: 100px; /* Adjusted height for mobile */
    overflow: hidden;
    position: absolute;
    }
    .ribbon::before,
    .ribbon::after {
    position: absolute;
    z-index: -1;
    content: '';
    display: block;
    border: 3px solid #E1341E; /* Reduced border thickness for mobile */
    }
    .ribbon span {
    position: absolute;
    display: block;
    width: 150px; /* Adjusted width for mobile */
    padding: 10px 0; /* Reduced padding for mobile */
    background-color: #E1341E;
    box: 0 3px 6px rgba(0,0,0,.6); /* Reduced box for mobile */
    color: #fff;
    font: 700 10px/1 'Lato', sans-serif; /* Reduced font size for mobile */
    text-transform: normalcase;
    text-align: center;
    }
    
    /* top right*/
    .ribbon-top-right {
    top: -5px; /* Adjusted positioning for mobile */
    right: -5px; /* Adjusted positioning for mobile */
    }
    .ribbon-top-right::before,
    .ribbon-top-right::after {
    border-top-color: transparent;
    border-right-color: transparent;
    }
    .ribbon-top-right::before {
    top: 0;
    left: 0;
    }
    .ribbon-top-right::after {
    bottom: 0;
    right: 0;
    }
    .ribbon-top-right span {
    left: -15px; /* Adjusted positioning for mobile */
    top: 20px; /* Adjusted positioning for mobile */
    transform: rotate(45deg);
    font-size: 0.97rem;
    
    }
    
    
    
    .light-box-1 {
      --border-size: 1px;
      --border-angle: 0turn;
      --border-radius: 15px; /* Added border radius */
      
      background-image: conic-gradient(from var(--border-angle), #213, #112 50%, #213), conic-gradient(from var(--border-angle), transparent 10%, #000, #FBCE3C);
      background-size: calc(100% - (var(--border-size) * 2)) calc(100% - (var(--border-size) * 2)), cover;
      background-position: center center;
      background-repeat: no-repeat;
      border-radius: var(--border-radius); /* Added border radius */
      
      animation: bg-spin 4s linear infinite;
    }
    
    @keyframes bg-spin {
      to {
        --border-angle: 1turn;
      }
    }
    
    @property --border-angle {
      syntax: "<angle>";
      inherits: true;
      initial-value: 0turn;
    }
    
    @property --border-radius {
      syntax: "<length>";
      inherits: false;
      initial-value: 0px;
    }
    
        
        
        .light-box-2 {
            --border-size: 1px;
            --border-angle: 0turn;
            --border-radius: 15px; /* Added border radius */
            background-image: conic-gradient(from var(--border-angle), #09090B, #09090B 50%, #09090B), conic-gradient(from var(--border-angle), transparent 10%, #fff, #fff);
            background-size: calc(100% - (var(--border-size) * 2)) calc(100% - (var(--border-size) * 2)), cover;
            background-position: center center;
            background-repeat: no-repeat;
            border-radius: var(--border-radius); /* Added border radius */
    
            animation: bg-spin 30s linear infinite;
        }
        
        
    </style>