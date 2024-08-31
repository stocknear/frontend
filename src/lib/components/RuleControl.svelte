<script>
  import { createEventDispatcher } from 'svelte';

  export let ruleName;
  export let title
  export let value;
  export let min;
  export let max;
  export let step;
  export let condition;

  const dispatch = createEventDispatcher();

  function changeRuleCondition(newCondition) {
    dispatch('changeCondition', { rule: ruleName, condition: newCondition });
  }

  function changeValue(event) {
    dispatch('changeValue', { rule: ruleName, value: Number(event.target.value) });
  }
</script>

<div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
  {title} {condition} {value}

  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" 
           checked={condition === 'below'} name={ruleName} />
    <span class="label-text text-white">Below</span> 
  </label>
  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" 
           checked={condition === 'above'} name={ruleName} />
    <span class="label-text text-white">Above</span> 
  </label>
</div>

<div class="w-full pt-5">
  <input type="range" min={min} max={max} step={step} bind:value on:input={changeValue} class="range range-secondary" />
</div>