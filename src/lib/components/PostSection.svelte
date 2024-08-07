<script lang = 'ts'>

  import {getImageURL, formatDate} from '$lib/utils';
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';
  import Share from '$lib/components/Share.svelte';
  import Downvote from '$lib/components/Downvote.svelte';
  import Upvote from '$lib/components/Upvote.svelte';

  import {postVote, tagList, postIdDeleted} from '$lib/store';
  import toast from 'svelte-french-toast';

  
  export let posts;
  export let moderators;
  export let data;
  
  let deletePostId = posts?.id
  
  
  
  let isVideoClicked = {};
  
  
  function isModerator(userId) {
    return moderators?.some(moderator => userId === moderator?.user);
  }
  

  
  
  
  
  let upvoteButtonClicked = {};
  let downvoteButtonClicked = {};
  let upvoteCounter = {};
  let downvoteCounter = {};
  let videoId = {};
  let userAlreadyVoted;
  
    upvoteCounter[posts.id] = posts.upvote;
    downvoteCounter[posts.id] = posts.downvote;
  
  
  userAlreadyVoted = posts?.expand['alreadyVoted(post)']?.some(item => item?.user === data?.user?.id);
  
  
  if (userAlreadyVoted) {
    upvoteButtonClicked[posts.id] = posts?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'upvote';
    downvoteButtonClicked[posts.id] = posts?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'downvote';
  } else {
    upvoteButtonClicked[posts.id] = false;
    downvoteButtonClicked[posts.id] = false;
  }


  
  
  const handleCopyLink = async () => {
  
  
    await navigator.clipboard.writeText("https://stocknear.com/community/post/"+posts?.id);
  
    toast.success('Link copied', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  };
  
  
  
  const handleDeletePost = async () => {
  
  
  const postData = {'postId': posts?.id,
                    'userId': posts?.user
                  };
  
  const response = await fetch(data?.fastifyURL+'/delete-post', {
    method: 'POST',
    headers: {
            'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
  const output = (await response.json())?.items;
  if (output === 'success')
  {
    $postIdDeleted = posts.id;
  
  }
  
  if (output === 'success') {
      toast.success('Post deleted', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  } else {
      toast.error('Something went wrong', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  }
  
  
  
  };
  
  
  
const handleUpvote = async (event) => {
  
  event.preventDefault(); // prevent the default form submission behavior
      
  const postId = event.target.postId.value;
  const postData = {
                  'postId': postId,
                  'userId': data?.user?.id,
                  };
        
  upvoteButtonClicked[postId] = !upvoteButtonClicked[postId];
  

    if (upvoteButtonClicked[postId]) {
      if (downvoteButtonClicked[postId]) {
        upvoteCounter[postId] += 1;
        downvoteCounter[postId] -= 1;
        downvoteButtonClicked[postId] = false;
      } else {
        upvoteCounter[postId]++;
      }
    } else {
      upvoteCounter[postId]--;
    }
  
  $postVote = {'id': postId, 'upvote': upvoteCounter[postId], 'downvote': downvoteCounter[postId], 'upvoteClicked': upvoteButtonClicked[postId], 'downvoteClicked': downvoteButtonClicked[postId]};

  const response = await fetch(data?.fastifyURL+'/upvote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
};
  
const handleDownvote = async (event) => {
  event.preventDefault(); // prevent the default form submission behavior
    
  const postId = event.target.postId.value;
  const postData = {
                  'postId': postId,
                  'userId': data?.user?.id,
                  };
  
  downvoteButtonClicked[postId] = !downvoteButtonClicked[postId];
  
  
    if (downvoteButtonClicked[postId]) {
      if (upvoteButtonClicked[postId]) {
        downvoteCounter[postId] += 1;
        upvoteCounter[postId] -= 1;
        upvoteButtonClicked[postId] = false;
      } else {
        downvoteCounter[postId]++;
      }
    } else {
      downvoteCounter[postId]--;
    }
  
    $postVote = {'id': postId, 'upvote': upvoteCounter[postId], 'downvote': downvoteCounter[postId], 'upvoteClicked': upvoteButtonClicked[postId], 'downvoteClicked': downvoteButtonClicked[postId]};

  const response = await fetch(data?.fastifyURL+'/downvote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      },
    body: JSON.stringify(postData)
  }); // make a POST request to the server with the FormData object
  
};
  
  
  
  
  
  
  
  function checkIfYoutubeVideo() {
    if (posts.postType === 'link') {
      const url = new URL(posts.link);
      if (url.hostname === "www.youtube.com") {
        const searchParams = url.searchParams;
        searchParams.delete('t'); // Remove the "t" parameter
  
        const videoIdMatch = url.search.match(/v=([^&]+)/);
        if (videoIdMatch) {
          videoId[posts.id] = videoIdMatch[1];
        }
      } else {
        videoId[posts.id] = '';
      }
    }
  }
  
  
  function clickVideo(event)
  {
    event.preventDefault();
    isVideoClicked[posts.id] = true;
  
  
  }
  
  
  
  
  checkIfYoutubeVideo()
  
  
$: {
  
    if($postIdDeleted.length !== 0)
    {
  
    upvoteCounter[posts.id] = posts.upvote;
    downvoteCounter[posts.id] = posts.downvote;
  
  
    userAlreadyVoted = posts?.expand['alreadyVoted(post)']?.some(item => item?.user === data?.user?.id);
  
  
    if (userAlreadyVoted) {
      upvoteButtonClicked[posts.id] = posts?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'upvote';
      downvoteButtonClicked[posts.id] = posts?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'downvote';
    } else {
      upvoteButtonClicked[posts.id] = false;
      downvoteButtonClicked[posts.id] = false;
    }

    checkIfYoutubeVideo()
  
    }
  }
  

  
  </script>
  
  
  
  
  <!-- Posts -->

  <div class="flex flex-row items-start w-full mt-5 relative">
    <div class="hidden lg:flex flex-col items-center absolute -top-2 -left-[70px]">
      <!--Start Upvote-->
      <form on:submit={handleUpvote}>
        <input type="hidden" name="postId" value={posts?.id}>
        {#if !data?.user}
        <div class="w-full">
          <label for="userLogin" class="cursor-pointer">
            <Upvote/>
          </label>
         
        </div>
          {:else}
          <button type="submit" class="w-full">
          {#if upvoteButtonClicked[posts?.id]}
            <Upvote state='active'/>
          {:else}
          <Upvote />
          {/if}
        </button>
        {/if}
      </form>
      <!--End Upvote-->
      <label class="text-center py-4 w-14 rounded-lg bg-[#27272A] border border-gray-700 text-[1rem] text-bold text-white">
          {upvoteCounter[posts?.id] - downvoteCounter[posts?.id] }
      </label>
      <!--Start Downvote-->
      <form on:submit={handleDownvote}>
        <input type="hidden" name="postId" value={posts?.id}>
          {#if !data?.user}
          <div class="w-full">
            <label for="userLogin" class="cursor-pointer">
              <Downvote />
            </label>
          </div>
          {:else}
            <button type="submit" class="w-full">
            {#if downvoteButtonClicked[posts?.id]}
            <Downvote state='active'/>
            {:else}
            <Downvote/>
            {/if}
            </button>
        {/if}
      </form>
      <!--End Downvote-->
  
    </div>
   
  <div class="w-full bg-[#141417] border-t border-b sm:border sm:hover:border-slate-600 border-gray-700 rounded-none sm:rounded-lg">
      <!-- List container -->
      <div class="flex flex-col">
          <!-- Item -->
          <div class="">
              <div class=" flex justify-between items-center mt-5 pb-2">
  
                <div class="pl-2 flex flex-col items-center ">
  
                  {#if posts?.pinned}
                    <div class="flex flex-row items-center mr-auto mb-4">
                      <svg class="w-6 h-6 inline-block ml-2 mr-2" fill="#75D377" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" stroke="#75D377"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M1154.976 0 988.342 166.52c-60.448 60.447-63.436 153.418-15.4 220.646L670.359 689.751c-4.022 4.022-6.55 8.964-9.079 13.79-147.212-61.022-328.671-34.246-444.626 81.709l-98.027 98.141 418.31 418.195-520.129 520.129c-22.41 22.409-22.41 58.724 0 81.248 11.262 11.147 25.972 16.778 40.682 16.778s29.42-5.63 40.567-16.778l520.128-520.129 418.195 418.31 98.142-98.142c75.962-75.847 117.793-176.862 117.793-284.313 0-56.195-12.067-110.208-33.787-160.198 2.758-1.839 5.861-2.988 8.275-5.516l303.963-303.964c29.19 21.145 63.896 33.097 100.67 33.097 46.083 0 89.293-17.928 121.93-50.565L1920 764.909 1154.976 0Z" fill-rule="evenodd"></path> </g></svg>
                      <span class="text-slate-300 text-[0.8rem] sm:text-sm font-bold uppercase">
                        Pinned by moderators
                      </span>
                    </div>
                  {/if}
  
  
                    <a href={'/community/user/'+posts?.expand?.user?.id} class="flex flex-row items-center justify-start mr-auto">
                      <label class="avatar w-7 h-7 flex-shrink-0 text-white text-xs sm:text-sm ml-1">
                        <img class="flex-shrink-0 inline-block bg-slate-300 rounded-full" 
                        src={posts?.expand?.user?.avatar
                            ? getImageURL(posts?.expand?.user?.collectionId, posts?.expand?.user?.id, posts?.expand?.user?.avatar)
                            : `https://avatar.vercel.sh/${posts?.expand?.user?.username}`} 
                        alt="User avatar" />
                      </label>
                      <span class="text-white ml-2 inline-block text-sm">
                        {posts?.expand?.user?.username}
                      </span>
                      {#if isModerator(posts?.user)}
                        <svg class="inline-block ml-1 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#75d377" d="M256 32C174 69.06 121.38 86.46 32 96c0 77.59 5.27 133.36 25.29 184.51a348.86 348.86 0 0 0 71.43 112.41c49.6 52.66 104.17 80.4 127.28 87.08c23.11-6.68 77.68-34.42 127.28-87.08a348.86 348.86 0 0 0 71.43-112.41C474.73 229.36 480 173.59 480 96c-89.38-9.54-142-26.94-224-64Z"/></svg>
                      {/if}
                
                      <span class="text-white font-bold ml-1 mr-1">
                        ·
                      </span>
                      <span class="text-white text-xs">
                        {formatDate(posts?.created)} ago
                      </span>
                    </a>

                
                </div>
                
  
                
  
            
  
                <!--Start settings-->
                <div class="flex justify-end items-center dropdown dropdown-bottom dropdown-end mr-4">
                  
                  
                  <a href={'/community/post/'+posts?.id} class="hidden lg:block ml-4 mr-4 flex justify-center items-center">
                    <svg class="w-5 h-5 sm:w-4 sm:h-4 mt-1 inline-block mr-3" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64px" height="64px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#D6D6DC"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" fill="#D6D6DC" d="M60,0H4C1.789,0,0,1.789,0,4v40c0,2.211,1.789,4,4,4h8v12 c0,1.617,0.973,3.078,2.469,3.695C14.965,63.902,15.484,64,16,64c1.039,0,2.062-0.406,2.828-1.172L33.656,48H60c2.211,0,4-1.789,4-4 V4C64,1.789,62.211,0,60,0z"></path> </g></svg>
                    <span class="text-[1rem] sm:text-sm text-white font-semibold sm:font-medium">
                    {#if posts?.expand['comments(post)']}
                      {posts?.expand['comments(post)']?.length}
                    {:else}
                      0
                    {/if}
                  </span>
                  </a>
  

                  
                  <div class="flex-shrink-0 rounded-full hover:bg-white hover:bg-opacity-[0.05] w-8 h-8 relative flex items-center justify-center">
                    <label tabindex="0" class="cursor-pointer flex-shrink-0">
                      <svg class="m-auto w-4 h-4 sm:w-5 sm:h-5 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                          <path fill="#cacaca" d="M156 128a28 28 0 1 1-28-28a28 28 0 0 1 28 28ZM48 100a28 28 0 1 0 28 28a28 28 0 0 0-28-28Zm160 0a28 28 0 1 0 28 28a28 28 0 0 0-28-28Z"/>
                      </svg>
                    </label>
                  </div>

                  <ul tabindex="0" class="border border-gray-700 dropdown-content menu bg-[#313131] rounded-box w-44 z-30">
                      {#if data?.user?.id === posts?.user || isModerator(data?.user?.id)}
                      <li>
                        <label on:click={handleCopyLink} class="text-sm text-white cursor-pointer">
                          <svg class="mr-auto w-5 h-5 inline-block" viewBox="0 -4 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#7B7B7B" stroke="#7B7B7B"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>link_round [#7B7B7B]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-420.000000, -3283.000000)" fill="#7B7B7B"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M370.999774,3133 L369.999774,3133 C367.662774,3133 365.786774,3130.985 366.019774,3128.6 C366.221774,3126.522 368.089774,3125 370.177774,3125 L370.999774,3125 C371.551774,3125 371.999774,3124.552 371.999774,3124 C371.999774,3123.448 371.551774,3123 370.999774,3123 L370.251774,3123 C366.965774,3123 364.100774,3125.532 364.002774,3128.815 C363.900774,3132.213 366.624774,3135 369.999774,3135 L370.999774,3135 C371.551774,3135 371.999774,3134.552 371.999774,3134 C371.999774,3133.448 371.551774,3133 370.999774,3133 M377.747774,3123 L376.999774,3123 C376.447774,3123 375.999774,3123.448 375.999774,3124 C375.999774,3124.552 376.447774,3125 376.999774,3125 L377.821774,3125 C379.909774,3125 381.777774,3126.522 381.979774,3128.6 C382.212774,3130.985 380.336774,3133 377.999774,3133 L376.999774,3133 C376.447774,3133 375.999774,3133.448 375.999774,3134 C375.999774,3135.104 376.999774,3135 377.999774,3135 C381.374774,3135 384.098774,3132.213 383.996774,3128.815 C383.898774,3125.532 381.033774,3123 377.747774,3123 M368.999774,3128 L378.999774,3128 C379.551774,3128 379.999774,3128.448 379.999774,3129 C379.999774,3130.346 379.210774,3130 368.999774,3130 C368.447774,3130 367.999774,3129.552 367.999774,3129 C367.999774,3128.448 368.447774,3128 368.999774,3128" id="link_round-[#7B7B7B]"> </path> </g> </g> </g> </g></svg>
                          Copy Link
                        </label>
                      </li>  
                      <li>
                          <label for={deletePostId} class="text-sm text-[#E1341E] cursor-pointer">
                            <svg class="mr-auto h-5 w-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#97372f" d="M7 21q-.825 0-1.413-.588T5 19V6q-.425 0-.713-.288T4 5q0-.425.288-.713T5 4h4q0-.425.288-.713T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.588 1.413T17 21H7ZM7 6v13h10V6H7Zm2 10q0 .425.288.713T10 17q.425 0 .713-.288T11 16V9q0-.425-.288-.713T10 8q-.425 0-.713.288T9 9v7Zm4 0q0 .425.288.713T14 17q.425 0 .713-.288T15 16V9q0-.425-.288-.713T14 8q-.425 0-.713.288T13 9v7ZM7 6v13V6Z"/></svg>  
                            Delete Post  
                          </label>
                      </li>
                      {:else}
                      <li>
                        <label on:click={handleCopyLink} class="text-sm text-white cursor-pointer">
                          <svg class="mr-auto w-5 h-5 inline-block" viewBox="0 -4 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#7B7B7B" stroke="#7B7B7B"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>link_round [#7B7B7B]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-420.000000, -3283.000000)" fill="#7B7B7B"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M370.999774,3133 L369.999774,3133 C367.662774,3133 365.786774,3130.985 366.019774,3128.6 C366.221774,3126.522 368.089774,3125 370.177774,3125 L370.999774,3125 C371.551774,3125 371.999774,3124.552 371.999774,3124 C371.999774,3123.448 371.551774,3123 370.999774,3123 L370.251774,3123 C366.965774,3123 364.100774,3125.532 364.002774,3128.815 C363.900774,3132.213 366.624774,3135 369.999774,3135 L370.999774,3135 C371.551774,3135 371.999774,3134.552 371.999774,3134 C371.999774,3133.448 371.551774,3133 370.999774,3133 M377.747774,3123 L376.999774,3123 C376.447774,3123 375.999774,3123.448 375.999774,3124 C375.999774,3124.552 376.447774,3125 376.999774,3125 L377.821774,3125 C379.909774,3125 381.777774,3126.522 381.979774,3128.6 C382.212774,3130.985 380.336774,3133 377.999774,3133 L376.999774,3133 C376.447774,3133 375.999774,3133.448 375.999774,3134 C375.999774,3135.104 376.999774,3135 377.999774,3135 C381.374774,3135 384.098774,3132.213 383.996774,3128.815 C383.898774,3125.532 381.033774,3123 377.747774,3123 M368.999774,3128 L378.999774,3128 C379.551774,3128 379.999774,3128.448 379.999774,3129 C379.999774,3130.346 379.210774,3130 368.999774,3130 C368.447774,3130 367.999774,3129.552 367.999774,3129 C367.999774,3128.448 368.447774,3128 368.999774,3128" id="link_round-[#7B7B7B]"> </path> </g> </g> </g> </g></svg>
                          Copy Link
                        </label>
                      </li>  
                      <li>
                        <label for="userLogin" class="text-sm cursor-pointer">
                          <svg class="w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12S6.5 2 12 2m0 2c-1.9 0-3.6.6-4.9 1.7l11.2 11.2c1-1.4 1.7-3.1 1.7-4.9c0-4.4-3.6-8-8-8m4.9 14.3L5.7 7.1C4.6 8.4 4 10.1 4 12c0 4.4 3.6 8 8 8c1.9 0 3.6-.6 4.9-1.7Z"/></svg>
                          Report
                        </label>
                    </li>
                      {/if}
                  </ul>
                </div>
                <!--End settings-->
  
                </div>
  
              <div >
              <div class="relative mt-2">
                <a href={"/community/post/"+posts?.id}>
                {#if posts?.postType === 'text'}
                  <!--Start PostType Text-->
                  <div class="flex flex-wrap md:flex-row container">
                    <div class="cursor-pointer flex items-start">
                        <div class="flex-grow w-full sm:w-3/4 max-w-2xl break-all">
  
                          
                        <div class="mt-2 flex flex-wrap sm:hover:text-[#0099FF] text-start text-[1.1rem] sm:text-xl font-semibold mb-2 flex-shrink w-fit break-normal">
                          {posts?.title}
                        </div>

                        
                        <div class="{posts?.description?.length > 400 ? 'darken-overlay' : ''} mt-3 text-sm sm:text-[1rem] whitespace-pre-line break-normal text-[#D7DADC]">
                          {@html posts?.description}
                        </div>
                              
                        </div>
                    </div>
                  </div>
                  <!--End PostType Image-->
                  {:else if posts?.postType==='image'}
  
  
                   <!--Start PostType Image-->
                   <div class="w-screen sm:w-full mt-2">
                      <div class="ml-3 mr-3 flex flex-wrap sm:hover:text-[#0099FF] text-[1.1rem] sm:text-xl font-semibold text-white mb-5 relative z-10 whitenormal">
                        {posts?.title}
                      </div>
  
          
                      <div class="relative">
                        {#if posts?.thumbnail && !posts?.thumbnail?.toLowerCase()?.includes('mp4')}
                          <div class="absolute inset-0 bg-cover object-fill bg-center bg-[#000]"></div>
                 
                          <!--<div class="absolute -inset-3 md:-inset-y-20 md:mt-10 bg-cover object-contain blur-[40px]" style="clip-path: polygon(0 0, 100% 0, 100% 90%, 0 90%); background-image: url('{getImageURL(posts.collectionId, posts.id, posts.thumbnail)}');"></div>-->
                          <img src={getImageURL(posts?.collectionId, posts?.id, posts?.thumbnail)} alt = "post image" class="m-auto w-auto relative max-h-[520px] sm:max-h-[700px]" style="position: relative;" loading="lazy"/>
                          {:else}
                          <!--show videos here-->
  
                         
                        
                          <VideoPlayer src={getImageURL(posts?.collectionId, posts?.id, posts?.thumbnail)} />
  
                          {/if}
                      </div>
                      
                    </div>
                    <!--End PostType Image-->
                  {:else if posts?.postType === 'link'}
                  <!--Start PostType Link -->
                    
                    {#if videoId[posts?.id]?.length === 0}
                       
          
                    <div class="flex flex-col sm:flex-row items-center sm:items-start pr-7 pb-2">
                      <div class="flex flex-col items-start w-full">
                        <!-- Post Title -->
                        <h2 class="pl-3 pt-2 text-start sm:hover:text-[#0099FF] text-[1.1rem] sm:text-xl font-semibold w-full mb-1 pr-5 flex-shrink break-normal">
                          {posts?.title}
                        </h2>
                        <!-- Post Description -->
                        {#if posts?.description !== 'undefined'}
                        <span class="block mt-2 text-start text-gray-100 text-[0.95rem] flex-shrink break-normal pl-3 w-11/12">
                          {posts?.description?.length > 120 ? posts?.description.slice(0, 120) + "..." : posts?.description}
                        </span>
                        {/if}
                        <a href={posts?.link} target="_blank" class="mt-2 text-sm pl-3 text-gray-400 font-semibold">
                          {(new URL(posts?.link))?.hostname.replace('www.','')}
                          <svg class="ml-1 w-4 h-4 inline-block -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14" stroke="#A6ADBB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                        </a>
                      </div>
                      
                      {#if posts?.thumbnail}
                      <div class="cursor-pointer w-full sm:w-56 sm:ml-auto mt-5 sm:mt-2 ml-6">
                        <div class="flex-shrink-0 ">
                          <a href={posts?.link} target="_blank" class="relative block w-full sm:w-56 h-full sm:max-h-[120px] overflow-hidden rounded-2xl">
                            <img src={getImageURL(posts?.collectionId, posts?.id, posts?.thumbnail)} class="object-cover bg-contain bg-center bg-no-repeat w-screen sm:w-full max-h-[250px] sm:h-fit rounded-2xl border border-gray-700" alt="news image" loading="lazy">
                          </a>
                        </div>
                      </div>
                      {/if}

                    </div>
                    
                      
                      
  
                    {:else}
                    <div class="pt-2 w-full">


                      <div class="ml-3 pr-7 flex flex-wrap sm:hover:text-[#0099FF] text-[1.1rem] sm:text-xl font-medium text-white mb-5 relative">
                        {posts?.title}
                      </div>
                      <!--
                      {#if !isVideoClicked[posts?.id] }

                      <div class="overflow-hidden bg-cover bg-no-repeat relative w-screen sm:w-full h-36 sm:h-[250px]">
                        <label on:click={clickVideo} class="cursor-pointer transition duration-200 opacity-70 hover:opacity-90">
                          <div class="relative transition duration-500 ease-in-out hover:scale-105">
                            <img src="{getImageURL(posts?.collectionId, posts?.id, posts?.thumbnail)}" alt="image" class="m-auto w-full h-full object-cover" loading="lazy"/>
                            <svg class="w-20 h-20 absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                              <path fill="none" d="M11 23a1 1 0 0 1-1-1V10a1 1 0 0 1 1.447-.894l12 6a1 1 0 0 1 0 1.788l-12 6A1.001 1.001 0 0 1 11 23Z"/>
                              <path fill="#D6D6DC" d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2Zm7.447 14.895l-12 6A1 1 0 0 1 10 22V10a1 1 0 0 1 1.447-.894l12 6a1 1 0 0 1 0 1.788Z"/>
                            </svg>
                          </div>
                        </label>
                      </div>
                    -->
                        <iframe
                        id="videoPlayer"
                        class="w-full min-h-56 sm:min-h-96 sm:h-full max-h-[500px]"
                        src={`https://www.youtube.com/embed/${videoId[posts.id]}`}
                        frameborder="0"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        autoplay
                      ></iframe>
                    </div>
                                      
                    {/if}
  
                  <!--End PostType Link-->
                  {/if}
              
                  </a>
                  
  
                <!--Start Post footer-->
                <div class="flex flex-col justify-start items-center mr-2 mt-8 ml-1.5 mb-4">
                  <!--Start Tags-->
                  <div class="flex flex-row items-center mr-auto ml-2">
                    {#if posts?.tagline?.length !== 0}
                    <label class="bg-[#D3D6DA] mr-3 text-xs h-fit font-medium text-[#171717] p-1 border rounded">
                      <span class="p-0.5">{posts?.tagline}</span>
                    </label>
                    {/if}
                    {#if posts?.tagTopic !== null}
                      {#each $tagList as tag}
                          {#each posts?.tagTopic as tagTopic}
                              {#if tag?.name === tagTopic}
                              <label class="bg-[#D3D6DA] mr-3 text-xs h-fit font-medium text-[#171717] p-1 border rounded">
                                <span class="p-0.5">{tag?.name}</span>
                              </label>
                              {/if}
                          {/each}
                      {/each}
                      {/if}
                    </div>
                  <!--End Tags-->
                  <!--Start-Up-Down-Vote-->
                  <div class="lg:hidden flex flex-row items-center justify-start ml-14 mt-6 w-full ">
                  <form on:submit={handleUpvote} class="-ml-4 lg:hidden mr-2">
                    <input type="hidden" name="postId" value={posts?.id}>
                    {#if !data?.user}
                    <div class="w-full">
                      <label for="userLogin" class="cursor-pointer">
                        <Upvote/>
                      </label>
                     
                    </div>
                      {:else}
                      <button type="submit" class="w-full">
                      {#if upvoteButtonClicked[posts?.id]}
                        <Upvote state='active'/>
                      {:else}
                      <Upvote />
                      {/if}
                    </button>
                    {/if}
                  </form>
                  <span class="text-sm text-semibold lg:hidden">
                    {upvoteCounter[posts?.id] - downvoteCounter[posts?.id] }
                  </span>
                  <form on:submit={handleDownvote} class="lg:hidden">
                    <input type="hidden" name="postId" value={posts?.id}>
                      {#if !data?.user}
                      <div class="w-full ml-2 mr-2">
                        <label for="userLogin" class="cursor-pointer">
                          <Downvote />
                        </label>
                      </div>
                      {:else}
                        <button type="submit" class="w-full ml-2 mr-2">
                        {#if downvoteButtonClicked[posts?.id]}
                        <Downvote state='active'/>
                        {:else}
                        <Downvote/>
                        {/if}
                        </button>
                    {/if}
                  </form>
                <!--End-Up-Down-Vote-->
                  <!--Start Comment Counter-->
                  <a href={'/community/post/'+posts?.id} class="ml-6 lg:hidden flex justify-center items-center rounded-md">
                    <svg class="w-4 h-4 mt-1 inline-block mr-2 lg:mr-3" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64px" height="64px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#D6D6DC"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" fill="#D6D6DC" d="M60,0H4C1.789,0,0,1.789,0,4v40c0,2.211,1.789,4,4,4h8v12 c0,1.617,0.973,3.078,2.469,3.695C14.965,63.902,15.484,64,16,64c1.039,0,2.062-0.406,2.828-1.172L33.656,48H60c2.211,0,4-1.789,4-4 V4C64,1.789,62.211,0,60,0z"></path> </g></svg>
                    <span class="ml-2 text-sm text-white font-semibold lg:font-medium">
                    {#if posts?.expand['comments(post)']}
                      {posts?.expand['comments(post)']?.length}
                    {:else}
                      0
                    {/if}
                  </span>
                  </a>
                <!--End Comment Counter-->
                <!--Start Share Button-->
                  <Share url ={'https://stocknear.com/community/post/'+posts?.id} />
                <!--End Share Button-->
                
                </div>
              </div>
                <!--End Post footer-->
  
              </div>
          </div>
          </div>
      </div>
  </div>
  

</div>
  
  
  
  
  
  <!--Start Delete Modal-->
  <input type="checkbox" id={deletePostId} class="modal-toggle" />
  
  <dialog id={deletePostId} class="modal modal-bottom sm:modal-middle ">
  
  
    <label for={deletePostId}  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    <div class="modal-box bg-[#27272A] p-10" >
  
  
          <h3 class="font-bold text-md sm:text-lg sm:mb-10">
            Are you sure you want to delete the post?
          </h3>
  
          <div class="modal-action ">
            <label on:click={handleDeletePost} for={deletePostId} class="sm:ml-3 btn bg-[#FF3131] hover:bg-[#ff4343] text-white btn-md w-full rounded-lg text-white font-bold text-md">
              Proceed
            </label>
        
  
            
          </div>
  
          
        </div>     
    </dialog>
    <!--End Delete Modal-->
  
    <style>
      .container {
        position: relative; /* Ensure relative positioning for the gradient overlay */
        overflow: hidden; /* To ensure the gradient does not overflow */
        max-height: 330px; /* Limit the container's height */
        width: 100%;
        padding: 14px;
      }
    
      .darken-overlay::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50px; /* Adjust as needed for the gradient effect */
        background: linear-gradient(0deg, rgb(20, 20, 23, 1), rgb(20, 20, 23, 0)); /* Smooth gradient transition */
        pointer-events: none; /* Ensure it doesn't interfere with text interaction */
      }
    </style>