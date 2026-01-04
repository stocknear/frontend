<script lang="ts">
  //import { linkTitle } from '$lib/store';

  export let value = "";
  export let placeholder = "";
  export let id;
  export let label;
  export let type = "text";
  export let disabled = false;
  export let required = false;
  export let maxLength = 100;
  export let showCounter = false;
  export let hidden = false;
  export let errors;
  export let useTitle = false; // new prop

  let inputValue = value;

  let counterColor;

  $: {
    if (inputValue.length > maxLength) {
      counterColor = "text-error";
    } else {
      counterColor = "text-white";
    }
  }

  function handleInput(event) {
    inputValue = event.target.value;
  }

  $: {
    if (inputValue) {
      errors = null;
    }
  }
</script>

<div
  class="form-control w-full max-w-2xl mb-2 text-muted dark:text-white {hidden
    ? 'hidden'
    : ''}"
>
  <label for={id} class="label pb-1">
    <span class="text-muted dark:text-white">{label}</span>
  </label>
  <div class="relative">
    <input
      class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 rounded-full whitespace-normal"
      {type}
      {placeholder}
      {required}
      {disabled}
      {id}
      name={id}
      value={inputValue}
      on:input={handleInput}
      autocomplete="off"
    />
  </div>

  {#if errors}
    <label for={id} class=" py-0 pt-1 text-xs">
      <span class="text-red-800 font-semibold dark:font-normal dark:text-error">
        {errors}
      </span>
    </label>
  {/if}
</div>
