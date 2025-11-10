<script lang="ts">
  import { stockTicker } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let data;

  function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(
      differenceInMs / (1000 * 60 * 60 * 24),
    );

    // Return the difference in days
    return differenceInDays <= 1;
  }
</script>

<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="analystInsightInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
      >
        <svg
          class="w-6 h-6 sm:w-7 sm:h-7 inline-block mr-1 mt-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="#fff"
            d="M20.562 10.188c.25-.688.313-1.376.25-2.063c-.062-.687-.312-1.375-.625-2c-.562-.937-1.375-1.687-2.312-2.125c-1-.437-2.063-.562-3.125-.312c-.5-.5-1.063-.938-1.688-1.25S11.687 2 11 2a5.17 5.17 0 0 0-3 .938c-.875.624-1.5 1.5-1.813 2.5c-.75.187-1.375.5-2 .875c-.562.437-1 1-1.375 1.562c-.562.938-.75 2-.625 3.063a5.44 5.44 0 0 0 1.25 2.874a4.7 4.7 0 0 0-.25 2.063c.063.688.313 1.375.625 2c.563.938 1.375 1.688 2.313 2.125c1 .438 2.062.563 3.125.313c.5.5 1.062.937 1.687 1.25S12.312 22 13 22a5.17 5.17 0 0 0 3-.937c.875-.625 1.5-1.5 1.812-2.5a4.54 4.54 0 0 0 1.938-.875c.562-.438 1.062-.938 1.375-1.563c.562-.937.75-2 .625-3.062c-.125-1.063-.5-2.063-1.188-2.876m-7.5 10.5c-1 0-1.75-.313-2.437-.875c0 0 .062-.063.125-.063l4-2.312a.5.5 0 0 0 .25-.25a.57.57 0 0 0 .062-.313V11.25l1.688 1v4.625a3.685 3.685 0 0 1-3.688 3.813M5 17.25c-.438-.75-.625-1.625-.438-2.5c0 0 .063.063.125.063l4 2.312a.56.56 0 0 0 .313.063c.125 0 .25 0 .312-.063l4.875-2.812v1.937l-4.062 2.375A3.7 3.7 0 0 1 7.312 19c-1-.25-1.812-.875-2.312-1.75M3.937 8.563a3.8 3.8 0 0 1 1.938-1.626v4.751c0 .124 0 .25.062.312a.5.5 0 0 0 .25.25l4.875 2.813l-1.687 1l-4-2.313a3.7 3.7 0 0 1-1.75-2.25c-.25-.937-.188-2.062.312-2.937M17.75 11.75l-4.875-2.812l1.687-1l4 2.312c.625.375 1.125.875 1.438 1.5s.5 1.313.437 2.063a3.7 3.7 0 0 1-.75 1.937c-.437.563-1 1-1.687 1.25v-4.75c0-.125 0-.25-.063-.312c0 0-.062-.126-.187-.188m1.687-2.5s-.062-.062-.125-.062l-4-2.313c-.125-.062-.187-.062-.312-.062s-.25 0-.313.062L9.812 9.688V7.75l4.063-2.375c.625-.375 1.312-.5 2.062-.5c.688 0 1.375.25 2 .688c.563.437 1.063 1 1.313 1.625s.312 1.375.187 2.062m-10.5 3.5l-1.687-1V7.063c0-.688.187-1.438.562-2C8.187 4.438 8.75 4 9.375 3.688a3.37 3.37 0 0 1 2.062-.313c.688.063 1.375.375 1.938.813c0 0-.063.062-.125.062l-4 2.313a.5.5 0 0 0-.25.25c-.063.125-.063.187-.063.312zm.875-2L12 9.5l2.187 1.25v2.5L12 14.5l-2.188-1.25z"
          /></svg
        >
        AI Analyst Insight
      </label>
      <InfoModal
        title={"AI Analyst Insight"}
        content={"We use large language models to analyze the latest reports from Wall Street analysts, providing concise summaries and key insights. This approach helps save time and allows you to focus on the most important information."}
        id={"analystInsightInfo"}
      />
    </div>
    {#if ["Pro", "Plus"]?.includes(data?.user?.tier)}
      <div class="w-full flex flex-col items-start">
        <div class="text-white text-[1rem] mt-2 mb-2 w-full">
          The AI model summarizes the latest Wallstreet Analyst Insight Report
          and extracts key points for you, focusing on what matters most.
        </div>
      </div>

      <div class="w-full mt-4">
        <a
          href={"/stocks/" + $stockTicker + "/forecast/analyst"}
          class="text-blue-400 hover:text-white flex justify-end mb-3 text-sm sm:text-[1rem]"
        >
          See All Ratings
        </a>

        <div class="relative">
          <div class="">
            <div class="flex justify-center">
              <!--<div class="{data?.getAnalystInsight.changesPercentage >= 0 ? 'bg-[#00FC50]' : 'bg-[#FF2F1F]'} w-1.5 mb-5 rounded-l-xl" />-->

              <!--Start Item-->
              <div class="flex flex-row items-center w-full mb-6">
                <div
                  class="w-full rounded {latestInfoDate(
                    data?.getAnalystInsight?.date,
                  )
                    ? 'bg-[#F9AB00]/10'
                    : 'bg-primary'} shadow-lg h-full pl-3 pt-2 pb-4"
                >
                  <div class="flex flex-col items-start">
                    <div class="flex flex-row items-start w-full pt-2">
                      <span class="text-white text-[0.915rem] pl-2 italic"
                        >Last Report from {data?.getAnalystInsight?.date}</span
                      >
                      {#if latestInfoDate(data?.getAnalystInsight?.date)}
                        <label
                          class="bg-[#2D4F8A] text-white text-xs rounded px-2 py-0.5 ml-3"
                          >New</label
                        >
                      {/if}
                    </div>

                    <div class="flex flex-col w-full pt-3 pl-2 pr-2 sm:pr-4">
                      <span class="text-white text-[1rem]">
                        {data?.getAnalystInsight?.insight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <!--End Item-->
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div
        class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold"
      >
        <svg
          class="mr-1.5 w-5 h-5 inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="#A3A3A3"
            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
          /></svg
        >
        Unlock content with
        <a
          class="inline-block ml-2 text-blue-400 sm:hover:text-white"
          href="/pricing">Pro Subscription</a
        >
      </div>
    {/if}
  </main>
</section>
