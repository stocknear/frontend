<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import {
    stock_detail_above,
    stock_detail_alert_created,
    stock_detail_alert_failed,
    stock_detail_below,
    stock_detail_cancel,
    stock_detail_condition,
    stock_detail_creating_alert,
    stock_detail_crossing,
    stock_detail_price,
    stock_detail_price_alert_on,
    stock_detail_regular_trading_hours,
    stock_detail_save,
    stock_detail_symbol,
    stock_detail_target_price_error,
    stock_detail_value,
  } from "$lib/paraglide/messages";

  import { openPriceAlert, newPriceAlertData } from "$lib/store";

  export let data;
  export let ticker;
  export let assetType;

  let currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));
  let targetPrice = currentPrice; //(currentPrice * (1 + targetPrice / 100))?.toFixed(2);
  let condition = "above";
  let note = "";
  const NOTE_MAX_LENGTH = 500;

  function resetAlertForm() {
    currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));
    targetPrice = currentPrice;
    condition = "above";
    note = "";
  }

  function changeStatement(event) {
    condition = event.target.value;
  }

  async function handleCreateAlert() {
    // Validate input locally.
    if (targetPrice < 0) {
      toast.error(stock_detail_target_price_error(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    const sanitizedNote = note.trim();

    // Optionally close the modal popup.
    const closePopup = document.getElementById("priceAlertModal");
    closePopup?.dispatchEvent(new MouseEvent("click"));

    // Prepare data for the POST request.
    const postData = {
      userId: data?.user?.id,
      symbol: ticker,
      name: data?.getStockQuote?.name,
      assetType: assetType,
      priceWhenCreated: currentPrice,
      condition: condition,
      targetPrice: targetPrice,
      note: sanitizedNote,
    };

    // Create a promise for the POST request.
    const promise = fetch("/api/create-price-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    }).then(async (response) => {
      const result = await response.json();
      // If the response is not ok, throw an error to be caught by toast.promise.
      if (!response.ok) {
        throw new Error(result.error || "Failed to create price alert");
      }
      return result;
    });

    // Use toast.promise to handle pending, success, and error states.
    toast.promise(promise, {
      loading: stock_detail_creating_alert(),
      success: stock_detail_alert_created(),
      error: (err) => err.message || stock_detail_alert_failed(),
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });

    // Await the promise and handle the result.
    try {
      const createdPriceAlertData = await promise;
      // Update reactive store or state as needed.
      newPriceAlertData.set(createdPriceAlertData);
      // Optionally reset targetPrice or perform further actions.
      resetAlertForm();
    } catch (error) {
      // The error is already handled by toast.promise, but you can log it here.
      console.error("Error creating price alert:", error);
    }
  }

  async function stepSizeValue(condition) {
    let step = 1;
    if (targetPrice <= 1) {
      step = 0.1;
    } else {
      step = 1;
    }

    targetPrice += condition === "add" ? step : -step;

    // Round to 2 decimal places
    targetPrice = parseFloat(targetPrice.toFixed(2));
  }

  $: {
    if ($openPriceAlert === true) {
      $openPriceAlert = false;
      resetAlertForm();
    }
  }
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<!--Start Trade Modal-->
<input type="checkbox" id="priceAlertModal" class="modal-toggle" />

<dialog id="priceAlertModal" class="modal modal-middle p-2 sm:p-0">
  <label for="priceAlertModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full min-h-fit h-[600px] sm:h-[500px] p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="priceAlertModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <div class="flex flex-col w-full">
      <h2
        class="font-semibold text-lg text-start mb-5 tracking-tight text-gray-900 dark:text-white"
      >
        {stock_detail_price_alert_on({ ticker })}
      </h2>

      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 font-medium"
      >
        <label
          class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-[20%] mb-1 sm:mb-0"
          >{stock_detail_symbol()}</label
        >

        <label
          class="rounded-full w-full sm:w-[80%] py-2 px-3 text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200"
        >
          <!--
          <img
            style="clip-path: circle(50%);"
            class="w-4 h-4 inline-block -mt-1 mr-1"
            src={`https://financialmodelingprep.com/image-stock/${ticker?.toUpperCase()}.png`}
            alt="logo"
            loading="lazy"
          />
          -->

          {ticker?.toUpperCase()}, {stock_detail_regular_trading_hours()}
        </label>
      </div>

      <div class="flex flex-col gap-4 mt-5 font-medium">
        <!-- Condition Label -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center">
          <label
            class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-[20%] mb-1 sm:mb-0"
            >{stock_detail_condition()}</label
          >
          <input
            type="text"
            value={stock_detail_price()}
            class="select-none w-full sm:w-[80%] border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 text-sm rounded-full py-2 px-3"
            readonly
          />
        </div>

        <!-- Crossing Dropdown -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center">
          <label
            class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-[20%] mb-1 sm:mb-0"
            >{stock_detail_crossing()}</label
          >
          <div class="relative w-full sm:w-[80%]">
            <select
              on:change={changeStatement}
              class="cursor-pointer w-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 text-sm rounded-full py-2 pl-3 pr-9 appearance-none"
            >
              <option value="above" selected>{stock_detail_above()}</option>
              <option value="below">{stock_detail_below()}</option>
            </select>
            <svg
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M7 10l5 5l5-5z" />
            </svg>
          </div>
        </div>

        <!-- Value Input -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center">
          <label
            class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-[20%] mb-1 sm:mb-0"
            >{stock_detail_value()}</label
          >

          <div class="relative w-full sm:w-[80%]">
            <input
              bind:value={targetPrice}
              class="w-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 text-sm rounded-full py-2 px-3 pr-16"
            />
            <div
              class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-x-1.5"
            >
              <button on:click={() => stepSizeValue("add")}>
                <svg
                  class="size-6 cursor-pointer text-gray-400 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width: 40px"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>
              <button on:click={() => stepSizeValue("minus")}>
                <svg
                  class="size-6 cursor-pointer text-gray-400 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width: 40px"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-start">
          <label
            class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-[20%] mb-1 sm:mb-0 sm:mt-2"
            >Note</label
          >
          <div class="w-full sm:w-[80%]">
            <textarea
              bind:value={note}
              maxlength={NOTE_MAX_LENGTH}
              rows="4"
              placeholder="Note down why this alert level matters and what you plan to do when it triggers"
              class="w-full font-normal placeholder:text-gray-600 dark:placeholder:text-gray-400 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 text-sm rounded-2xl py-2 px-3 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            ></textarea>
            <div
              class="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400"
            >
              <span class="tabular-nums">{note.length}/{NOTE_MAX_LENGTH}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4 absolute bottom-3 right-5">
          <label
            for="priceAlertModal"
            class="cursor-pointer border border-gray-300 dark:border-zinc-700 py-2 px-4 rounded-full text-sm bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            {stock_detail_cancel()}
          </label>
          <button
            on:click={handleCreateAlert}
            class="cursor-pointer bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 px-4 rounded-full text-sm font-semibold hover:bg-gray-800 dark:hover:bg-zinc-200 transition"
          >
            {stock_detail_save()}
          </button>
        </div>
      </div>

      <!--End Trade Modal-->
    </div>
  </div>
</dialog>
