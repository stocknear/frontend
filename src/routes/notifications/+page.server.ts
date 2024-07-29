import { redirect, error} from '@sveltejs/kit';


export const load = async ({ locals }) => {

	if (!locals.pb.authStore.isValid) {
		redirect(303, '/login');
	}
	
	async function getNotifications() {

        const postData = {'userId': locals?.user?.id};
    
        const response = await fetch(locals?.fastifyURL+'/get-notifications', {
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
