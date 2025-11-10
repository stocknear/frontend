 import type { RequestHandler } from "./$types";

export const POST = (async ({ request, locals }) => {
  const {  pb } = locals;
  const data = await request.json();
  const type = data?.type;
 
  let output;


     try {
        await pb.collection(type)?.delete(data?.strategyId)
        output = 'success';
    }
    catch(e) {
        output = 'failure';
    }

  return new Response(JSON.stringify(output));
 
}) satisfies RequestHandler;

