<script lang="ts">
  import Moon from "lucide-svelte/icons/moon";
  import Sun from "lucide-svelte/icons/sun";

  type ThemeMode = "light" | "dark";

  interface ViewTransitionLike {
    ready: Promise<void>;
  }

  type ViewTransitionDocument = Document & {
    startViewTransition?: (
      callback: () => void | Promise<void>,
    ) => ViewTransitionLike;
  };

  export let modeValue: ThemeMode = "dark";
  export let onToggle: (nextMode: ThemeMode) => void | Promise<void> = () => {};
  export let duration = 420;
  export let className = "";
  export let lightLabel = "Light";
  export let darkLabel = "Dark";

  let lightButtonRef: HTMLButtonElement | null = null;
  let darkButtonRef: HTMLButtonElement | null = null;
  let isAnimating = false;

  async function switchTheme(nextMode: ThemeMode, buttonRef: HTMLButtonElement | null) {
    if (isAnimating) return;
    if (nextMode === modeValue) return;
    const applyTheme = async () => {
      await onToggle(nextMode);
    };

    const viewTransitionDoc = document as ViewTransitionDocument;

    if (!buttonRef || typeof viewTransitionDoc.startViewTransition !== "function") {
      await applyTheme();
      return;
    }

    isAnimating = true;

    try {
      const transition = viewTransitionDoc.startViewTransition(() => {
        void applyTheme();
      });

      await transition.ready;

      const rect = buttonRef.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } finally {
      setTimeout(() => {
        isAnimating = false;
      }, duration);
    }
  }
</script>

<div
  class={`w-fit flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/60 dark:bg-zinc-900/60 p-0.5 ${className}`}
>
  <button
    bind:this={lightButtonRef}
    type="button"
    on:click={() => switchTheme("light", lightButtonRef)}
    class={`cursor-pointer text-xs flex items-center gap-x-2 px-3 py-1.5 rounded-full focus:z-10 focus:outline-none transition-all ${modeValue ===
    "light"
      ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white"
      : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"}`}
    aria-pressed={modeValue === "light"}
    aria-label="Set light theme"
  >
    <Sun class="h-4 w-4 -mr-1" />
    {lightLabel}
  </button>
  <button
    bind:this={darkButtonRef}
    type="button"
    on:click={() => switchTheme("dark", darkButtonRef)}
    class={`cursor-pointer text-xs flex items-center gap-x-2 pl-3 pr-2 py-1.5 rounded-full focus:z-10 focus:outline-none transition-all ${modeValue ===
    "dark"
      ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white"
      : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"}`}
    aria-pressed={modeValue === "dark"}
    aria-label="Set dark theme"
  >
    <Moon class="h-4 w-4 -mr-1" />
    {darkLabel}
  </button>
  <span class="sr-only">Toggle theme</span>
</div>

<style>
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation: none;
    mix-blend-mode: normal;
  }
</style>
