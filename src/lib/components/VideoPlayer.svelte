<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { v4 as uuidv4 } from "uuid";

  let id = uuidv4();

  export let src;
  export let hideProgressbar = false;

  let container; // container div reference
  let video; // video element reference
  let observer;
  let progress = -1;
  let isPlaying = false;

  onMount(() => {
    // Set up IntersectionObserver to auto-play/pause when in/out of view
    if (browser) {
      const handleIntersect = (entries) => {
        entries.forEach((entry) => {
          if (!entry?.isIntersecting) {
            pauseVideo();
          }
        });
      };

      const options = { threshold: 0.4, rootMargin: "0px" };
      observer = new IntersectionObserver(handleIntersect, options);

      if (container) {
        observer.observe(container);
      }
    }
  });

  function updateProgress() {
    if (video && video.duration && !video.paused) {
      progress = (video.currentTime / video.duration) * 100;
      progress = parseFloat(progress.toFixed(2));
    }
  }

  // Update progress on time update
  $: {
    if (video) {
      video.ontimeupdate = updateProgress;
    }
  }

  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  function playVideo() {
    if (video) {
      video.play();
      video.muted = false;
      isPlaying = true;
    }
  }

  function pauseVideo() {
    if (video) {
      video.pause();
      video.muted = true;
      isPlaying = false;
    }
  }

  function togglePlayback(event) {
    // Prevent click event from bubbling to the container if needed
    event.stopPropagation();
    if (video.paused) {
      playVideo();
    } else {
      pauseVideo();
    }
  }
</script>

<div class="video-container" bind:this={container} on:click={togglePlayback}>
  <video
    {id}
    playsinline
    loop
    class="w-full max-w-96 rounded"
    {src}
    bind:this={video}
    on:loadedmetadata={updateProgress}
  ></video>
  <div class="play-pause-icon" on:click|stopPropagation={togglePlayback}>
    {#if isPlaying}
      <!-- Pause icon: two vertical bars -->
      <svg viewBox="0 0 24 24">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
      </svg>
    {:else}
      <!-- Play icon: triangle -->
      <svg viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    {/if}
  </div>
</div>

<style>
  .video-container {
    position: relative;
    display: inline-block;
  }
  .play-pause-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 10;
    /* Optional: style the icon's background and appearance */
    background: rgba(0, 0, 0, 0.4);
    border-radius: 50%;
    padding: 0.5rem;
  }
  .play-pause-icon svg {
    fill: white;
    width: 50px;
    height: 50px;
  }
</style>
