import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;

  // Cost of generating bull/bear analysis
  const costOfCredit = 2;

  // Check if user has enough credits
  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. This analysis costs ${costOfCredit} credits. Credits are reset at the start of each month.`
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

   if (!['Pro', 'Plus'].includes(user?.tier) ) {
    return new Response(
      JSON.stringify({
        error: `This feature is available exclusively for Subscribers. Please upgrade your plan.`
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const data = await request.json();
    const { portfolioId, holdings } = data;

    if (!portfolioId) {
      return new Response(
        JSON.stringify({ error: "Portfolio ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!holdings || !Array.isArray(holdings) || holdings?.length === 0) {
      return new Response(
        JSON.stringify({ error: "Holdings are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call FastAPI backend with streaming support
    const upstream = await fetch(apiURL + "/portfolio-bull-bear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        portfolioId,
        holdings
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      console.error("FastAPI error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to generate analysis" }),
        { status: upstream.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const decoder = new TextDecoder();
    const upstreamReader = upstream.body.getReader();

    let fullResponse = { bullSay: "", bearSay: "", date: "" };
    let controllerClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Only enqueue if controller is not closed
            if (!controllerClosed) {
              controller.enqueue(chunk);
            }

            // Accumulate full response for server-side saving
            try {
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const parsed = JSON.parse(line);
                    // Check for complete event with final result
                    if (parsed.event === 'complete') {
                      fullResponse = {
                        bullSay: parsed.bullSay || "",
                        bearSay: parsed.bearSay || "",
                        date: new Date().toISOString()
                      };
                    }
                  } catch (e) {
                    // Ignore parse errors for individual lines
                  }
                }
              }
            } catch (e) {
              // Ignore accumulation errors
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          if (!controllerClosed) {
            controller.error(err);
          }
        } finally {
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }

          // Server-side save after streaming completes
          if (fullResponse.bullSay || fullResponse.bearSay) {
            try {
              // Update portfolio in PocketBase with bull/bear data
              await pb.collection("portfolio")?.update(portfolioId, {
                bullBear: JSON.stringify(fullResponse)
              });
            } catch (saveErr) {
              console.error("Server-side save error:", saveErr);
            }
          }
        }
      }
    });

    // Deduct credits from user after starting stream
    await pb.collection("users")?.update(user?.id, {
      credits: user?.credits - costOfCredit,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });

  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to proxy stream" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
