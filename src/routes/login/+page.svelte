<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import SEO from "$lib/components/SEO.svelte";
  import OAuthButtons from "$lib/components/OAuthButtons.svelte";

  export let form;
  export let data;

  let isClicked = false;
  let loading = false;
  let oauthLoading = false;

  const submitLogin = () => {
    loading = true;
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
          if (form?.notVerified) {
            toast.error("Please verify your email first", {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            await update();
            break;
          } else form?.notVerified === false;
          {
            toast.success("Login successfully!", {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            await update();
            break;
          }
        case "redirect":
          isClicked = true;
          toast.success("Login successfully!", {
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
      loading = false;
    };
  };
</script>

<SEO
  title="Log in to Stocknear"
  description="Log in to your Stocknear account using your email and password."
/>

<div
  class="text-gray-700 dark:text-zinc-200 relative w-full max-w-3xl mx-auto {data?.user
    ? 'min-h-[500px] sm:min-h-[900px]'
    : 'min-h-screen'} {oauthLoading ? 'opacity-[0.2]' : ''}"
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
        class="text-center text-2xl sm:text-3xl pt-5 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {!data?.user ? "Log in to your account" : "You are logged in"}
      </h1>
    </div>

    {#if !data?.user}
      <span class="text-sm text-gray-500 dark:text-zinc-400 text-center">
        Welcome back!
      </span>

      <div class="relative w-full max-w-lg m-auto">
        <form
          action="?/login"
          method="POST"
          use:enhance={submitLogin}
          class="flex flex-col items-center space-y-3 pt-4 pl-3 pr-3 sm:pl-0 sm:pr-0 ml-auto mr-auto"
        >
          <Input
            type="email"
            id="email"
            label="Email"
            value={form?.data?.email ?? ""}
            errors={form?.errors?.email}
          />
          <Input
            type="password"
            id="password"
            label="Password"
            errors={form?.errors?.password}
          />
          <div class="w-full max-w-lg">
            <a
              href="/reset-password"
              class="text-sm sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
              >Forgot Password?</a
            >
          </div>

          <div class="w-full max-w-lg pt-5 m-auto pb-5">
            {#if !loading && !isClicked}
              <button
                type="submit"
                class="cursor-pointer py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem]"
              >
                <span>Login</span>
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
        </form>

        <div class="divider text-gray-800 dark:text-zinc-300 py-6">
          <span class="text-[11px] uppercase tracking-[0.3em] z-10"
            >Or login using</span
          >
        </div>

        <OAuthButtons on:click={() => (oauthLoading = !oauthLoading)} />

        <p
          class="pb-1 text-sm w-full max-w-lg flex justify-center items-center text-gray-500 dark:text-zinc-400"
        >
          You don't have an account?
          <a
            href="/register"
            class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition ml-1"
            >Sign up</a
          >
        </p>
      </div>
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
