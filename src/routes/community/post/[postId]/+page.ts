import { userRegion, cachedPosts } from '$lib/store';

import { get } from 'svelte/store';

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
        // Get the current value of cachedPosts
        const cachedValue = get(cachedPosts);
        
        // Try to find the post in the cached value
        const output = cachedValue?.posts?.find(item => item?.id === params.postId) ?? {};
    
        // If the post is found in the cache, return it
        if (Object.keys(output).length !== 0) {
            return output;
        }
    
        // If the post is not found in the cache, fetch it from the endpoint
        const postData = { postId: params.postId };
    
        const response = await fetch(fastifyURL + '/get-one-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });
    
        const result = await response.json();
    
        // Assuming the result contains an 'items' array
        return result.items;
    }

	const getPostId = async () => {

		return params.postId;
	};


	return {
		getPostId: await getPostId(),
		getOnePost: await getOnePost(),
	};

	
};
