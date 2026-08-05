<script lang="ts">
  import { etfTicker } from "$lib/store";
  import { formatDate, removeCompanyStrings } from "$lib/utils";

  export let data;

  let newsList = data?.getNews || [];
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <slot />
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-3">
          {#if newsList?.length !== 0}
            <div
              class="w-full bg-surface-card border border-line rounded-container p-4 mt-4"
            >
              <div class="p-4 text-sm">
                <h3 class="type-h3 text-fg mb-3">
                  {$etfTicker} News
                </h3>
                <ul class="">
                  {#each newsList?.slice(0, 10) as item}
                    <li class="mb-3 last:mb-1">
                      {formatDate(item?.publishedDate)} &#183;
                      <a
                        class="font-medium text-fg transition-colors hover:text-accent"
                        href={item?.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow">{item?.title}</a
                      >
                      - {item?.site}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>
