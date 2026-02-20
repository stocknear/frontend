import type { RequestHandler } from "./$types";

const MAX_DOWNLOAD_CREDITS = 500;
const CREDIT_COST = 10;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: RequestHandler = async ({ locals }) => {
  const { user, pb, clientIp } = locals;

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

  const currentCredits = Number(user?.credits ?? 0);
  if (!Number.isFinite(currentCredits) || currentCredits < CREDIT_COST) {
    return json(
      {
        error: `Insufficient credits. Your current balance is ${Number.isFinite(currentCredits) ? currentCredits : 0}. This export costs ${CREDIT_COST} credits.`,
      },
      400,
    );
  }

  let updatedUser;
  try {
    updatedUser = await pb.collection("users").update(user.id, {
      "credits-": CREDIT_COST,
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
          error: `Insufficient credits. Your current balance is ${currentCredits}. This export costs ${CREDIT_COST} credits.`,
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
        "credits+": CREDIT_COST,
      });
    } catch (rollbackError) {
      console.error(
        "Failed to rollback options screener export credits:",
        rollbackError,
      );
    }

    return json(
      {
        error: `Insufficient credits. You need ${CREDIT_COST} credits.`,
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
    creditsDeducted: CREDIT_COST,
    remainingCredits: updatedUser?.credits ?? user?.credits,
    downloadCredits: updatedUser?.downloadCredits ?? user?.downloadCredits,
  });
};
