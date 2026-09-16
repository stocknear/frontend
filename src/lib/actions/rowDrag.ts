import { writable, type Readable } from "svelte/store";

export type RowDragState = {
  /** Key of the row being dragged, or null. */
  dragging: string | null;
  /** Key of the row currently under the cursor, or null. */
  overKey: string | null;
  /** True when the drop lands below the hovered row rather than above it. */
  overBelow: boolean;
};

export type RowDragParams = { key: string; enabled: boolean };

const IDLE: RowDragState = { dragging: null, overKey: null, overBelow: false };

/**
 * Native HTML5 row reordering, keyed on row identity rather than index so
 * pagination and filtering cannot shift the wrong row.
 *
 * `handle` goes on the grip, `row` on the row it belongs to. The drop lands on
 * the hovered row's own position — below it when dragging down, above when
 * dragging up — and `state.overBelow` reports which, so the preview cannot
 * disagree with the result.
 *
 * ponytail: native DnD, no library. Keyboard reordering is the one thing it
 * does not give us; swap the engine here if that becomes a requirement.
 */
export function createRowDrag(
  onDrop: (fromKey: string, toKey: string) => void,
) {
  const state = writable<RowDragState>(IDLE);
  let draggedKey: string | null = null;
  let draggedRow: HTMLElement | null = null;

  const reset = () => {
    draggedKey = null;
    draggedRow = null;
    state.set(IDLE);
  };

  function handle(node: HTMLElement, params: RowDragParams) {
    let current = params;

    const onDragStart = (event: DragEvent) => {
      if (!current.enabled) return;
      draggedKey = current.key;
      draggedRow = node?.closest("tr");
      state.set({ dragging: current.key, overKey: null, overBelow: false });
      if (!event.dataTransfer) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", current.key);
      // The handle is a small grip, so drag the row it belongs to.
      if (draggedRow) {
        event.dataTransfer.setDragImage(
          draggedRow,
          12,
          draggedRow.clientHeight / 2,
        );
      }
    };

    const sync = () => {
      node.draggable = current.enabled;
    };

    node.addEventListener("dragstart", onDragStart);
    sync();

    return {
      update(next: RowDragParams) {
        current = next;
        sync();
      },
      destroy() {
        node.removeEventListener("dragstart", onDragStart);
      },
    };
  }

  function row(node: HTMLElement, params: RowDragParams) {
    let current = params;

    const onDragOver = (event: DragEvent) => {
      if (!current.enabled || draggedKey === null) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (current.key === draggedKey) {
        state.update((value) => ({ ...value, overKey: null }));
        return;
      }
      // Ask the DOM which way we are going instead of tracking indices.
      const below = !!(
        draggedRow?.compareDocumentPosition(node) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
      state.set({
        dragging: draggedKey,
        overKey: current.key,
        overBelow: below,
      });
    };

    const onDragLeave = (event: DragEvent) => {
      if (!node?.contains(event.relatedTarget as Node)) {
        state.update((value) => ({ ...value, overKey: null }));
      }
    };

    const onDropEvent = (event: DragEvent) => {
      if (!current.enabled || draggedKey === null) return;
      event.preventDefault();
      const fromKey = draggedKey;
      const toKey = current.key;
      reset();
      if (fromKey !== toKey) onDrop(fromKey, toKey);
    };

    const onDragEnd = () => reset();

    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDropEvent);
    node.addEventListener("dragend", onDragEnd);

    return {
      update(next: RowDragParams) {
        current = next;
      },
      destroy() {
        node.removeEventListener("dragover", onDragOver);
        node.removeEventListener("dragleave", onDragLeave);
        node.removeEventListener("drop", onDropEvent);
        node.removeEventListener("dragend", onDragEnd);
      },
    };
  }

  return { handle, row, state: state as Readable<RowDragState> };
}
