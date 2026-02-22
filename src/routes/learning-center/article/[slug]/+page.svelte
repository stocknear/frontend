<script>
  import { getImageURL, convertToSlug } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import showdown from "showdown";
  import katex from "katex";
  import "katex/dist/katex.min.css";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import Calendar from "lucide-svelte/icons/calendar";
  import Link2 from "lucide-svelte/icons/link-2";
  import Check from "lucide-svelte/icons/check";
  import X from "lucide-svelte/icons/x";
  import Clock from "lucide-svelte/icons/clock";
  import { toast } from "svelte-sonner";
  import { browser } from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import {
    learning_center_table_of_contents,
    learning_center_share_this_post,
    learning_center_back_to_all_posts,
    learning_center_min_read,
    learning_center_quick_start,
    learning_center_sidebar_top_gainers,
    learning_center_sidebar_top_losers,
    learning_center_sidebar_analysts,
    learning_center_sidebar_stock_screener,
    learning_center_sidebar_options_flow,
    learning_center_sidebar_earnings_calendar,
    learning_center_sidebar_dividends_calendar,
    learning_center_sidebar_ipo_calendar,
    learning_center_related_articles,
    learning_center_view_all_articles,
    learning_center_share_this_article,
    learning_center_link_copied,
    learning_center_link_copy_failed,
    learning_center_sign_in_to_read,
    learning_center_briefing_description,
    learning_center_create_free_account,
    learning_center_sign_in,
    learning_center_click_to_close,
  } from "$lib/paraglide/messages";

  export let data;

  // Table of Contents
  let tableOfContents = [];
  let activeSection = "";
  let readingProgress = 0;

  // Share state
  let linkCopied = false;

  // Lightbox state
  let lightboxOpen = false;
  let lightboxImageSrc = "";
  let lightboxImageAlt = "";

  let article = data?.getArticle;
  let relatedArticles = data?.getRelatedArticles || [];
  $: isDailyLocked = article?.category === "Daily" && !data?.user;

  // Build back URL based on article category
  $: backUrl =
    article?.category &&
    article.category !== "all" &&
    article.category !== "Daily"
      ? `/learning-center?category=${encodeURIComponent(article.category)}`
      : "/learning-center";

  // Markdown to HTML converter
  const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    headerLevelStart: 2,
  });

  const mathDelimitersRegex =
    /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/;
  const skipMathTags = new Set(["script", "style", "code", "pre", "textarea"]);

  function normalizeMathEscapes(text) {
    const value = text || "";
    // Convert doubly-escaped delimiters/control sequences to single escapes.
    return value
      .replace(/\\{2,}(?=[\[\]\(\)])/g, "\\")
      .replace(/\\{2,}(?=[A-Za-z])/g, "\\");
  }

  function renderLatexInHtml(html) {
    if (!html || typeof katex?.renderToString !== "function") return html;

    const renderExpr = (expr, displayMode, rawMatch) => {
      try {
        const normalizedExpr = normalizeMathEscapes(expr || "");
        return `<span class="${displayMode ? "katex-display-wrap" : "katex-inline-wrap"}">${katex.renderToString(
          normalizedExpr,
          {
            displayMode,
            throwOnError: false,
            strict: "ignore",
          },
        )}</span>`;
      } catch {
        return rawMatch;
      }
    };

    let out = html;
    // Block: \[ ... \] and \\[ ... \\]
    out = out.replace(/\\{1,2}\[([\s\S]+?)\\{1,2}\]/g, (m, expr) =>
      renderExpr(expr, true, m),
    );
    // Block: $$ ... $$
    out = out.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) =>
      renderExpr(expr, true, m),
    );
    // Inline: \( ... \) and \\( ... \\)
    out = out.replace(/\\{1,2}\(([\s\S]+?)\\{1,2}\)/g, (m, expr) =>
      renderExpr(expr, false, m),
    );
    return out;
  }

  function parseMathSegments(text) {
    const normalizedText = normalizeMathEscapes(text);
    const mathTokenRegex =
      /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
    const segments = [];
    let cursor = 0;
    let match;
    while ((match = mathTokenRegex.exec(normalizedText)) !== null) {
      if (match.index > cursor) {
        segments.push({
          type: "text",
          value: normalizedText.slice(cursor, match.index),
        });
      }
      const expr = (match[1] ?? match[2] ?? match[3] ?? "").trim();
      const displayMode = match[1] != null || match[2] != null;
      segments.push({
        type: "math",
        value: expr,
        raw: match[0],
        displayMode,
      });
      cursor = mathTokenRegex.lastIndex;
    }
    if (cursor < normalizedText.length) {
      segments.push({ type: "text", value: normalizedText.slice(cursor) });
    }
    return segments;
  }

  function renderMathInDocument(doc) {
    if (
      typeof window === "undefined" ||
      typeof NodeFilter === "undefined" ||
      !doc?.body
    ) {
      return;
    }

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      const value = currentNode.nodeValue || "";
      const normalizedValue = normalizeMathEscapes(value);
      const parentTag = currentNode.parentElement?.tagName?.toLowerCase() || "";
      if (
        normalizedValue &&
        mathDelimitersRegex.test(normalizedValue) &&
        !skipMathTags.has(parentTag)
      ) {
        textNodes.push(currentNode);
      }
      currentNode = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const textValue = textNode.nodeValue || "";
      const segments = parseMathSegments(textValue);
      if (!segments.some((s) => s.type === "math")) continue;

      const fragment = doc.createDocumentFragment();
      for (const segment of segments) {
        if (segment.type === "text") {
          fragment.appendChild(doc.createTextNode(segment.value));
          continue;
        }

        const wrapper = doc.createElement("span");
        wrapper.className = segment.displayMode
          ? "katex-display-wrap"
          : "katex-inline-wrap";
        try {
          wrapper.innerHTML = katex.renderToString(segment.value, {
            displayMode: segment.displayMode,
            throwOnError: false,
            strict: "ignore",
          });
        } catch {
          wrapper.textContent = segment.raw;
        }
        fragment.appendChild(wrapper);
      }

      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }

  // Transform PocketBase image URLs to use getImageURL for proper environment handling
  function transformPocketBaseUrls(html) {
    // Match PocketBase URLs: http://localhost:8090/api/files/collectionId/recordId/fileName
    // or any domain with /api/files/ pattern
    const pbUrlPattern =
      /(?:https?:\/\/[^\/]+)?\/api\/files\/([^\/]+)\/([^\/]+)\/([^\s"'?]+)/g;

    return html.replace(
      pbUrlPattern,
      (match, collectionId, recordId, fileName) => {
        return getImageURL(collectionId, recordId, fileName);
      },
    );
  }

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
      // Also convert any markdown images that might be mixed in with HTML
      // Pattern: ![alt text](url) or ![alt text](url "title")
      html = html.replace(
        /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
        (match, alt, src, title) => {
          const titleAttr = title ? ` title="${title}"` : "";
          return `<img src="${src}" alt="${alt}"${titleAttr} />`;
        },
      );
    } else {
      // Otherwise, convert markdown to HTML
      html = converter.makeHtml(content);
    }

    // Remove [IMAGE: ...] placeholder text (used in content templates)
    // Also handles escaped brackets \[IMAGE:...\]
    html = html.replace(/\\?\[IMAGE:[^\]]*\\?\]/g, "");

    // Transform all PocketBase URLs to use proper environment URL
    html = transformPocketBaseUrls(html);
    // Render LaTeX math blocks/inline before DOM parsing.
    html = renderLatexInHtml(html);

    // Process images to apply saved widths from title attribute
    // Title format: "width:XXX|original title"
    if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      renderMathInDocument(doc);
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

  $: {
    if (data?.getParams) {
      article = data?.getArticle;
      relatedArticles = data?.getRelatedArticles || [];
    }
  }

  $: readingTime = article?.time || 5;

  // Extract FAQ pairs from article HTML for structured data
  function extractFAQSchema(html) {
    if (!html) return null;
    const parts = html.split(
      /(<h2[^>]*>)\s*Frequently Asked Questions\s*<\/h2>/i,
    );
    if (parts.length < 3) return null;
    const faqHtml = parts.slice(2).join("");
    const questions = [];
    // Match h3 followed by one or more p tags as the answer
    const regex = /<h3[^>]*>([^<]+)<\/h3>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/gi;
    let match;
    while ((match = regex.exec(faqHtml)) !== null) {
      const answerText = match[2].replace(/<[^>]+>/g, "").trim();
      if (answerText) {
        questions.push({
          "@type": "Question",
          name: match[1].trim(),
          acceptedAnswer: {
            "@type": "Answer",
            text: answerText,
          },
        });
      }
    }
    if (questions.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions,
    };
  }

  // Build BreadcrumbList schema
  function buildBreadcrumbSchema(articleData) {
    if (!articleData) return null;
    return {
      "@context": "https://schema.org",
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
          name: "Learning Center",
          item: "https://stocknear.com/learning-center",
        },
        ...(articleData.category
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: articleData.category,
                item: `https://stocknear.com/learning-center?category=${encodeURIComponent(articleData.category)}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: articleData.title,
                item: `https://stocknear.com/learning-center/article/${data?.getParams}`,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 3,
                name: articleData.title,
                item: `https://stocknear.com/learning-center/article/${data?.getParams}`,
              },
            ]),
      ],
    };
  }

  // Format ISO date properly with T separator
  function toISO(dateStr) {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // Extract TOC and add IDs to H2 headers in one pass (works with HTML string)
  function processContentWithTOC(html) {
    if (!html) return { html: "", toc: [] };

    const toc = [];
    let index = 0;

    // Use regex to find and replace H2 tags, adding IDs
    const processedHtml = html.replace(
      /<h2([^>]*)>([^<]*)<\/h2>/gi,
      (match, attrs, text) => {
        const trimmedText = text.trim();
        // Skip FAQ section header
        if (trimmedText.toLowerCase() === "frequently asked questions") {
          return match;
        }
        const id = `section-${index}`;
        toc.push({ id, text: trimmedText });
        index++;
        return `<h2${attrs} id="${id}">${text}</h2>`;
      },
    );

    return { html: processedHtml, toc };
  }

  $: renderedDescription = renderContent(article?.description);
  $: ({ html: processedDescription, toc: tableOfContents } =
    processContentWithTOC(renderedDescription));
  $: if (tableOfContents.length > 0 && !activeSection) {
    activeSection = tableOfContents[0].id;
  }

  // Scroll to section
  function scrollToSection(id) {
    if (!browser) return;
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }

  // Track active section and reading progress on scroll (throttled)
  let scrollTimeout;
  function handleScroll() {
    if (!browser) return;

    // Calculate reading progress - 100% when reaching related articles section
    const articleContent = document.querySelector(".article-content");
    if (articleContent) {
      const scrollY = window.scrollY;
      const articleEnd = articleContent.offsetTop + articleContent.offsetHeight;
      const startPoint = 0;
      const endPoint = articleEnd - window.innerHeight * 0.5;

      if (endPoint > startPoint) {
        readingProgress = Math.min(
          100,
          Math.max(0, (scrollY / endPoint) * 100),
        );
      } else {
        readingProgress = 100;
      }
    } else {
      readingProgress = 0;
    }

    if (tableOfContents.length === 0) return;

    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;

      const scrollPosition = window.scrollY + 140;

      for (let i = tableOfContents.length - 1; i >= 0; i--) {
        const section = document.getElementById(tableOfContents[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          activeSection = tableOfContents[i].id;
          return;
        }
      }

      activeSection = tableOfContents[0]?.id || "";
    }, 50);
  }

  // Get the full article URL
  function getArticleUrl() {
    if (browser) {
      return window.location.href;
    }
    return `https://stocknear.com/learning-center/article/${data?.getParams}`;
  }

  // Share functions
  function shareOnTwitter() {
    const url = getArticleUrl();
    const text = article?.title || "Check out this article";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420",
    );
    showShareDropdown = false;
  }

  function shareOnReddit() {
    const url = getArticleUrl();
    const title = article?.title || "Check out this article";
    window.open(
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      "_blank",
      "width=550,height=420",
    );
    showShareDropdown = false;
  }

  function shareOnLinkedIn() {
    const url = getArticleUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420",
    );
    showShareDropdown = false;
  }

  function shareOnFacebook() {
    const url = getArticleUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420",
    );
    showShareDropdown = false;
  }

  async function copyLink() {
    const url = getArticleUrl();
    try {
      await navigator.clipboard.writeText(url);
      linkCopied = true;
      toast.success(learning_center_link_copied());
      setTimeout(() => {
        linkCopied = false;
        showShareDropdown = false;
      }, 1500);
    } catch (err) {
      toast.error(learning_center_link_copy_failed());
    }
  }

  // Lightbox functions
  function openLightbox(src, alt) {
    lightboxImageSrc = src;
    lightboxImageAlt = alt || "Article image";
    lightboxOpen = true;
    // Prevent body scroll when lightbox is open
    if (browser) {
      document.body.style.overflow = "hidden";
    }
  }

  function closeLightbox() {
    lightboxOpen = false;
    lightboxImageSrc = "";
    lightboxImageAlt = "";
    // Restore body scroll
    if (browser) {
      document.body.style.overflow = "";
    }
  }

  // Handle escape key to close lightbox
  function handleKeydown(event) {
    if (event.key === "Escape" && lightboxOpen) {
      closeLightbox();
    }
  }

  // Handle clicks on images in article content
  function handleArticleClick(event) {
    const target = event.target;
    if (target.tagName === "IMG" && target.closest(".article-content")) {
      event.preventDefault();
      openLightbox(target.src, target.alt);
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener("keydown", handleKeydown);
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("scroll", handleScroll);
      // Ensure scroll is restored if component unmounts while lightbox open
      document.body.style.overflow = "";
    }
  });
