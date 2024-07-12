<script lang='ts'>
  import { onMount, onDestroy } from 'svelte';
  import toast from 'svelte-french-toast';
  import {commentAdded} from '$lib/store';
  import { pb } from '$lib/pocketbase';

 export let data;
 export let postId = '';

let post = data?.getOnePost;

let imageId = 'image-input';

let expandField = false;

  //let characterCount = 0;



let inputValue = '';
let imageInput = '';
let imageComment;


const showPreview = (event) => {
  const target = event.target;
  const files = target.files;
  if (files.length > 0) {
  const src = URL.createObjectURL(files[0]);
  const preview = document.getElementById('image-preview');
  preview.src = src;

  }
};



const createComment = async (event) => {
    event.preventDefault(); // prevent the default form submission behavior
    let output;
    let newComment;
    const userId = data?.user?.id;

  if(inputValue.length !== 0)
    {
    const postData = {
      'comment': inputValue,
      'post': postId,
      'image': imageInput.length !== 0 ? imageInput[0] : '',
      'user': userId
    }

    /*
    const response = await fetch(fastifyURL+'/create-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData),
      }); // make a POST request to the server with the FormData object

      output = await response.json()
    }
    */
   //Create comment in User Browser because i need to learn how to transfer images.
    try {
      newComment = await pb.collection('comments').create(postData);
    
      newComment = await pb.collection("comments").getOne(newComment?.id, {
          expand: `user`})


      //User always upvotes their post in the intial state
      await pb.collection("comments").update(newComment.id, {
        "vote+": 1,
      })

      const opPost = await pb.collection('posts').getOne(postId)
      //create new record for notifications collections
      if (userId !== opPost?.user)
      {
          let formDataNotifications = new FormData();
          formDataNotifications.append('opUser', opPost?.user);
          formDataNotifications.append('user', userId)
          formDataNotifications.append('post', postId);
          formDataNotifications.append('comment', newComment?.id)
          formDataNotifications.append('notifyType', 'comment');
  
          await pb.collection('notifications').create(formDataNotifications);
      }
      output = 'success'

  }
  catch(e) {
      console.log(e);
      output = 'failure'
  }
   
  if (output === 'success') {
      toast.success('Commented successfully', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });

      $commentAdded = newComment;

      //console.log("comment added: ", $commentAdded)
      inputValue = '';
      imageInput = '';

      handleCancel()


  } 
  else {
    toast.error('Something went wrong. Please try again...', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  }

  }
};



function handleInput(event) {
  inputValue = event.target.value;

  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
}

function handleCancel() {
if (editor)
{
  editor.innerHTML = '';
}
inputValue = '';
imageInput = '';
const closePopup = document.getElementById("mobileTextEditorModal");
closePopup?.dispatchEvent(new MouseEvent('click'))
        
const textarea = document.querySelector('textarea');
textarea.style.height = '36px'; // 48px are h-12 in tailwindcss

}

function handleImageInput(event) {
  imageInput = event.target.files;

  expandField=true;
}



