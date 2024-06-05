import { createPostTextSchema,createPostImageSchema, createPostLinkSchema } from '$lib/schemas';
import { validateData } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { serialize } from 'object-to-formdata';
import { marked } from 'marked';

import got from 'got';
import cheerio from 'cheerio';
import BlobUtil from 'blob-util';
import sharp from 'sharp';



export const config = {
	runtime: 'nodejs20.x',
  };


  function removeDuplicateClasses(str) {
	return str.replace(/class="([^"]*)"/, (match, classAttr) => `class="${[...new Set(classAttr.split(' '))].join(' ')}"`);
  }

  function addClassesToHtml(htmlString) {
    // Helper function to add a class to a specific tag
	function addClassToTag(tag, className) {
        // Add class if the tag doesn't already have a class attribute
        const regex = new RegExp(`<${tag}(?![^>]*\\bclass=)([^>]*)>`, 'g');
        htmlString = htmlString.replace(regex, `<${tag} class="${className}"$1>`);

        // Append the new class to tags that already have a class attribute, ensuring no duplicates
        const regexWithClass = new RegExp(`(<${tag}[^>]*\\bclass=["'][^"']*)(?!.*\\b${className}\\b)([^"']*)["']`, 'g');
        htmlString = removeDuplicateClasses(htmlString.replace(regexWithClass, `$1 ${className}$2"`));
    }
    // Add classes to headings
    addClassToTag('h1', 'text-2xl');
    addClassToTag('h2', 'text-xl');
    addClassToTag('h3', 'text-xl');
    addClassToTag('h4', 'text-md');
    addClassToTag('h5', 'text-sm');
    addClassToTag('h6', 'text-xs');

    // Add classes to anchor tags
    addClassToTag('a', 'text-blue-400 hover:text-white underline');

    // Add classes to ordered lists
    addClassToTag('ol', 'list-decimal ml-4 text-sm');

    // Add classes to unordered lists
    addClassToTag('ul', 'list-disc ml-4 text-sm -mt-5');

    // Add classes to blockquotes and their paragraphs
    function addClassToBlockquote() {
        // Add class to blockquote
        htmlString = htmlString.replace(
            '<blockquote',
            '<blockquote class="p-4 my-4 border-s-4 border-gray-400 bg-[#313131]"'
        );

         // Add class to p inside blockquote
		 htmlString = htmlString.replace(
            /<blockquote([^>]*)>\s*<p/g,
            `<blockquote$1>\n<p class="text-sm italic font-medium leading-relaxed text-white"`
        );
    }

    addClassToBlockquote();

    return htmlString;
}


export const load = async ({ locals}) => {

	if (!locals.pb.authStore.isValid) {
		redirect(303, '/login');
	}
};



  
  
