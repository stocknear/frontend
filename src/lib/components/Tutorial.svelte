<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  export let steps = [];

  const tutorialArticleByPath: Record<string, string> = {
    "/analysts/*":
      "/learning-center/article/wall-street-analyst-ratings-find-the-best-stock-ideas-from-topranked-experts",
  };

  function normalizePath(pathname: string): string {
    if (!pathname) return "/";
    if (pathname !== "/" && pathname.endsWith("/"))
      return pathname.slice(0, -1);
    return pathname;
  }

  function matchPattern(pattern: string, pathname: string): boolean {
    // Support trailing wildcard patterns like "/analysts/*"
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -2); // "/analysts"
      return pathname === base || pathname.startsWith(base + "/");
    }
    return pattern === pathname;
  }

  function resolveTutorialPath(pathname: string): string | null {
    const normalizedPath = normalizePath(pathname);

    // 1) exact match first
    const exact = tutorialArticleByPath[normalizedPath];
    if (exact) return exact;

    // 2) wildcard / prefix patterns
    for (const [pattern, target] of Object.entries(tutorialArticleByPath)) {
      if (pattern.includes("*") && matchPattern(pattern, normalizedPath)) {
        return target;
      }
    }

    return null;
  }

  async function handleTutorialClick() {
    const tutorialPath = resolveTutorialPath($page?.url?.pathname || "/");
    await goto(tutorialPath ?? "/learning-center");
  }
</script>

<button
  class="font-semibold cursor-pointer flex flex-row items-center shrink-0 sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
  on:click={handleTutorialClick}
>
  Tutorial
  <svg
    class="ml-1 inline-block size-[22px] cursor-pointer"
    viewBox="0 0 20 20"
    fill="currentColor"
    style="max-width:40px"
  >
    <path
      fill-rule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
      clip-rule="evenodd"
    />
  </svg>
</button>
