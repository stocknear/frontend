<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { sectorNavigation } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_profile_address,
  stock_detail_profile_ceo,
  stock_detail_profile_cik_code,
  stock_detail_profile_col_date,
  stock_detail_profile_col_name,
  stock_detail_profile_col_position,
  stock_detail_profile_col_title,
  stock_detail_profile_col_type,
  stock_detail_profile_company_description,
  stock_detail_profile_contact_details,
  stock_detail_profile_country,
  stock_detail_profile_cusip_number,
  stock_detail_profile_employees,
  stock_detail_profile_employer_id,
  stock_detail_profile_exchange,
  stock_detail_profile_fiscal_year,
  stock_detail_profile_industry,
  stock_detail_profile_ipo_date,
  stock_detail_profile_isin_number,
  stock_detail_profile_key_executives,
  stock_detail_profile_no_address,
  stock_detail_profile_no_city,
  stock_detail_profile_no_description,
  stock_detail_profile_no_executives,
  stock_detail_profile_no_filings,
  stock_detail_profile_reporting_currency,
  stock_detail_profile_sec_filings,
  stock_detail_profile_sector,
  stock_detail_profile_seo_description,
  stock_detail_profile_seo_keywords,
  stock_detail_profile_seo_title,
  stock_detail_profile_sic_code,
  stock_detail_profile_stock_details,
  stock_detail_profile_ticker_symbol,
  stock_detail_profile_view_all_filings,
  stock_detail_profile_website,
} from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getData;

  function getIndustryHref(industryName) {
    // Replace spaces with hyphens
    let formattedName = industryName?.replace(/ /g, "-");
    // Replace "&" with "and"
    formattedName = formattedName?.replace(/&/g, "and");
    // Remove any extra hyphens (e.g., from consecutive spaces)
    formattedName = formattedName?.replace(/-{2,}/g, "-");
    // Convert to lowercase for consistency
    return "/list/industry/" + formattedName?.toLowerCase();
  }

  function textToParagraphs(text) {
    // Split the text into sentences
    const sentences = text.split(
      /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.)\s+(?=[A-Z])/,
    );

    // Wrap sentences in paragraphs
    const paragraphs = sentences.map(
      (sentence) => `<p class="mb-5">${sentence.trim()}</p>`,
    );

    // Wrap paragraphs in a div with additional classes
    return `<div class="mb-5 md:text-lg [&>p]:mb-5">
${paragraphs.join("\n")}
</div>`;
  }

  $: formattedText = textToParagraphs(
    rawData?.description || stock_detail_profile_no_description(),
  );
</script>

