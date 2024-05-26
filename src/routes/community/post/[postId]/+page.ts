import { userRegion } from '$lib/store';




export const load = async ({ params }) => {

	const usRegion = ['cle1','iad1','pdx1','sfo1'];
	let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;

	userRegion.subscribe(value => {
	if (usRegion.includes(value)) {
		fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
	} else {
		fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
	}
	});



	async function getOnePost() {

		
		const postData = {'postId': params.postId};

		const response = await fetch(fastifyURL+'/get-one-post', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(postData),
			});
		
		const output = await response.json()

		return output?.items
	}

	const getPostId = async () => {

		return params.postId;
	};


	return {
		getPostId: await getPostId(),
		getOnePost: await getOnePost(),
	};

	
};









/*
export const actions = {
	


	replycomment: async ({ request, locals }) => {
		const body = await request.formData();

		body.append('user', locals.user.id);

		if (body.get('description') === 'undefined')
		{
			body.delete('description');
			body.append('description', '');
			console.log('I GOT TRIGGERED')
		}
		
		
		const {formData, errors} = await validateData( body, createReplyCommentSchema);


		if (errors) {
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			});
		}

		//Each comment gives the user +1 Karma points
		await locals.pb.collection("users").update(locals.user.id, {
			"karma+": 1,
		})
		
		try {
			let newReplyComment = await locals.pb.collection('replycomments').create(serialize(formData));

			//User always upvotes their post in the intial state
			await locals.pb.collection("replycomments").update(newReplyComment.id, {
				"vote+": 1,
			})

		} catch (err) {
			console.log('Error: ', err);
			throw error(err.status, err.message);
		}

		throw redirect(303, '/community/'+body.get('post'));
		
		
	},

	
};
*/