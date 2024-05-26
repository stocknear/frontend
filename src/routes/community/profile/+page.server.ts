import { redirect, error} from '@sveltejs/kit';

export const load = async ({ locals}) => {

	if (!locals.pb.authStore.isValid) {
		redirect(303, '/login');
	}
	
	const getSubscriptionData = async () => {
		const output = (await locals.pb.collection('payments').getFullList({
			filter: `user="${locals.user.id}" `,
			sort: '-created',
		  }))?.at(0)?.data?.data?.attributes ?? {} ;
	
		//console.log(output)
		
		return output;
	  };


	  return {
		getSubscriptionData: await getSubscriptionData()
	  };
};




export const actions = {
	
    cancelSubscription: async ({ request, locals }) => {
		const formData = await request?.formData();

		const apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY;
		const subscriptionId = formData?.get('subscriptionId');


		
		try {
			const url = `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`;
			const headers = {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${apiKey}`
			};
		
			const response = await fetch(url, {
				method: 'DELETE',
				headers: headers
			});

					
			
		} catch (err) {
			console.log("Error: ", err);
			error(err.status, err.message);
		}


		redirect(302, '/community/profile');
	
	},

	reactivateSubscription: async ({ request, locals }) => {
		const formData = await request?.formData();

		const apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY;
		const subscriptionId = formData?.get('subscriptionId');


		
		try {
			const url = `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`;
			const headers = {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${apiKey}`
			};

			const payload = {
				data: {
					type: 'subscriptions',
					id: `${subscriptionId}`,
					attributes: {
						cancelled: false
					}
				}
			};
		
			const response = await fetch(url, {
				method: 'PATCH',
				headers: headers,
				body: JSON.stringify(payload)
			});

					
			
		} catch (err) {
			console.log("Error: ", err);
			error(err.status, err.message);
		}


		redirect(302, '/community/profile');
	
	},
	
    

};
