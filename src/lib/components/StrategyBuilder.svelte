<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fly } from "svelte/transition";
    import Trash2 from "lucide-svelte/icons/trash-2";
    import Plus from "lucide-svelte/icons/plus";
    import ChevronDown from "lucide-svelte/icons/chevron-down";

    import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
    import { Button } from "$lib/components/shadcn/button/index.js";

    const dispatch = createEventDispatcher();

    export let strategyBlocks = [];
    export let availableIndicators = {};
    export let mode = "buy"; // 'buy' or 'sell'

    // Modal state for indicator selection
    let currentEditingBlockId = null;

    // IndicatorModal variables
    let searchTerm = "";
    let selectedIndicator = "price";

    // Local source of truth for the UI (prevents parent overwrite glitches)
    let localSelected: string = selectedIndicator || "price";

    // Keep local in sync when parent changes the prop
    $: if (selectedIndicator && selectedIndicator !== localSelected) {
        localSelected = selectedIndicator;
    }

    // Update selectedIndicator when we start editing a block
    $: if (currentEditingBlockId) {
        const currentBlock = strategyBlocks.find(
            (b) => b.id === currentEditingBlockId,
        );
        if (currentBlock) {
            selectedIndicator = currentBlock.indicator || "price";
            localSelected = selectedIndicator;
        }
    }

    // If local becomes empty for any reason → fallback to "price"
    $: if (!localSelected) {
        localSelected = "price";
    }

    // IndicatorModal reactive statements
    // Group indicators by category
    $: groupedIndicators = Object.entries(availableIndicators).reduce(
        (acc: Record<string, any[]>, [key, config]: [string, any]) => {
            const category = config?.category || "Other";
            (acc[category] ||= []).push({ key, ...config });
            return acc;
        },
        {},
    );

    // Filter indicators based on search
    $: filteredGroupedIndicators = Object.entries(groupedIndicators).reduce(
        (
            acc: Record<string, any[]>,
            [category, indicators]: [string, any[]],
        ) => {
            const filtered = indicators.filter(
                (indicator) =>
                    indicator.label
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    indicator.key
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
            if (filtered.length > 0) acc[category] = filtered;
            return acc;
        },
        {},
    );

    // Count total indicators
    $: totalIndicators = Object.values(availableIndicators).length;

    // Block types
    const BLOCK_TYPES = {
        CONDITION: "condition",
        LOGIC: "logic",
        GROUP: "group",
    };

    // Logic operators
    const LOGIC_OPERATORS = {
        AND: "AND",
        OR: "OR",
    };

    let blockIdCounter = 0;

    // Generate unique IDs using timestamp and counter to avoid duplicates
    function generateUniqueId() {
        let newId;
        do {
            newId = `block_${Date.now()}_${blockIdCounter++}`;
        } while (strategyBlocks.some((block) => block.id === newId));
        return newId;
    }

    // Initialize with empty blocks by default
    if (strategyBlocks.length === 0) {
        strategyBlocks = [];
    }

    function createConditionBlock(
        indicator = "price",
        operator = null,
        value = null,
    ) {
        const id = generateUniqueId();
        const config = getIndicatorConfig(indicator);

        // Use config defaults if not provided
        const finalOperator = operator || config.defaultOperator || "equals";
        let finalValue = value;

        if (finalValue === null) {
            if (Array.isArray(config.defaultValue)) {
                // For array defaultValue, use the first option
                finalValue = config.defaultValue[0];
            } else {
                // For numeric defaultValue, use the number directly
                finalValue = config.defaultValue;
            }
        }

        return {
            id,
            type: BLOCK_TYPES.CONDITION,
            indicator,
            operator: finalOperator,
            value: finalValue,
            logicOperator: null,
        };
    }

    function createGroupBlock() {
        const id = generateUniqueId();
        return {
            id,
            type: BLOCK_TYPES.GROUP,
            children: [createConditionBlock()],
            logicOperator: LOGIC_OPERATORS.AND,
        };
    }

    function addBlock(type = BLOCK_TYPES.CONDITION) {
        let newBlock;

        switch (type) {
            case BLOCK_TYPES.CONDITION:
                newBlock = createConditionBlock();
                break;
            case BLOCK_TYPES.GROUP:
                newBlock = createGroupBlock();
                break;
            default:
                return;
        }

        // Add logic operator to previous block if needed
        if (strategyBlocks.length > 0) {
            const lastBlock = strategyBlocks[strategyBlocks.length - 1];
            if (!lastBlock.logicOperator) {
                lastBlock.logicOperator = LOGIC_OPERATORS.AND;
            }
        }

        strategyBlocks = [...strategyBlocks, newBlock];
        dispatch("change", { blocks: strategyBlocks });
    }

    function removeBlock(blockId) {
        const index = strategyBlocks.findIndex((b) => b.id === blockId);
        if (index > -1) {
            strategyBlocks.splice(index, 1);
            // Remove logic operator from previous block if it's now the last
            if (index > 0 && index === strategyBlocks.length) {
                strategyBlocks[index - 1].logicOperator = null;
            }
            strategyBlocks = [...strategyBlocks];
            dispatch("change", { blocks: strategyBlocks });
        }
    }

    function updateBlock(blockId, updates) {
        const block = strategyBlocks.find((b) => b.id === blockId);
        if (block) {
            Object.assign(block, updates);
            strategyBlocks = [...strategyBlocks];
            dispatch("change", { blocks: strategyBlocks });
        }
    }

    function handleIndicatorSelect(event) {
        const { indicator } = event.detail;
        if (currentEditingBlockId) {
            const newConfig = getIndicatorConfig(indicator);
            let newValue;

            if (Array.isArray(newConfig.defaultValue)) {
                newValue = newConfig.defaultValue[0];
            } else {
                newValue = newConfig.defaultValue;
            }

            updateBlock(currentEditingBlockId, {
                indicator: indicator,
                operator: newConfig.defaultOperator || "equals",
                value: newValue,
            });
        }
        currentEditingBlockId = null;
        closeIndicatorModal();
    }

    function handleIndicatorModalClose() {
        currentEditingBlockId = null;
        closeIndicatorModal();
    }

    function selectIndicator(key: string) {
        // Toggle: clicking same one switches to "price" (no "all unchecked" state visible)
        localSelected = localSelected === key ? "price" : key;
        selectedIndicator = localSelected;

        // Handle the selection if we're editing a block
        if (currentEditingBlockId) {
            const newConfig = getIndicatorConfig(selectedIndicator);
            let newValue;

            if (Array.isArray(newConfig.defaultValue)) {
                newValue = newConfig.defaultValue[0];
            } else {
                newValue = newConfig.defaultValue;
            }

            updateBlock(currentEditingBlockId, {
                indicator: selectedIndicator,
                operator: newConfig.defaultOperator || "equals",
                value: newValue,
            });
        }

        // Don't close the modal - let user continue browsing/selecting
    }

    function closeIndicatorModal() {
        searchTerm = "";
        currentEditingBlockId = null;
    }

    function updateLogicOperator(blockId, operator) {
        const block = strategyBlocks.find((b) => b.id === blockId);
        if (block) {
            block.logicOperator = operator;
            strategyBlocks = [...strategyBlocks];
            dispatch("change", { blocks: strategyBlocks });
        }
    }

    // Get indicator configuration
    function getIndicatorConfig(indicatorKey) {
        return (
            availableIndicators[indicatorKey] || {
                label: indicatorKey,
                operators: ["equals"],
                defaultValue: 0,
            }
        );
    }

    // Convert blocks to conditions format for backend
    export function getConditions() {
        return strategyBlocks
            .map((block, index) => {
                if (block.type === BLOCK_TYPES.CONDITION) {
                    return {
                        indicator: block.indicator,
                        operator: block.operator,
                        value: block.value,
                        connector: block.logicOperator
                            ? block.logicOperator.toLowerCase()
                            : null,
                    };
                } else if (block.type === BLOCK_TYPES.GROUP) {
                    return {
                        type: "group",
                        operator: block.logicOperator,
                        conditions: block.children.map((child) => ({
                            indicator: child.indicator,
                            operator: child.operator,
                            value: child.value,
                        })),
                    };
                }
            })
            .filter(Boolean);
    }
</script>

<div class="">
    <div
        class="flex flex-col sm:flex-row justify-start w-full sm:justify-between items-start sm:items-center mb-4"
    >
        <h3 class="text-lg font-semibold capitalize mb-5 sm:mb-0">
            Define {mode} conditions
        </h3>
        <div class="flex gap-2 ml-auto sm:ml-0">
            <button
                class="cursor-pointer flex items-center gap-1.5 px-2 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded text-sm font-medium transition-colors"
                on:click={() => {
                    addBlock(BLOCK_TYPES.CONDITION);
                }}
            >
                <Plus size={16} />
                <span class="mr-1">Add Block</span>
            </button>
            <button
                class="cursor-pointer inline-flex items-center text-sm gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors"
                on:click={() => {
                    dispatch("runBacktest");
                }}
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
                Run Backtest
            </button>
        </div>
    </div>

    {#if strategyBlocks?.length > 0}
        <div
            class="overflow-x-auto border border-gray-300 dark:border-gray-800 rounded bg-[#F8F9FA] dark:bg-secondary"
        >
            <table
                class="min-w-full divide-y divide-gray-200 dark:divide-gray-600"
            >
                <!-- Table head -->
                <thead class="bg-gray-50 dark:bg-secondary">
                    <tr>
                        <th
                            scope="col"
                            class="px-4 py-1.5 text-left text-sm font-semibold"
                        >
                            Indicator
                        </th>
                        <th
                            scope="col"
                            class="px-4 py-1.5 text-left text-sm font-semibold"
                        >
                            Operator
                        </th>
                        <th
                            scope="col"
                            class="px-4 py-1.5 text-left text-sm font-semibold"
                        >
                            Value
                        </th>
                        <th
                            scope="col"
                            class="px-4 py-1.5 text-left text-sm font-semibold"
                        >
                            Logic
                        </th>
                        <th
                            scope="col"
                            class="px-4 py-1.5 text-sm font-semibold w-8"
                        ></th>
                    </tr>
                </thead>

                <!-- Table body -->
                <tbody
                    class="bg-[#F9FAFB] dark:bg-secondary divide-y divide-gray-200 dark:divide-gray-600 text-sm"
                >
                    {#each strategyBlocks as block, index (block.id)}
                        {#if block.type === BLOCK_TYPES.CONDITION}
                            <tr>
                                <!-- Indicator Selection -->
                                <td class="px-4 py-2">
                                    <label
                                        for="indicatorModal"
                                        class="w-60 justify-between inline-flex items-center border-none bg-black text-white sm:hover:bg-default px-3 py-2 text-sm h-[35px] rounded cursor-pointer"
                                        on:click={() => {
                                            currentEditingBlockId = block.id;
                                        }}
                                    >
                                        <span class="truncate">
                                            {getIndicatorConfig(block.indicator)
                                                .label}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            class="ml-2 opacity-50"
                                        />
                                    </label>
                                </td>

                                <!-- Operator Selection -->
                                <td class="px-4 py-2">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            asChild
                                            let:builder
                                        >
                                            <Button
                                                builders={[builder]}
                                                class="cursor-pointer w-40 justify-between border-none bg-black text-white sm:hover:bg-default px-3 py-2 text-sm h-[35px]"
                                            >
                                                <span
                                                    class="capitalize truncate"
                                                    >{block.operator}</span
                                                >
                                                <ChevronDown
                                                    size={16}
                                                    class="ml-2 opacity-50"
                                                />
                                            </Button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content
                                            class="w-40 max-h-[400px] overflow-y-auto scroller "
                                        >
                                            <DropdownMenu.Group>
                                                {#each getIndicatorConfig(block.indicator).operators as op}
                                                    <DropdownMenu.Item
                                                        class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary {block.operator ===
                                                        op
                                                            ? 'bg-gray-100 dark:bg-gray-700'
                                                            : ''}"
                                                        on:click={() => {
                                                            updateBlock(
                                                                block.id,
                                                                {
                                                                    operator:
                                                                        op,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <span class="capitalize"
                                                            >{op}</span
                                                        >
                                                    </DropdownMenu.Item>
                                                {/each}
                                            </DropdownMenu.Group>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </td>

                                <!-- Value Selection/Input -->
                                <td class="px-4 py-2">
                                    {#if Array.isArray(getIndicatorConfig(block.indicator).defaultValue)}
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger
                                                asChild
                                                let:builder
                                            >
                                                <Button
                                                    builders={[builder]}
                                                    class="cursor-pointer w-60 justify-between border-none bg-black text-white sm:hover:bg-default px-3 py-2 text-sm h-[35px]"
                                                >
                                                    <span class="truncate">
                                                        {getIndicatorConfig(
                                                            block.indicator,
                                                        ).valueLabels?.[
                                                            block.value
                                                        ] || block.value}
                                                    </span>
                                                    <ChevronDown
                                                        size={16}
                                                        class="ml-2 opacity-50"
                                                    />
                                                </Button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content
                                                class="w-60 max-h-[400px] overflow-y-auto scroller"
                                            >
                                                <DropdownMenu.Group>
                                                    {#each getIndicatorConfig(block.indicator).defaultValue as option}
                                                        <DropdownMenu.Item
                                                            class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary {block.value ===
                                                            option
                                                                ? 'bg-gray-100 dark:bg-gray-700'
                                                                : ''}"
                                                            on:click={() => {
                                                                updateBlock(
                                                                    block.id,
                                                                    {
                                                                        value: option,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {getIndicatorConfig(
                                                                block.indicator,
                                                            ).valueLabels?.[
                                                                option
                                                            ] || option}
                                                        </DropdownMenu.Item>
                                                    {/each}
                                                </DropdownMenu.Group>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Root>
                                    {:else}
                                        <input
                                            type="number"
                                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-inherit focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={block.value}
                                            min={getIndicatorConfig(
                                                block.indicator,
                                            ).min}
                                            max={getIndicatorConfig(
                                                block.indicator,
                                            ).max}
                                            on:input={(e) =>
                                                updateBlock(block.id, {
                                                    value: parseFloat(
                                                        e.target.value,
                                                    ),
                                                })}
                                        />
                                    {/if}
                                </td>

                                <!-- Logic Operator -->
                                <td class="px-4 py-2">
                                    {#if block.logicOperator && index < strategyBlocks.length - 1}
                                        <button
                                            class="cursor-pointer px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-semibold transition-all hover:bg-gray-800 dark:hover:bg-gray-200"
                                            on:click={() => {
                                                const newOp =
                                                    block.logicOperator ===
                                                    LOGIC_OPERATORS.AND
                                                        ? LOGIC_OPERATORS.OR
                                                        : LOGIC_OPERATORS.AND;
                                                updateLogicOperator(
                                                    block.id,
                                                    newOp,
                                                );
                                            }}
                                        >
                                            {block.logicOperator}
                                        </button>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>

                                <!-- Delete Button -->
                                <td class="px-4 py-2">
                                    <button
                                        class="p-1.5 cursor-pointer"
                                        on:click={() => removeBlock(block.id)}
                                        title="Remove condition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if strategyBlocks.length === 0}
        <div
            class="border border-gray-300 dark:border-gray-600 rounded bg-[#F8F9FA] dark:bg-default p-10 min-h-40 m-auto flex justify-center items-center w-full"
        >
            <div class="text-center">
                <p class="">No conditions added yet</p>
            </div>
        </div>
    {/if}
</div>

<!-- Indicator Modal -->
{#if currentEditingBlockId !== null}
    <input
        type="checkbox"
        id="indicatorModalToggle"
        class="modal-toggle"
        checked
    />

    <dialog id="indicatorModalDialog" class="modal p-2 lg:p-0">
        <!-- Backdrop toggler points to the checkbox above -->
        <label
            for="indicatorModalToggle"
            on:click={closeIndicatorModal}
            class="cursor-pointer modal-backdrop"
        ></label>

        <div
            class="modal-box relative bg-white dark:bg-primary z-20 mx-2 min-h-[30vh] h-[800px] rounded bg-default opacity-100 border border-gray-300 dark:border-gray-600 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto"
        >
            <div class="relative flex flex-col w-full">
                <!-- Sticky Header -->
                <div
                    class="fixed w-full h-fit sticky -top-6 z-40 bg-white dark:bg-primary opacity-100 pb-6 pt-5 border-gray-300 dark:border-gray-600 border-b"
                >
                    <div
                        class="flex flex-row items-center justify-between mb-2"
                    >
                        <h2 class="text-[1rem] sm:text-xl font-semibold">
                            Select Indicator ({totalIndicators} total)
                        </h2>
                        <button
                            on:click={closeIndicatorModal}
                            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem]"
                            aria-label="Close"
                        >
                            <svg
                                class="w-6 h-6 sm:w-8 sm:h-8"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- Search bar -->
                    <form
                        class="w-full h-8"
                        on:keydown={(e) =>
                            e?.key === "Enter" ? e.preventDefault() : ""}
                    >
                        <label for="search" class="sr-only">Search</label>
                        <div class="relative w-full max-w-sm">
                            <div
                                class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
                            >
                                <svg
                                    class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                    />
                                </svg>
                            </div>

                            <div
                                class="absolute inset-y-0 right-0 flex items-center pr-2 {searchTerm?.length >
                                0
                                    ? ''
                                    : 'hidden'}"
                            >
                                <button
                                    on:click={() => (searchTerm = "")}
                                    class="cursor-pointer text-gray-600 dark:text-gray-300"
                                    tabindex="0"
                                    type="button"
                                    aria-label="Clear search"
                                >
                                    <svg
                                        class="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        style="max-width:40px"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <input
                                autocomplete="off"
                                id="search"
                                class="focus:outline-none placeholder-gray-800 dark:placeholder-gray-300 block w-full p-2 ps-10 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-secondary border border-blue-500"
                                placeholder="Search..."
                                bind:value={searchTerm}
                            />
                        </div>
                    </form>
                </div>

                <!-- Content -->
                <div class="">
                    {#each searchTerm?.length !== 0 ? Object.entries(filteredGroupedIndicators) : Object.entries(groupedIndicators) as [category, indicators]}
                        <h4 class="mb-1 font-semibold text-lg mt-5">
                            {category}
                        </h4>
                        <div class="flex flex-wrap">
                            {#each indicators as indicator (indicator.key)}
                                <div
                                    class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
                                >
                                    <!-- Use click instead of change; drive state via localSelected -->
                                    <input
                                        id={indicator.key}
                                        type="checkbox"
                                        on:click={() =>
                                            selectIndicator(indicator.key)}
                                        checked={localSelected ===
                                            indicator.key}
                                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 lg:h-4 lg:w-4"
                                    />
                                    <div class="-mt-0.5">
                                        <label
                                            for={indicator.key}
                                            class="cursor-pointer text-[1rem]"
                                        >
                                            {indicator.label}
                                        </label>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/each}

                    {#if searchTerm?.length > 0 && Object?.entries(filteredGroupedIndicators)?.length === 0}
                        <div class="mt-5 font-semibold text-[1rem] sm:text-lg">
                            Nothing found
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </dialog>
{/if}
<!-- End Indicator Modal -->
