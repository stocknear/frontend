import type { RequestHandler } from "./$types";
import { error} from '@sveltejs/kit';



// POST, not GET: this deletes state, and a GET is sent cross-site with sameSite=lax cookies
// while SvelteKit's CSRF protection does not cover GET.
export const POST = (async ({ locals }) => {
	const { user, pb } = locals;

	if (!user?.id) {
		console.log('No username passed to addSubscription');
		throw error(401, 'Unauthorized');
	}

	try {
		const output = await pb.collection("pushSubscription").getFullList({
			filter: `user="${user.id}"`,
		});

		if (output?.length > 0) {
			for (const item of output) {
				await pb.collection("pushSubscription")?.delete(item?.id);
			}
		}

		return new Response(JSON.stringify({'success': true}));
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
