<script lang = 'ts'>
export let signal;

</script>

{#if signal === 'Strong Buy'}

<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#10DB06] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>

{:else if signal === 'Buy'}
<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#10DB06] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#10DB06] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>
{:else if signal === 'Neutral'}
<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#F8901E] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#F8901E] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#F8901E] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>
{:else if signal === 'Sell'}
<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#FF2F1F] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#FF2F1F] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>
{:else if signal === 'Strong Sell'}
<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#FF2F1F] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>
{:else}
<div class="relative h-full w-full mt-5">
    <div class="absolute bottom-0 right-0 flex flex-row items-end">
      <div class="bg-[#707070] mr-0.5 h-2.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-3 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-3.5 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-4 w-1.5"></div>
      <div class="bg-[#707070] mr-0.5 h-[18px] w-1.5"></div>
    </div>
</div>
{/if}