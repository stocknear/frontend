<script lang="ts">
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import * as Table from "$lib/components/shadcn/table/index.ts";
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber } from "$lib/utils";

  export let darkPoolList;
</script>

<Card.Root
  class="bg-gray-50 dark:bg-default overflow-x-auto overflow-hidden overflow-y-auto "
>
  <Card.Header class="flex flex-row items-center">
    <div class="flex flex-col items-start w-full">
      <div class="flex flex-row w-full items-center">
        <Card.Title>
          <a
            href="/dark-pool-flow/"
            class="text-xl sm:text-2xl text-muted dark:text-white font-semibold cursor-pointer sm:hover:underline sm:hover:underline-offset-4"
          >
            Dark Pool Order
            <svg
              class="h-5 w-5 inline-block"
              viewBox="0 0 20 20"
              fill="currentColor"
              style="max-width:40px"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              ></path></svg
            >
          </a></Card.Title
        >
      </div>
    </div>
  </Card.Header>
  <Card.Content>
    {#if darkPoolList?.length > 0}
      <Table.Root class="overflow-x-auto w-full">
        <Table.Header>
          <Table.Row>
            <Table.Head class=" text-left text-sm font-bold dark:font-semibold"
              >Symbol</Table.Head
            >
            <Table.Head
              class="text-right table-cell text-sm font-bold dark:font-semibold"
              >Prem</Table.Head
            >
            <Table.Head
              class="text-right table-cell text-sm font-bold dark:font-semibold"
              >Size</Table.Head
            >

            <Table.Head
              class=" text-right text-sm font-bold dark:font-semibold whitespace-nowrap"
              >Size / Avg Vol</Table.Head
            >
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each darkPoolList as item}
            <Table.Row>
              <Table.Cell class="text-sm sm:text-[1rem]">
                <a
                  href={`/${item?.assetType === "Stock" ? "stocks" : "etf"}/${item?.ticker}`}
                  class="text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted cursor-pointer"
                  >{item?.ticker}</a
                >
              </Table.Cell>
              <Table.Cell
                class="table-cell xl:table.-column text-sm sm:text-[1rem] text-right"
              >
                ${abbreviateNumber(item?.premium)}
              </Table.Cell>
              <Table.Cell
                class="table-cell xl:table.-column text-sm sm:text-[1rem] text-right"
              >
                {item?.size?.toLocaleString("en-US")}
              </Table.Cell>

              <Table.Cell
                class="text-right md:table.-cell xl:table.-column text-sm sm:text-[1rem]"
              >
                {item?.sizeAvgVolRatio ? item?.sizeAvgVolRatio + "%" : "n/a"}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {:else}
      <Infobox text="Currently, no unusual dark pool flow data available." />
    {/if}
  </Card.Content>
</Card.Root>
