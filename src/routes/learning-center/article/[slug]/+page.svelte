<script>
  import { getImageURL } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import {
    blog_alt_wallpaper,
    blog_last_updated,
  } from "$lib/paraglide/messages";
  import showdown from "showdown";
  import Pencil from "lucide-svelte/icons/pencil";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import Calendar from "lucide-svelte/icons/calendar";

  export let data;

  let article = data?.getArticle;
  $: isAdmin = data?.user?.admin === true;

  // Markdown to HTML converter
  const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    headerLevelStart: 2,
  });

  // Convert markdown to HTML, handling both markdown and existing HTML content
  function renderContent(content) {
    if (!content) return "";

    let html;
    // If content already contains HTML tags, return as-is
    if (
      /<[a-z][\s\S]*>/i.test(content) &&
      !content.startsWith("#") &&
      !content.startsWith("-") &&
      !content.startsWith("*")
    ) {
      html = content;
    } else {
      // Otherwise, convert markdown to HTML
      html = converter.makeHtml(content);
    }

    // Process images to apply saved widths from title attribute
    // Title format: "width:XXX|original title"
    if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("img").forEach((img) => {
        const title = img.getAttribute("title") || "";
        const widthMatch = title.match(/^width:(\d+)\|?/);
        if (widthMatch) {
          img.style.width = `${widthMatch[1]}px`;
          img.style.height = "auto";
          // Clean up title for display
          const cleanTitle = title.replace(/^width:\d+\|?/, "");
          if (cleanTitle) {
            img.setAttribute("title", cleanTitle);
          } else {
            img.removeAttribute("title");
          }
        }
      });
      return doc.body.innerHTML;
    }

    return html;
  }

  // Get tag colors
  function getTagColor(tag) {
    const colors = {
      Stocks:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      ETF: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      Options:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      Sentiment:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    };
    return (
      colors[tag] ||
      "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
    );
  }

  // Format date nicely
  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // Calculate reading time
  function getReadingTime(content) {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  $: {
    if (data?.getParams) {
      article = data?.getArticle;
    }
  }

  $: renderedDescription = renderContent(article?.description);
  $: readingTime = getReadingTime(article?.description);
</script>

<SEO
  title={article?.title}
  description={article?.abstract}
  keywords="stock market education, investment tutorial, {article?.title?.toLowerCase()}, learn investing, trading strategy, financial education, investment guide, stock analysis tutorial"
  image={article?.cover
    ? getImageURL(article?.collectionId, article?.id, article?.cover)
    : ""}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "EducationalArticle",
    headline: article?.title,
    description: article?.abstract,
    image: article?.cover
      ? getImageURL(article?.collectionId, article?.id, article?.cover)
      : "https://stocknear.com/pwa-512x512.png",
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/pwa-512x512.png",
      },
    },
    datePublished: article?.created,
    dateModified: article?.updated,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://stocknear.com/learning-center/article/${data?.getParams}`,
    },
    about: {
      "@type": "Thing",
      name: "Stock Market Education",
    },
    educationalLevel: "beginner",
    learningResourceType: "tutorial",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    wordCount:
      article?.description?.replace(/<[^>]*>/g, "")?.split(" ")?.length || 0,
  }}
/>

