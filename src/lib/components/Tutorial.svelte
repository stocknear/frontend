<script lang="ts">
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";

  export let steps = [];

  const driverObj = driver({
    showProgress: true,
    steps: steps,
  });
</script>

<button
  class="ml-auto font-semibold cursor-pointer flex flex-row items-center"
  on:click={() => {
    driverObj.drive();
  }}
  >Tutorial<svg
    class="ml-1 inline-block size-[22px] cursor-pointer"
    viewBox="0 0 20 20"
    fill="currentColor"
    style="max-width:40px"
    ><path
      fill-rule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
      clip-rule="evenodd"
    ></path></svg
  ></button
>
