import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
    const { pb } = locals;
  const data = await request.json();

  const type = data?.type
  let output;
  
      try {
        output = await pb.collection(type).create(data)
        
    }
    catch(e) {
        output = {};
    
  }

  return new Response(JSON.stringify(output));
};
