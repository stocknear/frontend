import type { RequestHandler } from "./$types";
import { calculateIntradayExportCredits } from "$lib/utils";

const ALLOWED_TIERS = new Set(["Plus", "Pro"]);
const ALLOWED_INTERVALS = new Set(["1hour", "30min", "15min", "5min"]);
const RANGE_LIMITS: Record<string, Record<string, number>> = {
  Plus: { "1hour": 1460, "30min": 1460, "15min": 1460, "5min": 30 },
  Pro: { "1hour": 1460, "30min": 1460, "15min": 1460, "5min": 60 },
};

const activeExports = new Map<string, number>();

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user, pb, clientIp } = locals;

  const ipAddress =
    typeof clientIp === "string" && clientIp?.trim()?.length > 0
      ? clientIp?.trim()
      : "unknown";
  const now = Date.now();

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_TIERS.has(user?.tier)) {
    return new Response(
      JSON.stringify({
        error: "This feature is available for Plus and Pro users only.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  if ((user?.downloadCredits ?? 0) > 500) {
    return new Response(
      JSON.stringify({
        error:
          "Abusive usage detected. Please read our Terms of Service to understand more.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const startDate = data?.startDate;
  const endDate = data?.endDate;
  const interval = String(data?.interval ?? "15min").toLowerCase();
  const ticker = String(data?.ticker ?? "").toUpperCase();

  if (!ALLOWED_INTERVALS.has(interval)) {
    return new Response(
      JSON.stringify({ error: "Unsupported interval." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!ticker || !/^[A-Z0-9.\-^]{1,12}$/.test(ticker)) {
    return new Response(JSON.stringify({ error: "Invalid ticker." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ error: "Missing date range." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const today = new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return new Response(JSON.stringify({ error: "Invalid date format." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (start > end) {
    return new Response(
      JSON.stringify({ error: "Start date must be on or before end date." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (end > today) {
    return new Response(
      JSON.stringify({ error: "End date cannot be in the future." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const rangeDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  const tierLimits = RANGE_LIMITS[user?.tier] ?? RANGE_LIMITS.Plus;
  const maxDays = tierLimits[interval] ?? 30;
  if (rangeDays > maxDays) {
    return new Response(
      JSON.stringify({
        error: `Date range too large. Max ${maxDays} days for ${user?.tier}.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const userId = user?.id ?? "anonymous";
  if (activeExports.has(userId)) {
    return new Response(
      JSON.stringify({ error: "Another export is already in progress." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  

  const creditCost = calculateIntradayExportCredits(
    startDate,
    endDate,
    interval,
  );
  if (user?.credits < creditCost) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This export costs ${creditCost} credits.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const postData = {
    ticker,
    startDate,
    endDate,
    interval,
  };

  activeExports.set(userId, now);

  try {
    const response = await fetch(apiURL + "/historical-price-interval-export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ ...postData, userTier: user?.tier, userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
        },
      });
    }

    const contentDisposition =
      response.headers.get("Content-Disposition") ?? "";
    const contentType = response.headers.get("Content-Type") ?? "text/csv";
    const payload = await response.arrayBuffer();

    try {
      await pb?.collection("users")?.update(user?.id, {
        credits: user?.credits - creditCost,
        downloadCredits: (user?.downloadCredits ?? 0) + 1,
      });
    } catch (error) {
      console.error("Failed to deduct credits:", error);
    }

    let userInfo;

    try {
      userInfo = await pb
        ?.collection("userInfo")
        ?.getFirstListItem(`user="${user.id}"`);
    } catch (err) {
      if (err.status !== 404) {
        throw err; // real error -> let outer catch handle it
      }
    }

    // 3) Update if exists, otherwise create
    if (userInfo) {
      await pb.collection("userInfo").update(userInfo.id, {
        ipAddress,
      });
    } else {
      await pb.collection("userInfo").create({
        user: user.id,
        ipAddress,
      });
    }


    return new Response(payload, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } finally {
    activeExports.delete(userId);
  }
};
