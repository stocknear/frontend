import { postAPI } from "$lib/server/api";

function parseDataArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Strip notes for initial load — send hasNote flag instead */
function stripNotes(data: any[]): any[] {
  return data.map((d) => {
    const { note, ...rest } = d;
    return {
      ...rest,
      hasNote: Boolean(note && typeof note === "string" && note.trim().length > 0),
    };
  });
}

export const load = async ({ locals }) => {
  const { pb, user } = locals;

  const getOptionsWatchlist = async () => {
    if (!user?.id || user?.tier !== "Pro") {
      return { data: [] };
    }

    try {
      const records = await pb.collection("optionsWatchlist").getFullList({
        filter: `user="${user?.id}"`,
      });
      const record = records?.at(0);

      if (!record) {
        return { data: [] };
      }

      const data = parseDataArray(record.data);

      return {
        ...record,
        data: stripNotes(data),
      };
    } catch (e) {
      return { data: [] };
    }
  };

  const watchlistResult = await getOptionsWatchlist();

  // SSR enrichment: fetch latest contract prices in a single batch call
  const enrichWatchlist = async (): Promise<Record<string, any>> => {
    if (user?.tier !== "Pro") return {};

    const items = watchlistResult?.data ?? [];
    if (items.length === 0) return {};

    // Compute DTE, prioritize non-expired contracts
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const withDTE = items.map((item: any) => {
      if (!item.date_expiration) return { ...item, dte: null };
      const expiry = new Date(item.date_expiration);
      expiry.setHours(0, 0, 0, 0);
      const dte = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { ...item, dte };
    });

    const nonExpired = withDTE.filter(
      (i: any) => i.dte === null || i.dte >= 0,
    );
    const expired = withDTE.filter(
      (i: any) => i.dte !== null && i.dte < 0,
    );
    const toEnrich = [...nonExpired, ...expired];

    // Deduplicate by option_symbol
    const uniqueContracts: { ticker: string; contract: string }[] = [];
    const seen = new Set<string>();
    for (const item of toEnrich) {
      if (item.option_symbol && !seen.has(item.option_symbol)) {
        seen.add(item.option_symbol);
        uniqueContracts.push({
          ticker: item.ticker,
          contract: item.option_symbol,
        });
      }
    }

    if (uniqueContracts.length === 0) return {};

    try {
      const batchResult = await postAPI(
        locals,
        "/options-contract-history",
        { batch: true, contracts: uniqueContracts },
      );

      const enrichmentData: Record<string, any> = {};
      for (const item of toEnrich) {
        const contractData = batchResult?.[item.option_symbol];
        if (contractData) {
          const currentPrice =
            contractData.close ?? contractData.mark ?? null;
          const entryPrice = item.price;
          const currentOI = contractData.open_interest ?? null;
          const currentVol = contractData.volume ?? null;
          enrichmentData[item.id] = {
            currentPrice,
            iv: contractData.implied_volatility ?? null,
            delta: contractData.delta ?? null,
            volume: currentVol,
            openInterest: currentOI,
            pctChange:
              currentPrice != null && entryPrice > 0
                ? ((currentPrice - entryPrice) / entryPrice) * 100
                : null,
            oiChange:
              currentOI != null && item.open_interest > 0
                ? ((currentOI - item.open_interest) / item.open_interest) * 100
                : null,
            volChange:
              currentVol != null && item.volume > 0
                ? ((currentVol - item.volume) / item.volume) * 100
                : null,
            status: "done",
          };
        } else {
          enrichmentData[item.id] = {
            currentPrice: null,
            iv: null,
            delta: null,
            volume: null,
            openInterest: null,
            pctChange: null,
            oiChange: null,
            volChange: null,
            status: "error",
          };
        }
      }
      return enrichmentData;
    } catch (e) {
      console.error("Failed to enrich watchlist:", e);
      return {};
    }
  };

  return {
    getOptionsWatchlist: watchlistResult,
    enrichmentData: await enrichWatchlist(),
  };
};
