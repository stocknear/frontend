import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const {user, pb, clientIp } = locals;
  
    let output = 'failure';
      // Check if user has enough credits

    const ipAddress =
      typeof clientIp === "string" && clientIp?.trim()?.length > 0
        ? clientIp?.trim()
        : undefined;
    

  if (user?.downloadCredits > 500) {
    return new Response(JSON.stringify({ error: "Abusive usage detected. Please read our Terms of Service to understand more." }), { status: 400 });
  }

try {

  
  await pb.collection('users').update(user?.id, {
    'downloadCredits': user?.downloadCredits +1,
    'ipAddress': ipAddress
  });

  output = 'success';


}
catch(e) {
    console.log(e)
}

  return new Response(JSON.stringify(output));
};

