<script lang="ts">
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { numberOfUnreadNotification } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  export let data;
  export let form;

  const rowsPerPageOptions = [10, 20, 50];
  const DEFAULT_ROWS_PER_PAGE = rowsPerPageOptions[0];

  type NotificationRecord = {
    id?: string;
    readed?: boolean;
    [key: string]: unknown;
  };

  type NotificationEntry = NotificationRecord | null | undefined;

  let notificationList: NotificationEntry[] = (data?.notifications?.items ??
    []) as NotificationEntry[];
  let totalItems =
    data?.notifications?.totalItems ?? notificationList?.length ?? 0;
  let totalPages =
    data?.notifications?.totalPages ??
    Math.max(
      1,
      Math.ceil(
        totalItems / (data?.notifications?.perPage ?? DEFAULT_ROWS_PER_PAGE),
      ),
    );
  let currentPage = data?.notifications?.page ?? 1;
  let selectedRowsPerPage =
    data?.notifications?.perPage ?? DEFAULT_ROWS_PER_PAGE;
  let pagePathName = $page?.url?.pathname;
  let mounted = false;
  let pendingRowsChange = false;
  let updateInFlight = false;
  let notificationChannels = data?.notificationChannels ?? null;
  let unreadNotificationCount = 0;
  let globalUnreadCount = 0;
  let totalKnownUnread = 0;
  let markAllDisabled = true;
  let deleteInFlight = false;
  let deleteError: string | null = null;

  const extractChannelSettings = (record: Record<string, unknown> | null) =>
    record
      ? Object.entries(record).reduce(
          (acc, [key, value]) => {
            if (typeof value === "boolean") {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, boolean>,
        )
      : {};

  let channelSettings: Record<string, boolean> =
    extractChannelSettings(notificationChannels);

  let channelUpdating: Record<string, boolean> = Object.keys(
    channelSettings,
  ).reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  let activeChannelRecordId: string | null = notificationChannels?.id ?? null;
  const channelLabelMap: Record<string, string> = {
    earningsSurprise: "Earnings Surprise",
    wiim: "Why Price Moved",
    topAnalyst: "Top Analyst Rating",
  };

  const formatChannelLabel = (key: string) =>
    channelLabelMap[key] ??
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (character) => character.toUpperCase());

  const channelOrder = ["earningsSurprise", "wiim", "topAnalyst"];

  const toChannelOptions = (settings: Record<string, boolean>) =>
    Object.keys(settings)
      .sort((a, b) => {
        const indexA = channelOrder.indexOf(a);
        const indexB = channelOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) {
          return a.localeCompare(b);
        }
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .map((key) => ({
        key,
        label: formatChannelLabel(key),
      }));

  let channelOptions: Array<{ key: string; label: string }> =
    toChannelOptions(channelSettings);

  $: channelOptions = toChannelOptions(channelSettings);

  export function formatDate(dateStr, short = false) {
    try {
      // Normalize common "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
      const isoLike =
        typeof dateStr === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)
          ? dateStr.replace(" ", "T")
          : dateStr;

      const berlinFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // <- IMPORTANT: use 24-hour clock so 'hour' is 0-23
      });

      const parseDateToUTCFromBerlinParts = (date) => {
        const parts = berlinFormatter.formatToParts(date);
        const get = (type) =>
          Number(parts.find((p) => p.type === type)?.value ?? 0);
        const year = get("year");
        const month = get("month"); // 1-12
        const day = get("day");
        const hour = get("hour"); // now 0-23
        const minute = get("minute");
        const second = get("second");

        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      };

      const berlinDateObj = parseDateToUTCFromBerlinParts(new Date(isoLike));
      const berlinCurrentObj = parseDateToUTCFromBerlinParts(new Date());

      const seconds = Math.floor((berlinCurrentObj - berlinDateObj) / 1000);
      if (Number.isNaN(seconds)) throw new Error("Invalid date");

      const intervals = [
        { unit: "year", short: "y", seconds: 31536000 },
        { unit: "month", short: "mo", seconds: 2592000 },
        { unit: "week", short: "w", seconds: 604800 },
        { unit: "day", short: "d", seconds: 86400 },
        { unit: "hour", short: "h", seconds: 3600 },
        { unit: "minute", short: "m", seconds: 60 },
        { unit: "second", short: "s", seconds: 1 },
      ];

      for (const { unit, short: s, seconds: secondsInUnit } of intervals) {
        const count = Math.floor(seconds / secondsInUnit);

        if (count >= 1) {
          // Special case: prefer days instead of "25h".
          if (unit === "hour" && count >= 24) {
            const days = Math.floor(count / 24);
            return short
              ? `${days}d`
              : `${days} day${days === 1 ? "" : "s"} ago`;
          }

          if (short) {
            return `${count}${s}`;
          }
          return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
        }
      }

      return short ? "0s" : "Just now";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  }

  $: if (
    data?.notificationChannels &&
    data.notificationChannels.id &&
    data.notificationChannels.id !== activeChannelRecordId
  ) {
    notificationChannels = data.notificationChannels;
    channelSettings = extractChannelSettings(notificationChannels);
    channelUpdating = Object.keys(channelSettings).reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    activeChannelRecordId = notificationChannels.id;
  } else if (!data?.notificationChannels && activeChannelRecordId) {
    notificationChannels = null;
    channelSettings = {};
    channelUpdating = {};
    activeChannelRecordId = null;
  }

  async function handleChannelToggle(channelKey: string, nextValue: boolean) {
    if (!notificationChannels?.id) {
      return;
    }

    const previousValue = channelSettings[channelKey] ?? false;

    channelSettings = {
      ...channelSettings,
      [channelKey]: nextValue,
    };
    channelUpdating = {
      ...channelUpdating,
      [channelKey]: true,
    };

    try {
      const payload = {
        id: notificationChannels.id,
        ...channelSettings,
      };

      const response = await fetch("/api/update-notification-channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update channel: ${channelKey}`);
      }

      notificationChannels = {
        ...notificationChannels,
        [channelKey]: nextValue,
      };
    } catch (error) {
      console.error("Unable to update notification channel", error);
      channelSettings = {
        ...channelSettings,
        [channelKey]: previousValue,
      };
    } finally {
      channelUpdating = {
        ...channelUpdating,
        [channelKey]: false,
      };
    }
  }

  $: if (data?.notifications) {
    const {
      items,
      totalItems: total,
      totalPages: pages,
      page: pageFromServer,
      perPage,
    } = data.notifications;

    const nextItems = (items ?? []) as NotificationEntry[];
    const nextTotalItems = total ?? nextItems?.length ?? 0;
    const nextTotalPages =
      pages ??
      Math.max(
        1,
        Math.ceil(nextTotalItems / (perPage ?? DEFAULT_ROWS_PER_PAGE)),
      );

    notificationList = nextItems;
    totalItems = nextTotalItems;
    totalPages = nextTotalPages;
    currentPage = pageFromServer ?? 1;

    if (
      !pendingRowsChange &&
      typeof perPage === "number" &&
      perPage !== selectedRowsPerPage
    ) {
      selectedRowsPerPage = perPage;
    }
  }

  function getPaginationKey(path: string) {
    return `${path}_rowsPerPage`;
  }

  function getStoredRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      return DEFAULT_ROWS_PER_PAGE;
    }

    try {
      const savedRows = localStorage.getItem(getPaginationKey(currentPath));
      const parsed = savedRows ? Number(savedRows) : NaN;

      return rowsPerPageOptions.includes(parsed)
        ? parsed
        : DEFAULT_ROWS_PER_PAGE;
    } catch (error) {
      console.warn("Failed to load rows per page preference:", error);
      return DEFAULT_ROWS_PER_PAGE;
    }
  }

  function saveRowsPerPage(value = selectedRowsPerPage) {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(getPaginationKey(pagePathName), String(value));
    } catch (error) {
      console.warn("Failed to save rows per page preference:", error);
    }
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const getUnreadNotificationIds = (
    list: NotificationEntry[] | null | undefined,
  ) => {
    const ids: string[] = [];

    if (!list) {
      return ids;
    }

    for (const item of list) {
      if (
        item &&
        item.readed === false &&
        typeof item?.id === "string" &&
        item.id.length > 0
      ) {
        ids.push(item.id);
      }
    }

    return ids;
  };

  $: unreadNotificationCount =
    getUnreadNotificationIds(notificationList).length;
  $: globalUnreadCount = Number($numberOfUnreadNotification ?? 0);
  $: totalKnownUnread = Math.max(unreadNotificationCount, globalUnreadCount);
  $: markAllDisabled = updateInFlight || totalKnownUnread === 0;

  async function fetchAllUnreadNotificationIds() {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const response = await fetch("/api/get-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ readed: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread notifications");
      }

      const unreadItems = (await response.json()) as NotificationEntry[];
      return getUnreadNotificationIds(unreadItems);
    } catch (error) {
      console.error("Failed to fetch unread notifications", error);
      return [];
    }
  }

  function closeDeleteModal() {
    if (typeof document === "undefined") return;

    const checkbox = document.getElementById(
      "deleteNotifications",
    ) as HTMLInputElement | null;

    if (checkbox) {
      checkbox.checked = false;
    }
  }

  function buildSearchParams(targetPage: number, perPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set("page", String(targetPage));
    params.set("perPage", String(perPage));
    return params.toString();
  }

  async function goToPage(pageNumber: number) {
    if (
      pageNumber < 1 ||
      pageNumber > totalPages ||
      pageNumber === currentPage
    ) {
      return;
    }

    const params = buildSearchParams(pageNumber, selectedRowsPerPage);
    await goto(`/notifications?${params}`, {
      keepfocus: true,
      noScroll: true,
    });
    scrollToTop();
  }

  async function changeRowsPerPage(
    newRowsPerPage: number,
    options: { persist?: boolean; replaceState?: boolean } = {},
  ) {
    if (!rowsPerPageOptions.includes(newRowsPerPage)) {
      newRowsPerPage = DEFAULT_ROWS_PER_PAGE;
    }

    const { persist = true, replaceState = false } = options;

    const searchPerPage = Number($page.url.searchParams.get("perPage") ?? "");
    const currentPerPage =
      Number.isFinite(searchPerPage) && searchPerPage > 0
        ? searchPerPage
        : selectedRowsPerPage;

    if (
      newRowsPerPage === selectedRowsPerPage &&
      currentPerPage === newRowsPerPage
    ) {
      if (persist) {
        saveRowsPerPage(newRowsPerPage);
      }
      return;
    }

    pendingRowsChange = true;
    selectedRowsPerPage = newRowsPerPage;

    if (persist) {
      saveRowsPerPage(newRowsPerPage);
    }

    const params = buildSearchParams(1, newRowsPerPage);

    try {
      await goto(`/notifications?${params}`, {
        keepfocus: true,
        noScroll: true,
        replaceState,
      });
      scrollToTop();
    } finally {
      pendingRowsChange = false;
    }
  }

  type UpdateNotificationsOptions = {
    mutateClient?: boolean;
    overrideIds?: string[];
  };

  async function updateNotifications(options: UpdateNotificationsOptions = {}) {
    const { mutateClient = false, overrideIds } = options;
    if (!mounted || typeof window === "undefined" || updateInFlight) return;

    const notificationIdList =
      Array.isArray(overrideIds) && overrideIds.length > 0
        ? overrideIds
        : getUnreadNotificationIds(notificationList);

    if (notificationIdList.length === 0) {
      return;
    }

    const postData = {
      unreadList: notificationIdList,
    };

    updateInFlight = true;

    try {
      await fetch("/api/update-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (mutateClient) {
        const unreadIdSet = new Set(notificationIdList);
        notificationList = notificationList.map((item) => {
          if (
            item &&
            typeof item?.id === "string" &&
            unreadIdSet.has(item.id)
          ) {
            return {
              ...item,
              readed: true,
            };
          }
          return item;
        });
      }

      const currentUnreadTotal =
        typeof $numberOfUnreadNotification === "number"
          ? $numberOfUnreadNotification
          : 0;
      const nextUnreadTotal = Math.max(
        currentUnreadTotal - notificationIdList.length,
        0,
      );

      if ($numberOfUnreadNotification !== nextUnreadTotal) {
        $numberOfUnreadNotification = nextUnreadTotal;
      }
    } catch (error) {
      console.error("Failed to update notifications", error);
    } finally {
      updateInFlight = false;
    }
  }

  async function markAllAsRead() {
    if (markAllDisabled) {
      return;
    }

    const localUnreadIds = getUnreadNotificationIds(notificationList);
    const shouldFetchAll =
      totalKnownUnread > unreadNotificationCount || localUnreadIds.length === 0;

    const targetIds = shouldFetchAll
      ? await fetchAllUnreadNotificationIds()
      : localUnreadIds;

    if (targetIds.length === 0) {
      return;
    }

    await updateNotifications({
      mutateClient: true,
      overrideIds: targetIds,
    });
  }

  async function deleteAllNotifications() {
    if (deleteInFlight || notificationList?.length < 1) {
      return;
    }

    deleteError = null;
    deleteInFlight = true;

    try {
      const response = await fetch("/api/delete-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      type DeleteResponse = {
        success?: boolean;
        deleted?: number;
        error?: string;
      };
      const result = (await response.json()) as DeleteResponse;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Request failed");
      }

      notificationList = [];
      notificationList = [...notificationList];
      totalItems = 0;
      totalPages = 1;
      currentPage = 1;
      $numberOfUnreadNotification = 0;

      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete notifications", error);
      deleteError = "Failed to delete notifications. Please try again.";
    } finally {
      deleteInFlight = false;
    }
  }

  onMount(async () => {
    mounted = true;
    const storedRows = getStoredRowsPerPage();

    if (storedRows !== selectedRowsPerPage) {
      await changeRowsPerPage(storedRows, {
        persist: false,
        replaceState: true,
      });
    } else {
      await updateNotifications();
    }
  });

  $: if (mounted && !pendingRowsChange) {
    notificationList;
    void updateNotifications();
  }

  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
  }
