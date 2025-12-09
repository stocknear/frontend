<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";

  export let src: string;
  export let poster: string = "";
  export let playbackRate: number = 1;
  export let className: string = "";
  export let threshold: number = 0.3;
  export let rootMargin: string = "100px";

  let container: HTMLDivElement;
  let video: HTMLVideoElement;
  let observer: IntersectionObserver;
  let isLoaded = false;
  let isVisible = false;
  let shouldLoad = false;
  let prefersReducedMotion = false;

  onMount(() => {
    if (!browser) return;

    // Check for reduced motion preference
    prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Set up IntersectionObserver for lazy loading and autoplay
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Start loading video when it comes into view
          if (!shouldLoad) {
            shouldLoad = true;
          }

          // Play video when visible (unless reduced motion)
          if (video && isLoaded && !prefersReducedMotion) {
            video.play().catch(() => {
              // Autoplay blocked, that's fine
            });
          }
        } else {
          // Pause when out of view to save resources
          if (video && !video.paused) {
            video.pause();
          }
        }
      });
    };

    observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    if (container) {
      observer.observe(container);
    }
  });

  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  function handleVideoLoaded() {
    isLoaded = true;

    // Set playback rate
    if (video && playbackRate !== 1) {
      video.playbackRate = playbackRate;
    }

    // Auto-play if currently visible
    if (isVisible && !prefersReducedMotion) {
      video.play().catch(() => {});
    }
  }

  function handleVideoError() {
    // Keep showing poster on error
    isLoaded = false;
  }
</script>

<div
  bind:this={container}
  class="lazy-video-container relative overflow-hidden {className}"
>
  <!-- Poster/Placeholder - shows until video is loaded and playing -->
  {#if poster && (!isLoaded || !isVisible)}
    <img
      src={poster}
      alt=""
      class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      class:opacity-0={isLoaded && isVisible}
      loading="eager"
    />
  {/if}

  <!-- Shimmer placeholder if no poster -->
  {#if !poster && !isLoaded}
    <div
      class="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-background-shine"
      style="background-size: 200% 100%;"
    ></div>
  {/if}

  <!-- Video - only load source when shouldLoad is true -->
  {#if shouldLoad}
    <video
      bind:this={video}
      class="w-full h-auto transition-opacity duration-500"
      class:opacity-0={!isLoaded}
      autoplay
      loop
      muted
      playsinline
      on:loadeddata={handleVideoLoaded}
      on:error={handleVideoError}
    >
      <source {src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  {:else}
    <!-- Placeholder div to maintain aspect ratio before video loads -->
    <div class="w-full" style="aspect-ratio: 16/9;"></div>
  {/if}

  <!-- Reduced motion notice (optional, for accessibility) -->
  {#if prefersReducedMotion && poster}
    <div
      class="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded"
    >
      Motion reduced
    </div>
  {/if}
</div>

<style>
  .lazy-video-container {
    /* Ensure container has dimensions even before video loads */
    min-height: 100px;
  }
</style>
