<script lang="ts">
    import { cn } from "$lib/utils";
  
    export let img: string;
    export let name: string;
    export let body: string;
</script>
  
  <figure
    class={cn(
      "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-50/[.1] bg-gray-50/[.10] hover:bg-gray-50/[.15]",
      // dark styles
      "border-gray-50/[.1] bg-gray-50/[.10] hover:bg-gray-50/[.15]"
    )}
  >
    <div class="flex flex-row items-center gap-2">
      <img class="rounded-full w-8 h-8"  alt="" src={img} />
      <div class="flex flex-col">
        <!-- svelte-ignore a11y-structure -->
        <figcaption class="text-sm font-medium text-white">
          {name}
        </figcaption>
      </div>
    </div>
    <blockquote class="mt-2 text-sm text-left text-white">{body}</blockquote>
  </figure>
  