</script>

<SEO
  title={article?.title}
  description={article?.abstract}
  type="article"
  twitterCard="summary_large_image"
  article={{
    publishedTime: toISO(article?.created),
    modifiedTime: toISO(article?.updated),
    section: article?.category || "Features",
    tags: article?.tags || [],
  }}
  keywords="stock market education, investment tutorial, {article?.title?.toLowerCase()}, learn investing, trading strategy, financial education, investment guide, stock analysis tutorial"
  image={article?.cover
    ? getImageURL(article?.collectionId, article?.id, article?.cover)
    : article?.category === "Daily"
      ? "/img/premarket-news-cover.webp"
      : ""}
  structuredData={[
    {
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
      datePublished: toISO(article?.created),
      dateModified: toISO(article?.updated),
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
    },
    extractFAQSchema(article?.description),
    buildBreadcrumbSchema(article),
  ]}
/>

<!-- Reading Progress Bar -->
<div class="fixed top-0 left-0 w-full h-1 z-50">
  <div
    class="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-150 ease-out"
    style="width: {readingProgress}%"
  ></div>
</div>

<div class="min-h-screen bg-white dark:bg-[#09090B]">
  <!-- Main Layout Grid -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div class="lg:grid lg:grid-cols-12 lg:gap-12">
      <!-- Left Sidebar (Desktop Only) -->
      <aside class="hidden lg:block lg:col-span-3">
        <div class="sticky top-28">
          <nav class="space-y-6">
            <!-- Table of Contents -->
            {#if tableOfContents.length > 0}
              <div>
                <h4
                  class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4"
                >
                  {learning_center_table_of_contents()}
                </h4>
                <ul
                  class="space-y-2.5 text-sm border-l border-gray-200 dark:border-zinc-800 pl-4"
                >
                  {#each tableOfContents as item}
                    <li>
                      <button
                        type="button"
                        on:click={() => scrollToSection(item.id)}
                        class="cursor-pointer block w-full text-left leading-relaxed transition-colors duration-150 {activeSection ===
                        item.id
                          ? 'text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                      >
                        {item.text}
                      </button>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Share This Post -->
            <div class="pt-6 border-t border-gray-200 dark:border-zinc-800">
              <h4
                class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4"
              >
                {learning_center_share_this_post()}
              </h4>
              <div class="flex items-center gap-2">
                <!-- Twitter/X -->
                <button
                  type="button"
                  on:click={shareOnTwitter}
                  class="cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
                  title="Share on Twitter"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                </button>

                <!-- Facebook -->
                <button
                  type="button"
                  on:click={shareOnFacebook}
                  class="cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-[#1877F2] transition"
                  title="Share on Facebook"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </button>

                <!-- LinkedIn -->
                <button
                  type="button"
                  on:click={shareOnLinkedIn}
                  class="cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-[#0A66C2] transition"
                  title="Share on LinkedIn"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                    />
                  </svg>
                </button>

                <!-- Copy Link -->
                <button
                  type="button"
                  on:click={copyLink}
                  class="cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  title="Copy link"
                >
                  {#if linkCopied}
                    <Check class="w-4 h-4 text-green-500" />
                  {:else}
                    <Link2 class="w-4 h-4" />
                  {/if}
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Article Content -->
      <article class="lg:col-span-9 xl:col-span-7">
        <!-- Back Link -->
        <a
          href={backUrl}
          class="inline-flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition mb-6"
        >
          <ArrowLeft class="w-4 h-4" />
          <span class="text-sm font-medium">{learning_center_back_to_all_posts()}</span>
        </a>

        <!-- Cover Image -->
        {#if article?.cover}
          <div class="mb-8 rounded-2xl overflow-hidden shadow-md">
            <img
              src={getImageURL(
                article?.collectionId,
                article?.id,
                article?.cover,
              )}
              alt={article?.title}
              class="w-full h-64 sm:h-80 lg:h-96 object-cover"
              loading="lazy"
            />
          </div>
        {:else if article?.category === "Daily"}
          <div class="mb-8 rounded-2xl overflow-hidden shadow-md">
            <img
              src="/img/premarket-news-cover.webp"
              alt={article?.title}
              class="w-full h-64 sm:h-80 lg:h-96 object-cover"
              loading="lazy"
            />
          </div>
        {/if}

        <!-- Article Header -->
        <header class="mb-8">
          <!-- Tags -->
          {#if article?.tags && article.tags.length > 0}
            <div class="flex flex-wrap items-center gap-2 mb-4">
              {#each article.tags as tag}
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium {getTagColor(
                    tag,
                  )}"
                >
                  {tag}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Title -->
          <h1
            class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
          >
            {article?.title}
          </h1>

          <!-- Abstract -->
          {#if article?.abstract}
            <p class="text-lg text-gray-500 dark:text-zinc-400 leading-relaxed">
              {article?.abstract}
            </p>
          {/if}

          <!-- Meta Info -->
          <div
            class="flex items-center gap-4 mt-6 text-sm text-gray-500 dark:text-zinc-500"
          >
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4" />
              <span>{formatDate(article?.updated)}</span>
            </div>
            <span class="text-gray-300 dark:text-zinc-700">|</span>
            <div class="flex items-center gap-1.5">
              <Clock class="w-4 h-4" />
              <span>{learning_center_min_read({ time: String(readingTime) })}</span>
            </div>
          </div>
        </header>

        <!-- Article Content -->
        {#if isDailyLocked}
          <div class="relative">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="article-content max-h-[400px] overflow-hidden" on:click={handleArticleClick}>
              {@html processedDescription?.replace(
                "__VIDEO_SRC__",
                getImageURL(article?.collectionId, article?.id, article?.video),
              )}
            </div>
            <!-- Gradient fade overlay -->
            <div class="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#09090B] dark:via-[#09090B]/95 pointer-events-none"></div>
          </div>

          <!-- CTA Section -->
          <div class="text-center pt-8 pb-4">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {learning_center_sign_in_to_read()}
            </h2>
            <p class="text-gray-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              {learning_center_briefing_description()}
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/register"
                class="w-full sm:w-auto px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition"
              >
                {learning_center_create_free_account()}
              </a>
              <a
                href="/login"
                class="w-full sm:w-auto px-8 py-3 rounded-full border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-violet-400 dark:hover:border-violet-500 font-semibold text-sm transition"
              >
                {learning_center_sign_in()}
              </a>
            </div>
          </div>
        {:else}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="article-content" on:click={handleArticleClick}>
            {@html processedDescription?.replace(
              "__VIDEO_SRC__",
              getImageURL(article?.collectionId, article?.id, article?.video),
            )}
          </div>
        {/if}

        <!-- Bottom Share Section -->
        {#if !isDailyLocked}
        <div class="border-t border-gray-200 dark:border-zinc-800 mt-12 pt-8">
          <div class="flex flex-col items-center gap-4">
            <span class="text-sm font-medium text-gray-500 dark:text-zinc-400"
              >{learning_center_share_this_article()}</span
            >
            <div class="flex items-center gap-3">
              <!-- Twitter/X -->
              <button
                type="button"
                on:click={shareOnTwitter}
                class="cursor-pointer p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
                title="Share on Twitter"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
              </button>

              <!-- Reddit -->
              <button
                type="button"
                on:click={shareOnReddit}
                class="cursor-pointer p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-[#FF4500] transition"
                title="Share on Reddit"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
                  />
                </svg>
              </button>

              <!-- LinkedIn -->
              <button
                type="button"
                on:click={shareOnLinkedIn}
                class="cursor-pointer p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-[#0A66C2] transition"
                title="Share on LinkedIn"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
              </button>

              <!-- Facebook -->
              <button
                type="button"
                on:click={shareOnFacebook}
                class="cursor-pointer p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-[#1877F2] transition"
                title="Share on Facebook"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </button>

              <!-- Copy Link -->
              <button
                type="button"
                on:click={copyLink}
                class="cursor-pointer p-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                title="Copy link"
              >
                {#if linkCopied}
                  <Check class="w-5 h-5 text-green-500" />
                {:else}
                  <Link2 class="w-5 h-5" />
                {/if}
              </button>
            </div>
          </div>
        </div>
        {/if}
      </article>

      <!-- Right Sidebar (Desktop Only) -->
      <aside class="hidden xl:block xl:col-span-2">
        <div class="sticky top-28">
          <nav>
            <h4
              class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4"
            >
              {learning_center_quick_start()}
            </h4>
            <ul class="space-y-2.5 text-sm">
              <li>
                <a
                  href="/market-mover/gainers"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_top_gainers()}
                </a>
              </li>
              <li>
                <a
                  href="/market-mover/losers"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_top_losers()}
                </a>
              </li>
              <li>
                <a
                  href="/analysts"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_analysts()}
                </a>
              </li>
              <li>
                <a
                  href="/stock-screener"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_stock_screener()}
                </a>
              </li>
              <li>
                <a
                  href="/options-flow"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_options_flow()}
                </a>
              </li>
              <li>
                <a
                  href="/earnings-calendar"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_earnings_calendar()}
                </a>
              </li>
              <li>
                <a
                  href="/dividends-calendar"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_dividends_calendar()}
                </a>
              </li>
              <li>
                <a
                  href="/ipos"
                  class="block text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  {learning_center_sidebar_ipo_calendar()}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  </div>

  <!-- Related Articles Section -->
  {#if relatedArticles && relatedArticles.length > 0}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="border-t border-gray-200 dark:border-zinc-800 pt-12">
        <h2
          class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-8"
        >
          {learning_center_related_articles()}
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each relatedArticles as related}
            <a
              href="/learning-center/article/{convertToSlug(related?.title)}"
              class="group flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all duration-200"
            >
              <!-- Cover Image -->
              {#if related?.cover}
                <div class="relative h-40 overflow-hidden">
                  <img
                    src={getImageURL(
                      related?.collectionId,
                      related?.id,
                      related?.cover,
                    )}
                    alt={related?.title}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              {:else}
                <div
                  class="h-40 bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/20 dark:to-zinc-900 flex items-center justify-center"
                >
                  <svg
                    class="w-12 h-12 text-violet-300 dark:text-violet-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              {/if}

              <!-- Content -->
              <div class="flex flex-col flex-1 p-4">
                <!-- Title -->
                <h3
                  class="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition line-clamp-2 mb-3"
                >
                  {related?.title}
                </h3>

                <!-- Meta -->
                <div
                  class="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-auto"
                >
                  <div class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" />
                    <span>{formatDate(related?.created)}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" />
                    <span>{learning_center_min_read({ time: String(related?.time || 5) })}</span>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>

        <!-- View All Link -->
        <div class="mt-8 text-center">
          <a
            href="/learning-center"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition"
          >
            {learning_center_view_all_articles()}
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Image Lightbox Modal -->
{#if lightboxOpen}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    on:click={closeLightbox}
    on:keydown={(e) => e.key === "Escape" && closeLightbox()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Close Button -->
    <button
      type="button"
      on:click|stopPropagation={closeLightbox}
      class="cursor-pointer absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
      aria-label="Close lightbox"
    >
      <X class="w-6 h-6" />
    </button>

    <!-- Image Container -->
    <div
      class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="presentation"
    >
      <img
        src={lightboxImageSrc}
        alt={lightboxImageAlt}
        class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
    </div>

    <!-- Click anywhere hint -->
    <p
      class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm"
    >
      {learning_center_click_to_close()}
    </p>
  </div>
{/if}

<style>
  /* Article Content Styles */
  .article-content {
    font-size: 1.125rem;
    line-height: 1.8;
    color: #374151;
    counter-reset: equation;
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

  /* Figure container: dark "app window" for screenshots */
  .article-content :global(figure) {
    margin: 1.75rem 0;
    padding: 0.75rem;
    background: #09090b;
    border: 1px solid #27272a;
    border-radius: 0.75rem;
    overflow: hidden;
  }

  :global(.dark) .article-content :global(figure) {
    background: #09090b;
    border-color: #27272a;
  }

  /* Images inside figures: no extra margin, fill the container */
  .article-content :global(figure img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 0;
    display: block;
    cursor: pointer;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .article-content :global(figure img:hover) {
    opacity: 0.9;
    transform: scale(1.01);
  }

  /* Videos inside figures */
  .article-content :global(figure video) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    display: block;
    margin: 0;
  }

  /* Figcaption: light text below image inside the dark container */
  .article-content :global(figcaption) {
    margin-top: 0.625rem;
    font-size: 0.9rem;
    line-height: 1.45;
    color: #a1a1aa;
    padding: 0 0.25rem;
    text-align: center;
  }

  .article-content :global(figcaption a) {
    color: #60a5fa;
    text-decoration: underline;
  }

  .article-content :global(figcaption a:hover) {
    color: #93c5fd;
  }

  /* Standalone images (not inside figure) */
  .article-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    display: block;
    cursor: pointer;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .article-content :global(img:hover) {
    opacity: 0.9;
    transform: scale(1.01);
  }

  /* Standalone video (not inside figure) */
  .article-content :global(video) {
    max-width: 100%;
    height: auto;
    border-radius: 0.75rem;
    margin: 1.75rem 0;
    display: block;
    background: #09090b;
    border: 1px solid #27272a;
  }

  .article-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .article-content :global(.katex-display-wrap) {
    display: block;
    margin: 1rem 0;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    padding-right: 2.75rem;
    counter-increment: equation;
  }

  .article-content :global(.katex-inline-wrap) {
    display: inline;
  }

  .article-content :global(.katex-display-wrap)::after {
    content: "(" counter(equation) ")";
    position: absolute;
    right: 0.25rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.875rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  :global(.dark) .article-content :global(.katex-display-wrap)::after {
    color: #a1a1aa;
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

  /* Line clamp utility for related articles */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
