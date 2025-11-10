<script>
  import SEO from "$lib/components/SEO.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  const emailAddress = "support@stocknear.com";
</script>

<SEO title="Imprint" description="" />

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Imprint</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Imprint</h1>
          </div>

          <div class="w-full m-auto">
            <div class="">
              <p class=" italic mb-2">
                According to § 5 Telemediengesetz (TMG) ‍
              </p>

              <p class=" mb-5">
                Stocknear GmbH
                <br />
                Am Lohgraben 30
                <br />
                57074 Siegen
                <br />
                Email:
                <a
                  href={`mailto:${emailAddress}`}
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                  >{emailAddress}</a
                >.
                <br class="mb-3" />

                Managing Director (<span class="italic">Geschäftsführer</span>):
                Dr. rer. nat. Muslem Rahimi
                <br class="mb-3" />

                Registered in the commercial register at the local court at
                Siegen under: HRB 13800
                <br />
                VAT ID: DE366905061
              </p>

              <p class="mb-5">
                Responsible for the content according § 55 Abs. 2 RStV
                <br />
                Notice according to the Online Dispute Settlement Regulation
              </p>

              <p class="mb-5">
                Under applicable law, we are required to inform consumers of the
                existence of the European Online Dispute Resolution platform,
                which can be used to resolve disputes without having to go to
                court. The European Commission is responsible for setting up the
                platform. The European Online Dispute Resolution Platform can be
                found here:
                <a target="_blank" href="http://ec.europa.eu/odr"
                  >http://ec.europa.eu/odr.</a
                >
                <br />
                However, we would like to point out that we are not prepared to participate
                in the dispute resolution procedure within the framework of theEuropean
                Online Dispute Resolution Platform. To contact us, please use our
                above e-mail and phone number.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold mb-3">
                Notice in accordance with the Consumer Dispute Settlement Act
                (VSBG)
              </h2>

              <p class=" mb-5">
                We are not willing and obliged to participate in dispute
                resolution proceedings before a consumer arbitration board.
              </p>

              <h1 class=" text-2xl font-bold text-start mb-5">
                Disclaimer - legal notice
              </h1>
              <h1 class=" text-xl font-bold text-start mb-3 ml-2">
                § 1 Content warning
              </h1>

              <p class=" mb-3 ml-2">
                The free and freely accessible content of this website has been
                created with the greatest possible care, but the provider of
                this website does not guarantee the accuracy and timeliness of
                the free and freely accessible journalistic advice and news.
                Contributions identified by name reflect the opinion of the
                respective author and not always the opinion of the provider.
                Simply by calling up the free and freely accessible content, no
                contractual relationship is established between the user and the
                provider; in this respect, there is no intention on the part of
                the provider to be legally bound.
              </p>

              <h1 class=" text-xl font-bold text-start mb-3 ml-2">
                § 2 External Links
              </h1>
              <p class=" mb-3 ml-2">
                This website contains links to third-party websites ("external
                links"). These websites are subject to the liability of the
                respective operators. When the external links were first
                created, the provider checked the external content for any legal
                violations. At that time, no legal violations were apparent. The
                provider has no influence on the current and future design and
                content of the linked pages. The inclusion of external links
                does not imply that the provider adopts the content behind the
                reference or link as its own. A constant control of the external
                links is not reasonable for the provider without concrete
                evidence of violations. However, in the event of knowledge of
                legal violations, such external links will be deleted
                immediately.
              </p>

              <h1 class=" text-xl font-bold text-start mb-3 ml-2">
                § 3 Copyrights and ancillary copyrights
              </h1>
              <p class=" mb-3 ml-2">
                The content published on this website is subject to German
                copyright and ancillary copyright law. Any use not permitted by
                German copyright and ancillary copyright law requires the prior
                written consent of the provider or the respective copyright
                holder. This applies in particular to the copying, editing,
                translation, storage, processing or reproduction of content in
                databases or other electronic media and systems. Contents and
                rights of third parties are marked as such. The unauthorized
                reproduction or transmission of individual content or complete
                pages is not permitted and is punishable by law. Only the
                production of copies and downloads for personal, private and
                non-commercial use is permitted. The display of this website in
                external frames is only permitted with written permission.
              </p>

              <h1 class=" text-xl font-bold text-start mb-3 ml-2">
                § 4 Special conditions of use
              </h1>
              <p class=" mb-3 ml-2">
                Insofar as special conditions for individual uses of this
                website deviate from the aforementioned paragraphs, this will be
                expressly pointed out at the appropriate place. In this case,
                the special conditions of use shall apply in the respective
                individual case.
              </p>
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
