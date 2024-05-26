<script lang='ts'>

import { onMount, onDestroy} from 'svelte';
import { browser } from '$app/environment';
import { v4 as uuidv4 } from 'uuid';
import { screenWidth } from '$lib/store';

  let id = uuidv4();

  export let src;
  export let hideProgressbar = false;


  let container;
    let observer;
    let video;
    let progress = -1;


  onMount(async () => {

      video = document.getElementById(id);


    if (typeof window !== 'undefined' && browser) {
      const handleIntersect = (entries, observer) => {
        entries.forEach((entry) => {
          if (entry?.isIntersecting) {
            //console.log("video id:", id, "should play now");
            playVideo();
          } else {
            pauseVideo();
            //console.log("video id:", id, "should stop now");
          }
        });
      };

      const options = { threshold: 0.4, rootMargin: '-0px 0px' };
      observer = new IntersectionObserver(handleIntersect, options);

      if (container instanceof Element) {
        observer.observe(container);
      }
    }
  });
  
function updateProgress() {
  if (video && video?.duration && !video?.paused) {
    const { currentTime, duration } = video;
    progress = (currentTime / duration) * 100;
    // Use decimal values for smoother progress
    progress = parseFloat(progress.toFixed(2));
  }
}

  $: {
    if (video) {
      video.ontimeupdate = updateProgress;

      
    }
  };


    onDestroy(() => {
      if (observer) {
        observer?.disconnect();
      }
    });
  
    function playVideo() {
  if (video) {
      video.play();
      video.muted = true;
    ;
  }
}

  
    function pauseVideo() {

      if (video) {
        video.pause();
        video.muted = true;
        isVideoMuted[id] = video.muted;

      }
    }



  let isVideoMuted = {};

isVideoMuted[id] = true;

function toggleMute(event) {
  event.preventDefault();
  
  if (video?.paused) 
  {
    video?.play();
    isVideoMuted[id] = false;

  }
  else {

    video.muted = !video?.muted;
  isVideoMuted[id] = video?.muted;
  }
  
 
}


</script>


<div class="absolute inset-0 bg-cover object-fill bg-center bg-[#000]">
</div>

<video
  id={id}
  playsinline
  loop
  class="relative m-auto w-full max-w-screen max-h-[520px] sm:max-h-[700px]"
  src={src}
  on:click={toggleMute}
  bind:this={container}
  on:loadedmetadata={updateProgress}
/>



  <div class="z-20 bg-center bg-[#000] rounded-full w-11 h-11 bg-opacity-60 absolute bottom-2 left-2 flex items-center justify-center">
    {#if isVideoMuted[id]}
      <svg class="w-6 h-6 m-auto" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>sound-off-filled</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="icon" fill="#fff" transform="translate(42.666667, 59.581722)"> <path d="M47.0849493,-1.42108547e-14 L298.668,251.583611 L304.101001,257.015597 L304.101,257.016 L353.573532,306.488791 C353.573732,306.488458 353.573933,306.488124 353.574133,306.48779 L384.435257,337.348961 L384.434,337.349 L409.751616,362.666662 L379.581717,392.836561 L191.749,205.003 L191.749973,369.105851 L81.0208,283.647505 L7.10542736e-15,283.647505 L7.10542736e-15,112.980838 L80.8957867,112.980838 L91.433,104.688 L16.9150553,30.169894 L47.0849493,-1.42108547e-14 Z M361.298133,28.0146513 C429.037729,103.653701 443.797162,209.394226 405.578884,298.151284 L372.628394,265.201173 C396.498256,194.197542 381.626623,113.228555 328.013013,54.642278 L361.298133,28.0146513 Z M276.912853,95.5237713 C305.539387,127.448193 318.4688,168.293162 315.701304,208.275874 L266.464558,159.040303 C261.641821,146.125608 254.316511,133.919279 244.488548,123.156461 L243.588693,122.182545 L276.912853,95.5237713 Z M191.749973,25.7516113 L191.749,84.3256113 L158.969,51.5456113 L191.749973,25.7516113 Z" id="Combined-Shape"> </path> </g> </g> </g></svg>
    {:else}
      <svg class="w-6 h-6 m-auto" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#fff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>sound-loud-filled</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="icon" fill="#ffffff" transform="translate(42.666667, 85.333333)"> <path d="M361.299413,341.610667 L328.014293,314.98176 C402.206933,233.906133 402.206933,109.96608 328.013013,28.8906667 L361.298133,2.26304 C447.910187,98.97536 447.908907,244.898347 361.299413,341.610667 Z M276.912853,69.77216 L243.588693,96.4309333 C283.38432,138.998613 283.38304,204.87488 243.589973,247.44256 L276.914133,274.101333 C329.118507,215.880107 329.118507,127.992107 276.912853,69.77216 Z M191.749973,1.42108547e-14 L80.8957867,87.2292267 L7.10542736e-15,87.2292267 L7.10542736e-15,257.895893 L81.0208,257.895893 L191.749973,343.35424 L191.749973,1.42108547e-14 L191.749973,1.42108547e-14 Z" id="Shape"> </path> </g> </g> </g></svg>
    {/if}
  </div>

{#if !hideProgressbar}
  <progress class="progress [&::-webkit-progress-value]:bg-[#FF0000] [&::-moz-progress-bar]:bg-[#FF0000] w-full bg-white" value={progress} max="100" style="height: 1.5px"></progress>
{/if}

