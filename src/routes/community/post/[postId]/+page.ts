import { cachedPosts } from '$lib/store';

import { get } from 'svelte/store';

export const load = async ({ parent, params }) => {



	async function getOnePost() {
        // Get the current value of cachedPosts
        const cachedValue = get(cachedPosts);
        
        // Try to find the post in the cached value
        const output = cachedValue?.posts?.find(item => item?.id === params.postId) ?? {};
    
        // If the post is found in the cache, return it
        if (Object.keys(output).length !== 0) {
            return output;
        }
        
        const { fastifyURL } = await parent();
        // If the post is not found in the cache, fetch it from the endpoint
        const postData = { postId: params.postId };
    
        const response = await fetch(fastifyURL + '/get-one-post', {
            method: 'POST',
            headers: {
               "Content-Type": "application/json"
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
