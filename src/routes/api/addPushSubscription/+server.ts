import type { RequestHandler } from "./$types";



export const POST = (async ({ locals, request }) => {
	const { user, pb } = locals;
	let output = false;
	
	const data = await request.json();

	try {
	const items = await pb.collection("pushSubscription").getFullList({
	filter: `user="${user?.id}"`,
	});

	if (output?.length > 0) {
		for (const item of items) {
			await pb.collection("pushSubscription").delete(item?.id);
		}
	}

	
	await pb.collection("pushSubscription").create({user: user?.id, subscription: data})

	output = true;

	} catch(err) {
		console.log(err)
	}

  return new Response(JSON.stringify({'success': output}));

}) satisfies RequestHandler;