
<script lang='ts'>

    export let state;
    let color = state === 'active' ? '#0076FE' : '#D6D6DC'

</script>



<div class="flex justify-center items-center {state === 'active' ? 'text-[#0076FE] bg-[#31304D] lg:bg-inherit' : 'text-[#A6ADBB]'}  rounded-lg w-8 h-8 relative">
    <svg class="lg:hidden inline-block w-4 h-4 " version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512.171 512.171" xml:space="preserve"><path fill="currentColor" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971 c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627 l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504 C479.793,292.501,480.71,287.915,479.046,283.925z"></path></svg>
    <svg class="hidden lg:block cursor-pointer inline-block w-9 h-9 hover:text-[#fff] text-[#5C5C5C]" fill={state === 'active' ? color : "currentColor"} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.9188 8.17969H11.6888H6.07877C5.11877 8.17969 4.63877 9.33969 5.31877 10.0197L10.4988 15.1997C11.3288 16.0297 12.6788 16.0297 13.5088 15.1997L15.4788 13.2297L18.6888 10.0197C19.3588 9.33969 18.8788 8.17969 17.9188 8.17969Z" /></svg>
</div>

