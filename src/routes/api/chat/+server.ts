import type { RequestHandler } from "./$types";
import { getCreditFromQuery, agentOptions } from "$lib/utils";


export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb } = locals;
  const { query, chatId, reasoning } = await request.json();

  // simple premium check
  /*
  if (!["Pro", "Plus"].includes(user?.tier)) {
    return new Response(
      JSON.stringify({
        error: "This feature is available exclusively for Plus and Pro members. Please upgrade your account <a href='/pricing' class='text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-500'>here</a> to gain access."
      }),
      { status: 400 }
    );
    
  }
    */
  const multiplier = reasoning === true ? 2 : 1;
  const costOfCredit = getCreditFromQuery(query, agentOptions)*multiplier;
  
  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({
        error: `Insufficient credits. Your current balance is ${user?.credits}. Your prompt would cost ${costOfCredit} credits. Credits are reset at the start of each month.`
      }),
      { status: 400 }
    );
    
  }
  

  if (query?.length > 4092) {
    console.log("too long")
    return new Response(
      JSON.stringify({ error: "Input text is too length" }),
      { status: 400 }
    );
  }

  if (query?.length < 1) {
    console.log("too short")
    return new Response(
      JSON.stringify({ error: "Input text cannot be empty" }),
      { status: 400 }
    );
  }


  //get history based on pb:
  const messages = (await pb.collection("chat").getOne(chatId))?.messages?.slice(-20) || [];

  try {
    const upstream = await fetch(`${apiURL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON?.stringify({ query: query, messages: messages, reasoning: reasoning})
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      console.error("Upstream error:", errText);
      return new Response(errText, { status: upstream.status });
    }

 

    const decoder = new TextDecoder();
    const upstreamReader = upstream.body.getReader();

    let fullResponse = "";
    let controllerClosed = false;
    
    let collectedSources = [];  // Track sources for saving
    
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
              // Try to parse each chunk as JSON to extract content and sources
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const parsed = JSON.parse(line);
                    if (parsed.content) {
                      fullResponse = parsed.content; // Keep updating with latest content
                    }
                    if (parsed.event === 'sources' && parsed.sources) {
                      collectedSources = parsed.sources; // Capture sources
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
          
          // Server-side backup save after streaming completes
          if (fullResponse && fullResponse.trim()) {
            try {
              const systemMessage: any = { content: fullResponse, role: "system" };
              // Add sources if collected
              if (collectedSources && collectedSources.length > 0) {
                systemMessage.sources = collectedSources;
              }
              
              const updatedMessages = [...messages, 
                { content: query, role: "user" },
                systemMessage
              ];
              
              await pb?.collection("chat")?.update(chatId, {
                'messages': JSON.stringify(updatedMessages)
              });
            } catch (saveErr) {
              console.error("Server-side save error:", saveErr);
            }
          }
        }
      }
    });

    await pb?.collection("users")?.update(user?.id, {
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