<SEO
  title={stock_detail_profile_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_profile_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_profile_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["Organization", "Corporation", "WebPage"],
    name: $displayCompanyName,
    alternateName: $stockTicker,
    tickerSymbol: $stockTicker,
    description: `Company profile and business overview for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/profile`,
    logo: `https://stocknear.com/logo/${$stockTicker}.png`,
    foundingDate: rawData?.ipoDate || undefined,
    numberOfEmployees: rawData?.fullTimeEmployees || undefined,
    industry: rawData?.industry || undefined,
    sector: rawData?.sector || undefined,
    address: rawData?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: rawData.address,
          addressLocality: rawData?.city,
          addressRegion: rawData?.state,
          postalCode: rawData?.zip,
          addressCountry: rawData?.country,
        }
      : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: rawData?.phone,
      contactType: "customer service",
      url: rawData?.website,
    },
    sameAs: [
      rawData?.website,
      `https://stocknear.com/stocks/${$stockTicker}`,
    ].filter(Boolean),
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Company Profile",
          item: `https://stocknear.com/stocks/${$stockTicker}/profile`,
        },
      ],
    },
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div
        class="relative flex flex-row justify-center items-start overflow-hidden w-full"
      >
        <div class="sm:p-7 w-full mt-2 sm:mt-0">
          <div class="lg:float-left lg:w-[calc(100%-336px-20px)]">
            <h1 class="text-xl sm:text-2xl font-bold mb-4 w-full">
              {stock_detail_profile_company_description()}
            </h1>
            {@html formattedText}
          </div>
          <div class="lg:-mr-6 shrink-0 lg:float-right lg:w-[336px]">
            <div
              class="mt-7 rounded border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-3 pb-2 pt-3 xs:px-4 xs:pt-4 lg:mt-1"
            >
              <div class="text-center text-2xl font-semibold">
                {$displayCompanyName}
              </div>
              <div class="mb-0">
                <img
                  src={`https://financialmodelingprep.com/image-stock/${$stockTicker?.toUpperCase()}.png`}
                  alt={`${$displayCompanyName} logo`}
                  class="mx-auto py-0.5 w-28 h-28 mt-5 mb-5"
                />
              </div>
              <table class="w-full">
                <tbody
                  ><tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_country()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.country
                        ? rawData?.country?.replace("US", "United States")
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_ipo_date()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.ipoDate !== null &&
                      rawData?.ipoDate?.length > 0
                        ? new Date(rawData?.ipoDate)?.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            daySuffix: "2-digit",
                          })
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_industry()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      ><a
                        href={rawData?.industry
                          ? getIndustryHref(rawData?.industry)
                          : "#"}
                        class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition underline underline-offset-4"
                        >{rawData?.industry ?? "n/a"}</a
                      ></td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_sector()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2">
                      <a
                        href={sectorNavigation?.find(
                          (item) => item?.title === rawData?.sector,
                        )?.link}
                        class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition underline underline-offset-4"
                        >{rawData?.sector ? rawData?.sector : "n/a"}</a
                      ></td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_employees()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      ><a
                        class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition underline underline-offset-4"
                        href={`/stocks/${$stockTicker}/profile/employees`}
                        >{rawData?.fullTimeEmployees
                          ? new Intl.NumberFormat("en")?.format(
                              rawData?.fullTimeEmployees,
                            )
                          : "n/a"}</a
                      ></td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_ceo()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.ceo || "n/a"}</td
                    ></tr
                  ></tbody
                >
              </table>
            </div>

            <h2 class="mt-6 xs:mt-8 font-bold text-2xl mb-2">
              {stock_detail_profile_contact_details()}
            </h2>
            <div
              class="rounded border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-4 pb-2 pt-4"
            >
              <table class="w-full">
                <tbody
                  ><tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td colspan="2" class="pb-3"
                      ><div class="mb-2 text-lg font-bold">{stock_detail_profile_address()}</div>
                      <div>
                        {rawData?.address
                          ? rawData?.address
                          : stock_detail_profile_no_address()}<br />{rawData?.city
                          ? rawData?.city
                          : stock_detail_profile_no_city()}, {rawData?.state ?? ""}<br
                        />{rawData?.country?.replace("US", "United States") ??
                          ""}
                      </div></td
                    ></tr
                  >

                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-0.5 py-2 font-semibold">{stock_detail_profile_website()}</td>
                    <td class="px-0.5 py-2 text-right">
                      <a
                        href={rawData?.website}
                        class="truncate text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        target="_blank">{rawData?.website ?? "n/a"}</a
                      ></td
                    ></tr
                  ></tbody
                >
              </table>
            </div>
            <h2 class="mt-6 xs:mt-8 font-bold text-2xl mb-2">{stock_detail_profile_stock_details()}</h2>
            <div
              class="rounded border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-2 pb-2 pt-2 xs:px-4 xs:pt-2.5"
            >
              <table class="w-full">
                <tbody
                  ><tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_ticker_symbol()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{$stockTicker?.toUpperCase() ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_exchange()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.exchange ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_fiscal_year()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.fiscalYearRange ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_reporting_currency()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.currency ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_cik_code()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.cik ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_cusip_number()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.cusip ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_isin_number()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.isin ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2"
                      >{stock_detail_profile_employer_id()}</td
                    >
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.taxIdentificationNumber ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-0"
                    ><td class="px-1 py-1.5 font-semibold lg:py-2">{stock_detail_profile_sic_code()}</td>
                    <td class="px-1 py-1.5 text-right lg:py-2"
                      >{rawData?.sicCode ?? "n/a"}</td
                    ></tr
                  ></tbody
                >
              </table>
            </div>
          </div>

          <div class=" mb-2 lg:float-left lg:w-[calc(100%-336px-40px)]">
            <h2 class="mt-6 lg:mt-4 text-xl sm:text-2xl font-bold mb-5">
              {stock_detail_profile_key_executives()}
            </h2>
            {#if rawData?.executives?.length > 0}
              <table class="mb-6 w-full xs:mb-8">
                <thead
                  class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  ><tr class="border-y border-gray-300 dark:border-zinc-700"
                    ><th
                      class="px-2 py-2.5 text-left font-semibold xs:px-3 xs:py-3 sm:px-4"
                      >{stock_detail_profile_col_name()}</th
                    >
                    <th
                      class="px-2 py-2.5 text-left font-semibold xs:px-3 xs:py-3 sm:px-4"
                      >{stock_detail_profile_col_position()}</th
                    ></tr
                  ></thead
                >
                <tbody>
                  {#each rawData?.executives as item}
                    <tr
                      class="border-b border-gray-300 dark:border-zinc-700 text-sm"
                      ><td
                        class="px-2 py-2.5 align-top font-semibold xs:px-3 xs:py-3 sm:px-4"
                        >{item?.name}</td
                      >
                      <td class="px-2 py-2.5 align-top xs:px-3 xs:py-3 sm:px-4"
                        >{item?.position}</td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              {stock_detail_profile_no_executives()}
            {/if}
            <h2 class="mt-10 text-xl sm:text-2xl font-bold mb-5">
              {stock_detail_profile_sec_filings()}
            </h2>
            {#if rawData?.filings?.length > 0}
              <table class="w-full">
                <thead
                  class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  ><tr class="border-y border-gray-300 dark:border-zinc-700"
                    ><th
                      class="px-2 py-2.5 text-left font-semibold xs:px-3 xs:py-3 sm:px-4"
                      >{stock_detail_profile_col_date()}</th
                    >
                    <th
                      class="px-2 py-2.5 text-left font-semibold xs:px-3 xs:py-3 sm:px-4"
                      >{stock_detail_profile_col_type()}</th
                    >
                    <th
                      class="px-2 py-2.5 text-left font-semibold xs:px-3 xs:py-3 sm:px-4"
                      >{stock_detail_profile_col_title()}</th
                    ></tr
                  ></thead
                >

                <tbody>
                  {#each rawData?.filings as item}
                    <tr
                      class="border-b border-gray-300 dark:border-zinc-700 text-sm"
                      ><td
                        class="px-2 py-2.5 align-top font-semibold xs:px-3 xs:py-3 sm:px-4"
                        >{item?.date}</td
                      >
                      <td
                        class="px-2 py-2.5 align-top font-semibold xs:px-3 xs:py-3 sm:px-4"
                        >{item?.type}</td
                      >
                      <td
                        class="px-2 py-2.5 align-top font-semibold xs:px-3 xs:py-3 sm:px-4"
                        ><a
                          class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition sm:hover:underline sm:hover:underline-offset-4"
                          href={item?.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          >{item?.title?.length > 50
                            ? item?.title?.slice(0, 50) + "..."
                            : item?.title}</a
                        ></td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              {stock_detail_profile_no_filings()}
            {/if}
            <div
              class="border-b border-gray-300 dark:border-zinc-700 py-3 text-lg sm:text-xl font-semibold"
            >
              <a
                class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition sm:hover:underline sm:hover:underline-offset-4"
                href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${rawData?.cik}&amp;count=100`}
                target="_blank"
                rel="noopener noreferrer">{stock_detail_profile_view_all_filings()}</a
              >
            </div>
          </div>
          <div class="clear-both min-h-5"></div>
        </div>
      </div>
    </div>
  </div>
</section>
