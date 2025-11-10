<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let ruleName;
  export let title;
  export let value;
  export let min;
  export let max;
  export let step;
  export let unit = "";
  export let condition;

  const dispatch = createEventDispatcher();

  function changeRuleCondition(newCondition) {
    condition = newCondition;
    dispatch("changeCondition", { rule: ruleName, condition: newCondition });
  }

  function changeValue(val) {
    dispatch("changeValue", { rule: ruleName, value: val });
  }
</script>

<!--
<div class="w-full max-w-xl text-white  text-sm sm:text-[1rem] flex flex-row justify-center items-center">
  {title?.replace('[%]','')} {condition} {value} {unit}

  <label on:click={() => changeRuleCondition('under')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
    <input type="radio" class="radio checked:bg-[#fff] bg-default border border-gray-600 mr-2" 
           checked={condition === 'under'} name={ruleName} />
    <span class="label-text text-white">Under</span> 
  </label>
  <label on:click={() => changeRuleCondition('over')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
    <input type="radio" class="radio checked:bg-[#fff] bg-default border border-gray-600 mr-2" 
           checked={condition === 'over'} name={ruleName} />
    <span class="label-text text-white">Over</span> 
  </label>
</div>

<div class="w-full pt-5">
  <input type="range" min={min} max={max} step={step} bind:value on:input={changeValue} class="range range-secondary" />
</div>
-->

<!--Start Added Rules-->
<div
  class="flex items-center justify-between space-x-2 px-1 py-1.5 text-smaller leading-tight text-white"
>
  <div class="text-white text-[1rem]">
    {title?.replace("[%]", "")}
  </div>
  <div class="flex items-center">
    <button
      class="mr-1.5 cursor-pointer text-gray-300 sm:hover:text-red-500 focus:outline-hidden"
      title="Remove filter"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="CurrentColor"
        style="max-width:40px"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
    </button>
    <div class="relative inline-block text-left">
      <div class="dropdown dropdown-end">
        <button
          tabindex="0"
          class="bg-[#000] h-[33px] flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 text-white rounded truncate"
        >
          <span class="truncate ml-2">
            {#if value === "" || condition === ""}
              Any
            {:else}
              {condition} {value}{unit}
            {/if}
          </span>
          <svg
            class=" ml-1 h-6 w-6 xs:ml-2 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>

        <div
          class="dropdown-content absolute z-40 mt-2 rounded bg-[#181C1F] py-1 shadow-lg border border-gray-600 focus:outline-hidden"
          tabindex="0"
          role="menu"
        >
          <div class="select-none space-y-1 p-1 pb-2 pr-2 text-sm">
            <div class="flex items-center justify-start gap-x-1">
              <div
                class="relative inline-block flex flex-row items-center justify-center m-auto"
              >
                <label
                  on:click={() => changeRuleCondition("under")}
                  class="cursor-pointer flex flex-row mr-2 justify-center items-center"
                >
                  <input
                    type="radio"
                    class="radio checked:bg-[#fff] bg-default border border-gray-600 mr-2"
                    checked={condition === "under"}
                    name={ruleName}
                  />
                  <span class="label-text text-white">Under</span>
                </label>
                <label
                  on:click={() => changeRuleCondition("over")}
                  class="cursor-pointer flex flex-row ml-2 justify-center items-center"
                >
                  <input
                    type="radio"
                    class="radio checked:bg-[#fff] bg-default border border-gray-600 mr-2"
                    checked={condition === "over"}
                    name={ruleName}
                  />
                  <span class="label-text text-white">Over</span>
                </label>
              </div>
            </div>
          </div>

          <div
            class="thin-scrollbar dark:styled-scrollbar dark:right-scrollbar max-h-[250px] overflow-y-auto overflow-x-hidden overscroll-contain border-t border-gray-600
                dark:border-dark-500 xl:max-h-[297px]"
          >
            {#each step as newValue}
              <button
                on:click={() => changeValue(newValue)}
                class="block w-full border-b border-gray-600 px-4 py-2 text-left text-sm text-white last:border-0 sm:hover:bg-gray-100 sm:hover:text-gray-900
                                  focus:bg-blue-100 focus:text-gray-900 focus:outline-hidden"
              >
                {condition}
                {newValue}{unit}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<!--End Added Rules-->
