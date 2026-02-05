<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    register_password_min_length,
    register_password_has_letter,
    register_password_has_number,
    register_password_has_special,
    register_passwords_match,
  } from "$lib/paraglide/messages.js";

  export let id: string;
  export let label: string;
  export let value = "";
  export let confirmValue = "";
  export let disabled = false;
  export let errors: string | string[] | null = null;
  export let showRequirements = true;
  export let showMatchIndicator = false;

  const dispatch = createEventDispatcher();

  let inputValue = value;
  let isFocused = false;

  // Password validation checks
  $: hasMinLength = inputValue.length >= 8;
  $: hasLetter = /[A-Za-z]/.test(inputValue);
  $: hasNumber = /\d/.test(inputValue);
  $: hasSpecial = /[@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_]/.test(inputValue);
  $: passwordsMatch = showMatchIndicator && inputValue.length > 0 && inputValue === confirmValue;
  
  // Overall validity - now includes special character requirement
  $: isValid = hasMinLength && hasLetter && hasNumber && hasSpecial;
  $: showChecklist = showRequirements && (isFocused || inputValue.length > 0);

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;
    dispatch("input", inputValue);
  }

  function handleFocus() {
    isFocused = true;
  }

  function handleBlur() {
    isFocused = false;
  }

  // Clear errors when user starts typing
  $: if (inputValue) {
    errors = null;
  }
</script>

<div class="form-control w-full max-w-2xl mb-2 text-muted dark:text-white">
  <label for={id} class="label pb-1">
    <span class="text-muted dark:text-white">{label}</span>
  </label>
  <div class="relative">
    <input
      class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 rounded-full whitespace-normal pr-12"
      type="password"
      {id}
      name={id}
      {disabled}
      value={inputValue}
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      autocomplete="off"
    />
    
    {#if inputValue.length > 0}
      <div class="absolute right-4 top-1/2 -translate-y-1/2">
        {#if isValid}
          <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        {:else}
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        {/if}
      </div>
    {/if}
  </div>

  {#if errors}
    <label for={id} class="py-0 pt-1 text-xs">
      <span class="text-red-800 font-semibold dark:font-normal dark:text-error">
        {Array.isArray(errors) ? errors[0] : errors}
      </span>
    </label>
  {/if}

  {#if showChecklist}
    <div class="mt-3 space-y-1.5 transition-all duration-200">
      <div class="flex items-center gap-2 text-xs">
        <div class="w-4 h-4 flex items-center justify-center">
          {#if hasMinLength}
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></div>
          {/if}
        </div>
        <span class="{hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'}">
          {register_password_min_length()}
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <div class="w-4 h-4 flex items-center justify-center">
          {#if hasLetter}
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></div>
          {/if}
        </div>
        <span class="{hasLetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'}">
          {register_password_has_letter()}
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <div class="w-4 h-4 flex items-center justify-center">
          {#if hasNumber}
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></div>
          {/if}
        </div>
        <span class="{hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'}">
          {register_password_has_number()}
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <div class="w-4 h-4 flex items-center justify-center">
          {#if hasSpecial}
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></div>
          {/if}
        </div>
        <span class="{hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'}">
          {register_password_has_special()}
        </span>
      </div>

      {#if showMatchIndicator && confirmValue.length > 0}
        <div class="flex items-center gap-2 text-xs">
          <div class="w-4 h-4 flex items-center justify-center">
            {#if passwordsMatch}
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </div>
          <span class="{passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
            {register_passwords_match()}
          </span>
        </div>
      {/if}
    </div>
  {/if}
</div>
