<script>
    import { onMount } from 'svelte';
  
    let touchStartY = 0;
    let touchEndY = 0;
    let isPulling = false;
    let refreshHeight = 0;
  
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
  
    const onTouchMove = (e) => {
      touchEndY = e.touches[0].clientY;
      if (touchEndY > touchStartY) {
        isPulling = true;
        refreshHeight = (touchEndY - touchStartY) * 0.5; // Adjust the factor to control sensitivity
      }
    };
  
    const onTouchEnd = () => {
      if (isPulling && refreshHeight > 150) {
        // Trigger the refresh action
        refresh();
      }
      resetPull();
    };
  
    const resetPull = () => {
      isPulling = false;
      refreshHeight = 0;
    };
  
    const refresh = () => {
      // Refresh the page
      location.reload();
    };
  
    onMount(() => {
      document.addEventListener('touchstart', onTouchStart);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
  
      return () => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
    });
  </script>
  
  <style>
    .content {
      transition: transform 0.2s ease-out; /* Smooth transition for the content */
    }
  </style>
  
  <div
    class="content"
    style="transform: translateY({refreshHeight}px);"
  >
    <div
      class="refresh-indicator fixed top-0 left-0 right-0 flex justify-center items-center"
      style="height: {refreshHeight}px;"
    >
      {#if isPulling && refreshHeight > 100}
        <div class="spinner animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
      {/if}
    </div>
    <slot></slot> <!-- This will allow the content of the component to be passed in -->
  </div>
  