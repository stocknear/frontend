<script>
  import SEO from "$lib/components/SEO.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import { showCookiePreferences } from "$lib/store";
  import { Button } from "$lib/components/shadcn/button/index.ts";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  const emailAddress = "support@stocknear.com";

  function openCookiePreferences() {
    showCookiePreferences.set(true);
  }
</script>

<SEO
  title="Privacy Policy"
  description="Learn about how Stocknear protects your privacy and handles your data. Our comprehensive privacy policy outlines our commitment to data security and transparency."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >Home</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">Privacy Policy</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Privacy Policy
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <p class="italic mb-2 text-xs text-gray-800 dark:text-zinc-300">
                Last updated: 07.12.2025
              </p>

              <p class=" mb-10">
                Stocknear (the "website" or "site") is committed to protecting
                your privacy. This Privacy Policy explains the types of
                information we collect from you, how we use it, and the
                circumstances under which it may be shared. Please review this
                policy in its entirety along with our
                <a
                  href="/terms-of-use"
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >Terms of use</a
                >. Generally, you may use our website without providing personal
                data. When personal data (such as your name, address, or email
                address) is collected, it is done voluntarily. We will not share
                this data with third parties without your explicit consent.
                Please note that data transmission over the Internet (for
                example, via email) is not completely secure, and absolute
                protection against unauthorized access is not possible. The use
                of contact information provided in the imprint for sending
                unsolicited advertising or promotional material is strictly
                prohibited, and we reserve the right to pursue legal action in
                the event of such misuse.
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Cookies
              </h2>

              <p class="mb-4">
                Our website utilizes cookies to enhance your browsing
                experience. We categorize cookies into three types:
              </p>

              <ul class="list-disc ml-6 mb-4 space-y-2">
                <li>
                  <strong>Necessary Cookies:</strong> Essential for website functionality,
                  including authentication, security, and remembering your preferences.
                  These cannot be disabled.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how visitors
                  interact with our website to improve user experience.
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Used to track visitors across
                  websites for personalized advertising (Meta Pixel, Google Ads).
                </li>
              </ul>

              <p class="mb-4">
                You can manage your cookie preferences at any time. Click the
                button below to update your settings:
              </p>

              <div class="mb-10">
                <Button
                  on:click={openCookiePreferences}
                  class="flex-shrink-0 w-fit border border-gray-300 shadow dark:border-zinc-700 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 ease-out flex flex-row justify-between items-center px-4 py-2 rounded-full truncate"
                >
                  Manage Cookie Preferences
                </Button>
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Links to Other Sites
              </h2>

              <div class=" mb-10">
                Our Service may include links to third-party websites that are
                not under our control. When you click on a third-party link, you
                will be directed to their site. We strongly encourage you to
                review the Privacy Policies of any website you visit. We assume
                no responsibility for the content, privacy practices, or
                policies of these external sites.
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Security of Data
              </h2>

              <div class=" mb-10">
                We prioritize the security of your data; however, please be
                aware that no method of Internet transmission or electronic
                storage is entirely secure. While we employ commercially
                reasonable measures to safeguard your Personal Data, we cannot
                guarantee its absolute security.
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Your Data Protection Rights Under General Data Protection
                Regulation (GDPR)
              </h2>

              <div class=" mb-10">
                If you reside in the European Union (EU) or the European
                Economic Area (EEA), you have specific data protection rights
                under the GDPR. We strive to enable you to review, correct,
                update, or delete your Personal Data as needed.<br /><br />
                If you would like to know what Personal Data we hold about you or
                wish to have it removed from our systems, please contact us at
                <a
                  href={`mailto:${emailAddress}`}
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >{emailAddress}</a
                >.<br /><br />
                In addition, you have the following rights:
                <ol class="list-decimal ml-8 mt-2">
                  <li>
                    The right to access, update, or delete the information we
                    have on you;
                  </li>
                  <li>
                    The right to rectification – to have inaccurate or
                    incomplete information corrected;
                  </li>
                  <li>
                    The right to object to our processing of your Personal Data;
                  </li>
                  <li>
                    The right to request a restriction on the processing of your
                    Personal Data;
                  </li>
                  <li>
                    The right to data portability – to receive your Personal
                    Data in a structured, machine-readable format;
                  </li>
                  <li>
                    The right to withdraw consent at any time when processing is
                    based on your consent.
                  </li>
                </ol>
                <br />
                We may require you to verify your identity before processing your
                request. Please note that providing certain essential information
                may be necessary to continue providing our Service.<br /><br />
                You also have the right to lodge a complaint with a Data Protection
                Authority regarding our handling of your Personal Data. For further
                details, please contact the relevant authority in your region.
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Your Data Protection Rights under the California Privacy
                Protection Act (CalOPPA)
              </h2>

              <div class=" mb-10">
                CalOPPA is the first state law in the United States requiring
                commercial websites and online services to post a privacy
                policy. This law applies to any entity collecting personally
                identifiable information from California residents and mandates
                clear disclosure of what information is collected, how it is
                shared, and adherence to the policy.<br /><br />
                In accordance with CalOPPA, we commit to the following:
                <ol class="list-decimal ml-8 mt-2">
                  <li>Users can visit our site anonymously;</li>
                  <li>
                    Our Privacy Policy link, clearly labeled with the word
                    "Privacy," is easily accessible at the bottom of our
                    website;
                  </li>
                  <li>
                    Users will be informed of any changes to our Privacy Policy
                    via the dedicated Privacy Policy page;
                  </li>
                  <li>
                    Users may update their personal information by contacting us
                    at
                    <a
                      href={`mailto:${emailAddress}`}
                      class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                      >{emailAddress}</a
                    >.
                  </li>
                </ol>
                <br />
                Additionally, we honor Do Not Track signals. When a Do Not Track
                setting is enabled in your web browser, we do not track, plant cookies,
                or use advertising technologies.
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Children's Privacy
              </h2>

              <div class=" mb-10">
                Our Services are not intended for children under the age of 18.
                We do not knowingly collect personally identifiable information
                from individuals under 18. If you become aware that a child has
                provided us with Personal Data, please contact us immediately.
                If it is determined that Personal Data from a child has been
                collected without parental consent, we will take steps to remove
                that information from our servers.
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Changes to this Privacy Policy
              </h2>

              <div class=" mb-10">
                We reserve the right to modify this Privacy Policy at any time.
                Any changes will be communicated by posting the updated policy
                on this page. We recommend that you review this Privacy Policy
                regularly to stay informed of any updates. Changes become
                effective immediately upon posting.
              </div>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/donation"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Sponsor Us
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/contact"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Contact Us
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
