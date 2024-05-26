import type { RequestHandler } from './$types';
import { serialize } from 'object-to-formdata';
import { validateData } from '$lib/utils';
import { updateCommentTextSchema} from '$lib/schemas';
import { error} from '@sveltejs/kit';


export const POST = (async ( {request, locals} ) => {
  
let output = 'error';

const body = await request.formData();
const commentId = body?.get('commentId');

  if (body?.get('comment') === 'undefined')
  {
    body?.delete('comment');
    body?.append('comment', '');
  }

  const {formData, errors} = await validateData( body, updateCommentTextSchema);
  console.log(error)

  if (errors) {
    
    return new Response(JSON.stringify(output));
  }
 

  let updateComment;
  try {

    updateComment = await locals.pb.collection('comments').update(commentId,serialize(formData));

    updateComment = await locals.pb.collection('comments').getOne(commentId, {
        expand: 'user,alreadyVoted(comment)',
        fields: "*,expand.user,expand.alreadyVoted(comment).user,expand.alreadyVoted(comment).type",
      });

    output = 'success';

  } catch (err) {
    console.log('Error: ', err);
    error(err.status, err.message);
  }



    return new Response(JSON.stringify([output, updateComment]));
}) satisfies RequestHandler;