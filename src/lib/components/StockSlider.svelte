<script lang="ts">
  export let sliderList;
</script>

<div class="slider pt-1 sm:pt-0 h-10 sm:h-8 w-full max-w-screen">
  <div class="slide-track flex flex-row items-center">
    {#each [...sliderList] as item}
      <a
        href={`stocks/${item?.symbol}`}
        class="cursor-pointer transition shadow-lg sm:hover:bg-[#404040] sm:hover:bg-opacity-[0.7] duration-150 sm:w-full flex flex-row items-center rounded-full justify-center py-1.5 text-white text-sm mr-6 sm:mr-8"
      >
        {item.symbol}
        {#if item?.changesPercentage >= 0}
          <svg
            class="inline-block w-4 h-4 ml-0.5 -mr-0.5 mt-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><g id="evaArrowUpFill0"
              ><g id="evaArrowUpFill1"
                ><path
                  id="evaArrowUpFill2"
                  fill="#00FC50"
                  d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"
                /></g
              ></g
            ></svg
          >
          <span class="text-[#00FC50] text-sm"
            >+{item?.changesPercentage?.toFixed(2)}%</span
          >
        {:else if item?.changesPercentage < 0}
          <svg
            class="inline-block w-4 h-4 ml-0.5 -mr-0.5 mt-1 rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><g id="evaArrowUpFill0"
              ><g id="evaArrowUpFill1"
                ><path
                  id="evaArrowUpFill2"
                  fill="#FF2F1F"
                  d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"
                /></g
              ></g
            ></svg
          >
          <span class="text-[#FF2F1F] text-sm"
            >{item?.changesPercentage?.toFixed(2)}%</span
          >
        {/if}
      </a>
    {/each}
  </div>
</div>

<style lang="scss">
  @mixin white-gradient {
    background: linear-gradient(
      to right,
      rgba(14, 14, 16, 1) 0%,
      rgba(14, 14, 16, 0) 100%
    );
  }

  $animationSpeed: 60s;

  // Animation
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-250px * 7));
    }
  }

  // Styling
  .slider {
    background: #09090b;
    margin: auto;
    overflow: hidden;
    position: relative;

    &::before,
    &::after {
      @include white-gradient;
      content: "";
      height: 100%;
      position: absolute;
      width: 3%;
      z-index: 2;
    }

    &::after {
      right: 0;
      top: 0;
      transform: rotateZ(180deg);
    }

    &::before {
      left: 0;
      top: 0;
    }

    .slide-track {
      animation: scroll $animationSpeed linear infinite;
      display: flex;
      width: calc(250px * 14);
      &:hover {
        animation-play-state: paused;
      }
    }
  }
</style>
