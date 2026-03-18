import type { RequestHandler } from "./$types";



export const POST = (async ({ locals, request }) => {
	const { user, pb } = locals;
	if (!user?.id) {
		return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
	}

	const data = await request.json();
	const subscription = data?.subscription;

	if (!subscription?.endpoint) {
		return new Response(
			JSON.stringify({ success: false, error: "Missing push subscription endpoint" }),
			{ status: 400 },
		);
	}

	try {
		const items = await pb.collection("pushSubscription").getFullList({
			filter: `user="${user.id}"`,
		});

		const normalizedSubscription = {
			subscription: {
				endpoint: subscription.endpoint,
				expirationTime: subscription.expirationTime ?? null,
				keys: {
					p256dh: subscription.keys?.p256dh ?? "",
					auth: subscription.keys?.auth ?? "",
				},
			},
		};

		const existingItem = items.find((item) => {
			const existingSubscription = item.subscription?.subscription ?? item.subscription;
			return existingSubscription?.endpoint === subscription.endpoint;
		});

		if (existingItem?.id) {
			await pb.collection("pushSubscription").update(existingItem.id, {
				subscription: normalizedSubscription,
			});
		} else {
			await pb.collection("pushSubscription").create({
				user: user.id,
				subscription: normalizedSubscription,
			});
		}

		return new Response(JSON.stringify({ success: true, deviceCount: existingItem ? items.length : items.length + 1 }));
	} catch(err) {
		console.log(err)
		return new Response(
			JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unable to save push subscription" }),
			{ status: 500 },
		);
	}

}) satisfies RequestHandler;