<div class="min-h-screen bg-white dark:bg-[#09090B]">
  <!-- Top Bar -->
  <div
    class="sticky top-0 z-40 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800"
  >
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <!-- Left: Back -->
        <a
          href="/learning-center"
          class="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft class="w-5 h-5" />
        </a>

        <!-- Right: Admin Edit -->
        {#if isAdmin && article?.id}
          <a
            href="/learning-center/editor/{article.id}"
            class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium transition"
          >
            <Pencil class="w-4 h-4" />
            Edit
          </a>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <article class="max-w-3xl mx-auto px-6 py-12">
    <!-- Cover Image -->
    {#if article?.cover}
      <div class="mb-10 -mx-6 sm:mx-0">
        <img
          src={getImageURL(article?.collectionId, article?.id, article?.cover)}
          alt={article?.title}
          class="w-full h-64 sm:h-80 object-cover sm:rounded-xl"
          loading="lazy"
        />
      </div>
    {/if}

    <!-- Title -->
    <h1
      class="text-4xl sm:text-5xl font-serif font-light text-gray-900 dark:text-white mb-4 leading-tight"
    >
      {article?.title}
    </h1>

    <!-- Subtitle/Abstract -->
    {#if article?.abstract}
      <p class="text-xl text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
        {article?.abstract}
      </p>
    {/if}

    <!-- Tags -->
    {#if article?.tags && article.tags.length > 0}
      <div class="flex flex-wrap items-center gap-2 mb-6">
        {#each article.tags as tag}
          <span
            class="px-3 py-1 rounded-full text-sm font-medium {getTagColor(
              tag,
            )}"
          >
            {tag}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Meta Info -->
    <div
      class="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-500 mb-8"
    >
      <div class="flex items-center gap-1.5">
        <Calendar class="w-4 h-4" />
        <span>{formatDate(article?.updated)}</span>
      </div>
      <span class="text-gray-300 dark:text-zinc-700">·</span>
      <span>{readingTime} min read</span>
    </div>

    <!-- Divider -->
    <div class="w-12 h-px bg-gray-200 dark:bg-zinc-700 mb-10"></div>

    <!-- Content -->
    <div class="article-content">
      {@html renderedDescription?.replace(
        "__VIDEO_SRC__",
        getImageURL(article?.collectionId, article?.id, article?.video),
      )}
    </div>

    <!-- Bottom Divider -->
    <div class="w-full h-px bg-gray-200 dark:bg-zinc-800 my-12"></div>

    <!-- Footer -->
    <div class="flex items-center justify-between">
      <a
        href="/learning-center"
        class="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
      >
        <ArrowLeft class="w-4 h-4" />
        <span class="text-sm font-medium">Back to Learning Center</span>
      </a>

      {#if isAdmin && article?.id}
        <a
          href="/learning-center/editor/{article.id}"
          class="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >
          <Pencil class="w-4 h-4" />
          <span class="text-sm font-medium">Edit Article</span>
        </a>
      {/if}
    </div>
  </article>
</div>

<style>
  /* Article Content Styles - Matching Editor */
  .article-content {
    font-size: 1.125rem;
    line-height: 1.8;
    color: #374151;
  }

  :global(.dark) .article-content {
    color: #d4d4d8;
  }

  .article-content :global(p) {
    margin: 0.75rem 0;
  }

  .article-content :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 2rem 0 1rem;
    color: #111827;
  }

  :global(.dark) .article-content :global(h1) {
    color: #ffffff;
  }

  .article-content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.75rem 0 0.75rem;
    color: #111827;
  }

  :global(.dark) .article-content :global(h2) {
    color: #ffffff;
  }

  .article-content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: #111827;
  }

  :global(.dark) .article-content :global(h3) {
    color: #ffffff;
  }

  .article-content :global(blockquote) {
    border-left: 3px solid #d1d5db;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark) .article-content :global(blockquote) {
    border-left-color: #52525b;
    color: #a1a1aa;
  }

  .article-content :global(code) {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  :global(.dark) .article-content :global(code) {
    background: #27272a;
  }

  .article-content :global(pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    overflow-x: auto;
    font-size: 0.9rem;
  }

  .article-content :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .article-content :global(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  .article-content :global(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  .article-content :global(li) {
    margin: 0.375rem 0;
  }

  .article-content :global(a) {
    color: #2563eb;
    text-decoration: underline;
  }

  :global(.dark) .article-content :global(a) {
    color: #60a5fa;
  }

  .article-content :global(a:hover) {
    color: #1d4ed8;
  }

  :global(.dark) .article-content :global(a:hover) {
    color: #93c5fd;
  }

  .article-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    display: block;
  }

  .article-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .article-content :global(th),
  .article-content :global(td) {
    border: 1px solid #e5e7eb;
    padding: 0.75rem;
    text-align: left;
  }

  :global(.dark) .article-content :global(th),
  :global(.dark) .article-content :global(td) {
    border-color: #3f3f46;
  }

  .article-content :global(th) {
    background: #f9fafb;
    font-weight: 600;
  }

  :global(.dark) .article-content :global(th) {
    background: #27272a;
  }

  .article-content :global(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2rem 0;
  }

  :global(.dark) .article-content :global(hr) {
    border-top-color: #3f3f46;
  }

  .article-content :global(strong) {
    font-weight: 600;
    color: #111827;
  }

  :global(.dark) .article-content :global(strong) {
    color: #ffffff;
  }

  .article-content :global(em) {
    font-style: italic;
  }
</style>
