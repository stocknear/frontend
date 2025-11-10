<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  export let url;

  function shareContent() {
    if (navigator.share) {
      navigator
        .share({
          title: document.title,
          url,
        })
        .then(() => console.log("Content shared successfully."))
        .catch((error) => console.log("Error sharing content:", error));
    } else {
      toast?.error("Sharing is not supported by your device", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }
</script>

<label on:click={shareContent} class="lg:hidden cursor-pointer ml-auto mr-10">
  <svg
    class="inline-block w-5 h-5 mr-3"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    ><path
      fill="#d6d6dc"
      d="M18 22q-1.25 0-2.125-.875T15 19q0-.175.025-.363t.075-.337l-7.05-4.1q-.425.375-.95.588T6 15q-1.25 0-2.125-.875T3 12q0-1.25.875-2.125T6 9q.575 0 1.1.213t.95.587l7.05-4.1q-.05-.15-.075-.337T15 5q0-1.25.875-2.125T18 2q1.25 0 2.125.875T21 5q0 1.25-.875 2.125T18 8q-.575 0-1.1-.212t-.95-.588L8.9 11.3q.05.15.075.338T9 12q0 .175-.025.363T8.9 12.7l7.05 4.1q.425-.375.95-.587T18 16q1.25 0 2.125.875T21 19q0 1.25-.875 2.125T18 22Z"
    /></svg
  >
  <!--
  <span class=" text-[#D6D6DC] text-sm">
    Share
</span>
-->
</label>
