import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey } = locals;

  const portfolioData = data?.portfolioData;
  const timePeriod = data?.timePeriod;

  // Make both API calls in parallel for efficiency
  const [overviewResponse, healthResponse] = await Promise.all([
    // Call portfolio-overview endpoint
    fetch(apiURL + "/portfolio-overview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ portfolioData, timePeriod }),
    }),
    // Call portfolio-health-score endpoint
    fetch(apiURL + "/portfolio-health-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ portfolioData }),
    }),
  ]);

  // Parse both responses
  const [overviewData, healthData] = await Promise.all([
    overviewResponse.json(),
    healthResponse.json(),
  ]);

  // Combine the results
  const output = {
    performance: overviewData,
    health: healthData,
  };

  return new Response(JSON.stringify(output));
};
