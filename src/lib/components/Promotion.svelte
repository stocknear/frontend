<script lang="ts">
  import { screenWidth } from "$lib/store";

  export let modalId = "promotionModal";
  export let title = "Upgrade for real-time edge on every trade.";
  export let subtitle = "Upgrade to Pro for unlimited access to all features";
  export let features = [
    "Unlimited AI chat & research",
    "Real-time market data & screeners",
    "Portfolio tracking & insights",
  ];
  export let monthlyLabel = "$19/month";
  export let monthlyHref = "/pricing";
  export let yearlyLabel = "$99/year";
  export let yearlyNote = "Save 57%";
  export let yearlyHref = "/pricing";
  export let footerText =
    "Cancel anytime. We are a small team and your support means everything.";
  export let contactHref = "/contact";
  export let chatHref = "/chat";
  export let showLogout = false;
  export let logoutAction = "/logout";
</script>

<input type="checkbox" id={modalId} class="modal-toggle" />

<dialog
  id={modalId}
  class="modal modal-bottom sm:modal-middle rounded-none sm:rounded"
>
  <label for={modalId} class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full bg-white/90 dark:bg-zinc-950/70 shadow-sm backdrop-blur-sm sm:border sm:border-gray-200 dark:sm:border-zinc-800/80 rounded-none sm:rounded-2xl {$screenWidth <
    640
      ? 'min-h-screen'
      : ''}"
  >
    <label
      for={modalId}
      class="cursor-pointer absolute right-3 top-3 text-lg text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white transition"
    >
      <svg
        class="h-8 w-8"
        viewBox="0 -0.5 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"
          fill="currentColor"
        ></path></svg
      >
    </label>

    <div class="grid grid-cols-1 animate-fade-in-once">
      <div class="flex justify-center pt-6 sm:pt-3">
        <div
          class="h-12 w-12 rounded-full bg-gray-100/80 dark:bg-zinc-900/60 flex items-center justify-center text-gray-900 dark:text-white"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path
              d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2
        class="text-center text-2xl sm:text-3xl pt-4 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {title}
      </h2>
      <p class="text-gray-500 dark:text-zinc-400 text-center text-sm pb-5 pt-3">
        {subtitle}
      </p>

      <ul
        class="space-y-3 text-sm sm:text-base text-gray-800 dark:text-zinc-200"
      >
        {#each features as feature}
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span>{feature}</span>
          </li>
        {/each}
      </ul>

      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <a
          href={monthlyHref}
          class="flex-1 py-2.5 px-4 rounded-full font-semibold transition bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 text-center"
        >
          {monthlyLabel}
        </a>
        <a
          href={yearlyHref}
          class="flex-1 py-2.5 px-4 rounded-full font-semibold transition bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 dark:bg-zinc-950/80 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-900 text-center"
        >
          <span>{yearlyLabel}</span>
          <span class="ml-2 text-xs text-gray-500 dark:text-zinc-400">
            {yearlyNote}
          </span>
        </a>
      </div>

      <p class="mt-5 text-center text-xs text-gray-500 dark:text-zinc-400">
        {footerText}
        <a
          class="text-violet-600 dark:text-violet-400 hover:underline ml-1"
          href={contactHref}
        >
          Contact us
        </a>
        <span class="mx-1">or</span>
        <a
          class="text-violet-600 dark:text-violet-400 hover:underline"
          href={chatHref}
        >
          chat
        </a>
        <span class="mx-1">for any issues.</span>
        {#if showLogout}
          <form class="inline" action={logoutAction} method="POST">
            <button
              type="submit"
              class="text-violet-600 dark:text-violet-400 hover:underline ml-1"
            >
              Logout
            </button>
          </form>
        {/if}
      </p>
    </div>
  </div>
</dialog>
