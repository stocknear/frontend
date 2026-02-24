import type { RequestHandler } from "./$types";

const MAX_DOWNLOAD_CREDITS = 500;

const SCREENER_CONFIG: Record<string, { tiers: string[]; creditCost: number }> = {
  "stock": { tiers: ["Pro", "Plus"], creditCost: 0 },
  "etf": { tiers: ["Pro", "Plus"], creditCost: 0 },
  "options": { tiers: ["Pro"], creditCost: 3 },
  "covered-call": { tiers: ["Pro"], creditCost: 3 },
  "cash-secured-put": { tiers: ["Pro"], creditCost: 3 },
  "options-flow": { tiers: ["Pro"], creditCost: 3 },
  "unusual-order-flow": { tiers: ["Pro"], creditCost: 3 },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: RequestHandler = async ({ locals, request }) => {
  const { user, pb, clientIp } = locals;

  let body: { screener?: string } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const screener = body?.screener;
  const config = screener ? SCREENER_CONFIG[screener] : undefined;
  if (!screener || !config) {
    return json({ error: "Invalid screener type." }, 400);
  }

  const { tiers: allowedTiers, creditCost } = config;

  if (!user) {
    return json({ error: "Authentication required." }, 401);
  }

  if (!allowedTiers.includes(user?.tier)) {
    const tierLabel = allowedTiers.length === 1 ? allowedTiers[0] : allowedTiers.join(" or ");
    return json(
      { error: `This feature is available for ${tierLabel} members only.` },
      403,
    );
  }

  const latestDownloadCredits = Number(user?.downloadCredits ?? 0);
  if (
    Number.isFinite(latestDownloadCredits) &&
    latestDownloadCredits > MAX_DOWNLOAD_CREDITS
  ) {
    return json(
      {
        error:
          "Abusive usage detected. Please read our Terms of Service to understand more.",
      },
      400,
    );
  }

  let updatedUser: Record<string, any> | undefined;

  if (creditCost > 0) {
    const currentCredits = Number(user?.credits ?? 0);
    if (!Number.isFinite(currentCredits) || currentCredits < creditCost) {
      return json(
        {
          error: `Insufficient credits. Your current balance is ${Number.isFinite(currentCredits) ? currentCredits : 0}. This export costs ${creditCost} credits.`,
        },
        400,
      );
    }

    let updatedCreditsUser;
    try {
      updatedCreditsUser = await pb.collection("users").update(user.id, {
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

      console.error(
        `Failed to deduct ${screener} screener export credits:`,
        error,
      );
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

    if ((updatedCreditsUser?.credits ?? 0) < 0) {
      try {
        await pb.collection("users").update(user.id, {
          "credits+": creditCost,
        });
      } catch (rollbackError) {
        console.error(
          `Failed to rollback ${screener} screener export credits:`,
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

    updatedUser = updatedCreditsUser;
  }

  try {
    updatedUser = await pb.collection("users").update(user.id, {
      "downloadCredits+": 1,
    });

    if ((updatedUser?.downloadCredits ?? 0) > MAX_DOWNLOAD_CREDITS) {
      try {
        const rollbackFields: Record<string, number> = { "downloadCredits-": 1 };
        if (creditCost > 0) {
          rollbackFields["credits+"] = creditCost;
        }
        await pb.collection("users").update(user.id, rollbackFields);
      } catch (rollbackError) {
        console.error(
          `Failed to rollback ${screener} screener export after downloadCredits limit:`,
          rollbackError,
        );
      }

      return json(
        {
          error:
            "Abusive usage detected. Please read our Terms of Service to understand more.",
        },
        400,
      );
    }
  } catch (downloadCreditError) {
    console.error(
      `Failed to update ${screener} screener downloadCredits:`,
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
        `Failed to update user info for ${screener} screener export:`,
        error,
      );
    }
  }

  return json({
    success: true,
    creditsDeducted: creditCost,
    remainingCredits: updatedUser?.credits ?? user?.credits,
    downloadCredits: updatedUser?.downloadCredits ?? user?.downloadCredits,
  });
};
