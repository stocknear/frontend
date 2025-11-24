<script lang="ts">
  import { onMount } from "svelte";

  const targetDate = new Date("2025-11-27T00:00:00+01:00");

  let days: number | string = "-";
  let hours: number | string = "-";
  let minutes: number | string = "-";
  let seconds: number | string = "-";

  const updateTime = () => {
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();

    if (timeDiff > 0) {
      const totalSeconds = Math.floor(timeDiff / 1000);

      seconds = totalSeconds % 60;
      minutes = Math.floor((totalSeconds % 3600) / 60);
      hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      days = Math.floor(totalSeconds / (3600 * 24));
    } else {
      days = 0;
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  };

  // update immediately and then every second
  updateTime();

  onMount(() => {
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="lg:max-w-xl w-full rounded-none sm:rounded m-auto mb-10">
  <div class="container">
    <h2 class="text-2xl font-bold text-center text-pink-700 dark:text-pink-500">
      BLACK FRIDAY DEAL - 30% Discount!
    </h2>
  </div>
  <div class="container text-center">
    <p class=" font-bold text-xl">Use Promo Code: BF25</p>
    <div
      class="grid grid-flow-col gap-5 font-bold text-center m-auto auto-cols-max justify-center mt-6"
    >
      <div class="flex flex-col text-xs">
        <span class="countdown font-mono text-xl sm:text-2xl">
          <span style="--value:{days};"></span>
        </span>
        days
      </div>
      <div class="flex flex-col text-xs">
        <span class="countdown font-mono text-xl sm:text-2xl">
          <span style="--value:{hours};"></span>
        </span>
        hours
      </div>
      <div class="flex flex-col text-xs">
        <span class="countdown font-mono text-xl sm:text-2xl">
          <span style="--value:{minutes};"></span>
        </span>
        min
      </div>
      <div class="flex flex-col text-xs">
        <span class="countdown font-mono text-xl sm:text-2xl">
          <span style="--value:{seconds};"></span>
        </span>
        sec
      </div>
    </div>
    <h2 class="text-lg font-bold text-center mt-5">
      Next sale starts 11/28 for 20%
    </h2>
  </div>
</div>
