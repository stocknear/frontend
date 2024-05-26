
<script lang='ts'>

    export let state;
    export let votes;
    let color = state === 'active' ? '#0076FE' : '#D6D6DC'
</script>


<div class="{state === 'active' ? 'sm:hover:bg-[#102f52]' : 'sm:hover:bg-gray-700'} h-10 px-2 -ml-2 flex justify-center items-center rounded-md">
    <svg class="inline-block w-4 h-4 mr-2 sm:mr-3 {state === 'active' ? '' : ''}" fill={color} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 13.82 13.47" xml:space="preserve"><g class="dont-open-thread"><path d="M6.49,0.01C5.44,0.44-0.26,11.22,0.01,11.73c0.11,0.11,0.26,0.16,0.39,0.22c0.14,0.05,5.29,1.53,6.1,1.53
        c0.67,0,6.83-1.99,6.96-2.06c0.13-0.07,0.27-0.15,0.35-0.28C14.02,10.39,7.55-0.42,6.49,0.01z"></path></g></svg>
    <span class="text-sm font-medium text-[#D6D6DC] {state === 'active' ? 'text-[#0076FE]' : ''}">
        {votes}
    </span>
    <svg class="rotate-180 inline-block w-4 h-4 mr-2 sm:mr-3 {state === 'active' ? '' : ''}" fill={color} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 13.82 13.47" xml:space="preserve"><g class="dont-open-thread"><path d="M6.49,0.01C5.44,0.44-0.26,11.22,0.01,11.73c0.11,0.11,0.26,0.16,0.39,0.22c0.14,0.05,5.29,1.53,6.1,1.53
        c0.67,0,6.83-1.99,6.96-2.06c0.13-0.07,0.27-0.15,0.35-0.28C14.02,10.39,7.55-0.42,6.49,0.01z"></path></g></svg>
</div>