export const actions = {

	createPostText: async ({ request, locals }) => {

		let newPost = '';
		const body = await request.formData();
		body.delete('thumbnail');
		body.append('user', locals?.user?.id);

		let {formData, errors} = await validateData( body, createPostTextSchema);

		formData.description = addClassesToHtml(marked(formData?.description))
		

		formData.tagTopic = JSON.parse(formData.tagTopic)[0]
		formData.upvote = 1
		

		if(errors)
		{
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			})
		}

		

		//Each post gives the user +1 Karma points
		await locals.pb.collection("users").update(locals.user.id, {
			"karma+": 1,
		})

		try {

			newPost = await locals.pb.collection('posts').create(serialize(formData));
			

			// add the tagTopic manually because serialize does not work on arrays
			await locals?.pb.collection("posts").update(newPost.id, {
				"tagTopic": formData.tagTopic,
			})

			//Save it collection alreadyVoted to keep track if user voted or not 
			//FormData for alreadyVoted
			
			let formDataAlreadyVoted = new FormData();
			formDataAlreadyVoted.append('post', newPost?.id);
			formDataAlreadyVoted.append('user', newPost?.user);
			formDataAlreadyVoted.append('type', 'upvote');
			//console.log(formDataAlreadyVoted)
			await locals.pb.collection('alreadyVoted').create(formDataAlreadyVoted);


			
		} catch (err) {
			console.log('Error: ', err);
			error(err.status, err.message);
		}

		if(newPost?.id?.length !== 0) {
			redirect(303, '/community/post/'+newPost?.id);
		} else {
			redirect(303, '/community');
		}
		


	},

	createPostImage: async ({ request, locals }) => {
		let newPost = '';
		const body = await request.formData();
		const thumb = body.get('thumbnail');

		if (thumb?.size === 0) {
			body.delete('thumbnail');
		}

		body.append('user', locals?.user?.id);		

		let {formData, errors} = await validateData( body, createPostImageSchema);
		
		formData.tagTopic = JSON.parse(formData.tagTopic)[0]
		formData.upvote = 1


		if(errors)
		{	

			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			})
		}
		
		

		//Each post gives the user +1 Karma points
		await locals.pb.collection("users").update(locals?.user?.id, {
			"karma+": 1,
		})


		
		if (formData.thumbnail.type.includes('image')) {
			try {
			  const image = formData.thumbnail;
			  const imageBuffer = await image.arrayBuffer();
			  const imageBufferArray = new Uint8Array(imageBuffer);
			  let optimizedImageBuffer;
		  
			  if (image.type === 'image/gif') {
				// Process GIF files differently
				optimizedImageBuffer = imageBufferArray;
			  } else {
				// Process other image formats (e.g., JPEG, PNG) using sharp library
				optimizedImageBuffer = await sharp(imageBufferArray)
				  .resize({
					width: 800,
					height: 1000,
					fit: sharp.fit.inside,
					withoutEnlargement: true,
				  })
				  .jpeg({ quality: 50 })
				  .toBuffer();
			  }
		  
			  formData.thumbnail = new File([optimizedImageBuffer], image.name, {
				type: image.type,
				lastModified: image.lastModified,
			  });
	

			} catch (err) {
			  console.log('Error:', err);
			  error(err.status, err.message);
			}
		  }
		  
		

		
		try {
			
			newPost = await locals.pb.collection('posts').create(serialize(formData));
			
			
			// add the tagTopic manually because serialize does not work on arrays
			await locals?.pb.collection("posts").update(newPost.id, {
				"tagTopic": formData?.tagTopic,
			})

			
			//Save it collection alreadyVoted to keep track if user voted or not 
			//FormData for alreadyVoted
			
			let formDataAlreadyVoted = new FormData();
			formDataAlreadyVoted.append('post', newPost.id);
			formDataAlreadyVoted.append('user', newPost.user);
			formDataAlreadyVoted.append('type', 'upvote');
			//console.log(formDataAlreadyVoted)
			await locals.pb.collection('alreadyVoted').create(formDataAlreadyVoted);
			
		} catch (err) {
			console.log('Error: ', err);
			error(err.status, err.message);
		}

		
		if(newPost?.id?.length !== 0) {
			redirect(303, '/community/post/'+newPost?.id);
		} else {
			redirect(303, '/community');
		}


	},


	createPostLink: async ({ request, locals }) => {
		let newPost = '';
		const body = await request.formData();
		const url = body.get('link')
		let image;
		let description;
		let imageBlob;

		try {
			const response = await got(url, { headers: {
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
			},
			responseType: 'buffer' });

			const $ = cheerio.load(response.body);
			//const title = $('head title').text();
			description= $('head meta[property="og:description"]').attr('content');
			image = $('head meta[property="og:image"]').attr('content');

			if (!image) {
				let largestSize = 0;
				let largestImage = '';
				$('img').each(async function() {
				if ($(this).attr('src') && $(this).attr('src').match(/\.(webp|jpg|jpeg|png|gif)$/)) {
					try {
						const imageBuffer = await got($(this).attr('src'), { headers: {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'},responseType: 'buffer' }).then(response => response.body);
						const imageSize = (await sharp(imageBuffer).metadata()).width * (await sharp(imageBuffer).metadata()).height;
						if (imageSize > largestSize) {
							largestSize = imageSize;
							largestImage = $(this).attr('src');
						}
					} catch (error) {
						// Handle the error when getting the image
						console.error('Error getting image:', error);
					}
				}
				});
				image = largestImage;
			}


		// Download the image and append it to the form data
		const imageBuffer = await got(image, { headers: {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'},responseType: 'buffer' }).then(response => response.body);
		imageBlob = await BlobUtil.createBlob([imageBuffer], { type: 'image/jpeg' });

		}

		catch(e)
		{
			console.log(e)
		}
		
		
		//body.delete('thumbnail')
		//body.append('thumbnail', imageBlob);

		// Append the title to the form data
		//body.append('name', title);
		body.append('user', locals.user.id);
		body.append('description', description);



		/*
		const thumb = body.get('thumbnail');

		if (thumb.size === 0) {
			body.delete('thumbnail');
		}
		*/
	

		let {formData, errors} = await validateData( body, createPostLinkSchema);

		formData.tagTopic = JSON.parse(formData.tagTopic)[0]
		formData.upvote = 1


		if (imageBlob?.length !== 0) {
			formData.thumbnail = imageBlob

		}

		if(errors)
		{
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			})
		}


		//Each post gives the user +1 Karma points
		await locals.pb.collection("users").update(locals?.user?.id, {
			"karma+": 1,
		})

		try {
			newPost = await locals.pb.collection('posts').create(serialize(formData));
			

			// add the tagTopic manually because serialize does not work on arrays
			await locals.pb.collection("posts").update(newPost.id, {
				"tagTopic": formData.tagTopic,
			})

			//Save it collection alreadyVoted to keep track if user voted or not 
			//FormData for alreadyVoted
			
			let formDataAlreadyVoted = new FormData();
			formDataAlreadyVoted.append('post', newPost.id);
			formDataAlreadyVoted.append('user', newPost.user);
			formDataAlreadyVoted.append('type', 'upvote');
			//console.log(formDataAlreadyVoted)
			await locals.pb.collection('alreadyVoted').create(formDataAlreadyVoted);
			
		} catch (err) {
			console.log('Error: ', err);
			error(err.status, err.message);
		}

		if(newPost?.id?.length !== 0) {
			redirect(303, '/community/post/'+newPost?.id);
		} else {
			redirect(303, '/community');
		}

	},


};