</script>

<SEO
  title="Stock Market Notifications | Real-Time Updates & Alerts"
  description="Stay informed with real-time stock market notifications. Get instant alerts on price changes, trends, and market movements to make smarter investment decisions."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    items={[{ label: "Home", href: "/" }, { label: "Notifications" }]}
  />

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-4 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Notification
            </h1>
          </div>

          <div
            class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between mt-5 text-gray-700 dark:text-zinc-200 sm:py-2 sm:border-t sm:border-b sm:border-gray-200 sm:dark:border-zinc-700"
          >
            <h2
              class="text-start w-full mb-2 sm:mb-0 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {totalItems?.toLocaleString("en-US")} Alerts
            </h2>
            <div
              class="flex items-center ml-auto border-t border-b border-gray-300 dark:border-zinc-700 sm:border-none py-1 sm:py-0 w-full"
            >
              <div
                class="flex items-center ml-auto pt-1 pb-1 sm:pt-0 sm:pb-0 w-fit"
              >
                <Button
                  class="w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center w-full sm:w-auto px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  on:click={markAllAsRead}
                  disabled={markAllDisabled}
                  aria-disabled={markAllDisabled}
                >
                  <span class="truncate text-[0.85rem] sm:text-sm"
                    >{updateInFlight ? "Marking..." : "Mark all as read"}</span
                  >
                </Button>
              </div>

              <div
                class="flex items-center ml-2 pt-1 pb-1 sm:pt-0 sm:pb-0 w-fit"
              >
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center w-full sm:w-auto px-3 py-2 rounded-full truncate"
                    >
                      <span class="truncate text-[0.85rem] sm:text-sm"
                        >Settings</span
                      >
                      <svg
                        class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    alignOffset={0}
                    class="w-auto min-w-64 max-w-80 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Label
                      class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                    >
                      Customize your notifications
                    </DropdownMenu.Label>
                    <!-- Dropdown items -->
                    <DropdownMenu.Group class="pb-2">
                      {#if channelOptions.length > 0}
                        {#each channelOptions as option (option.key)}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
                            <label
                              class="inline-flex justify-between w-full items-center cursor-pointer"
                              on:click|stopPropagation
                              on:pointerdown|stopPropagation
                            >
                              <span class="mr-1 text-sm">{option.label}</span>

                              <div class="relative ml-auto">
                                <input
                                  type="checkbox"
                                  class="sr-only peer"
                                  checked={!!channelSettings[option.key]}
                                  disabled={!!channelUpdating[option.key]}
                                  on:change={(event) =>
                                    handleChannelToggle(
                                      option.key,
                                      event.currentTarget.checked,
                                    )}
                                />
                                <div
                                  class="w-9 h-5 bg-gray-300 dark:bg-zinc-700/60 rounded-full peer peer-checked:bg-gray-800 dark:peer-checked:bg-zinc-200/80 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-200 dark:after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                                  class:opacity-50={channelUpdating[option.key]}
                                ></div>
                              </div></label
                            >
                          </DropdownMenu.Item>
                        {/each}
                      {:else}
                        <DropdownMenu.Item
                          class="text-sm text-gray-500 dark:text-zinc-400"
                        >
                          No notification channels available.
                        </DropdownMenu.Item>
                      {/if}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              {#if notificationList && notificationList.length > 0}
                <div class="flex items-center ml-2 w-fit">
                  <label
                    for="deleteNotifications"
                    class="cursor-pointer transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center w-full sm:w-auto px-3 py-2 rounded-full truncate"
                    on:click={() => {
                      deleteError = null;
                    }}
                  >
                    <svg
                      class="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      style="max-width:40px"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path></svg
                    >
                  </label>
                </div>
              {/if}
            </div>
          </div>

          {#if notificationList?.length !== 0}
            <div class="flex flex-col items-start w-full mt-10">
              {#each notificationList as item}
                {#if item?.notifyType === "priceAlert"}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div
                    class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 px-3 py-3 sm:p-4 mb-4 w-full {!item?.readed
                      ? 'bg-gray-50/90 dark:bg-zinc-900/60'
                      : ''}"
                  >
                    <div class="flex flex-row items-center w-full">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <a
                        class="avatar w-8 h-8 shrink-0 mr-4 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60"
                      >
                        <img
                          style="clip-path: circle(50%);"
                          class="shrink-0 w-8 h-8 rounded-full inline-block p-0.5"
                          src={`https://financialmodelingprep.com/image-stock/${item?.liveResults?.symbol}.png`}
                          alt="Company Logo"
                        />
                      </a>

                      <div
                        class="text-sm sm:text-[0.95rem] text-gray-600 dark:text-zinc-300"
                      >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <div class="flex flex-col items-start">
                          <div>
                            <div class="flex flex-col items-start">
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                Price Alert triggered for <HoverStockChart
                                  symbol={item?.liveResults?.symbol}
                                  assetType={item?.liveResults?.assetType}
                                />
                              </div>
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                The price of <span class="font-semibold"
                                  >{item?.liveResults?.currentPrice}</span
                                >
                                is {item?.liveResults?.condition} your target of
                                <span class="font-semibold"
                                  >{item?.liveResults?.targetPrice}</span
                                >
                              </div>
                            </div>
                          </div>
                          <span
                            class="text-xs mt-1 text-gray-800 dark:text-zinc-300"
                            >{formatDate(item?.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                {:else if item?.notifyType === "wiim"}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div
                    class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 px-3 py-3 sm:p-4 mb-4 w-full {!item?.readed
                      ? 'bg-gray-50/90 dark:bg-zinc-900/60'
                      : ''}"
                  >
                    <div class="flex flex-row items-center w-full">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <a
                        class="avatar w-8 h-8 shrink-0 mr-4 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60"
                      >
                        <img
                          style="clip-path: circle(50%);"
                          class="shrink-0 w-8 h-8 rounded-full inline-block p-0.5"
                          src={`https://financialmodelingprep.com/image-stock/${item?.liveResults?.symbol}.png`}
                          alt="Company Logo"
                        />
                      </a>

                      <div
                        class="text-sm sm:text-[0.95rem] text-gray-600 dark:text-zinc-300"
                      >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <div class="flex flex-col items-start">
                          <div>
                            <div class="flex flex-col items-start">
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                <span class="font-semibold"
                                  >BREAKING News for</span
                                >
                                <HoverStockChart
                                  symbol={item?.liveResults?.symbol}
                                  assetType={item?.liveResults?.assetType}
                                />
                              </div>
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                New data for "Why Price Moved" event is out.
                              </div>
                            </div>
                          </div>
                          <span
                            class="text-xs mt-1 text-gray-800 dark:text-zinc-300"
                            >{formatDate(item?.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                {:else if item?.notifyType === "topAnalyst"}
                  <div
                    class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 px-3 py-3 sm:p-4 mb-4 w-full {!item?.readed
                      ? 'bg-gray-50/90 dark:bg-zinc-900/60'
                      : ''}"
                  >
                    <div class="flex flex-row items-center w-full">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <a
                        class="avatar w-8 h-8 shrink-0 mr-4 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60"
                      >
                        <img
                          style="clip-path: circle(50%);"
                          class="shrink-0 w-8 h-8 rounded-full inline-block p-0.5"
                          src={`https://financialmodelingprep.com/image-stock/${item?.liveResults?.symbol}.png`}
                          alt="Company Logo"
                        />
                      </a>

                      <div
                        class="text-sm sm:text-[0.95rem] text-gray-600 dark:text-zinc-300"
                      >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <div class="flex flex-col items-start">
                          <div>
                            <div class="flex flex-col items-start">
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                <span class="font-semibold"
                                  >New Top Analyst Rating for</span
                                >
                                <HoverStockChart
                                  symbol={item?.liveResults?.symbol}
                                  assetType={item?.liveResults?.assetType}
                                  link="forecast/analyst"
                                />
                              </div>
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                The rating company {item?.liveResults?.analyst} has
                                issued a new rating of „{item?.liveResults
                                  ?.rating_current}“ with an updated price
                                target of ${item?.liveResults
                                  ?.adjusted_pt_current}.
                              </div>
                            </div>
                          </div>
                          <span
                            class="text-xs mt-1 text-gray-800 dark:text-zinc-300"
                            >{formatDate(item?.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                {:else if item?.notifyType === "earningsSurprise"}
                  <div
                    class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 px-3 py-3 sm:p-4 mb-4 w-full {!item?.readed
                      ? 'bg-gray-50/90 dark:bg-zinc-900/60'
                      : ''}"
                  >
                    <div class="flex flex-row items-center w-full">
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <a
                        class="avatar w-8 h-8 shrink-0 mr-4 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60"
                      >
                        <img
                          style="clip-path: circle(50%);"
                          class="shrink-0 w-8 h-8 rounded-full inline-block p-0.5"
                          src={`https://financialmodelingprep.com/image-stock/${item?.liveResults?.symbol}.png`}
                          alt="Company Logo"
                        />
                      </a>

                      <div
                        class="text-sm sm:text-[0.95rem] text-gray-600 dark:text-zinc-300"
                      >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <div class="flex flex-col items-start">
                          <div>
                            <div class="flex flex-col items-start">
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                <span class="font-semibold"
                                  >Earnings Release for</span
                                >
                                <HoverStockChart
                                  symbol={item?.liveResults?.symbol}
                                  assetType={item?.liveResults?.assetType}
                                />
                              </div>
                              <div
                                class="text-sm sm:text-[0.95rem] mt-0.5 text-gray-600 dark:text-zinc-300"
                              >
                                New data for "Earnings Surprise" event is out.
                              </div>
                            </div>
                          </div>
                          <span
                            class="text-xs mt-1 text-gray-800 dark:text-zinc-300"
                            >{formatDate(item?.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>

            <div
              class="flex flex-row items-center justify-between mt-8 sm:mt-5 w-full"
            >
              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg
                    class="h-5 w-5 inline-block shrink-0 rotate-90"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style="max-width:40px"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span class="hidden sm:inline">Previous</span>
                </Button>
              </div>

              <div class="flex flex-row items-center gap-4">
                <span class="text-sm text-gray-600 dark:text-zinc-300">
                  Page {currentPage} of {totalPages}
                </span>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate"
                    >
                      <span class="truncate text-[0.85rem] sm:text-sm"
                        >{selectedRowsPerPage} Rows</span
                      >
                      <svg
                        class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    alignOffset={0}
                    class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Group class="pb-2">
                      {#each rowsPerPageOptions as item}
                        <DropdownMenu.Item
                          class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                        >
                          <label
                            on:click={() => changeRowsPerPage(item)}
                            class="inline-flex justify-between w-full items-center cursor-pointer"
                          >
                            <span class="text-sm">{item} Rows</span>
                          </label>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="hidden sm:inline">Next</span>
                  <svg
                    class="h-5 w-5 inline-block shrink-0 -rotate-90"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style="max-width:40px"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </Button>
              </div>
            </div>

            <div class="flex justify-center mt-4 w-full">
              <button
                on:click={scrollToTop}
                class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
              >
                Back to Top
                <svg
                  class="h-5 w-5 inline-block shrink-0 rotate-180"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style="max-width:40px"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
          {:else}
            <div class="w-full flex items-center justify-start text-start">
              <Infobox text="You have no notifications yet." />
            </div>
          {/if}
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/watchlist/stocks"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">Watchlist</h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Get realtime updates of your favorite stocks
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/portfolio"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Portfolio Tracker
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Get realtime updates of your portfolio
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

<input type="checkbox" id="deleteNotifications" class="modal-toggle" />

<dialog id="deleteNotifications" class="modal modal-middle p-3 sm:p-0">
  <label for="deleteNotifications" class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full p-6 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/90 text-gray-700 dark:text-zinc-200"
  >
    <h3 class="text-lg font-medium mb-2">Delete All Notifications</h3>
    <p class="text-sm mb-4">
      Are you sure you want to delete all notifications? This action cannot be
      undone.
    </p>
    {#if deleteError}
      <p class="text-sm text-red-600 dark:text-red-400 mb-4" role="alert">
        {deleteError}
      </p>
    {/if}
    <div class="flex justify-end space-x-3">
      <label
        for="deleteNotifications"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-zinc-900"
        tabindex="0"
        on:click={() => {
          deleteError = null;
        }}>Cancel</label
      ><button
        type="button"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        on:click={deleteAllNotifications}
        disabled={deleteInFlight}
        aria-disabled={deleteInFlight}
      >
        <svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg
        ><span class="whitespace-nowrap"
          >{deleteInFlight ? "Deleting..." : "Delete Notifications"}</span
        >
      </button>
    </div>
  </div>
</dialog>
