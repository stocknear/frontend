import { redirect, error } from "@sveltejs/kit";

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export const load = async ({ locals, url }) => {
  const { pb, user } = locals;

  if (!pb.authStore.isValid) {
    throw redirect(303, "/login");
  }

  const userId = user?.id;

  if (!userId) {
    throw redirect(303, "/login");
  }

  const getNotificationChannels = async () => {
    try {
      return await pb
        .collection("notificationChannels")
        .getFirstListItem(`user="${userId}"`);
    } catch (err: any) {
      if (err?.status !== 404) {
        console.error("Failed to load notification channels", err);
        throw err;
      }

      try {
        const existingRecords = await pb
          .collection("notificationChannels")
          .getList(1, 1);

        const sampleRecord = existingRecords?.items?.[0];

        const defaultValues = sampleRecord
          ? Object.keys(sampleRecord).reduce<Record<string, boolean>>(
              (acc, key) => {
                if (typeof sampleRecord[key] === "boolean") {
                  acc[key] = true;
                }
                return acc;
              },
              {},
            )
          : {
              earningsSurprise: true,
              wiim: true,
              topAnalyst: true,
            };

        defaultValues.user = userId;

        return await pb.collection("notificationChannels").create(defaultValues);
      } catch (creationError) {
        console.error(
          "Unable to create default notification channel settings",
          creationError,
        );
        throw creationError;
      }
    }
  };

  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const perPageParam = Number(url.searchParams.get("perPage") ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const requestedPerPage =
    Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : DEFAULT_PAGE_SIZE;
  const perPage = PAGE_SIZES.includes(requestedPerPage)
    ? requestedPerPage
    : DEFAULT_PAGE_SIZE;

  try {
    const [result, notificationChannels] = await Promise.all([
      pb.collection("notifications").getList(page, perPage, {
        filter: `user="${userId}"`,
        expand: "user",
        sort: "-created",
      }),
      getNotificationChannels().catch((channelError) => {
        console.error(channelError);
        return null;
      }),
    ]);

    const items = result?.items ?? [];
    const totalItems = result?.totalItems ?? items.length ?? 0;
    const totalPages =
      result?.totalPages ??
      Math.max(1, Math.ceil(totalItems / (result?.perPage ?? perPage)));

    return {
      notifications: {
        items,
        page: result?.page ?? page,
        perPage: result?.perPage ?? perPage,
        totalItems,
        totalPages,
      },
      notificationChannels,
    };
  } catch (err) {
    console.error("Failed to load notifications", err);
    throw error(500, "Unable to load notifications");
  }
};
