import { redirect, error} from '@sveltejs/kit';
import { userRegion } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];
	let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;

	userRegion.subscribe(value => {
	if (usRegion.includes(value)) {
		fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
	} else {
		fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
	}
	});

export const load = async ({ locals }) => {

	if (!locals.pb.authStore.isValid) {
		redirect(303, '/login');
	}
	
	async function getNotifications() {

        const postData = {'userId': locals?.user?.id};
    
        const response = await fetch(fastifyURL+'/get-notifications', {
            method: 'POST',
            headers: {
             "Content-Type": "application/json"
            },
            body: JSON.stringify(postData)
        });
    
        const output  = (await response.json())?.items;

        return output
    }


	  return {
		getNotifications: await getNotifications()
	  };
};
