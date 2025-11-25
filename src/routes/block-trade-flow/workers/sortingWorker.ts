type SortDirection = "asc" | "desc";

interface SortRequest {
  id?: number;
  data?: any[];
  key?: string;
  direction?: SortDirection;
}

const DEFAULT_KEY = "time";
const DEFAULT_DIRECTION: SortDirection = "desc";

function toTimeValue(item: Record<string, any>): number {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const datePart = typeof item.date === "string" ? item.date : "";
  const normalizedDate = Number(datePart.replaceAll("-", "")) || 0;

  const timeString =
    typeof item.time === "string" && item.time.length > 0
      ? item.time
      : "00:00:00";
  const [hours = 0, minutes = 0, seconds = 0] = timeString
    .split(":")
    .map((value) => Number(value) || 0);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Multiply by a large enough factor to keep chronological order intact
  return normalizedDate * 100000 + totalSeconds;
}

function sortByKey(
  dataset: any[],
  key: string = DEFAULT_KEY,
  direction: SortDirection = DEFAULT_DIRECTION,
): any[] {
  if (!Array.isArray(dataset) || dataset.length <= 1) {
    return dataset ?? [];
  }

  const factor = direction === "asc" ? 1 : -1;
  const data = dataset.slice();

  if (key === "time") {
    return data
      .map((item) => ({ item, value: toTimeValue(item) }))
      .sort((a, b) => factor * (a.value - b.value))
      .map((entry) => entry.item);
  }

  return data.sort((a: any, b: any) => {
    const aValue = a?.[key];
    const bValue = b?.[key];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return factor * aValue.localeCompare(bValue);
    }

    return factor * ((Number(aValue) || 0) - (Number(bValue) || 0));
  });
}

onmessage = (event: MessageEvent<SortRequest>) => {
  const { id, data, key = DEFAULT_KEY, direction = DEFAULT_DIRECTION } =
    event.data || {};

  const dataset = Array.isArray(data) ? data : [];
  const sortedData = sortByKey(dataset, key, direction);

  postMessage({ id, sortedData });
};

export {};
