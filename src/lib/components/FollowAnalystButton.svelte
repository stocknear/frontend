<script lang="ts">
  import { page } from "$app/stores";
  import { goto, invalidateAll } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  import {
    analysts_follow,
    analysts_following,
    analysts_follow_added,
    analysts_follow_removed,
    analysts_follow_failed,
    analysts_follow_limit,
    analysts_follow_limit_free,
  } from "$lib/paraglide/messages";

  // Props - minimal, only what's needed to identify the analyst
  export let analystId: string;
  export let analystName: string = "";
  export let companyName: string = "";
  // "detail" = larger pill for the analyst header, "row" = compact for table rows
  export let variant: "detail" | "row" = "detail";

  // Get user + followed analysts from page data (no prop drilling)
  $: user = $page.data?.user;
  $: initialFollows = $page.data?.getFollowedAnalysts ?? [];

  let followed: { analystId: string; analystName: string }[] = [];
  $: followed = initialFollows;

  let isToggling = false;

  // Follow caps by tier: Free = 1, Plus = 5, Pro = unlimited.
  $: followLimit =
    user?.tier === "Pro" ? Infinity : user?.tier === "Plus" ? 5 : 1;
  $: isFollowing = followed?.some((a) => a?.analystId === analystId);
  $: sizeClass =
    variant === "row" ? "px-3 py-1 text-xs" : "px-3.5 py-2 text-sm";
  $: iconClass = variant === "row" ? "size-3.5" : "size-4";

  const toastStyle = () =>
    `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

  // Open login modal for unauthenticated users (same hook as WatchlistButton)
  function openLoginModal() {
    const modal = document.getElementById("userLogin") as HTMLInputElement | null;
    if (modal) modal.checked = true;
    else goto("/login"); // modal isn't mounted yet / on this route
  }

  async function toggleFollow(event?: Event) {
    // Rows are often wrapped in links - don't navigate when toggling
    event?.preventDefault();
    event?.stopPropagation();

    if (isToggling) return;

    if (!user) {
      openLoginModal();
      return;
    }
    // Enforce the follow cap (Free 1 / Plus 5 / Pro unlimited) before the request.
    if (!isFollowing && (followed?.length ?? 0) >= followLimit) {
      toast.error(
        user?.tier === "Plus"
          ? analysts_follow_limit()
          : analysts_follow_limit_free(),
        { style: toastStyle() },
      );
      return;
    }

    isToggling = true;
    const wasFollowing = isFollowing;
    try {
      const response = await fetch("/api/follow-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analystId, analystName, companyName }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.error || analysts_follow_failed(), {
          style: toastStyle(),
        });
        return;
      }

      // Server response is the single source of truth for follow-state
      const output = await response.json();
      followed = output?.analysts ?? followed;

      const label = analystName || "analyst";
      toast.success(
        wasFollowing
          ? analysts_follow_removed({ name: label })
          : analysts_follow_added({ name: label }),
        { style: toastStyle() },
      );

      // Refresh shared layout data (getFollowedAnalysts) so follow-state stays
      // consistent across the /analysts subtree without a manual reload.
      await invalidateAll();
    } catch (error) {
      console.error("Follow toggle failed:", error);
      toast.error(analysts_follow_failed(), { style: toastStyle() });
    } finally {
      isToggling = false;
    }
  }
</script>

<button
  on:click={toggleFollow}
  disabled={isToggling}
  title={isFollowing ? analysts_following() : analysts_follow()}
  class="inline-flex items-center gap-1 cursor-pointer rounded-full border font-medium whitespace-nowrap shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-60 {sizeClass} {isFollowing
    ? 'border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25'
    : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 hover:border-violet-400 hover:text-violet-700 dark:hover:border-violet-500/70 dark:hover:text-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-500/10'}"
>
  {#if isFollowing}
    <!-- check -->
    <svg
      class="{iconClass} flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  {:else}
    <!-- plus -->
    <svg
      class="{iconClass} flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  {/if}
  <span>{isFollowing ? analysts_following() : analysts_follow()}</span>
</button>
