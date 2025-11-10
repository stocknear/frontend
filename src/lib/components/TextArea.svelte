<script lang="ts">
  export let value = "";
  export let placeholder = "";
  export let id;
  export let label;
  export let type = "text";
  export let disabled = false;
  export let required = false;
  export let hidden = false;

  export let maxLength = 5000;
  export let showCounter = false;

  export let errors;

  let inputValue = value;
  let counterColor;

  $: counter = `${inputValue.length}/${maxLength}`;

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
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<div class="form-control w-full h-auto {hidden ? 'hidden' : ''}">
  <label for={id} class="label pb-1">
    <span class="text-muted dark:text-white">{label}</span>
  </label>

  <textarea
    input="text"
    class="min-h-[290px] p-3 h-auto text-sm border border-gray-300 dark:border-gray-600 focus:outline-none w-full bg-white dark:bg-secondary placeholder-gray-600 dark:placeholder-gray-300 whitespace-normal w-full resize-none focus-none ring-none rounded"
    {type}
    {placeholder}
    {required}
    {disabled}
    {id}
    name={id}
    value={inputValue}
    on:input={handleInput}
  />

  {#if showCounter}
    <div class="flex justify-end mt-1 -mb-1">
      <span class={`label-text text-xs ${counterColor}`}>{counter}</span>
    </div>
  {/if}

  {#if errors}
    {#each errors as error}
      <label for={id} class="label py-0 pt-1">
        <span class="label-text-alt text-error">
          {error}
        </span>
      </label>
    {/each}
  {/if}
</div>
