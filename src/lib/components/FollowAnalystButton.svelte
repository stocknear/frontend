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
    analysts_follow_upgrade,
    analysts_follow_limit,
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

  $: isFollowing = followed?.some((a) => a?.analystId === analystId);
  $: isPremium = ["Pro", "Plus"].includes(user?.tier);
  $: sizeClass =
    variant === "row" ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-sm";

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
    if (!isPremium) {
      toast.error(analysts_follow_upgrade(), { style: toastStyle() });
      return;
    }

    // Plus members can follow up to 5 analysts; Pro is unlimited.
    if (!isFollowing && user?.tier !== "Pro" && (followed?.length ?? 0) >= 5) {
      toast.error(analysts_follow_limit(), { style: toastStyle() });
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
  class="inline-flex items-center gap-1.5 cursor-pointer rounded-full border font-medium whitespace-nowrap transition-colors {sizeClass} {isFollowing
    ? 'border-violet-500/60 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20'
    : 'border-gray-300 dark:border-zinc-700 text-muted dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-50 dark:hover:bg-zinc-900'}"
>
  {#if isFollowing}
    <!-- check -->
    <svg
      class="size-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  {:else}
    <!-- plus -->
    <svg
      class="size-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
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
