<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { navigating } from '$app/stores';
    import { fade } from 'svelte/transition';
  
    // progress bar value
    const p = tweened(0, {
      duration: 300,
      easing: cubicOut
    });
  
    let isVisible = false;
  
    function increase() {
      if ($p >= 0 && $p < 1) {
        p.update(value => value + 0.005); // Adjust the increment value as needed
      } else {
        p.set(0);
      }
  
      if ($navigating) {
        const rand = Math.round(Math.random() * (300 - 50)) + 50;
        setTimeout(increase, rand);
      }
    }
  
    $: {
      if ($navigating) {
        increase();
        isVisible = true;
      }
  
      if (!$navigating) {
        p.set(1);
        setTimeout(() => {
          isVisible = false;
          p.set(0);
        }, 500); // Adjust this timing as needed
      }
    }
  </script>
  
  {#if $p > 0 && $p < 1 && isVisible}
    <progress value={$p} transition:fade={{duration: 0}} />
  {/if}
  
<style>
    progress {
      --bar-color: #09090B;
      --val-color: rgb(34, 153, 221,0.8);
      position: fixed;
      top: 30;
      z-index: 99999;
      left: 0;
      height: 2px;
      width: 100%; /* Ensure the width covers the entire container */
      border-radius: 0;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  
    /* Bar */
    progress::-webkit-progress-bar {background-color: var(--bar-color); width: 100%;}
    progress {background-color: var(--bar-color);}
  
    /* Value */
    progress::-webkit-progress-value {background-color: var(--val-color) !important;}
    progress::-moz-progress-bar {background-color: var(--val-color) !important;}
    progress {color: var(--val-color);}
  </style>
  