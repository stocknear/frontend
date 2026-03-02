import type { RequestHandler } from "./$types";

const MAX_TRACKED_CONTRACTS = 5;

function sanitizeRules(rules: any[]): any[] {
  if (!Array.isArray(rules)) return rules;
  return rules.map((rule) => {
    if (rule?.name === "trackContract" && Array.isArray(rule.value)) {
      return { ...rule, value: rule.value.slice(0, MAX_TRACKED_CONTRACTS) };
    }
    return rule;
  });
}

export const POST = (async ({ request, locals }) => {
  const { pb } = locals;
  const data = await request.json();
  const type = data?.type;

  let output;

  try {
    output = await pb?.collection(type)?.update(data?.strategyId, {
      rules: sanitizeRules(data?.rules),
    });
  } catch (e) {
    output = {};
    console.error("Error updating data:", e);
  }
  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;

