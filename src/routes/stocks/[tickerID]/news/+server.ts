import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const { tickerID } = params;

	if (!tickerID) {
		throw redirect(302, '/stocks');
	}

	const lowerTicker = tickerID.toLowerCase();
	const pathname = url.pathname;

	if (tickerID !== lowerTicker) {
		const updatedPath = pathname.replace(tickerID, lowerTicker);
		throw redirect(301, updatedPath);
	}

	// No redirect needed — maybe return some default response
	throw redirect(301, `/stocks/${params.tickerID}`);
};
