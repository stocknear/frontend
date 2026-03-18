import type { RequestHandler } from "./$types";
import { error} from '@sveltejs/kit';

const getStoredEndpoint = (item: Record<string, any>) =>
	item?.subscription?.subscription?.endpoint ?? item?.subscription?.endpoint ?? null;

export const POST = (async ({ locals, request }) => {
	const { user, pb } = locals;

	if (!user?.id) {
		console.log('No username passed to addSubscription');
		throw error(401, 'Unauthorized');
	}

	try {
		const { endpoint } = await request.json();
		if (!endpoint) {
			return new Response(
				JSON.stringify({ success: false, error: 'Missing push subscription endpoint' }),
				{ status: 400 },
			);
		}

		const output = await pb.collection("pushSubscription").getFullList({
			filter: `user="${user.id}"`,
		});

		let deletedCount = 0;
		if (output?.length > 0) {
			for (const item of output) {
				if (getStoredEndpoint(item) !== endpoint) {
					continue;
				}
				await pb.collection("pushSubscription")?.delete(item?.id);
				deletedCount += 1;
			}
		}

		return new Response(JSON.stringify({ success: true, deletedCount }));
	} catch (err) {
		console.log(err);
		return new Response(
			JSON.stringify({
				success: false,
				error: err instanceof Error ? err.message : 'Unable to delete push subscription',
			}),
			{ status: 500 },
		);
	}

}) satisfies RequestHandler;
