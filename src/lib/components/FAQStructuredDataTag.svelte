<script lang="ts">
  export let faqs: {
    question: string;
    answer: string;
  }[];

  let mappedFaqs = faqs.map((faq, index) => {
    return `{
            "@type": "Question",
            "name": "${faq.question}",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "${faq.answer}"
            }
        }`;
  });
</script>

{@html `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${mappedFaqs}]
    }
</script>`}
