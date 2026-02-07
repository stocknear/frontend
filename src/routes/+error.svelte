<script>
  import { page } from "$app/stores";
  import SEO from "$lib/components/SEO.svelte";
  import {
  error_back_home,
  error_body_prefix,
  error_body_suffix,
  error_title,
} from "$lib/paraglide/messages";

  const emailAddress = "support@stocknear.com";
</script>

<SEO
  title="Page Not Found"
  description="The page you're looking for doesn't exist or has been moved."
  noindex={true}
/>

<section class="min-h-screen pt-6">
  <div class=" mt-10 m-auto overflow-hidden w-full max-w-4xl">
    <div class="lg:flex">
      <div class="mt-10 mb-5 m-auto">
        <h1 class=" text-center text-2xl sm:text-4xl font-bold mb-5">
          {error_title({ status: $page?.status })}
          <!--Server Maintenance-->
        </h1>
        <a href="/" class="flex justify-center items-center">
          <img
            class="w-20 m-auto inline-block"
            src="/pwa-192x192.png"
            alt="Logo"
          />
        </a>
        <!--
                <span class="mt-4  text-lg w-5/6 m-auto text-center flex justify-center items-center">
                    Sorry, our website is down for server maintenance. We will be back soon!
                </span>
                -->

        <div class="mt-4 text-md w-11/12 sm:w-full m-auto text-center">
          {error_body_prefix()}
          {" "}
          <a
            href={`mailto:${emailAddress}`}
            class="inline-block text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
            >{emailAddress}</a
          >.
          <br />
          {error_body_suffix()}
        </div>

        <a
          href="/"
          class="flex justify-center items-center w-1/2 m-auto py-2.5 mt-10 rounded-full duration-100 bg-black sm:hover:bg-muted text-white sm:hover:bg-blue-600 dark:bg-[#fff] dark:sm:hover:hover:bg-gray-300 dark:text-black font-semibold"
        >
          {error_back_home()}
        </a>
      </div>
    </div>
  </div>
</section>
