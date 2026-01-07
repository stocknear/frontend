import type { RequestHandler } from "./$types";
import { calculateIntradayExportCredits } from "$lib/utils";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user, pb, clientIp } = locals;

    const ipAddress =
      typeof clientIp === "string" && clientIp?.trim()?.length > 0
        ? clientIp?.trim()
        : undefined;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startDate = data?.startDate;
  const endDate = data?.endDate;

  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ error: "Missing date range." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const creditCost = calculateIntradayExportCredits(startDate, endDate);
  if (user?.credits < creditCost) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This export costs ${creditCost} credits.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const postData = {
    ticker: data?.ticker,
    startDate,
    endDate,
    interval: data?.interval ?? "15min",
  };

  const response = await fetch(apiURL + "/historical-price-interval-export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
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
    });
  } catch (error) {
    console.error("Failed to deduct credits:", error);
  }

  let userInfo;

  try {
    userInfo = await pb
      ?.collection('userInfo')
      ?.getFirstListItem(`user="${user.id}"`);
  } catch (err) {
    if (err.status !== 404) {
      throw err; // real error -> let outer catch handle it
    }
  }


  // 3) Update if exists, otherwise create
  if (userInfo) {
    await pb.collection('userInfo').update(userInfo.id, {
      ipAddress,
    });
  } else {
    await pb.collection('userInfo').create({
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
};
