 import type { RequestHandler } from "./$types";

export const POST = (async ({ request, locals }) => {
  const {  pb } = locals;
  const data = await request.json();
    const priceAlertIdList = data?.priceAlertIdList;

 
  let output;

   try {
        for (const item of priceAlertIdList) {
            await pb.collection("priceAlert")?.delete(item)
        }
        output = 'success';
    }
    catch(e) {
        //console.log(e)
        output = 'failure';
    }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;

