import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();

  const portfolioData = data?.portfolioData;
  const timePeriod = data?.timePeriod;

  // Make both API calls in parallel for efficiency
  const [overviewData, healthData] = await Promise.all([
    postAPI(locals, "/portfolio-overview", { portfolioData, timePeriod }),
    postAPI(locals, "/portfolio-health-score", { portfolioData }),
  ]);

  // Combine the results
  const output = {
    performance: overviewData,
    health: healthData,
  };

  return new Response(JSON.stringify(output));
};
