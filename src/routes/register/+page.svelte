<script>
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  export let form;
  export let data;

  let isClicked = false;
  let loading = false;
  let oauthLoading = false;
  let showTurnstile = true;

  const resetTurnstile = async () => {
    showTurnstile = false;
    await tick();
    showTurnstile = true;
  };

  const submitRegistration = () => {
    loading = true;
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
        case "redirect":
          isClicked = true;
          toast.success("Registration successfully!", {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "failure":
          toast.error("Invalid credentials", {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          toast.error(result.error.message, {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }
      await resetTurnstile();
      loading = false;
    };
  };
</script>

<SEO
  title="Sign Up"
  description="Sign Up to Stocknear to become part of the largest trading community in the world."
/>

<div
  class="relative w-full max-w-3xl mx-auto text-gray-700 dark:text-zinc-200 {data?.user
    ? 'min-h-[500px] sm:min-h-[900px]'
    : 'min-h-screen '}  {oauthLoading ? 'opacity-[0.2]' : ''}"
>
  <div class="grid grid-cols-1 gap-4">
    <div class="relative">
      <a href="/">
        <img
          class="m-auto w-16 sm:w-20 rounded-full pt-4"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
          loading="lazy"
        />
      </a>

      <h1
        class="text-center text-2xl sm:text-3xl pt-4 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {!data?.user ? "Getting Started" : "You are logged in"}
      </h1>
    </div>
    {#if !data?.user}
      <span class="text-sm text-gray-500 dark:text-zinc-400 text-center">
        Create an account & start your stock analysis
      </span>

      <form
        action="?/register"
        method="POST"
        use:enhance={submitRegistration}
        class="flex flex-col items-center space-y-3 w-full max-w-lg pt-4 pl-3 pr-3 sm:pl-0 sm:pr-0 ml-auto mr-auto"
      >
        <!--<Input id="name" label="Your first and last name" value={form?.data?.name} errors={form?.errors?.name} />-->

        <Input
          type="email"
          id="email"
          label="Email"
          value={form?.data?.email}
          errors={form?.errors?.email}
          disabled={loading}
        />

        <Input
          type="password"
          id="password"
          label="Password"
          errors={form?.errors?.password}
          disabled={loading}
        />

        <Input
          type="password"
          id="passwordConfirm"
          label="Confirm Password"
          errors={form?.errors?.passwordConfirm}
          disabled={loading}
        />

        <div class="w-full max-w-lg pt-5 m-auto pb-5">
          {#if !loading && !isClicked}
            <button
              type="submit"
              class="cursor-pointer py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem]"
            >
              <span>Register</span>
            </button>
          {:else}
            <button
              type="submit"
              disabled
              class="w-full rounded-full py-2.5 px-4 font-semibold text-[1rem]
             bg-gray-900 text-white dark:bg-white dark:text-gray-900
             opacity-60 cursor-not-allowed border border-gray-900/10 dark:border-white/10
             flex items-center justify-center gap-1.5"
            >
              <span class="loading loading-infinity"></span>
              <span>Signing Up</span>
            </button>
          {/if}
        </div>

        {#if showTurnstile}
          <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
        {/if}
        {#if form?.errors?.turnstile}
          <p class="text-center text-sm text-error pt-2">
            {form?.errors?.turnstile?.at(0)}
          </p>
        {/if}
      </form>

      <div class="divider text-gray-800 dark:text-zinc-300 py-6">
        <span class="text-[11px] uppercase tracking-[0.3em] z-10"
          >Or register using</span
        >
      </div>

      <OAuthButtons on:click={() => (oauthLoading = !oauthLoading)} />

      <p
        class="pb-1 text-sm w-full max-w-lg flex m-auto justify-center items-center text-gray-500 dark:text-zinc-400"
      >
        You already have an account?
        <a
          href="/login"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition ml-1"
          >Sign in</a
        >
      </p>

      <p
        class="pb-1 text-xs text-center pb-20 sm:pb-0 text-gray-800 dark:text-zinc-300"
      >
        By registering you agree to Stocknear's
        <a
          href="/terms-of-use"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
          >Terms of Use</a
        >
        and acknowledge that you've read our
        <a
          href="/privacy-policy"
          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
          >Privacy Policy</a
        >.
      </p>
    {:else}
      <p class="mt-2 text-center text-sm text-gray-500 dark:text-zinc-400">
        Logged in as {data?.user?.email}
      </p>
      <form class="cursor-pointer" action="/logout" method="POST">
        <button
          type="submit"
          aria-label="Logout"
          class="cursor-pointer mx-auto mt-2 flex w-full max-w-xs justify-center rounded-full
        bg-gray-900 text-white dark:bg-white dark:text-gray-900 border border-transparent px-4 py-2 text-sm font-semibold
        hover:bg-gray-800 dark:hover:bg-gray-200 transition-all focus:outline-none
        focus:ring-offset-0"
          >Log Out
        </button>
      </form>
    {/if}
  </div>
</div>

{#if oauthLoading}
  <div class="absolute right-1/2 left-1/2 top-1/2 bottom-1/2">
    <div class="relative">
      <label
        class="shadow-sm bg-white/90 dark:bg-zinc-900/80 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <span
          class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
        ></span>
      </label>
    </div>
  </div>
{/if}

<style>
  .shake-logo {
    animation-name: shake;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(0deg);
    }
    75% {
      transform: rotate(-10deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
