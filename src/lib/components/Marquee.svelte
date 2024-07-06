<script lang="ts">
    import { cn } from "$lib/utils";
    import ReviewCard from '$lib/components/ReviewCard.svelte';
    export let pauseOnHover: boolean = false;
    export let vertical: boolean = false;
    export let repeat: number = 4;
    export let reverse: boolean = false;
  
    const firstReviewBatch = [
  {
    name: "Moh",
    body: "Awesome site 🔥! The real-time data and insights are invaluable for my investments.",
    img: "https://avatar.vercel.sh/moh",
  },
  {
    name: "Markus",
    body: "Speechless. The detailed charts and summaries are just what I needed.",
    img: "https://avatar.vercel.sh/markus",
  },
  {
    name: "Mintha",
    body: "Really good ❤. The interface and stock overviews are a game-changer.",
    img: "https://avatar.vercel.sh/mintha",
  },
  {
    name: "Steven",
    body: "Perfect, keep it up 🚀! The market analysis and forecasts are top-notch.",
    img: "https://avatar.vercel.sh/steven",
  },
  {
    name: "Lars",
    body: "Amazing! The site simplifies complex data into clear insights.",
    img: "https://avatar.vercel.sh/lars",
  }
];

const secondReviewBatch = [
    {
    name: "Alanis",
    body: "Love it 🫰🏻! The charts with concise explanations make stock movements clear.",
    img: "https://avatar.vercel.sh/alanis",
  },
  {
    name: "Parviz",
    body: "Great, already shared 😎! This site is my go-to for stock information.",
    img: "https://avatar.vercel.sh/parviz",
  },
  {
    name: "Daniel",
    body: "Finally, a site that helps me find great stocks 💸. The research is spot-on.",
    img: "https://avatar.vercel.sh/daniel",
  },
  {
    name: "Hassan",
    body: "The best platform so far for researching stocks 💎.",
    img: "https://avatar.vercel.sh/hassan",
  },
  {
    name: "Pete",
    body: "The platform promised High Quality Wallstreet Data and they delivered it. Love it!",
    img: "https://avatar.vercel.sh/pete",
  },
]
    
</script>
  

  <div
    class={cn(
      "slider group flex overflow-hidden p-2 [--duration:12s] [--gap:1rem] [gap:var(--gap)]"
      )}
  >
    {#each firstReviewBatch as item, i (i)}
      <div
        class={cn("flex shrink-0 justify-around animate-marquee flex-row [gap:var(--gap)]", {
          "group-hover:[animation-play-state:paused]": true,
          "[animation-direction:reverse]": true,
        })}
      >
            <ReviewCard img={item?.img} name={item?.name} body={item?.body}/>
      </div>
    {/each}

    
  </div>

  
  <div
  class={cn(
    "slider group flex overflow-hidden p-2 [--duration:12s] [--gap:1rem] [gap:var(--gap)]"
    )}
>
  {#each secondReviewBatch as item, i (i)}
    <div
      class={cn("flex shrink-0 justify-around animate-marquee flex-row [gap:var(--gap)]", {
        "group-hover:[animation-play-state:paused]": true,
        "[animation-direction:reverse]": false,
      })}
    >
          <ReviewCard img={item?.img} name={item?.name} body={item?.body}/>
    </div>
  {/each}

  
</div>



<style lang='scss'>

@mixin white-gradient {
    background: linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
}

$animationSpeed: 60s;


// Styling
.slider {
    margin: auto;
    overflow: hidden;
    position: relative;

    &::before,
    &::after {
    @include white-gradient;
    content: "";
    height: 100%;
    position: absolute;
    width: 2%;
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

    
}
</style>
      