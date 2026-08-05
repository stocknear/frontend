<script lang="ts">
  import { formatCompact, formatNumber } from "$lib/i18n/format";
  import { localizedHref } from "$lib/i18n/navigation";
  import { escapeInfoTextHtml, fetchInfoText } from "$lib/i18n/info-text";
  import { goto } from "$app/navigation";
  import { MARGIN_KEYS as marginKeys } from "$lib/financials/constants";
  import {
    stock_detail_financials_add_favorite,
    stock_detail_financials_error_loading,
    stock_detail_financials_expand_chart,
    stock_detail_financials_growth_yoy,
    stock_detail_financials_hide_growth,
    stock_detail_financials_loading,
    stock_detail_financials_metric_definition,
    stock_detail_no_data,
    stock_detail_financials_remove_favorite,
    stock_detail_financials_show_growth,
  } from "$lib/paraglide/messages";

  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import GrowthRate from "lucide-svelte/icons/percent";

  export let data: any[];
  export let fields: { label: string; key: string; growthOf?: string }[];
  export let enableFavorites = false;
  export let favoriteStorageKey = "";
  export let showUpgradeColumn = false;
  export let upgradeHref = "/pricing";
  export let upgradeLabel = "Upgrade";
  export let periodType: "annual" | "quarterly" | "ttm" = "annual";
  export let onExpandChart:
    | ((metricKey: string, metricLabel: string) => void)
    | null = null;

  const isBrowser = typeof window !== "undefined";
  const DEFAULT_STORAGE_PREFIX = "financial_metrics";
  let localStorageKey = "";
  let favoriteMetrics: string[] = [];
  let favoriteSet: Set<string> = new Set();
  let computedFields = [];
  let visibleComputedFields = [];
  let renderableFieldKeys: Set<string> = new Set();
  let animationKey: string | null = null;

  // Store references to info icon elements
  let infoElements: { [key: string]: HTMLElement } = {};
  let infoTooltipInstances: Map<string, any> = new Map();
  let infoTooltipLoadState: Map<
    string,
    "idle" | "loading" | "loaded" | "error"
  > = new Map();
  let fieldLookup: Map<
    string,
    { label?: string; key?: string; growthOf?: string }
  > = new Map();

  const isGrowthField = (field?: { key?: string; growthOf?: string }) => {
    if (!field) return false;
    if (field.growthOf) {
      return true;
    }
    return /^growth/i.test(field.key ?? "");
  };

  const isPercentMetricKey = (key?: string | null) => {
    if (!key) return false;
    if (marginKeys.has(key)) {
      return true;
    }
    return /^growth/i.test(key);
  };

  const YOY_REGEX = /\bYoY\b/i;

  const appendYoYSuffix = (label: string) => {
    const normalized = label.trim();
    if (!normalized) {
      return stock_detail_financials_growth_yoy();
    }
    return YOY_REGEX.test(normalized) ? normalized : `${normalized} (YoY)`;
  };

  const getDisplayLabel = (field?: {
    label?: string;
    key?: string;
    isGrowth?: boolean;
    growthOf?: string;
  }) => {
    if (!field) return "";
    const baseLabel = (field.label ?? field.key ?? "").toString().trim();
    if (!baseLabel) {
      return "";
    }
    const treatAsGrowth = field.isGrowth ?? isGrowthField(field);
    return treatAsGrowth ? appendYoYSuffix(baseLabel) : baseLabel;
  };

  let growthFieldKeys: Set<string> = new Set();
  let visibleGrowthKeys: Set<string> = new Set();

  const sanitizeFavoriteList = (keys: string[] = []) => {
    if (!Array.isArray(keys)) return [];
    const availableKeys = new Set(fields.map((field) => field.key));
    return keys.filter(
      (key) => availableKeys.has(key) && !growthFieldKeys.has(key),
    );
  };

  const createGrowthMapping = (
    fieldList: { key: string; growthOf?: string }[] = [],
  ) => {
    const mapping = new Map<string, string[]>();
    fieldList.forEach((field) => {
      if (!field?.growthOf) return;
      if (!mapping.has(field.growthOf)) {
        mapping.set(field.growthOf, []);
      }
      mapping.get(field.growthOf)?.push(field.key);
    });
    return mapping;
  };

  let growthMapping: Map<string, string[]> = new Map();

  const hasGrowthChildren = (baseKey: string) =>
    Boolean(growthMapping.get(baseKey)?.length);

  const isGrowthActive = (baseKey: string) => {
    const keys = growthMapping.get(baseKey);
    if (!keys?.length) {
      return false;
    }
    return keys.every((key) => visibleGrowthKeys.has(key));
  };

  function toggleGrowthVisibility(baseKey: string) {
    const growthKeys = growthMapping.get(baseKey);
    if (!growthKeys?.length) {
      return;
    }
    const shouldShow = !growthKeys.every((key) => visibleGrowthKeys.has(key));
    const updated = new Set(visibleGrowthKeys);
    growthKeys.forEach((key) => {
      if (shouldShow) {
        updated.add(key);
      } else {
        updated.delete(key);
      }
    });
    visibleGrowthKeys = updated;
  }

  const sanitizeKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const EMPTY_LIKE_ROW_STRINGS = new Set([
    "",
    "-",
    "n/a",
    "na",
    "null",
    "undefined",
  ]);
  const ZERO_LIKE_ROW_NUMBER_REGEX = /^-?\d*\.?\d+$/;

  function isEmptyLikeRowValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "number") {
      return !Number.isFinite(value) || value === 0;
    }

    if (typeof value === "bigint") {
      return value === 0n;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (EMPTY_LIKE_ROW_STRINGS.has(normalized)) {
        return true;
      }

      const numericCandidate = normalized
        .replace(/[$,%\s]/g, "")
        .replace(/,/g, "");
      if (
        numericCandidate &&
        ZERO_LIKE_ROW_NUMBER_REGEX.test(numericCandidate)
      ) {
        return Number(numericCandidate) === 0;
      }

      return false;
    }

    return false;
  }

  function buildRenderableFieldKeySet(
    entries: any[] = [],
    fieldList: { key: string }[] = [],
  ) {
    if (!Array.isArray(fieldList) || fieldList.length === 0) {
      return new Set<string>();
    }

    const keys = fieldList.map((field) => field.key);
    if (!Array.isArray(entries) || entries.length === 0) {
      return new Set(keys);
    }

    const visibleKeys = new Set<string>();
    for (const item of entries) {
      for (const key of keys) {
        if (visibleKeys.has(key)) {
          continue;
        }
        if (!isEmptyLikeRowValue(item?.[key])) {
          visibleKeys.add(key);
        }
      }

      if (visibleKeys.size === keys.length) {
        break;
      }
    }

    return visibleKeys;
  }

  function buildStorageKey() {
    const base =
      favoriteStorageKey?.toString().trim() ||
      (isBrowser ? window.location.pathname : "") ||
      DEFAULT_STORAGE_PREFIX;
    const pathNormalized = base.startsWith("/")
      ? base.replace(/\/stocks\/[^/]+/i, "/stocks/_")
      : base;
    return `favorite_${sanitizeKey(pathNormalized)}`;
  }

  function persistFavorites(updatedList: string[]) {
    if (!enableFavorites || !isBrowser) return;
    localStorageKey = buildStorageKey();
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
    } catch (error) {
      console.warn("Failed to save favorite metrics:", error);
    }
  }

  function loadFavorites() {
    if (!enableFavorites || !isBrowser) return;
    localStorageKey = buildStorageKey();
    try {
      const stored = window.localStorage.getItem(localStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeFavoriteList(parsed);
        favoriteMetrics = sanitized;
        if (sanitized.length !== parsed.length) {
          persistFavorites(sanitized);
        }
      }
    } catch (error) {
      console.warn("Failed to load favorite metrics:", error);
    }
  }

  function toggleFavorite(metricKey: string) {
    if (!enableFavorites || growthFieldKeys.has(metricKey)) return;
    const isFavorite = favoriteSet.has(metricKey);
    const updatedList = isFavorite
      ? favoriteMetrics.filter((key) => key !== metricKey)
      : [...favoriteMetrics, metricKey];
    favoriteMetrics = updatedList;
    persistFavorites(updatedList);
    if (!isFavorite) {
      animationKey = null;
      animationKey = metricKey;
    }
  }

  function handleAnimationEnd(metricKey: string) {
    if (animationKey === metricKey) {
      animationKey = null;
    }
  }

  function setInfoTooltipContent(instance: any, title: string, body: string) {
    instance.setContent(`
      <div class="info-tooltip">
        <div class="info-tooltip__title">${escapeInfoTextHtml(title)}</div>
        <div class="info-tooltip__body">${escapeInfoTextHtml(body)}</div>
      </div>
    `);
  }

  function setLoadedInfoTooltipContent(
    instance: any,
    title: string,
    content: any,
  ) {
    instance.setContent(`
      <div class="info-tooltip">
        <div class="info-tooltip__title">${escapeInfoTextHtml(title)}</div>
        <div class="info-tooltip__body">${escapeInfoTextHtml(content?.text || stock_detail_no_data())}</div>
        ${
          content?.equation
            ? `<div class="info-tooltip__equation">${escapeInfoTextHtml(content?.equation)}</div>`
            : ""
        }
      </div>
    `);
  }

  function getInfoLabel(key: string) {
    const field = fieldLookup.get(key);
    return getDisplayLabel(field) || key;
  }

  async function loadInfoTooltip(key: string, instance: any) {
    const infoLabel = getInfoLabel(key);
    const currentState = infoTooltipLoadState.get(key) ?? "idle";

    if (currentState === "loaded" || currentState === "loading") {
      return;
    }

    infoTooltipLoadState.set(key, "loading");
    setInfoTooltipContent(
      instance,
      infoLabel,
      stock_detail_financials_loading(),
    );

    try {
      const content = await getInfoText(key);
      infoTooltipLoadState.set(key, "loaded");
      setLoadedInfoTooltipContent(instance, infoLabel, content);
    } catch (error) {
      infoTooltipLoadState.set(key, "error");
      setInfoTooltipContent(
        instance,
        infoLabel,
        stock_detail_financials_error_loading(),
      );
    }
  }

  function ensureInfoTooltip(key: string) {
    const existing = infoTooltipInstances.get(key);
    if (existing) {
      return existing;
    }

    const element = infoElements[key];
    if (!element) {
      return null;
    }

    const infoLabel = getInfoLabel(key);
    const instance = tippy(element, {
      trigger: "manual",
      placement: "bottom",
      theme: "minimal",
      allowHTML: true,
      appendTo: () => document.body,
      zIndex: 9999,
      interactive: false,
      delay: [0, 0],
      onShow: async (currentInstance) => {
        const state = infoTooltipLoadState.get(key) ?? "idle";
        if (state === "loaded" || state === "error") {
          return;
        }
        setInfoTooltipContent(
          currentInstance,
          infoLabel,
          stock_detail_financials_loading(),
        );
        await loadInfoTooltip(key, currentInstance);
      },
    });

    infoTooltipInstances.set(key, instance);
    return instance;
  }

  function showInfoTooltip(key: string) {
    const instance = ensureInfoTooltip(key);
    instance?.show();
  }

  function hideInfoTooltip(key: string) {
    infoTooltipInstances.get(key)?.hide();
  }

  function destroyInfoTooltip(key: string) {
    const instance = infoTooltipInstances.get(key);
    if (!instance) {
      return;
    }
    instance.destroy();
    infoTooltipInstances.delete(key);
    infoTooltipLoadState.delete(key);
  }

  const buildFieldGroups = (fieldList) => {
    const groups = [];
    let index = 0;
    while (index < fieldList.length) {
      const field = fieldList[index];
      if (field.isGrowth) {
        groups.push({
          base: field,
          items: [field],
          originalIndex: field.originalIndex,
        });
        index += 1;
        continue;
      }

      const items = [field];
      let nextIndex = index + 1;
      while (
        nextIndex < fieldList.length &&
        fieldList[nextIndex].isGrowth &&
        fieldList[nextIndex].growthOf === field.key
      ) {
        items.push(fieldList[nextIndex]);
        nextIndex += 1;
      }

      groups.push({
        base: field,
        items,
        originalIndex: field.originalIndex,
      });
      index = nextIndex;
    }

    return groups;
  };

  const flattenGroups = (groups) =>
    groups.flatMap((group) => (group?.items ? group.items : []));

  $: growthMapping = createGrowthMapping(fields);

  $: fieldLookup = new Map(fields.map((field) => [field.key, field]));

  $: growthFieldKeys = new Set(
    fields.filter((field) => isGrowthField(field)).map((field) => field.key),
  );

  $: {
    const validKeys = new Set(fields.map((field) => field.key));
    const filtered = Array.from(visibleGrowthKeys).filter((key) =>
      validKeys.has(key),
    );
    if (filtered.length !== visibleGrowthKeys.size) {
      visibleGrowthKeys = new Set(filtered);
    }
  }

  $: {
    const baseFields = fields.map((field, index) => {
      const normalizedField = {
        ...field,
        isMargin: isPercentMetricKey(field.key),
        isGrowth: isGrowthField(field),
        originalIndex: index,
      };
      return {
        ...normalizedField,
        displayLabel: getDisplayLabel(normalizedField),
      };
    });

    const groups = buildFieldGroups(baseFields);

    if (enableFavorites) {
      const sorted = [...groups].sort((a, b) => {
        const aFavorite = !a.base.isGrowth && favoriteSet.has(a.base.key);
        const bFavorite = !b.base.isGrowth && favoriteSet.has(b.base.key);
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
        return a.originalIndex - b.originalIndex;
      });
      computedFields = flattenGroups(sorted);
    } else {
      computedFields = flattenGroups(groups);
    }
  }

  $: renderableFieldKeys = buildRenderableFieldKeySet(data, fields);

  $: visibleComputedFields = computedFields.filter((field) =>
    renderableFieldKeys.has(field.key),
  );

  $: {
    const visibleKeys = new Set(
      visibleComputedFields.map((field) => field.key),
    );
    for (const key of Array.from(infoTooltipInstances.keys())) {
      if (!visibleKeys.has(key)) {
        destroyInfoTooltip(key);
      }
    }
  }

  $: if (enableFavorites) {
    const filteredFavorites = sanitizeFavoriteList(favoriteMetrics);
    if (filteredFavorites.length !== favoriteMetrics.length) {
      favoriteMetrics = filteredFavorites;
      persistFavorites(filteredFavorites);
    }
  }

  $: if (enableFavorites) {
    favoriteSet = new Set(sanitizeFavoriteList(favoriteMetrics));
  } else {
    favoriteSet = new Set();
  }

  // Helper to format the cell value
  function formatValue(
    value: number | null | undefined,
    isMargin: boolean,
  ): string {
    if (value === null || value === undefined) {
      return "-";
    }
    if (isMargin) {
      const percentValue = Number((value * 100).toFixed(2));
      const formattedPercent = formatNumber(percentValue, {
        maximumFractionDigits: 2,
      });
      return `${formattedPercent}%`;
    }
    const normalizedValue = Number(value.toFixed(2));
    return formatCompact(normalizedValue, { maximumFractionDigits: 2 });
  }

  const getGrowthDeltaClass = (value: unknown) => {
    const numericValue = Number(value);
    if (!Number?.isFinite(numericValue) || numericValue === 0) {
      return "";
    }
    return numericValue > 0
      ? "before:content-['+'] text-up"
      : numericValue < 0
        ? "text-down"
        : "text-fg-muted";
  };

  function goToUpgrade(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!upgradeHref) return;
    goto(localizedHref(upgradeHref));
  }

  async function getInfoText(parameter) {
    return fetchInfoText(parameter);
  }

  onMount(() => {
    if (enableFavorites) {
      loadFavorites();
    }

    return () => {
      for (const key of Array.from(infoTooltipInstances.keys())) {
        destroyInfoTooltip(key);
      }
    };
  });
