import type { RequestHandler } from './$types';
import { serialize } from 'object-to-formdata';
import { validateData } from '$lib/utils';
import { createCommentTextSchema, createCommentImageSchema } from '$lib/schemas';
import { error} from '@sveltejs/kit';
//import sharp from 'sharp';
//import { marked } from 'marked';


/*
export const config = {
  runtime: 'nodejs20.x',
};
*/

/*
function removeDuplicateClasses(str) {
  return str.replace(/class="([^"]*)"/g, (match, classAttr) => {
      return `class="${[...new Set(classAttr.split(' '))].join(' ')}"`;
  });
}

function addClassesToHtml(htmlString) {
  // Helper function to add a class to a specific tag
  function addClassToTag(tag, className) {
      // Add class if the tag doesn't already have a class attribute
      const regex = new RegExp(`<${tag}(?![^>]*\\bclass=)([^>]*)>`, 'g');
      htmlString = htmlString.replace(regex, `<${tag} class="${className}"$1>`);

      // Append the new class to tags that already have a class attribute, ensuring no duplicates
      const regexWithClass = new RegExp(`(<${tag}[^>]*\\bclass=["'][^"']*)(?!.*\\b${className}\\b)([^"']*)["']`, 'g');
      htmlString = htmlString.replace(regexWithClass, `$1 ${className}$2"`);
  }

  // Add classes to headings
  addClassToTag('h1', 'text-lg');
  addClassToTag('h2', 'text-lg');
  addClassToTag('h3', 'text-lg');
  addClassToTag('h4', 'text-lg');
  addClassToTag('h5', 'text-lg');
  addClassToTag('h6', 'text-lg');

  // Add classes to anchor tags
  addClassToTag('a', 'text-blue-400 hover:text-white underline');

  // Add classes to ordered lists
  addClassToTag('ol', 'list-decimal ml-10 text-sm');

  // Add classes to unordered lists
  addClassToTag('ul', 'list-disc ml-10 text-sm -mt-5');

  // Add classes to blockquotes and their paragraphs
  function addClassToBlockquote() {
      // Add class to blockquote
      htmlString = htmlString.replace(
          /<blockquote/g,
          '<blockquote class="pl-4 pr-4 rounded-lg bg-[#323232]"'
      );

      // Add class to p inside blockquote
      htmlString = htmlString.replace(
          /<blockquote([^>]*)>\s*<p/g,
          `<blockquote$1>\n<p class="text-sm font-medium leading-relaxed text-white"`
      );
  }

  addClassToBlockquote();

  // Remove duplicate classes after all modifications
  htmlString = removeDuplicateClasses(htmlString);

  return htmlString;
}

*/

export const POST = (async ( {request, locals} ) => {
  
let output = 'error';

const body = await request.formData();

  if (body?.get('comment') === 'undefined')
  {
    body?.delete('comment');
    body?.append('comment', '');
  }

  if (body?.get('reply') === null)
  {
    body?.delete('reply');
    body?.append('reply', '');
  }

  const {formData, errors} = await validateData( body, body?.get('image')?.length === 0 ? createCommentTextSchema : createCommentImageSchema);
  


  if (errors) {
    return new Response(JSON.stringify(output));
  }
  //formData.comment = addClassesToHtml(marked(formData?.comment))


/*
  if (formData?.image?.type?.includes('image'))
		{

			try {
				// image optimization before storing into the database
				const image = formData?.image;


				const imageBuffer = await image?.arrayBuffer();
				const imageBufferArray = new Uint8Array(imageBuffer);

				const optimizedImageBuffer = await sharp(imageBufferArray)
				.resize({
				width: 800,
				height: 1000,
				fit: sharp.fit.inside, // Maintain aspect ratio and fit within the specified dimensions
				withoutEnlargement: true, // Do not upscale the image if it's smaller than the specified dimensions
				})
				.jpeg({ quality: 50 }) // Example: Convert the image to JPEG format with 50% quality
				.toBuffer();

				formData.image = new File([optimizedImageBuffer], image.name, {
					type: image.type,
					lastModified: image.lastModified,
				});

			} catch(err) {
				console.log('Error: ', err);
				error(err.status, err.message);
			}
		}
    */

    //Each comment gives the user +1 Karma points

  await locals.pb.collection("users").update(locals?.user?.id, {
    "karma+": 1,
  })


  let newComment;
  try {

    newComment = await locals.pb.collection('comments').create(serialize(formData), {
      expand: 'user,alreadyVoted(comment)',
      fields: "*,expand.user,expand.alreadyVoted(comment).user,expand.alreadyVoted(comment).type",
    });



    let postId = formData.post
    const opPost = await locals.pb.collection('posts').getOne(postId)
    //create new record for notifications collections
    if (locals?.user?.id !== opPost?.user)
    {
        let formDataNotifications = new FormData();
        formDataNotifications.append('opUser', opPost?.user);
        formDataNotifications.append('user', formData?.user)
        formDataNotifications.append('post', postId);
        formDataNotifications.append('comment', newComment?.id)
        formDataNotifications.append('notifyType', 'comment');
        
        await locals.pb.collection('notifications').create(formDataNotifications);

    }


    
    let formDataAlreadyVoted = new FormData();
    formDataAlreadyVoted.append('comment', newComment?.id);
    formDataAlreadyVoted.append('user', newComment?.user);
    formDataAlreadyVoted.append('type', 'upvote');
    //console.log(formDataAlreadyVoted)
    await locals.pb.collection('alreadyVoted').create(formDataAlreadyVoted);

  //User always upvotes their comment in the intial state
  await locals.pb.collection("comments").update(newComment?.id, {
    "upvote+": 1,
  })


    output = 'success';


  } catch (err) {
    console.log('Error: ', err);
    error(err.status, err.message);
  }



    return new Response(JSON.stringify([output, newComment]));
}) satisfies RequestHandler;