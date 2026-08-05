<script lang="ts">
  import * as m from "$lib/paraglide/messages";

  export let blogData = [];

  function sentimentLabel(sentiment) {
    if (sentiment === "Very Good") return m.blog_sentiment_very_good();
    if (sentiment === "Good") return m.blog_sentiment_good();
    if (sentiment === "Average") return m.blog_sentiment_average();
    if (sentiment === "Bad") return m.blog_sentiment_bad();
    if (sentiment === "Very Bad") return m.blog_sentiment_very_bad();
    return sentiment;
  }
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">
  {m.blog_heading_management()}
</h2>

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded-control mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded-control w-full border border-line m-auto"
  >
    <tbody class="">
      {#each blogData?.data as item}
        <tr class=" dark:sm:hover:bg-[#245073]/10">
          <td class="text-start text-sm whitespace-nowrap">
            {item?.label}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {item?.value + "%"}
          </td>

          <td class=" text-sm sm:text-[1rem] whitespace-nowrap text-end">
            <label
              class="badge badge-lg w-24 rounded-control {[
                'Very Good',
                'Good',
              ]?.includes(item?.sentiment)
                ? 'bg-green-800 dark:bg-green-600'
                : item?.sentiment === 'Average'
                  ? 'bg-orange-800 dark:bg-orange-600'
                  : 'bg-red-800 dark:bg-red-600'}"
              >{sentimentLabel(item?.sentiment)}</label
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{@html blogData?.text}
