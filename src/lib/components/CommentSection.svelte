<script lang='ts'>

  import {getImageURL, formatDate} from '$lib/utils';
  import toast from 'svelte-french-toast';
  import { userRegion, commentAdded, commentIdDeleted, screenWidth, replyCommentClicked, editCommentClicked, scrollToComment } from '$lib/store';
  import TextEditor from '$lib/components/TextEditor.svelte';
  import { marked } from 'marked';
  import { tick } from 'svelte';
  
  export let moderators
  export let comment;
  export let data;
  export let postId;
  export let opUserId;

export let upvoteButtonClicked
export let downvoteButtonClicked
export let upvoteCounter;
export let downvoteCounter;
export let userAlreadyVoted;


if (userAlreadyVoted) {
  upvoteButtonClicked = comment?.expand['alreadyVoted(comment)']?.find(item => item?.user === data?.user?.id)?.type === 'upvote';
  downvoteButtonClicked = comment?.expand['alreadyVoted(comment)']?.find(item => item?.user === data?.user?.id)?.type === 'downvote';
} else {
  upvoteButtonClicked = false;
  downvoteButtonClicked = false;
}



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



const handleUpvote = async (event) => {
  
  event.preventDefault(); // prevent the default form submission behavior
      
  const commentId = event.target.commentId.value;
  const postData = {
      'postId': postId,
      'commentId': commentId,
      'userId': data?.user?.id,
  };
        
  upvoteButtonClicked = !upvoteButtonClicked;
  

    if (upvoteButtonClicked) {
      if (downvoteButtonClicked) {
        upvoteCounter += 1;
        downvoteCounter -= 1;
        downvoteButtonClicked = false;
      } else {
        upvoteCounter++;
      }
    } else {
      upvoteCounter--;
    }
  const response = await fetch(fastifyURL+'/upvote-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
};


const handleDownvote = async (event) => {
  event.preventDefault(); // prevent the default form submission behavior
    
  const commentId = event.target.commentId.value;
  const postData = {
                  'commentId': commentId,
                  'userId': data?.user?.id,
                  };
  
  downvoteButtonClicked = !downvoteButtonClicked;
  
  
    if (downvoteButtonClicked) {
      if (upvoteButtonClicked) {
        downvoteCounter += 1;
        upvoteCounter -= 1;
        upvoteButtonClicked = false;
      } else {
        downvoteCounter++;
      }
    } else {
      downvoteCounter--;
    }
  

  const response = await fetch(fastifyURL+'/downvote-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
};
  
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
  let fastifyURL;
  
  userRegion.subscribe(value => {
    if (usRegion.includes(value)) {
      fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
      fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
  });
  
  
  let deleteCommentId = comment?.id
  
  function isModerator(comment) {
    return moderators?.some(moderator => comment?.user === moderator?.user);
  }
  
  
  function repeatedCharacters(str) {
      // This regex matches any character (.) followed by itself at least five times
      const regex = /(.)\1{10,}/;
    
      // Test the string against the regex
      return regex?.test(str);
  }
  
  
  const handleDeleteComment = async () => {
  
  
  const postData = {
    'userId': data?.user?.id,
    'commentId': comment?.id,
    'commentUser': comment?.user
    }
  
  
  
  const response = await fetch(fastifyURL+'/delete-comment', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
  const output = (await response.json())?.message;
  if (output === 'success')
  {
    $commentIdDeleted = comment?.id;
  
  }
  
  if (output === 'success') {
      toast.success('Comment deleted', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  } else {
      toast.error('Something went wrong', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  }
  
  
  }
  
  
  
  const handleReportComment = async () => {
  
  toast.success('Comment reported.', {
      style: 'border-radius: 200px; background: #333; color: #fff'
      });
  
  
  }
  
  const toggle = (state) => {
    if (state === 'reply') {
      $replyCommentClicked[comment.id] = !$replyCommentClicked[comment.id]
      $editCommentClicked[comment.id] = false;
    }
    else if (state === 'edit') {
      $editCommentClicked[comment.id] = !$editCommentClicked[comment.id];
      $replyCommentClicked[comment.id] = false;
    }
  }


    
  $replyCommentClicked[comment?.id] = false
  $editCommentClicked[comment?.id] = false


  $: if ($scrollToComment?.length !== 0 && typeof window !== 'undefined') {
    // Wait for the DOM to update
    tick().then(() => {
      const commentElement = document.getElementById($scrollToComment);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: "center"});
      }
    });
  }


  /*
  $: {
    if($commentAdded?.length !== 0) {
      console.log('yes')
    }
  }


  $: {
    if($commentIdDeleted === comment?.id)
    {  
        upvoteCounter = {};
        downvoteCounter= {};
        upvoteButtonClicked= {};
        downvoteButtonClicked= {};
    }
}

*/

  </script>
  
    
  <div class="comment border-l border-gray-500 mt-8">
        <div class="flex flex-row justify-start items-center -ml-4">
            <a href={'/community/user/'+comment?.expand?.user?.id} class="flex flex-row items-center justify-start">
              <label class="avatar w-7 h-7 flex-shrink-0 text-white text-xs sm:text-sm ml-1">
                <img class="flex-shrink-0 inline-block bg-slate-300 rounded-full" 
                src={comment?.expand?.user?.avatar
                    ? getImageURL(comment?.expand?.user?.collectionId, comment?.expand?.user?.id, comment?.expand?.user?.avatar)
                    : `https://api.dicebear.com/7.x/thumbs/svg?seed=${comment?.expand?.user?.username}`} 
                alt="User avatar" />
              </label>
              <span class="text-white ml-2 inline-block text-xs sm:text-sm">
                {comment?.expand?.user?.username}
              </span>
              {#if isModerator(comment)}
                <svg class="inline-block ml-1 w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#75d377" d="M256 32C174 69.06 121.38 86.46 32 96c0 77.59 5.27 133.36 25.29 184.51a348.86 348.86 0 0 0 71.43 112.41c49.6 52.66 104.17 80.4 127.28 87.08c23.11-6.68 77.68-34.42 127.28-87.08a348.86 348.86 0 0 0 71.43-112.41C474.73 229.36 480 173.59 480 96c-89.38-9.54-142-26.94-224-64Z"/></svg>
              {/if}
              {#if comment?.user === opUserId}
              <span class="text-[#756EFF] text-sm font-semibold ml-1"> 
                OP
              </span>
              {/if}
              <span class="text-white font-bold ml-1 mr-1">
                ·
              </span>
              <span class="text-white text-xs">
                {formatDate(comment?.created)} ago
              </span>
            </a>
            
  
  
        </div>
        <div class="text-md text-slate-400 mb-1 pl-5 pt-3 whitespace-pre-wrap w-11/12 sm:w-5/6 ">
  
            
            <div id={comment?.id} class="text-sm text-[#D7DADC] rounded-lg {comment?.id === $scrollToComment ? 'pt-3 pl-3 pr-3 mb-5 bg-[#31304D]' : ''} whitespace-pre-line {repeatedCharacters(comment?.comment) === true ? 'break-all' : ''}">
              {#if !$editCommentClicked[comment?.id]}
              {@html addClassesToHtml(marked(comment?.comment))}
              {:else}
                <TextEditor
                data={data}
                postId={postId}
                commentId={comment?.id}
                inputValue={comment?.comment}
                placeholder={"Reply to the comment of @"+comment?.expand?.user?.username+"..."}
                />
              {/if}
            </div>
            {#if comment?.image?.length !== 0}
            <div class="relative mr-auto -mt-5">
              <img
                src={getImageURL(comment?.collectionId, comment?.id, comment?.image)} 
                class="w-auto max-w-36 max-h-[350px] sm:max-h-[550px] mr-auto"
                alt="comment Image"
                />
              </div>
              {/if}
  
            
          </div>
  
  
          <div class="flex flex-col items-start w-full">
          <div class="pl-5 flex flex-row items-center  {comment?.image?.length === 0 ? '-mt-8' : ''} ">
            <!--Start Voting-->
            <!--Start Upvote -->
            <form on:submit={handleUpvote}>
              <input type="hidden" name="commentId" value={comment?.id}>
              {#if !data?.user}
              <label for="userLogin" class="text-[#A6ADBB] cursor-pointer rounded-lg w-8 h-8 relative sm:hover:bg-[#333333] flex items-center justify-center">
                <svg class="rotate-180 w-4 h-4" version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512.171 512.171" xml:space="preserve"><path fill="currentColor" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971 c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627 l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504 C479.793,292.501,480.71,287.915,479.046,283.925z"></path></svg>
              </label>
              {:else}
              <button type="submit" class="{upvoteButtonClicked ? 'text-[#0076FE] bg-[#31304D]' : 'text-[#A6ADBB]'} cursor-pointer rounded-lg w-8 h-8 relative sm:hover:bg-[#333333] flex items-center justify-center">
                <svg class="rotate-180 w-4 h-4" version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512.171 512.171" xml:space="preserve"><path fill="currentColor" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971 c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627 l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504 C479.793,292.501,480.71,287.915,479.046,283.925z"></path></svg>
              </button >
              {/if}
            </form>
            <!--End Upvote-->
            <!--Start Downvote-->
            <span class="text-gray-200 text-sm ml-1.5 mr-1.5">
              {upvoteCounter - downvoteCounter }
            </span>
            <form on:submit={handleDownvote}>
              <input type="hidden" name="commentId" value={comment?.id} />
            {#if !data?.user}
            <label for="userLogin" class="mr-2 cursor-pointer rounded-lg w-8 h-8 relative sm:hover:bg-[#333333] flex items-center justify-center">
              <svg class="w-4 h-4 mt-0.5" version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512.171 512.171" xml:space="preserve"><path fill="currentColor" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971 c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627 l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504 C479.793,292.501,480.71,287.915,479.046,283.925z"></path></svg>
            </label>
            {:else}
            <button type="submit" class="{downvoteButtonClicked ? 'text-[#0076FE] bg-[#31304D]' : 'text-[#A6ADBB]'} mr-2 cursor-pointer rounded-lg w-8 h-8 relative sm:hover:bg-[#333333] flex items-center justify-center">
              <svg class="w-4 h-4 mt-0.5" version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512.171 512.171" xml:space="preserve"><path fill="currentColor" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971 c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627 l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504 C479.793,292.501,480.71,287.915,479.046,283.925z"></path></svg>
            </button>
            {/if}
            </form>
            <!--End Downvote-->
            <!--End Voting-->

            <label class="mr-3 cursor-pointer text-[12.5px] font-bold text-[#8C8C8C]" for={!data?.user ? 'userLogin' : ''} on:click={() => toggle('reply')}>
              Reply
            </label>

            {#if data?.user?.id === comment?.expand?.user?.id}  
            <label class="mr-3 cursor-pointer text-[12.5px] font-bold text-[#8C8C8C]" for={!data?.user ? 'userLogin' : ''} on:click={() => toggle('edit')}>
                Edit
              </label>
            {/if}
  
            {#if data?.user?.id === comment?.expand?.user?.id || data?.user?.id === moderators?.at(0).user}  
              <label for={'delete'+deleteCommentId} class="cursor-pointer text-[12.5px] font-bold text-[#8C8C8C]">
                Delete
              </label>
            {/if}

  
          </div>

          <div class="pl-8 w-full">
            
            {#if $replyCommentClicked[comment?.id]}
              <div class="mt-3 -ml-3">
              {#if data?.user}
                <TextEditor
                data={data}
                postId={postId}
                commentId={comment?.id}
                placeholder={"Reply to the comment of @"+comment?.expand?.user?.username+"..."}
                />
              {/if}
              </div>
            {/if}
          </div>

        </div>
  
  
          {#if comment?.children}
          <div class="ml-2">
            {#each comment.children  as comment}
            <svelte:self 
            {moderators} 
            {comment} 
            {data} 
            {postId} 
            {opUserId} 
            upvoteCounter={comment?.upvote}
            downvoteCounter={comment?.downvote}
            userAlreadyVoted={comment?.expand['alreadyVoted(comment)']?.some(item => item?.user === data?.user?.id)}
            />
            {/each}
          </div>
          {/if}
          
  </div>
  
  
  <!--Start Delete Modal-->
  <input type="checkbox" id={'delete'+deleteCommentId} class="modal-toggle" />
  
  <dialog id={'delete'+deleteCommentId} class="modal modal-bottom sm:modal-middle border border-slate-800">
  
    <label for={'delete'+deleteCommentId}  class="cursor-pointer modal-backdrop  bg-[#fff] bg-opacity-[0.05]"></label>
  
    <div class="modal-box bg-[#202020] p-5 border border-slate-600 shadow-none" >
  
          <h3 class="font-bold text-md sm:text-lg sm:mb-10 text-white mt-5">
            Are you sure you want to delete the comment?
          </h3>
  
          <div class="modal-action pb-4">
            <label for={'delete'+deleteCommentId} class="cursor-pointer text-sm px-3 py-3 rounded-lg m-auto text-white mr-5 bg-[#646464]">
              No, cancel
            </label>
            <label on:click={handleDeleteComment} for={'delete'+deleteCommentId} class="cursor-pointer text-sm px-3 py-3 rounded-lg m-auto text-white mr-5 bg-blue-700">
              Yes, I'm sure
            </label>
              
          </div>
        </div>
    </dialog>
  <!--End Delete Modal-->
  
  
  
  <!--Start Delete Modal-->
  <input type="checkbox" id="reportComment" class="modal-toggle" />
  
  <dialog id="reportComment" class="modal modal-bottom sm:modal-middle">
  
  
    <div class="modal-box" >
      <label for="reportComment" class="{$screenWidth < 640 ? 'hidden' : ''} btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</label>
  
          <h3 class="font-bold text-md sm:text-lg sm:mb-10">
            Are you sure you want to report the comment?
          </h3>
  
          <div class="modal-action">
            <label for="reportComment" class="btn text-xs text-white mr-5">
              No, cancel
            </label>
            <label on:click={handleReportComment} for="reportComment" class="btn bg-red-700 hover:bg-red-800 text-xs text-white mr-5">
              Yes, I'm sure
            </label>
              
          </div>
        </div>
    </dialog>
  <!--End Delete Modal-->
  
  
  
  <style>
    .comment {
      margin-inline-start: 1rem;
    }
    .comment.lines {
      position: relative;
      padding-inline-start: 1rem;
    }
  
    /* Media query for mobile devices */
    @media (max-width: 640px) {
      .comment {
        margin-inline-start: 0.5rem;
      }
      .comment.lines {
        padding-inline-start: 0.5rem;
      }
    }
  </style>
  