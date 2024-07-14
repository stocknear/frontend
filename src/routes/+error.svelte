<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    //import { trackError,trackButtonClick } from '$lib/mixpanel';
    import logo from '$lib/images/stocknear_logo.png';

    

</script>


<section class="min-h-screen pt-6">
    <div class="bg-[#09090B] mt-10 m-auto overflow-hidden w-full max-w-4xl">
        <div class="lg:flex">
            <div class="mt-10 mb-5 m-auto">
                <h1 class="text-white text-center text-4xl font-bold mb-5">
                   Page Not found - {$page?.status}
                   <!--Server Maintenance-->
                </h1>
                <a href="/" class="flex justify-center items-center">
                    <img class="w-20 m-auto inline-block" src={logo} />
                </a>
                <!--
                <span class="mt-4 text-white text-lg w-5/6 m-auto text-center flex justify-center items-center">
                    Sorry, our website is down for server maintenance. We will be back soon!
                </span>
                -->

                
                <span class="mt-4 text-white font-medium text-md w-5/6 m-auto text-center flex justify-center items-center">
                    The page was not found. If this error occurs persistenly please report it to us. 
                    <br class="mt-3">
                    We will fix it asap!
                </span>

                <a href="/" class="flex justify-center items-center w-5/6 m-auto py-2.5 mt-10 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium">
                    Back to Home Page
                </a>
                

            </div>
        </div>
    </div>


</section>
