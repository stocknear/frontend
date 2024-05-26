<script lang='ts'>

export let data;
export let title;
</script>

{#if data?.user?.tier !== 'Pro'}
<div class="px-5 sm:px-0 shadow-lg">
<div class="sm:rounded-lg bg-[#202020] pl-10 pr-10 pb-10 pt-5 w-full h-full m-auto -mt-5 relative">

<h3 class="text-white font-bold text-xl sm:text-2xl text-center">
    Upgrade to Pro
</h3>
<div class="text-white text-center text-sm sm:text-[1rem] pt-5 text-center">
    {title}
</div>


<!--Start Market Cap Group-->
<h2 class="text-center text-lg text-white font-bold mb-3 mt-3">and even more...</h2>

<div class="pt-3 flex justify-center items-center m-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 m-auto">
    <!-- Column 1 -->
    <div class="mb-4">
        <ul class="list-disc space-y-4 sm:space-y-1 m-auto text-center sm:text-start w-48 sm:w-full">
            <li class="mb-2 cursor-pointer">
                <a href="/list/mega-cap-stocks" class="text-white text-sm">Unlimited access to all data and tools</a>
            </li>
            <li class="mb-2 cursor-pointer">
                <a href="/list/large-cap-stocks" class="text-white text-sm ">Unlimited Options Data</a>
            </li>
        </ul>
    </div>
                    
    <!-- Column 2 -->
    <div class="sm:ml-10">
        <ul class="list-disc space-y-1 text-center sm:text-start w-48 sm:w-full">
            <li class="mb-2 cursor-pointer">
                <a href="/list/small-cap-stocks" class="text-white text-sm ">Unlimited Wall Street Analysts Ratings</a>
            </li>
            <li class="mb-2 cursor-pointer">
                <a href="/list/nano-cap-stocks" class="text-white text-sm ">Unlimited Price Alerts</a>
            </li>
        <!-- ...other list items -->
        </ul>
    </div>


    </div>
</div>

<!--End Market Cap Group-->



<a href="/pricing" class="mt-10 flex justify-center items-center w-56 m-auto btn text-white bg-blue-700 hover:bg-blue-600 transition duration-150 ease-in-out group">
    Become a Pro
    <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
    </span>
</a>

</div>

</div>
{/if}