</script>

{#each visibleComputedFields as field (field.key)}
  {#if !field.isGrowth || visibleGrowthKeys.has(field.key)}
    <tr
      class="whitespace-nowrap transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
    >
      <td
        class="text-start min-w-72 max-w-72 sm:min-w-96 sm:max-w-96 text-sm sm:text-[0.95rem] border-r border-line w-full flex flex-row items-center justify-between text-fg"
      >
        <div class="flex items-center gap-2">
          {#if enableFavorites && !field.isGrowth}
            <button
              type="button"
              aria-label={(favoriteSet.has(field.key)
                ? stock_detail_financials_remove_favorite
                : stock_detail_financials_add_favorite)({
                metric: field.displayLabel ?? field.label,
              })}
              aria-pressed={favoriteSet.has(field.key)}
              class={`cursor-pointer favorite-toggle w-5 h-5 inline-flex items-center justify-center transition-colors ${favoriteSet.has(field.key) ? "text-yellow-500 dark:text-[#FFA500]" : "text-gray-400 dark:text-gray-300"}`}
              on:click|stopPropagation={() => toggleFavorite(field.key)}
              title={(favoriteSet.has(field.key)
                ? stock_detail_financials_remove_favorite
                : stock_detail_financials_add_favorite)({
                metric: field.displayLabel ?? field.label,
              })}
            >
              <svg
                class={`w-4 h-4 shrink-0 ${animationKey === field.key ? "heartbeat" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                on:animationend={() => handleAnimationEnd(field.key)}
              >
                <path
                  fill="currentColor"
                  d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                />
              </svg>
            </button>
          {/if}

          <button
            type="button"
            bind:this={infoElements[field.key]}
            class="truncate w-fit max-w-40 sm:max-w-64 cursor-help flex items-center text-left"
            aria-label={stock_detail_financials_metric_definition({
              metric: field.displayLabel ?? field.label,
            })}
            on:mouseenter={() => showInfoTooltip(field.key)}
            on:mouseleave={() => hideInfoTooltip(field.key)}
            on:focus={() => showInfoTooltip(field.key)}
            on:blur={() => hideInfoTooltip(field.key)}
          >
            <span
              class="truncate"
              class:ml-7={field?.displayLabel?.includes("Growth (YoY)")}
              >{field.displayLabel ?? field.label}
            </span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          {#if !field.isGrowth && hasGrowthChildren(field.key)}
            <button
              type="button"
              class="cursor-pointer w-5 h-5 inline-flex items-center justify-center rounded border border-transparent transition-colors"
              aria-label={(isGrowthActive(field.key)
                ? stock_detail_financials_hide_growth
                : stock_detail_financials_show_growth)({
                metric: field.displayLabel ?? field.label,
              })}
              aria-pressed={isGrowthActive(field.key)}
              on:click|stopPropagation={() => toggleGrowthVisibility(field.key)}
              title={(isGrowthActive(field.key)
                ? stock_detail_financials_hide_growth
                : stock_detail_financials_show_growth)({
                metric: field.displayLabel ?? field.label,
              })}
            >
              <GrowthRate class="w-4 h-4 text-gray-500 dark:text-zinc-300" />
            </button>
          {/if}

          {#if onExpandChart}
            <!-- Use external modal (FinancialChartModal) when handler provided -->
            <button
              type="button"
              on:click={() =>
                onExpandChart(
                  field.growthOf || field.key,
                  field.displayLabel ?? field.label,
                )}
              class="cursor-pointer inline-block"
              aria-label={stock_detail_financials_expand_chart()}
            >
              <svg
                class="w-5 h-5 text-gray-500 dark:text-zinc-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g><g id="SVGRepo_iconCarrier">
                  <path
                    d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </g></svg
              >
            </button>
          {/if}
        </div>
      </td>
      {#each data as item}
        <td
          class={`text-sm sm:text-[0.95rem] text-end border-r border-line  tabular-nums ${field.isGrowth ? getGrowthDeltaClass(item[field.key]) : ""}`}
        >
          {formatValue(item[field.key], field.isMargin)}
        </td>
      {/each}
      {#if showUpgradeColumn}
        <td
          class="text-xs sm:text-sm text-end border-r border-line"
        >
          <a
            class="inline-flex w-full items-center justify-end gap-1 font-semibold text-fg-muted hover:text-accent transition-colors"
            href={localizedHref(upgradeHref)}
            on:click|preventDefault={goToUpgrade}
          >
            {upgradeLabel}
            <svg
              class="ml-1 size-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              style="max-width: 40px;"
            >
              <path
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              >
              </path>
            </svg>
          </a>
        </td>
      {/if}
    </tr>
  {/if}
{/each}

<style>
  .heartbeat {
    animation: heartbeat-animation 0.3s;
    animation-timing-function: ease-in-out;
  }

  @keyframes heartbeat-animation {
    0% {
      transform: rotate(0deg) scale(0.95);
    }
    25% {
      transform: rotate(10deg) scale(1.05);
    }
    50% {
      transform: rotate(0deg) scale(1.2);
    }
    75% {
      transform: rotate(-10deg) scale(1.05);
    }
    100% {
      transform: rotate(0deg) scale(0.95);
    }
  }
</style>
