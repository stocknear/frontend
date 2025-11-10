 import type { RequestHandler } from "./$types";

export const POST = (async ({ request, locals }) => {
  const {  pb } = locals;
  const data = await request.json();
  const type = data?.type;
 
  let output;

    try {
      output = await pb?.collection(type)?.update(data?.strategyId, {
        'rules': data?.rules
      })

    } 
    catch(e) {
      output = {};
      console.error("Error updating data:", e);
    }
    return new Response(JSON.stringify(output));
  
  
}) satisfies RequestHandler;

