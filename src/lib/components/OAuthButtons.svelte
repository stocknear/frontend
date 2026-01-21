<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let returnUrl: string = "";

  const dispatch = createEventDispatcher();

  let isHoveredGoogle = false;
  let isHoveredDiscord = false;
  let isHoveredGithub = false;

  function handleClick() {
    dispatch("click");
  }

  $: action = returnUrl ? `?/oauth2&returnUrl=${returnUrl}` : "?/oauth2";
</script>

<div class="flex flex-row items-center m-auto justify-center gap-x-3 pb-6">
  <form method="post" {action}>
    <input class="hidden" name="provider" value="google" />
    <button
      aria-label="Google Login"
      on:click={handleClick}
      on:mouseenter={() => (isHoveredGoogle = true)}
      on:mouseleave={() => (isHoveredGoogle = false)}
      class="cursor-pointer shrink-0 rounded-full w-11 h-11 relative bg-white/80 dark:bg-zinc-900/50 flex items-center justify-center border border-gray-300 shadow dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/80 transition"
    >
      <svg
        class="{isHoveredGoogle ? 'shake-logo' : ''} w-6 h-6 inline-block"
        viewBox="-3 0 262 262"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid"
        fill="#000000"
      >
        <g>
          <path
            d="M255.878,133.451 C255.878,122.717 255.007,114.884 253.122,106.761 L130.55,106.761 L130.55,155.209 L202.497,155.209 C201.047,167.249 193.214,185.381 175.807,197.565 L175.563,199.187 L214.318,229.21 L217.003,229.478 C241.662,206.704 255.878,173.196 255.878,133.451"
            fill="#4285F4"
          />
          <path
            d="M130.55,261.1 C165.798,261.1 195.389,249.495 217.003,229.478 L175.807,197.565 C164.783,205.253 149.987,210.62 130.55,210.62 C96.027,210.62 66.726,187.847 56.281,156.37 L54.75,156.5 L14.452,187.687 L13.925,189.152 C35.393,231.798 79.49,261.1 130.55,261.1"
            fill="#34A853"
          />
          <path
            d="M56.281,156.37 C53.525,148.247 51.93,139.543 51.93,130.55 C51.93,121.556 53.525,112.853 56.136,104.73 L56.063,103 L15.26,71.312 L13.925,71.947 C5.077,89.644 0,109.517 0,130.55 C0,151.583 5.077,171.455 13.925,189.152 L56.281,156.37"
            fill="#FBBC05"
          />
          <path
            d="M130.55,50.479 C155.064,50.479 171.6,61.068 181.029,69.917 L217.873,33.943 C195.245,12.91 165.798,0 130.55,0 C79.49,0 35.393,29.301 13.925,71.947 L56.136,104.73 C66.726,73.253 96.027,50.479 130.55,50.479"
            fill="#EB4335"
          />
        </g>
      </svg>
    </button>
  </form>

  <form method="post" {action}>
    <input class="hidden" name="provider" value="discord" />
    <button
      aria-label="Discord Login"
      on:click={handleClick}
      on:mouseenter={() => (isHoveredDiscord = true)}
      on:mouseleave={() => (isHoveredDiscord = false)}
      class="cursor-pointer shrink-0 rounded-full w-11 h-11 relative bg-white/80 dark:bg-zinc-900/50 flex items-center justify-center border border-gray-300 shadow dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/80 transition text-gray-900 dark:text-white"
    >
      <svg
        class="{isHoveredDiscord ? 'shake-logo' : ''} w-7 h-7 inline-block"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path
          d="M85.22,24.958c-11.459-8.575-22.438-8.334-22.438-8.334l-1.122,1.282 c13.623,4.087,19.954,10.097,19.954,10.097c-19.491-10.731-44.317-10.654-64.59,0c0,0,6.571-6.331,20.996-10.418l-0.801-0.962 c0,0-10.899-0.24-22.438,8.334c0,0-11.54,20.755-11.54,46.319c0,0,6.732,11.54,24.442,12.101c0,0,2.965-3.526,5.369-6.571 c-10.177-3.045-14.024-9.376-14.024-9.376c6.394,4.001,12.859,6.505,20.916,8.094c13.108,2.698,29.413-0.076,41.591-8.094 c0,0-4.007,6.491-14.505,9.456c2.404,2.965,5.289,6.411,5.289,6.411c17.71-0.561,24.441-12.101,24.441-12.02 C96.759,45.713,85.22,24.958,85.22,24.958z M35.055,63.824c-4.488,0-8.174-3.927-8.174-8.815 c0.328-11.707,16.102-11.671,16.348,0C43.229,59.897,39.622,63.824,35.055,63.824z M64.304,63.824 c-4.488,0-8.174-3.927-8.174-8.815c0.36-11.684,15.937-11.689,16.348,0C72.478,59.897,68.872,63.824,64.304,63.824z"
        />
      </svg>
    </button>
  </form>

  <form method="post" {action}>
    <input class="hidden" name="provider" value="github" />
    <button
      aria-label="Github Login"
      on:click={handleClick}
      on:mouseenter={() => (isHoveredGithub = true)}
      on:mouseleave={() => (isHoveredGithub = false)}
      class="cursor-pointer shrink-0 rounded-full w-11 h-11 relative bg-white/80 dark:bg-zinc-900/50 flex items-center justify-center border border-gray-300 shadow dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/80 transition text-gray-900 dark:text-white"
    >
      <svg
        class="{isHoveredGithub ? 'shake-logo' : ''} w-7 h-7 inline-block"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
        />
      </svg>
    </button>
  </form>
</div>

<style>
  .shake-logo {
    animation-name: shake;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(0deg);
    }
    75% {
      transform: rotate(-10deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
