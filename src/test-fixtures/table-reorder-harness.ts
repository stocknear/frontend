import { mount } from "svelte";
import Table from "$lib/components/Table/Table.svelte";

export function mountTableReorderHarness(target: HTMLElement) {
  const orders: string[][] = [];
  (window as any).__reorders = orders;

  // Prices are deliberately out of symbol order so one click on a sortable
  // header produces an observable change.
  mount(Table, {
    target,
    props: {
      data: { user: { tier: "Pro" } },
      rawData: [
        { id: "AAPL", symbol: "AAPL", price: 3, changesPercentage: 1 },
        { id: "AMD", symbol: "AMD", price: 1, changesPercentage: 2 },
        { id: "NVDA", symbol: "NVDA", price: 2, changesPercentage: 3 },
      ],
      onRowReorder: (order: string[]) => orders.push(order),
    },
  });
}
