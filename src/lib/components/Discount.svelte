<script lang="ts">
  import { onMount } from "svelte";

  // Target date: August 15, 2025 at midnight Berlin time
  // Using a function to get the correct Berlin midnight timestamp for all users
  const getBerlinMidnight = () => {
    // Create a date for August 15, 2025 in UTC
    // Then adjust for Berlin timezone (UTC+2 in summer/CEST)
    // August is summer time in Berlin, so UTC+2
    const year = 2025;
    const month = 7; // August (0-indexed)
    const day = 15;

    // Create the date at midnight UTC, then subtract 2 hours to get Berlin midnight
    // This ensures midnight in Berlin = 22:00 UTC on August 14
    const berlinMidnightUTC = Date.UTC(year, month, day - 1, 22, 0, 0, 0);
    return new Date(berlinMidnightUTC);
  };

  const targetDate = getBerlinMidnight();

  let days = "-";
  let hours = "-";
  let minutes = "-";
  let seconds = "-";

  const updateTime = () => {
    // Get current time for any user anywhere in the world
    const now = new Date();

    // Calculate the time difference to Berlin midnight
    const timeDiff = targetDate.getTime() - now.getTime();

    if (timeDiff > 0) {
      // Calculate the remaining days, hours, minutes, and seconds
      const totalSeconds = Math.floor(timeDiff / 1000);
      seconds = totalSeconds % 60;
      minutes = Math.floor((totalSeconds % 3600) / 60);
      hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      days = Math.floor(totalSeconds / (3600 * 24));
    } else {
      // Timer has expired
      days = 0;
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  };

  updateTime();

  onMount(() => {
    const interval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="lg:max-w-xl w-full rounded-none sm:rounded m-auto mb-10">
  <div class="container">
    <h2 class="text-2xl font-bold text-center text-pink-700 dark:text-pink-500">
      Annual Plans with 30% Discount!
    </h2>
  </div>
  <div class="container text-center">
    <!--
    <p class=" font-bold text-xl">
      Use Promo Code: <span class="font-extrabold">SUMMER25</span>
    </p>
  -->
    <p class=" font-bold text-xl">Use Promo Code: SCREENER</p>
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
  </div>
</div>
