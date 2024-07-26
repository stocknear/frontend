import PocketBase from "pocketbase";

import { serializeNonPOJOs } from '$lib/utils';
//import { v4 as uuidv4 } from 'uuid';


const usRegion = ['cle1','iad1','pdx1','sfo1'];



export const handle = async ({ event, resolve }) => {



		
	//let distinctUserId= uuidv4()
	

	//event.cookies.set('mixpanelUserId', distinctUserId, { path: '/', httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 365});

	event.locals.region = decodeURIComponent(
        event?.request?.headers?.get('x-vercel-id') ?? 'fra1::fra1::8t4xg-1700258428633-157d82fdfcc7',
      );

	const userRegion = event?.locals?.region?.split("::")?.at(0)?.split("::")?.at(0) || '';

	// Set a default API URL
	let pbUrl = import.meta.env.VITE_EU_POCKETBASE_URL; 
	let apiURL = import.meta.env.VITE_EU_API_URL;
	let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
	let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


	if (usRegion?.includes(userRegion)) {
		pbUrl = import.meta.env.VITE_USEAST_POCKETBASE_URL;
		apiURL = import.meta.env.VITE_USEAST_API_URL;
        fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
	  } else {
		pbUrl = import.meta.env.VITE_EU_POCKETBASE_URL;
		apiURL = import.meta.env.VITE_EU_API_URL;
        fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
	  }

  


	event.locals.pb = new PocketBase(pbUrl);
	event.locals.pb.authStore.loadFromCookie(event?.request?.headers?.get('cookie') || '');

	try {
		if (event?.locals?.pb?.authStore?.isValid) {
			await event?.locals?.pb?.collection('users')?.authRefresh();
			event.locals.user = serializeNonPOJOs(event?.locals?.pb?.authStore?.model);
			event.locals.apiURL = apiURL;
			event.locals.fastifyURL = fastifyURL;
			event.locals.apiKey = apiKey;
		}
	} catch(_) {
		event?.locals?.pb?.authStore?.clear();
		event.locals.user = undefined;
		event.locals.apiURL = apiURL;
		event.locals.fastifyURL = fastifyURL;
		event.locals.apiKey = apiKey;
	}

	


	const response = await resolve(event);



	response.headers.append('set-cookie', event?.locals?.pb?.authStore?.exportToCookie({ httpOnly: true, path: '/', sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365}));
	


	return response;
};

