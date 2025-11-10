<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;
  let isUpdating = false;

  const submitUpdatePassword = () => {
    isUpdating = true;
    return async ({ result, update }) => {
      if (result.type === "success" && result.data?.success) {
        toast.success("Password updated!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      } else {
        toast.error("Invalid credentials", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
      await update();
      isUpdating = false;
    };
  };
</script>

<SEO title="Update Password" description="Update your account password" />

<section
  class="flex flex-col items-center min-h-screen w-full max-w-3xl m-auto px-3 sm:px-0 mt-10"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <form
            action="?/updatePassword"
            method="POST"
            use:enhance={submitUpdatePassword}
            class="flex flex-col space-y-2 w-full max-w-lg m-auto"
          >
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold mb-6 text-center">
              Reset Your Password
            </h1>

            <Input
              id="oldPassword"
              name="oldPassword"
              label="Old Password"
              type="password"
              required
              errors={form?.errors?.errorOldPassword}
            />
            <Input
              id="password"
              name="password"
              label="New Password"
              type="password"
              required
              errors={form?.errors?.errorPassword}
            />
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              label="Confirm New Password"
              type="password"
              required
              errors={form?.errors?.errorPasswordConfirm}
            />

            <div class="w-full max-w-lg pt-3">
              {#if !isUpdating}
                <button
                  type="submit"
                  class="cursor-pointer py-2.5 bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] border-none dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                >
                  <span>Update Password</span>
                </button>
              {:else}
                <label
                  class="cursor-not-allowed btn bg-black sm:hover:bg-default text-white dark:text-black dark:bg-[#fff] opacity-[0.5] border border-gray-600 dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto font-semibold text-[1rem]"
                >
                  <div class="flex flex-row m-auto items-center">
                    <span class="loading loading-infinity"></span>
                    <span class=" ml-1.5">Processing</span>
                  </div>
                </label>
              {/if}
            </div>
          </form>
        </main>
      </div>
    </div>
  </div>
</section>
