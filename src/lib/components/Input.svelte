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
      class="input input-lg input-bordered border border-gray-300 dark:border-gray-600 focus:outline-none w-full bg-white dark:bg-secondary placeholder-gray-600 dark:placeholder-gray-300 whitespace-normal"
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
