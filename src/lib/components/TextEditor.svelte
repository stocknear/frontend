<script lang='ts'>
  import toast from 'svelte-french-toast';
  import {userRegion, commentAdded, commentUpdated, screenWidth, replyCommentClicked, editCommentClicked} from '$lib/store';

   export let data;
   export let postId = '';
   export let placeholder = 'Leave a comment';
   export let commentId; //Important for replyComent when clicked Cancel it should close the TextEditor;
   export let inputValue = '';



   const usRegion = ['cle1','iad1','pdx1','sfo1'];


let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;

userRegion.subscribe(value => {
  if (usRegion.includes(value)) {
    fastifyURL  = import.meta.env.VITE_USEAST_FASTIFY_URL;
  } else {
    fastifyURL  = import.meta.env.VITE_EU_FASTIFY_URL;
  }
});


  let ref;
  let isLoaded = true;
  let imageId = 'image-input';
  let expandField = commentId?.length !== 0 ? true : false;
  let imageInput = '';

	const showPreview = (event) => {
		const target = event.target;
		const files = target.files;
		if (files.length > 0) {
		const src = URL.createObjectURL(files[0]);
		const preview = document.getElementById('image-preview');
		preview.src = src;

		}
	};

async function handleComment(event) {
  if(isLoaded === true && inputValue?.length !== 0)
  {
    if($editCommentClicked[commentId]) {
      toast.promise(
      updateComment(event),
      {
        loading: 'Updating...',
        success: 'Updated successfully!',
        error: 'Something went wrong. Please try again...',
      }, 
      {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      }
      );
    }
    else {
      toast.promise(
      createComment(event),
      {
        loading: 'Creating...',
        success: 'Commented successfully!',
        error: 'Something went wrong. Please try again...',
      }, 
      {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      }
      );

    }
  }
isLoaded = true;
}


const createComment = async (event) => {
    event.preventDefault(); // prevent the default form submission behavior
    let output;

    try {
      if(isLoaded === true && inputValue?.length !== 0)
      {
        isLoaded = false;
        let formData = new FormData();

        if ($replyCommentClicked[commentId]) {
          formData.append('reply', commentId)
        }
        formData.append('comment', inputValue)
        formData.append('post', postId)
        formData.append('image', imageInput.length !== 0 ? imageInput[0] : '')
        formData.append('user', data?.user?.id)


          const response = await fetch('/api/create-comment', {
          method: 'POST',
          body: formData,
          }); // make a POST request to the server with the FormData object

          output = await response?.json()


          if (output[0] === 'success') {
            //Weird bug pocketbase says +1 for upvote but when i console.log(output[1]) i get upvote 0
            //Weird bug pocketbase does not expand correctly alreadyVoted when I create the comment but it works 
            //when i retrieve all comments through the endpoint get-all-comments in fastify.
            //To circumvent this problem we manually check it again here:

            let newComment = output[1];

            if (newComment?.upvote === 0) {
              newComment.upvote = 1;
            }

            if (!newComment?.expand["alreadyVoted(comment)"]) {
              newComment.expand["alreadyVoted(comment)"] = [];
            }

            const alreadyVotedArray = newComment?.expand["alreadyVoted(comment)"];
            const hasAlreadyVoted = alreadyVotedArray?.some(vote => vote.type === 'upvote' && vote.user === newComment?.user);

            if (!hasAlreadyVoted) {
              alreadyVotedArray.push({ type: 'upvote', user: newComment?.user });
            }


            $commentAdded = newComment;

            inputValue = '';
            imageInput = '';

            handleCancel()

          } 
      }
    }
    catch(e) {
      console.log(e)
    }
};

const updateComment = async (event) => {
    event.preventDefault(); // prevent the default form submission behavior
    let output;

    try {
      if(isLoaded === true && inputValue?.length !== 0)
      {
        isLoaded = false;
        let formData = new FormData();
        formData.append('comment', inputValue?.trimStart())
        formData.append('commentId', commentId)

          const response = await fetch('/api/update-comment', {
          method: 'POST',
          body: formData,
          }); // make a POST request to the server with the FormData object

          output = await response?.json()


          if (output[0] === 'success') {
            $commentUpdated = output[1];

            inputValue = '';
            imageInput = '';
            handleCancel()

          } 
      }
    }
    catch(e) {
      console.log(e)
    }
};


function handleInput(event) {
    inputValue = event.target.value;
  /*
    const textarea = event.target;
    if($screenWidth >= 640)
    {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 10000) + 'px';
    }
    else {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 10000) + 'px';
    }
    */

  }

function handleCancel() {

  if (commentId?.length !== 0) {
    $replyCommentClicked[commentId] = false;
    $editCommentClicked[commentId] = false;
  }

  inputValue = '';
  imageInput = '';
  expandField = false;

  const textarea = document.querySelector('textarea');
  textarea.style.height = '48px'; // 48px are h-12 in tailwindcss



}

 // Function to adjust textarea height
 function adjustHeight() {
    if (ref) {
      ref.style.height = 'auto';
      ref.style.height = Math.min(ref.scrollHeight, 10000) + 'px';
    }
  }

