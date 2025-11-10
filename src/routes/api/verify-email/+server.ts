 import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
    const {  pb } = locals;
  const data = await request.json();

    let output;

  
     try {
       await pb.collection('users').confirmVerification(data?.token);
        output = 'Done 🎉!';
    }
    catch(e) {
        console.log(e)
        output = 'No Valid Token!';
    }

  return new Response(JSON.stringify(output));
};