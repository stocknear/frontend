import type { RequestHandler } from "./$types";
import {
  adjustPocketBaseCredits,
  PocketBasePrivateError,
} from "$lib/server/pocketbasePrivate";

const MAX_DOWNLOAD_CREDITS = 500;

const SCREENER_CONFIG: Record<string, { tiers: string[]; creditCost: number }> =
  {
    stock: { tiers: ["Pro", "Plus"], creditCost: 0 },
    etf: { tiers: ["Pro", "Plus"], creditCost: 0 },
    options: { tiers: ["Pro"], creditCost: 3 },
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
    const tierLabel =
      allowedTiers.length === 1 ? allowedTiers[0] : allowedTiers.join(" or ");
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

  let updatedUser;
  try {
    updatedUser = await adjustPocketBaseCredits({
      userId: user.id,
      creditsDelta: -creditCost,
      downloadCreditsDelta: 1,
    });
  } catch (error) {
    if (error instanceof PocketBasePrivateError && error.status === 409) {
      return json(
        { error: `Insufficient credits. You need ${creditCost} credits.` },
        400,
      );
    }
    console.error(`Failed to account for ${screener} screener export`, {
      status:
        error instanceof PocketBasePrivateError ? error.status : undefined,
    });
    return json({ error: "Failed to process export. Please try again." }, 500);
  }

  if (updatedUser.downloadCredits > MAX_DOWNLOAD_CREDITS) {
    try {
      await adjustPocketBaseCredits({
        userId: user.id,
        creditsDelta: creditCost,
        downloadCreditsDelta: -1,
      });
    } catch {
      console.error(`Failed to rollback ${screener} export accounting`);
    }
    return json(
      {
        error:
          "Abusive usage detected. Please read our Terms of Service to understand more.",
      },
      400,
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
