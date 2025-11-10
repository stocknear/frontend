<script>
  import { page } from "$app/stores";
  //import { trackError,trackButtonClick } from '$lib/mixpanel';

  const emailAddress = "support@stocknear.com";
</script>

<section class="min-h-screen pt-6">
  <div class=" mt-10 m-auto overflow-hidden w-full max-w-4xl">
    <div class="lg:flex">
      <div class="mt-10 mb-5 m-auto">
        <h1 class=" text-center text-2xl sm:text-4xl font-bold mb-5">
          Page Not found - {$page?.status}
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
          The page was not found. If this error occurs persistenly please report
          it to us via
          <a
            href={`mailto:${emailAddress}`}
            class="inline-block text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
            >{emailAddress}</a
          >.
          <br />
          We will fix it asap!
        </div>

        <a
          href="/home"
          class="flex justify-center items-center w-1/2 m-auto py-2.5 mt-10 rounded duration-100 bg-black sm:hover:bg-muted text-white sm:hover:bg-blue-600 dark:bg-[#fff] dark:sm:hover:hover:bg-gray-300 dark:text-black font-semibold"
        >
          Back to Home Page
        </a>
      </div>
    </div>
  </div>
</section>
