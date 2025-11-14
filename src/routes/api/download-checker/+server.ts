import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const {user, pb } = locals;
  
    let output = 'failure';
      // Check if user has enough credits
  if (user?.downloadCredits > 500) {
    return new Response(JSON.stringify({ error: "Abusive usage detected. Please read our Terms of Service to understand more." }), { status: 400 });
  }

try {

  await pb.collection('users').update(user?.id, {
    'downloadCredits': user?.downloadCredits +1
  });

  output = 'success';


}
catch(e) {
    console.log(e)
}

  return new Response(JSON.stringify(output));
};

