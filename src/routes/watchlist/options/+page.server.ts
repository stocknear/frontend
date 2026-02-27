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

  return {
    getOptionsWatchlist: await getOptionsWatchlist(),
  };
};
