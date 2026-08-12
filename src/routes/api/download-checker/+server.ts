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
  // 1) Update user downloadCredits
  await pb.collection('users').update(user.id, {
    downloadCredits: (user.downloadCredits ?? 0) + 1,
  });

  // 2) Check if userInfo already exists for this user
  let userInfo;

  try {
    userInfo = await pb
      .collection('userInfo')
      .getFirstListItem(`user="${user.id}"`);
  } catch (err) {
    // PocketBase returns 404 if no record matches
    if (err.status !== 404) {
      throw err; // real error -> let outer catch handle it
    }
  }


  // 3) Update if exists, otherwise create
  if (userInfo) {
    await pb.collection('userInfo').update(userInfo.id, {
      ipAddress,
    });
  } else {
    await pb.collection('userInfo').create({
      user: user.id,
      ipAddress,
    });
  }

  output = 'success';
} catch (e) {
  console.log(e);
  output = 'error';
}


  return new Response(JSON.stringify(output));
};

