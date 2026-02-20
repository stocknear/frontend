import type { RequestHandler } from "./$types";
import {
  OPTIONS_SCREENER_EXPORT_CREDIT_MAX,
  OPTIONS_SCREENER_EXPORT_CREDIT_MIN,
  calculateOptionsScreenerExportCredits,
} from "$lib/utils";

const MAX_DOWNLOAD_CREDITS = 500;
const DEFAULT_SORT_KEY = "totalPrem";
const ALLOWED_TABS = new Set(["general", "filters", "greeks"]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sanitizeRules(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (rule) =>
        rule &&
        typeof rule === "object" &&
        typeof (rule as { name?: unknown })?.name === "string",
    )
    .map((rule) => {
      const typedRule = rule as {
        name: string;
        condition?: unknown;
        value?: unknown;
      };
      return {
        name: typedRule.name,
        condition:
          typeof typedRule.condition === "string" ? typedRule.condition : "",
        value: typedRule.value,
      };
    })
    .slice(0, 100);
}

function sanitizeDisplayColumns(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 100);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb, clientIp } = locals;

  if (!user) {
    return json({ error: "Authentication required." }, 401);
  }

  if (user?.tier !== "Pro") {
    return json(
      { error: "This feature is available for Pro members only." },
      403,
    );
  }

  if ((user?.downloadCredits ?? 0) > MAX_DOWNLOAD_CREDITS) {
    return json(
      {
        error:
          "Abusive usage detected. Please read our Terms of Service to understand more.",
      },
      400,
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const sortKey =
    typeof payload?.sortKey === "string" && payload?.sortKey.trim().length > 0
      ? payload.sortKey.trim()
      : DEFAULT_SORT_KEY;
  const sortOrder = payload?.sortOrder === "asc" ? "asc" : "desc";
  const tab =
    typeof payload?.tab === "string" && ALLOWED_TABS.has(payload.tab)
      ? payload.tab
      : "general";
  const search =
    typeof payload?.search === "string" ? payload.search.trim() : "";
  const rules = sanitizeRules(payload?.rules);
  const displayColumns = sanitizeDisplayColumns(payload?.displayColumns);

  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
    sortKey,
    sortOrder,
    tab,
    subscriber: "Pro",
  });

  if (search.length > 0) {
    params.set("search", search);
  }

  if (rules.length > 0) {
    params.set("rules", JSON.stringify(rules));
  }

  if (displayColumns.length > 0) {
    params.set("displayColumns", displayColumns.join(","));
  }

  const feedResponse = await fetch(
    `${apiURL}/options-screener-feed?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    },
  );

  if (!feedResponse.ok) {
    const errorText = await feedResponse.text();
    return json(
      {
        error:
          errorText?.trim()?.length > 0
            ? errorText
            : "Failed to validate options screener export.",
      },
      500,
    );
  }

  let feedData: any = {};
  try {
    feedData = await feedResponse.json();
  } catch {
    return json({ error: "Invalid response while validating export." }, 500);
  }
  const totalItems = Number(feedData?.total ?? 0);

  if (!Number.isFinite(totalItems) || totalItems <= 0) {
    return json({ error: "No data available to export." }, 400);
  }

  const creditCost = calculateOptionsScreenerExportCredits(totalItems);
  const currentCredits = Number(user?.credits ?? 0);

  if (!Number.isFinite(currentCredits) || currentCredits < creditCost) {
    return json(
      {
        error: `Insufficient credits. Your current balance is ${Number.isFinite(currentCredits) ? currentCredits : 0}. This export costs ${creditCost} credits.`,
      },
      400,
    );
  }

  let updatedUser;
  try {
    updatedUser = await pb.collection("users").update(user.id, {
      "credits-": creditCost,
    });
  } catch (error) {
    const statusCode = (error as { status?: number })?.status;
    const originalMessage = (error as { message?: string })?.message ?? "";
    const rawMessage = originalMessage.toLowerCase();
    const validationData = (error as { data?: Record<string, unknown> })?.data;
    const hasCreditsValidationError =
      typeof validationData === "object" &&
      validationData !== null &&
      "credits" in validationData;

    if (
      statusCode === 400 &&
      (hasCreditsValidationError || rawMessage.includes("credit"))
    ) {
      return json(
        {
          error: `Insufficient credits. Your current balance is ${currentCredits}. This export costs ${creditCost} credits.`,
        },
        400,
      );
    }

    if (statusCode === 403) {
      return json(
        {
          error:
            "Permission denied while updating credits. Please sign in again and retry.",
        },
        403,
      );
    }

    if (statusCode === 400 && originalMessage.trim().length > 0) {
      return json({ error: originalMessage }, 400);
    }

    console.error("Failed to deduct options screener export credits:", error);
    return json(
      {
        error:
          originalMessage.trim().length > 0
            ? originalMessage
            : "Failed to process export. Please try again.",
      },
      500,
    );
  }

  if ((updatedUser?.credits ?? 0) < 0) {
    try {
      await pb.collection("users").update(user.id, {
        "credits+": creditCost,
      });
    } catch (rollbackError) {
      console.error(
        "Failed to rollback options screener export credits:",
        rollbackError,
      );
    }

    return json(
      {
        error: `Insufficient credits. You need ${creditCost} credits.`,
      },
      400,
    );
  }

  let currentDownloadCredits = Number(
    updatedUser?.downloadCredits ?? user?.downloadCredits ?? 0,
  );
  if (!Number.isFinite(currentDownloadCredits)) {
    currentDownloadCredits = Number(user?.downloadCredits ?? 0);
  }
  currentDownloadCredits = Math.max(0, currentDownloadCredits) + 1;

  try {
    updatedUser = await pb.collection("users").update(user.id, {
      downloadCredits: currentDownloadCredits,
    });
  } catch (downloadCreditError) {
    console.error(
      "Failed to update options screener downloadCredits:",
      downloadCreditError,
    );
  }

  const ipAddress =
    typeof clientIp === "string" && clientIp.trim().length > 0
      ? clientIp.trim()
      : undefined;

  if (ipAddress) {
    try {
      let userInfo;
      try {
        userInfo = await pb
          .collection("userInfo")
          .getFirstListItem(`user="${user.id}"`);
      } catch (error) {
        const statusCode = (error as { status?: number })?.status;
        if (statusCode !== 404) {
          throw error;
        }
      }

      if (userInfo) {
        await pb.collection("userInfo").update(userInfo.id, { ipAddress });
      } else {
        await pb.collection("userInfo").create({
          user: user.id,
          ipAddress,
        });
      }
    } catch (error) {
      console.error(
        "Failed to update user info for options screener export:",
        error,
      );
    }
  }

  return json({
    success: true,
    creditsDeducted: creditCost,
    remainingCredits: updatedUser?.credits ?? user?.credits,
    downloadCredits: updatedUser?.downloadCredits ?? user?.downloadCredits,
    totalItems,
    minCredits: OPTIONS_SCREENER_EXPORT_CREDIT_MIN,
    maxCredits: OPTIONS_SCREENER_EXPORT_CREDIT_MAX,
  });
};