function handleImageInput(event) {
    imageInput = event.target.files;
    //console.log(imageInput)

  }


  $: {
    if (expandField === true && typeof window !== 'undefined') {
      ref?.focus()
      adjustHeight();
    }
  }

</script>
  
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">

<div class="p-2 w-full max-w-xl mr-auto overflow-y-scroll {commentId?.length !== 0 ? '-ml-2' : ''}">
  <textarea
    on:click={() => expandField = true}
    class="rounded-lg text-sm  {expandField ? 'min-h-24 h-auto border-[#1C4090]' : 'h-12  border-gray-500'} overflow-hidden sm:hover:border-[#1C4090] sm:hover:ring-1 transition sm:ease-out placeholder-gray-500 w-full bg-[#202020] text-white border border-1 ring-2 sm:ring-0 ring-[#1C4090]"
    placeholder={placeholder}
    value={inputValue}
    bind:this={ref}
    on:input={handleInput}
    />

    {#if expandField}
    <div class="flex flex-col">
      <div class="flex flex-row items-center justify-end mt-4">
       <!--
        <div class="relative">
        <label for={imageId} class="{imageInput.length !== 0 ? 'hidden' : ''} inline-flex mr-auto items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-gray-800 cursor-pointer">
          <svg class="w-6 h-6 inline-block"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="#A6ADBB" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="#E5E7EB"></path> </g></svg>
        
          <input class="hidden rounded text-gray-200"
					type="file"
					id={imageId}
          name={imageId}
					on:input={handleImageInput}
          on:change={showPreview}
					 />
        </label>
      </div>
      -->

        <label on:click={handleCancel} class="inline-flex justify-end items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-gray-800 cursor-pointer mr-3">
            Cancel
        </label>
        {#if isLoaded}
          <label on:click={handleComment} class="inline-flex justify-end items-center bg-purple-600 {inputValue.length !== 0 ? 'opacity-100 cursor-pointer' : 'opacity-60'}  py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg focus:ring-purple-300">
              Post
          </label>
        {:else}
        <label class="inline-flex justify-end items-center bg-purple-600 opacity-60 py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg focus:ring-purple-300">
          Post
        </label>
        {/if}

        </div>

        {#if imageInput.length !== 0}
        <div class="relative mr-auto -mt-8">
          <label on:click={() => imageInput = ''} class="text-black w-7 h-7 text-center m-auto flex justify-center items-center rounded-full bg-white absolute top-0 -right-2">✕</label>
          <img class="object-contain max-w-full max-h-[150px] mx-auto"
               alt="Image preview"
               id="image-preview" />
        </div>
        
        {/if}


      </div>
    {/if}
</div>

<!--
{:else}

<section class="border-1 border-t border-slate-800 {imageInput?.length !== 0 ? 'min-h-44' : expandField ? 'min-h-40' : 'min-h-24'} rounded-none fixed z-20 w-full -translate-x-1/2 bg-[#202020] bottom-0 left-1/2">
<div class="w-full m-auto rounded-none mt-5">
  <textarea
    on:click={() => expandField = true}
    class="textarea h-8 max-w-h-20 rounded-lg w-11/12 flex justify-center items-center m-auto placeholder-gray-500 bg-[#333333] text-white"
    placeholder={placeholder}
    value={inputValue}
    on:input={handleInput}
    />
    {#if expandField}
    <div class="flex flex-col">
      <div class="flex flex-row items-center mt-4">
        
        
        <div class="relative">
        <label for={imageId} class="{imageInput.length !== 0 ? 'hidden' : ''} py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg">
          <svg class="w-6 h-6 inline-block"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="#A6ADBB" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="#E5E7EB"></path> </g></svg>
        
          <input class="hidden rounded text-gray-200"
					type="file"
					id={imageId}
          name={imageId}
					on:input={handleImageInput}
          on:change={showPreview}
					 />
        </label>
      </div>
      

        <label on:click={handleCancel} class="ml-auto py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg mr-3">
            Cancel
        </label>
        {#if isLoaded}
        <label on:click={handleComment} class="mr-5 bg-purple-600 {inputValue.length !== 0 ? 'opacity-100' : 'opacity-60'}  py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg focus:ring-purple-300">
            Post
        </label>
        {:else}
        <label class="mr-5 bg-purple-600 opacity-60 py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg focus:ring-purple-300">
          Post
        </label>
        {/if}

        </div>

        {#if imageInput.length !== 0}
        <div class="relative mr-auto -mt-8">
          <label on:click={() => imageInput = ''} class="text-black w-5 h-5 text-center m-auto flex justify-center items-center rounded-full bg-white absolute top-0 right-0 -mt-1 mr-1">✕</label>
          <img class="object-contain w-16 h-16 pl-4"
               alt="Image preview"
               id="image-preview" />
        </div>
        
        {/if}


    </div>
    {/if}

</div>

</section>
-->






