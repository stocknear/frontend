<script lang="ts">
  export let title: string;
  export let datePublished: string;
  export let dateModified: string;
  export let image: string | undefined;
  export let url: string;
</script>

{@html `<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    ${
      image
        ? `"image": [
      "${image}"
    ],`
        : ""
    }
    "datePublished": "${datePublished}",
    "dateModified": "${dateModified}",
    "author": [
      {
        "@type": "Person",
        "name": "Muslem Rahimi",
        "url": "https://stocknear.com/about"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Blog",
        "item": "https://stocknear.com/${url}"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${title}"
      }
    ]
  }
]
</script>`}
