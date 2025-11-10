<script>
  import SEO from "$lib/components/SEO.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  const emailAddress = "support@stocknear.com";
</script>

<SEO
  title="Privacy Policy"
  description="Learn about how Stocknear protects your privacy and handles your data. Our comprehensive privacy policy outlines our commitment to data security and transparency."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Privacy Policy</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
          </div>

          <div class="w-full m-auto">
            <div class="">
              <p class="text-muted dark:text-gray-200 italic mb-2 text-sm">
                Last updated: 22.06.2023
              </p>

              <p class=" mb-10">
                Stocknear (the "website" or "site") is committed to protecting
                your privacy. This Privacy Policy explains the types of
                information we collect from you, how we use it, and the
                circumstances under which it may be shared. Please review this
                policy in its entirety along with our
                <a
                  href="/terms-of-use"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
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

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">Cookies</h2>

              <p class="mb-10">
                Our website utilizes cookies to enhance your browsing
                experience. By visiting stocknear.com, you consent to our use of
                cookies in accordance with our Privacy Policy. Cookies enable us
                to retrieve user information for each visit and improve the
                functionality of specific sections of our site.
              </p>
              <!--
              <br />

              <div id="fcConsentRevocation" class="mb-10">
                You can update your cookie preferences anytime here:
                <br />
                <button
                  class="py-2 px-3 rounded mt-3 bg-blue-500 cursor-pointer sm:hover:bg-blue-600 text-white"
                  on="googleFC.prompt(consent=googleFC, expireCache=true)"
                  >Privacy and cookie settings</button
                >
              </div>

              -->

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
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

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
                Security of Data
              </h2>

              <div class=" mb-10">
                We prioritize the security of your data; however, please be
                aware that no method of Internet transmission or electronic
                storage is entirely secure. While we employ commercially
                reasonable measures to safeguard your Personal Data, we cannot
                guarantee its absolute security.
              </div>

              <h2 class=" text-2xl sm:text-3xl font-bold mb-3">
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
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
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

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
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
                      class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                      >{emailAddress}</a
                    >.
                  </li>
                </ol>
                <br />
                Additionally, we honor Do Not Track signals. When a Do Not Track
                setting is enabled in your web browser, we do not track, plant cookies,
                or use advertising technologies.
              </div>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
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

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
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
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/donation"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Sponsor Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/contact"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Contact Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