const toolbarOptions = {
        container: [
            ['bold', 'italic', 'underline','strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ],
    }


	let quill;
  let editor;
  const regex = /^(\s*<p><br><\/p>\s*)*$/;

    let loadingEditor = false;

    onMount(async () => {

        const { default: Quill } = await import('quill');

        quill = new Quill('.quill-editor', {
            modules: {
            toolbar: toolbarOptions,
            },
            theme: 'snow',
            placeholder: "Leave a comment...",
            keepFocus: true,
        });


        quill.on('text-change', function() {
            editor = quill.root;
            // Add text-4xl class to all h1 elements
            editor.querySelectorAll('h1').forEach((h1) => {
                h1.classList.add('text-4xl');
            });
            editor.querySelectorAll('h2').forEach((h2) => {
                h2.classList.add('text-3xl');
            });
            editor.querySelectorAll('h3').forEach((h3) => {
                h3.classList.add('text-xl');
            });
            editor.querySelectorAll('h4').forEach((h4) => {
                h4.classList.add('text-md');
            });
            editor.querySelectorAll('h5').forEach((h5) => {
                h5.classList.add('text-sm');
            });
            editor.querySelectorAll('h6').forEach((h6) => {
                h6.classList.add('text-xs');
            });

            editor.querySelectorAll('a').forEach((a) => {
                a.classList.add('text-blue-400', 'hover:text-white','underline');
            });

            editor.querySelectorAll('ol').forEach((ol) => {
                ol.classList.add('list-decimal', 'ml-10','text-sm');
            });

            editor.querySelectorAll('ul').forEach((ul) => {
                ul.classList.add('list-disc', 'ml-10','text-sm');
            });

            
            /*
            editor.querySelectorAll('pre').forEach((pre) => {
                pre.classList.add('bg-[#23241F]', 'w-auto','h-auto','max-w-6xl','breaks-all');
            });
            */

            const contents = editor.innerHTML;
            inputValue = contents;

            console.log(inputValue)

            if (regex?.test(inputValue)) {
              editor.innerHTML = '';
              inputValue = '';
            }

            //console.log(inputValue)

            // Force Svelte to update the DOM
            $: {}
        });

        loadingEditor = true;
    });


onDestroy(() => {
    if (quill) {
      quill.off('text-change');
      quill = null;
    }
  });



1
</script>

<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
</svelte:head>


<div class="drawer drawer-end overflow-hidden" style="z-index: 9999;">
  <input id="mobileTextEditorModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
      <div class="rounded-xl bg-[#000] min-h-screen w-screen pb-20 overflow-y-auto overflow-hidden">
    <!--
    <h1 class="text-white sm:hidden font-medium text-xl mt-10 pl-2">
      {@html post?.title}
    </h1>
    -->

    <h1 class="text-white text-lg pl-7 pt-16">
      Share your opinion 
    </h1>
    
    <!--Start Quill Editor-->
    <div class="{!loadingEditor ? 'hidden' : ''} mt-3 pl-7 pr-7">
      <div class="quill-editor min-h-[96px] h-[120px] resize-none focus-none ring-none rounded-none bg-[#2A303C] text-white">
          <select class="ql-header" aria-label="Header" title="Header">
            <option selected></option>
          </select>
      </div>
    </div>


  <textarea placeholder="Loading editor..." class="{loadingEditor ? 'hidden' : ''} min-h-[96px] h-[120px] text-sm italic w-full resize-none focus-none ring-none rounded-none bg-[#2A303C] text-white"></textarea>
    <!--End Quill Editor-->
    

      <textarea
        class="hidden"
        type="text"
        value={inputValue}
        on:input={handleInput}
        />

    <div class="flex flex-row justify-start mt-4 pb-16 pl-7 pr-7">
     
      <div class="relative">

          
      <label for={imageId} class="{imageInput.length !== 0 ? 'hidden' : ''} inline-flex mr-auto items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-gray-800 cursor-pointer">
        
            
      <svg class="w-5 h-5 inline-block"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="#A6ADBB" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="#E5E7EB"></path> </g></svg>
      
        <input class="hidden rounded text-gray-200"
          type="file"
          id={imageId}
          name={imageId}
          on:input={handleImageInput}
          on:change={showPreview}
         />
      </label>

      {#if imageInput.length !== 0}
      <div class="ml-2">
        <label on:click={() => imageInput = ''} class="btn btn-xs btn-circle bg-red-600 absolute -top-2 -right-2">
          ✕
        </label>
        <img class="object-contain w-10 h-10 mx-auto rounded"
             alt="Image preview"
             id="image-preview" />
      </div>
      
      {/if}


    </div>
      <div class="relative flex justify-end items-center ml-auto mr-2">
      <label on:click={handleCancel} class="inline-flex justify-end items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-gray-800 cursor-pointer mr-3">
          Cancel
      </label>
        <label on:click={createComment} class="inline-flex justify-end items-center bg-purple-600 {inputValue.length !== 0 ? 'opacity-100 cursor-pointer' : 'opacity-60'}  py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg focus:ring-purple-300">
            Post
        </label>

      </div>
      
      </div>

      

  

    <label on:click={() => handleCancel()} class="absolute left-6 top-4">
      <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        <span class="text-white text-md font-medium">
          Return
        </span>
    </label>
        

  </div>

  
</div>
</div>






<style>
	@import '/src/lib/assets/style_quill.css';

    .quill-editor, textarea {
        touch-action: none; /* or 'none' if manipulation doesn't work */
    }
	
</style>
