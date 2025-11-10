<script>
  import { onMount } from "svelte";
  import stocknear_logo from "$lib/images/stocknear_logo.png";

  let touchStartY = 0;
  let touchEndY = 0;
  let isPulling = false;
  let isRefreshing = false;
  let refreshHeight = 0;
  let isMobile = false;

  onMount(() => {
    isMobile = window.innerWidth <= 768; // Only enable for mobile screens

    if (isMobile) {
      document.addEventListener("touchstart", onTouchStart);
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      if (isMobile) {
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      }
    };
  });

  const onTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e) => {
    if (window.scrollY === 0) {
      touchEndY = e.touches[0].clientY;
      if (touchEndY > touchStartY) {
        isPulling = true;
        refreshHeight = (touchEndY - touchStartY) * 0.5; // Adjust sensitivity
      }
    }
  };

  const onTouchEnd = () => {
    if (isPulling && refreshHeight > 120) {
      isRefreshing = true;
      refresh();
    } else {
      resetPull();
    }
  };

  const resetPull = () => {
    isPulling = false;
    refreshHeight = 0;
  };

  const refresh = () => {
    setTimeout(() => {
      location.reload();
    }, 1000); // Simulate loading time
  };
</script>

{#if isMobile}
  <div class="content" style="transform: translateY({refreshHeight}px);">
    <div class="refresh-indicator" style="height: {refreshHeight}px;">
      {#if isPulling || isRefreshing}
        <img src={stocknear_logo} alt="Stocknear Logo" class="h-12 w-12" />
        {#if isRefreshing}
          <div class="spinner mt-2"></div>
        {/if}
      {/if}
    </div>

    <slot></slot>
    <!-- Wrap around page content -->
  </div>
{:else}
  <slot></slot> <!-- Desktop version, just show content -->
{/if}

<style>
  .content {
    transition: transform 0.2s ease-out;
  }

  .refresh-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    border: 4px solid rgba(0, 0, 255, 0.3);
    border-top: 4px solid blue;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
