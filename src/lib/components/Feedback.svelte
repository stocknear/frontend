<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  import veryGoodEmoji from "$lib/assets/veryGoodEmoji.svg";
  import goodEmoji from "$lib/assets/goodEmoji.svg";
  import badEmoji from "$lib/assets/badEmoji.svg";
  import veryBadEmoji from "$lib/assets/veryBadEmoji.svg";
  import Question from "lucide-svelte/icons/message-circle-question";
  export let data;

  import feedback_icon from "$lib/images/feedback_icon.png";

  let rating = "";
  let inputValue = "";
  let category = "general";
  let activeIdx = 0;

  const tabs = [
    {
      title: "General",
    },
    {
      title: "Feature",
    },
    {
      title: "Bug",
    },
  ];

  function handleMode(index) {
    activeIdx = index;
    if (activeIdx === 0) {
      category = "general";
    } else if (activeIdx === 1) {
      category = "feature-request";
    } else if (activeIdx === 2) {
      category = "bug-report";
    }
  }

  async function sendFeedback() {
    if (inputValue?.length === 0) {
      toast.error("Please enter your feedback", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    if (rating?.length === 0 && category === "general") {
      toast.error("Please select an emoji", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    const closePopup = document.getElementById("feedbackInfo");
    closePopup?.dispatchEvent(new MouseEvent("click"));

    const userId = data?.user?.id ?? "";

    const postData = {
      user: userId,
      rating: rating,
      description: inputValue,
      category: category,
    };

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    toast.success("Thank you for your feedback", {
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });

    rating = "";
    inputValue = "";
  }

  function handleInput(event) {
    inputValue = event.target.value;
  }
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<div class="fixed z-100 bottom-8 sm:bottom-10 right-8 sm:right-16">
  <label
    for="feedbackInfo"
    class="border inline-flex items-center justify-center w-12 h-12 sm:w-full sm:h-10 font-semibold bg-black dark:bg-gray-100 border-gray-500 dark:border-gray-700 ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer"
  >
    <Question class="sm:hidden w-5 h-5 text-white dark:text-black" />
    <span class="text-white dark:text-black hidden sm:block text-md px-3">
      Feedback
    </span>
    <img
      class="hidden sm:inline-block w-12 -mt-6 opacity-[0.85]"
      src={feedback_icon}
      alt="feedback logo"
    />
  </label>
</div>

<!--Start Create Watchlist Modal-->
<input type="checkbox" id="feedbackInfo" class="modal-toggle" />

<dialog id="feedbackInfo" class="modal overflow-hidden p-3 sm:p-0 bg-[#000]/30">
  <label for="feedbackInfo" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box rounded w-full bg-white dark:bg-secondary border border-gray-300 dark:border-gray-600"
  >
    <div class="flex flex-row items-center pt-5">
      <h1 class=" text-xl sm:text-2xl font-bold">Your Feedback matters!</h1>
      <label
        for="feedbackInfo"
        class="inline-block cursor-pointer absolute right-3 top-3 text-[1.3rem] sm:text-[1.8rem]"
      >
        <svg
          class="w-6 h-6 sm:w-8 sm:h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg
        >
      </label>
    </div>

    <div class="p-2">
      <div
        class="bg-gray-400 dark:bg-secondary w-full min-w-20 sm:w-full relative flex flex-wrap items-center justify-center rounded p-1 mt-4"
      >
        {#each tabs as item, i}
          <button
            on:click={() => handleMode(i)}
            class="cursor-pointer group relative z-1 rounded-full w-1/3 min-w-20 py-1 {activeIdx ===
            i
              ? 'z-0'
              : ''} "
          >
            {#if activeIdx === i}
              <div class="absolute inset-0 rounded bg-[#fff]"></div>
            {/if}
            <span
              class="relative text-sm block font-semibold whitespace-nowrap {activeIdx ===
              i
                ? 'text-black'
                : ''}"
            >
              {item.title}
            </span>
          </button>
        {/each}
      </div>
    </div>

    <div class="p-2 w-full h-[200px] max-h-[1000px]">
      <textarea
        class="text-black max-h-[1000px] h-[200px] border-gray-300 dark:border-gray-800 textarea focus:outline-none placeholder-gray-600 dark:placeholder-black w-full bg-gray-200 dark:bg-gray-300"
        placeholder="Your feedback..."
        value={inputValue}
        on:input={handleInput}
      />
    </div>

    <ul class="flex gap-5 justify-center mt-5 mb-5">
      {#if category === "general"}
        <li on:click={() => (rating = "Very Good")} class="cursor-pointer">
          <div
            class="rounded-full w-16 h-16 relative {rating === 'Very Good'
              ? 'bg-gray-400 dark:bg-secondary'
              : ''} sm:hover:bg-gray-400 dark:sm:hover:bg-secondary flex items-center justify-center"
          >
            <img
              class="w-8 h-8 sm:w-10 sm:h-10"
              src={veryGoodEmoji}
              loading="lazy"
            />
          </div>
        </li>
        <li on:click={() => (rating = "Good")} class="cursor-pointer">
          <div
            class="rounded-full w-16 h-16 relative {rating === 'Good'
              ? 'bg-gray-400 dark:bg-secondary'
              : ''} sm:hover:bg-gray-400 dark:sm:hover:bg-secondary flex items-center justify-center"
          >
            <img
              class="w-8 h-8 sm:w-10 sm:h-10"
              src={goodEmoji}
              loading="lazy"
            />
          </div>
        </li>
        <li on:click={() => (rating = "Bad")} class="cursor-pointer">
          <div
            class="rounded-full w-16 h-16 relative {rating === 'Bad'
              ? 'bg-gray-400 dark:bg-secondary'
              : ''} sm:hover:bg-gray-400 dark:sm:hover:bg-secondary flex items-center justify-center"
          >
            <img
              class="w-8 h-8 sm:w-10 sm:h-10"
              src={badEmoji}
              loading="lazy"
            />
          </div>
        </li>
        <li on:click={() => (rating = "Very Bad")} class="cursor-pointer">
          <div
            class="rounded-full w-16 h-16 relative {rating === 'Very Bad'
              ? 'bg-gray-400 dark:bg-secondary'
              : ''} sm:hover:bg-gray-400 dark:sm:hover:bg-secondary flex items-center justify-center"
          >
            <img
              class="w-8 h-8 sm:w-10 sm:h-10"
              src={veryBadEmoji}
              loading="lazy"
            />
          </div>
        </li>
      {/if}
    </ul>

    <button
      on:click={() => sendFeedback()}
      class="mb-4 px-3 py-2 bg-black dark:bg-[#fff] cursor-pointer sm:hover:bg-muted w-11/12 rounded m-auto text-white dark:text-black font-semibold text-md"
    >
      Send Feedback
    </button>
  </div>
</dialog>
