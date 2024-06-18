<script lang='ts'>
  import {getImageURL, formatDate} from '$lib/utils';
  import CommentSection from '$lib/components/CommentSection.svelte';
  import TextEditor from '$lib/components/TextEditor.svelte';
  import Downvote from '$lib/components/Downvote.svelte';
  import Upvote from '$lib/components/Upvote.svelte';
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';
  
  
  
  import { onMount, onDestroy } from 'svelte';
  import {userRegion, cachedPosts, postVote, screenWidth, scrollToComment, postIdDeleted, setCache, getCache, tagList, numberOfUnreadNotification, commentAdded, commentUpdated, commentIdDeleted } from '$lib/store';
  import { goto, afterNavigate } from '$app/navigation';
  import { base } from '$app/paths'
  
  import toast from 'svelte-french-toast';
  
  export let data;
  export let form;
      
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
  let fastifyURL;
  
  userRegion.subscribe(value => {
  
      if (usRegion.includes(value)) {
        fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
      } else {
        fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
      }
    });
  
  
  let post = data?.getOnePost;
  let isScrolled = false;
  let isLoaded = false;
    
  let upvoteButtonClicked = {};
  let downvoteButtonClicked = {};
  let upvoteCounter = {};
  let downvoteCounter = {};
  let userAlreadyVoted;
  
  
  
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

    const response = await fetch(fastifyURL+'/upvote', {
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

    const response = await fetch(fastifyURL+'/downvote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        },
      body: JSON.stringify(postData)
    }); // make a POST request to the server with the FormData object
    
  };
  
  function handleScroll() {
      // Check the scroll position
  
      isScrolled = window.scrollY > 0;
      
    }
  
  
  const sortCommentsByDate = (comments) => {
    return comments.sort(function(a, b) {
      return new Date(b?.created) - new Date(a?.created);
    });
    }
  
     
  
  
  let dropdownOpen = false; // State variable to control dropdown visibility
  
  function toggleDropdown() {
          dropdownOpen = !dropdownOpen;
    }
  
  const handleCopyLink = async () => {
      dropdownOpen = !dropdownOpen;
      await navigator.clipboard.writeText("https://stocknear.com/community/post/"+post.id);
  
      toast.success('Link copied', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  };
  
    
  const handleReport = async () => {
  
    dropdownOpen = !dropdownOpen;
    toast.success('Post has been reported. Thank you!', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
      });
  };
  
  
  
  const handleDeletePost = async () => {
  
      dropdownOpen = !dropdownOpen;
  
      const postData = {
          postId: data?.getPostId,
          userId: data?.user?.id
      };
    
    const response = await fetch(fastifyURL+'/delete-post', {
      method: 'POST',
      headers: {
              'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
      });
    
    const output = (await response.json())?.items;
    
    if (output === 'success')
    {
      $postIdDeleted = post?.id;
    
    }
  
    if (output === 'success') {
        toast.success('Post deleted', {
        style: 'border-radius: 200px; background: #333; color: #fff;'
        });
        goto('/community')
  
    } else {
        toast.error('Something went wrong', {
        style: 'border-radius: 200px; background: #333; color: #fff;'
        });
    }  
  };
  
  
  
     
  let numberOfComments = 0;
  let comments = [];
  //let replyComments = data?.allReplyComments?.items.reverse() || [];
  
  
      
  let moderators;    
  let videoId = null;
  
  let loadTextEditor = false;
  
  
  
  async function getAllComments()
  {
  
    const postData = {'postId': data?.getPostId};
  
    // make the GET request to the endpoint
    const response = await fetch(fastifyURL+'/get-all-comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData),
        });
  
    const output = (await response.json())?.items;
  
    return output;
   
  };
  
  
  const getModerators = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('', 'getModerators');
      if (cachedData) {
        output = cachedData;
      } else {
  
        // make the POST request to the endpoint
        const response = await fetch(fastifyURL + '/get-moderators', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        output = (await response.json())?.items;
  
        setCache('', output, 'getModerators');
      }
  
      return output;
    };
  
  
    
    function isModerator(userId) {
      return moderators?.some(moderator => userId === moderator?.user);
    }
  
  function countAllComments(comments) {
  // Helper function to recursively count comments
  function countComments(commentsList) {
  let count = 0;
  for (let comment of commentsList) {
      count += 1; // Count this comment
      if (comment.children && comment.children.length > 0) {
      count += countComments(comment.children); // Recursively count nested comments
      }
  }
  return count;
  }
  return countComments(comments);
  }
  
  let LoginPopup;
  
  onMount(async () => {
      
    upvoteCounter[post.id] = post?.upvote;
    downvoteCounter[post.id] = post?.downvote;
    userAlreadyVoted = post?.expand['alreadyVoted(post)']?.some(item => item?.user === data?.user?.id);
      
    if (userAlreadyVoted) {
      upvoteButtonClicked[post.id] = post?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'upvote';
      downvoteButtonClicked[post.id] = post?.expand['alreadyVoted(post)']?.find(item => item?.user === data?.user?.id)?.type === 'downvote';
    } else {
      upvoteButtonClicked[post.id] = false;
      downvoteButtonClicked[post.id] = false;
    }
  
  
  
      if(!data?.user)
      {
        LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
      }
  
      [moderators, comments] = await Promise.all([
        getModerators(),
        getAllComments(),
      ]);
  
      numberOfComments = countAllComments(comments) || 0;
  
  if (post?.postType === 'link') {
      const url = new URL(post.link);
      if (url.hostname === "www.youtube.com") {
      const videoIdMatch = url.search.match(/v=([^&]+)/);
      if (videoIdMatch) {
          videoId = videoIdMatch[1];
      }
      }
  
  }
  
  loadTextEditor = true;
  isLoaded = true;
  
  //comments = data?.allComments?.items.reverse() || []
  //replyComments = data?.allReplyComments?.items.reverse() || []
  // Add a scroll event listener
  window.addEventListener('scroll', handleScroll);
  
  return () => {
  // Remove the event listener when the component is unmounted
  window.removeEventListener('scroll', handleScroll);
  };
  
  });
  
  
  let previousPage : string = base || '/community/';
  afterNavigate(({from}) => {
          previousPage = from?.url.pathname?.startsWith('/community/create-post') ? '/community' :  ( from?.url.pathname || '/community')
  
          }) 
  
  function closePost(event) {
  
      if (event.target.classList.contains('cursor-zoom-out')) {
          
          goto(previousPage);
  
      }
  
  }
  
  
  
  onDestroy( () => {
      $commentAdded = '';
      $commentIdDeleted = '';
      $scrollToComment = '';
      $postVote = {};
  })
  

// Function to update the vote when posts are cached
function updateVote(postVote) {
  const { id, upvote, downvote, upvoteClicked, downvoteClicked } = postVote;
  console.log(postVote)
  // Find the post by ID
  const item = $cachedPosts?.posts?.find(post => post?.id === id);
  console.log(item)
  if (item) {
      item.upvote = upvote;
      item.downvote = downvote;

     // Check if expand['alreadyVoted(item)'] exists
    if (!item.expand['alreadyVoted(item)']) {
      // Create the structure if it does not exist
      item.expand['alreadyVoted(post)'] = [
        {
          type: upvoteClicked ? 'upvote' : downvoteClicked ? 'downvote' : 'neutral',
          user: data?.user?.id
        }
      ];
    } else {
      // Update the existing type based on the click flags
      item.expand['alreadyVoted(post)'][0].type = upvoteClicked ? 'upvote' : downvoteClicked ? 'downvote' : 'neutral';
    }

  } else {
    console.log("Post not found.");
  }
}


  
  function addCommentToParent(comments, newComment) {
    // Helper function to handle the recursion
    function findAndAddParent(commentsList, newComment) {
      for (let comment of commentsList) {
        // Check if this comment is the parent
        if (comment.id === newComment.reply) {
          // Initialize children array if it doesn't exist
          if (!comment.children) {
            comment.children = [];
          }
          // Add the new comment to the beginning of the children array
          comment.children.unshift(newComment);
          return true; // Indicate that the comment has been added
        }
        // If not, recursively check in children
        if (comment.children && findAndAddParent(comment.children, newComment)) {
          return true; // Indicate that the comment has been added
        }
      }
      return false; // Indicate that the comment was not added
    }
  
    // If the new comment has a reply id, try to add it to its parent
    if (newComment.reply) {
      if (!findAndAddParent(comments, newComment)) {
        // If parent comment not found, add new comment at root level
        comments.unshift(newComment);
      }
    } else {
      // If new comment doesn't have a reply id, add it at root level
      comments.unshift(newComment);
    }
  
    return comments;
  }
  
  function updateCommentInList(newObject, list) {
    // Helper function to handle the recursion
    function findAndReplaceComment(commentsList, newComment) {
      for (let comment of commentsList) {
        // Check if this comment has the same id
        if (comment.id === newComment.id) {
          // Replace the comment
          comment.comment = newComment.comment;
          return true; // Indicate that the comment has been updated
        }
        // If not, recursively check in children
        if (comment.children && findAndReplaceComment(comment.children, newComment)) {
          return true; // Indicate that the comment has been updated
        }
      }
      return false; // Indicate that the comment was not updated
    }
  
    // Start the recursive search and update process
    findAndReplaceComment(list, newObject);
  
    // Return the updated list
    return list;
  }
  
  
  
  // Function to recursively find and remove a comment by id
  function removeCommentById(comments, idToRemove) {
    for (let i = 0; i < comments?.length; i++) {
      let comment = comments[i];
      // If the current comment has the id to remove
      if (comment?.id === idToRemove) {
        // Remove the comment from the array
        comments?.splice(i, 1);
        return comments; // Return the updated comments list
      }
      // If the current comment has children, recursively search for the comment in children
      if (comment?.children) {
        comment.children = removeCommentById(comment?.children, idToRemove);
      }
    }
    return comments; // Return the original comments list if the comment is not found
  }
  
  
  
  $: {
      if($commentAdded?.length !== 0)
      {  
        comments = sortCommentsByDate(addCommentToParent(comments, $commentAdded))
        numberOfComments = countAllComments(comments)
      }
  }
  
  $: {
    if($commentUpdated?.length !== 0) 
    {
      comments = updateCommentInList($commentUpdated, comments);
    }
  }
  
  $: {
      if($commentIdDeleted?.length !== 0)
      {
          comments = removeCommentById(comments, $commentIdDeleted)
          numberOfComments = countAllComments(comments)
      }
  }
  
  
  $: {
  if($postVote && Object?.keys($postVote).length !== 0)
  {
    //Update in realtime the already downloaded posts list when user votes in cached posts
    updateVote($postVote)
    //console.log(posts?.at(0))
    $postVote = {};
  }

}

  </script>
  
  
      
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {post.title} · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
    <!-- Other meta tags -->
    <meta property="og:title" content="{post.title} · stocknear"/>
    <meta property="og:description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="{post.title} · stocknear"/>
    <meta name="twitter:description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
      
    
  
  
  <!--<section on:click={closePost} class="bg-[#0F0F0F] cursor-zoom-out min-h-screen">-->
  
  <!--in:pageTransitionIn={{ duration: 250, screenWidth: $screenWidth }}-->
  <div class="overflow-hidden flex flex-row item-start w-full lg:mt-5 relative max-w-6xl m-auto lg:px-5 sm:pb-40">
    <!--Start Voting-->
    <div style="top: 4rem;" class="hidden lg:flex flex-col items-center relative h-fit sticky z-20 lg:mr-3 ">
      <!--Start Upvote-->
      <form on:submit={handleUpvote}>
        <input type="hidden" name="postId" value={post?.id}>
        {#if !data?.user}
        <div class="w-full">
          <label for="userLogin" class="cursor-pointer">
            <Upvote/>
          </label>
         
        </div>
          {:else}
          <button type="submit" class="w-full">
          {#if upvoteButtonClicked[post?.id]}
            <Upvote state='active'/>
          {:else}
          <Upvote />
          {/if}
        </button>
        {/if}
      </form>
      <!--End Upvote-->
      <label class="px-6 py-4 w-14 rounded-lg bg-[#202020] text-[1rem] text-bold text-white">
          {typeof upvoteCounter[post?.id] === 'number' || typeof downvoteCounter[post?.id] === 'number' ? (upvoteCounter[post?.id] - downvoteCounter[post?.id]) : '-' }
      </label>
      <!--Start Downvote-->
      <form on:submit={handleDownvote}>
        <input type="hidden" name="postId" value={post?.id}>
          {#if !data?.user}
          <div class="w-full">
            <label for="userLogin" class="cursor-pointer">
              <Downvote />
            </label>
          </div>
          {:else}
            <button type="submit" class="w-full">
            {#if downvoteButtonClicked[post?.id]}
            <Downvote state='active'/>
            {:else}
            <Downvote/>
            {/if}
            </button>
        {/if}
      </form>
      <!--End Downvote-->
  
    </div>
   <!--End Voting-->
  
  
  <div class="w-full bg-[#202020] max-w-5xl m-auto border sm:hover:border-slate-800 border-slate-800 rounded-none sm:rounded-xl ">
      
  <!-- Start Header -->
  <div style="top: 0.8rem;" class="sm:rounded-xl absolute h-12 sticky z-20 bg-[#202020] w-full {isScrolled && $screenWidth < 640 ? 'border-b border-gray-700 ease-in' : 'ease-out'}">
      <div class="flex flex-row items-center justify-between w-full pt-3">
          <a href={previousPage} class="absolute left-2 sm:left-4 sm:top-4">
              <svg class="w-5 h-5 inline-block sm:mr-1 sm:-mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                  <g transform="rotate(-90 512 512)">
                      <path fill="white" d="M104.704 685.248a64 64 0 0 0 90.496 0l316.8-316.8l316.8 316.8a64 64 0 0 0 90.496-90.496L557.248 232.704a64 64 0 0 0-90.496 0L104.704 594.752a64 64 0 0 0 0 90.496z"/>
                  </g>
              </svg>
              <span class="hidden sm:inline-block text-white font-medium">
                  Return
              </span>
          </a>
          <span class="sm:hidden m-auto text-[1rem] font-medium text-white">
              Post
          </span>
      </div>
  </div>
  
  <!-- Page wrapper -->
          <div class="flex flex-col overflow-hidden pb-40">
      
           
                      <div class="w-full max-w-5xl mx-auto sm:px-6">
                          <div class="md:flex md:justify-between md:divide-x md:divide-slate-800">
                              <!-- Main content -->
                              <div class="md:grow pb-12 md:pb-20">
                                  
                                  <!--
                                  <button on:click={() => goto('/community')} class="sm:hidden inline-flex items-center mr-auto">
                                      <svg class="w-6 h-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
                                      <span class="text-sm text-white">Return</span>
                                  </button>
                                  -->
  
                                  <div class="w-full m-auto mt-10 pb-20">
  
                                      <a href={'/community/user/'+post?.expand?.user?.id} class="flex flex-row items-center justify-start ml-3 pb-5 mr-auto">
                                          <label class="avatar w-10 h-10 flex-shrink-0 text-white text-xs sm:text-sm ml-1">
                                            <img class="flex-shrink-0 inline-block bg-slate-300 rounded-full" 
                                            src={post?.expand?.user?.avatar
                                                ? getImageURL(post?.expand?.user?.collectionId, post?.expand?.user?.id, post?.expand?.user?.avatar)
                                                : `https://api.dicebear.com/7.x/thumbs/svg?seed=${post?.expand?.user?.username}`} 
                                            alt="User avatar" />
                                          </label>
                                          <span class="text-white ml-2 inline-block text-sm">
                                            {post?.expand?.user?.username}
                                          </span>
                                          {#if isLoaded}
                                          {#if isModerator(post?.expand?.user?.id)}
                                            <svg class="inline-block ml-1 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#75d377" d="M256 32C174 69.06 121.38 86.46 32 96c0 77.59 5.27 133.36 25.29 184.51a348.86 348.86 0 0 0 71.43 112.41c49.6 52.66 104.17 80.4 127.28 87.08c23.11-6.68 77.68-34.42 127.28-87.08a348.86 348.86 0 0 0 71.43-112.41C474.73 229.36 480 173.59 480 96c-89.38-9.54-142-26.94-224-64Z"/></svg>
                                          {/if}
                                          {/if}
                                          <span class="text-white font-bold ml-1 mr-1">
                                            ·
                                          </span>
                                          <span class="text-white text-xs">
                                            {formatDate(post?.created)} ago
                                          </span>
                                        </a>
                                     
  
                                      <h1 class="text-xl sm:text-2xl pl-3 pr-3 font-semibold mt-4 text-[#D7DADC] cursor-auto">
                                        
                                          {#if post?.postType !== 'link'}
                                              {post?.title}
                                          {/if}
                                         
                                      </h1>
  
                                    
                                      
                                      {#if videoId === null}
                                      
                                          {#if post?.postType === 'link'}
                                          <!--Start Post Link-->
                                        
                                          <div class="flex flex-col sm:flex-row items-start pb-4">
                                              <div class="flex-shrink-0">
                                              {#if post?.thumbnail}
                                              <a href={post?.link} target="__blank" class="cursor-pointer ">
                                                  <img src="{getImageURL(post?.collectionId, post?.id, post?.thumbnail)}" class="w-screen sm:w-40 lg:w-48 max-h-[250px] sm:max-h-[120px] rounded-lg sm:rounded-2xl mr-4 mb-2" alt="news image">
                                              </a>
                                              {/if}
                                              </div>
                                              <div class="flex-grow {post?.thumbnail ? '' : 'ml-1 sm:ml-5'} ">
                                              <h1 class="text-start text-xl sm:text-2xl text-[#D7DADC] font-semibold mb-2 flex-shrink ml-2 sm:ml-0">
                                                  {post?.title}
                                              </h1>
                                              {#if post?.description !== 'undefined'}
                                              <span class="w-full flex justify-start items-center text-start text-[#D7DADC] text-sm sm:text-[1rem] mb-2 flex-shrink ml-2 mt-2 sm:ml-0">
                                                  {@html post?.description } 
                                              </span>
                                              {/if}
  
                                              <a href={post?.link} target="_blank" class="mt-2 text-[1rem] text-gray-400 font-semibold ml-2.5 sm:ml-0">
                                                {(new URL(post?.link))?.hostname.replace('www.','')}
                                                <svg class="ml-1 w-4 h-4 inline-block -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14" stroke="#A6ADBB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                              </a>
  
                                              </div>
                                          </div>
                                          <!--End Post Link-->
                                          <!--Start Rest of Post type-->
                                          {:else}
                          
                                          
                                              {#if post?.thumbnail?.length !==0}
                                                  {#if !['webm', 'mp4'].some(format => post?.thumbnail?.includes(format))}
                                                  <!--<label for="zoomPostImage" class="cursor-zoom-in mt-10 bg-[#000] m-auto flex justify-center items-center">-->
                                                  <label class="mt-10 bg-[#000] m-auto flex justify-center items-center rounded-xl">
                                                      <img src="{getImageURL(post?.collectionId, post?.id, post?.thumbnail)}" alt="image" class="relative bg-center m-auto object-center w-auto relative max-h-[520px] sm:max-h-[700px]">
                                                  </label>
                                                  {:else}
                                                  <label class="mt-10 bg-[#000] m-auto flex justify-center items-center rounded-xl">
                                                      
  
                                                    <!--
                                                      <video
                                                      controls
                                                      class="relative m-auto {$screenWidth < 640 ? 'w-screen' : 'w-fit max-w-[800px] max-h-[700px]'} " 
                                                      src={getImageURL(post?.collectionId, post?.id, post?.thumbnail)}
                                                      />
                                                  -->
                                                  <div class="relative m-auto {$screenWidth < 640 ? 'w-screen' : 'w-fit max-w-[800px] max-h-[700px]'}">
                                                      <VideoPlayer src={getImageURL(post?.collectionId, post?.id, post?.thumbnail)} hideProgressbar = {$screenWidth > 640 ? true : false} />
                                                  </div>
                                                      
                                                  </label>
                                              
                                                  {/if}
  
                                                  
                                              {/if}
                                              <!--End Rest of Post type-->
                                          {/if}
  
                                      {:else}
                                      <h1 class="text-xl sm:text-2xl pl-3 pr-3 font-semibold mt-4 text-[#D7DADC] cursor-auto">
                                        {post?.title}
                                      </h1>
                                      
                                      <div class="mt-10 m-auto flex justify-center items-center mb-10">
                                          <iframe
                                          class="w-full min-h-56 sm:min-h-96 sm:h-full max-h-[500px] sm:rounded-xl sm:shadow-sm sm:shadow-[#313131]"
                                          src={`https://www.youtube.com/embed/${videoId}`}
                                          frameborder="0"
                                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowfullscreen
                                          ></iframe>
                                      </div>
                                      {/if}
  
                                     
  
                                      <p class="mt-5 text-lg whitespace-normal {videoId !== null ? 'hidden' : ''} ">
                                          
                                          {#if post?.postType !== 'link'}
                                          <div class="p-3 text-sm sm:text-[1rem] whitespace-pre-line text-[#D7DADC]">
                                              {@html post?.description}
                                          </div>
                                          {/if}
                                      </p>
                                        
                                      <!--Start Tagline-->
                                      <div class="flex flex-row items-center">
                                          {#if post?.tagline?.length !== 0}
                                          <label class="bg-[#D3D6DA] ml-3 mr-3 text-xs h-fit text-[#171717] font-medium p-2 rounded">
                                              <span class="p-0.5">{post?.tagline}</span>
                                          </label>
                                          {/if}
                                          <!--Start Tags-->
                                          <div class="flex flex-row {post?.tagline ? '' : 'ml-3'} mr-auto">
                                              {#if post?.tagTopic !== null}
                                              {#each $tagList as tag}
                                                  {#each post?.tagTopic as tagTopic}
                                                      {#if tag?.name === tagTopic}
                                                      <label class="bg-[#D3D6DA] mr-3 text-xs h-fit text-[#171717] font-medium p-2 rounded">
                                                          <span class="p-0.5">{tag?.name}</span>
                                                      </label>
                                                      {/if}
                                                   {/each}
                                              {/each}
                                              {/if}
                                              </div>
                                          <!--End Tags-->
  
                                      </div>
                                      <!-- End Tagline-->
  
                                      <div class="flex flex-row items-center justify-start ml-8 mt-8 mb-3 w-full ">
                                        <form on:submit={handleUpvote} class="-ml-4 lg:hidden mt-1 mr-2">
                                          <input type="hidden" name="postId" value={post?.id}>
                                          {#if !data?.user}
                                          <div class="w-full">
                                            <label for="userLogin" class="cursor-pointer">
                                              <Upvote/>
                                            </label>
                                           
                                          </div>
                                            {:else}
                                            <button type="submit" class="w-full">
                                            {#if upvoteButtonClicked[post?.id]}
                                              <Upvote state='active'/>
                                            {:else}
                                            <Upvote />
                                            {/if}
                                          </button>
                                          {/if}
                                        </form>
                                        <span class="text-sm text-semibold lg:hidden">
                                          {upvoteCounter[post?.id] - downvoteCounter[post?.id] }
                                        </span>
                                        <form on:submit={handleDownvote} class="ml-1 lg:hidden mt-1 mr-2">
                                          <input type="hidden" name="postId" value={post?.id}>
                                            {#if !data?.user}
                                            <div class="w-full ml-2 mr-2">
                                              <label for="userLogin" class="cursor-pointer">
                                                <Downvote />
                                              </label>
                                            </div>
                                            {:else}
                                              <button type="submit" class="w-full ml-2 mr-2">
                                              {#if downvoteButtonClicked[post?.id]}
                                              <Downvote state='active'/>
                                              {:else}
                                              <Downvote/>
                                              {/if}
                                              </button>
                                          {/if}
                                        </form>
  
                                        <div class="ml-6 lg:hidden flex justify-center items-center rounded-md">
                                          <svg class="w-4 h-4 mt-1 inline-block mr-2 lg:mr-3" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64px" height="64px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#D6D6DC"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" fill="#D6D6DC" d="M60,0H4C1.789,0,0,1.789,0,4v40c0,2.211,1.789,4,4,4h8v12 c0,1.617,0.973,3.078,2.469,3.695C14.965,63.902,15.484,64,16,64c1.039,0,2.062-0.406,2.828-1.172L33.656,48H60c2.211,0,4-1.789,4-4 V4C64,1.789,62.211,0,60,0z"></path> </g></svg>
                                          <span class="ml-2 text-sm text-white font-semibold lg:font-medium">
                                            {numberOfComments}
                                          </span>
                                      </div>
  
                                      </div>
  
  
                                      <div class="divider mb-3"></div>
  
                                      <p class="text-white ml-5 sm:ml-2 text-xl hidden lg:block">
                                          {numberOfComments} Comments
                                      </p>
  
      
                                      {#if !loadTextEditor}
                                      <div class="flex  items-center m-auto relative -top-7 h-[50px] w-[100px]">
                                          <div class="loader">Loading...</div>
                                        </div>
                                      {:else}
                                          <!-- Start-Comment form -->
                                          <div class="w-full max-w-6xl mt-5">
  
                                              {#if data?.user}
                                              <div class="w-full sm:w-5/6 mb-5">
                                                  <TextEditor
                                                      data = {data}
                                                      postId = {post.id}
                                                      commentId = ''
                                                      
                                                  />
                                                  <!--Submit button in TextEditor component-->
                                              </div>
                                              
                                              {:else}
                                              <div class="text-sm sm:text-md text-white bg-[#4B5563] bg-opacity-[0.2] w-full sm:w-fit flex items-center justify-start sm:justify-center pl-2 sm:pl-5 pr-0 sm:pr-5 h-16 rounded-none sm:rounded-lg">
                                                  <svg class="w-5 h-5 inline-block flex-shrink-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                                                  Please <label for="userLogin" class="text-blue-400 hover:text-white ml-1 mr-1 font-medium underline">sign up</label> 
                                                  to be able to comment on topics
                                              </div>
                                              {/if}
  
                                          </div>
  
                                          
                                          
                                          
                                          {#if numberOfComments === 0}
                                          <p class="text-center sm:text-start text-slate-100 sm:pl-2 pr-2 text-sm sm:text-md pb-20">
                                              No comments available yet. Be the first and open the discussion! 🚀
                                          </p>
                                          {/if}
  
                                          <!--End-Comment form -->
  
                                          <!--Start comment section-->
                                          <div class="mt-10 ml-2">
                                          {#each comments as comment}
  
                                              <CommentSection
                                              moderators={moderators}
                                              comment = {comment}
                                              postId = {post?.id}
                                              data = {data}
                                              opUserId={post?.user}
                                              upvoteCounter={comment?.upvote}
                                              downvoteCounter={comment?.downvote}
                                              userAlreadyVoted={comment?.expand['alreadyVoted(comment)']?.some(item => item?.user === data?.user?.id)}
                                              />
  
                                          {/each}
                                          </div>
                                          <!--End comment section-->
  
                                      {/if}
  
      
                                          
                                      
                                  </div>
                              </div>
      
                              
      
                          </div>
      
                      </div>
  
             
          </div>
  
   
           <!-- Start Zoom Post Image -->
           <!---
              <input type="checkbox" id="zoomPostImage" class="modal-toggle" />
  
              <label for="zoomPostImage" class="modal cursor-pointer">
              <div class="info-card w-full max-w-screen-md h-screen mx-auto flex justify-center">
                  <label class="w-full relative bg-slate-800 bg-opacity-0" for="">
                  <label for="zoomPostImage" class="btn btn-sm btn-circle absolute right-2 top-2 bg-white hover:bg-gray-300">
                      <span class="text-black text-lg">✕</span>
                  </label>
                  
                  <img src={getImageURL(post.collectionId, post.id, post.thumbnail)} class="rounded-md w-full max-h-[900px] inline-block mx-auto" alt="zoom post image" />
                  
                  </label>
              </div>
              </label>
          -->
          <!-- End Zoom Post Image -->
  
  
    </div>
  </div>
  
  
  <!--Start Login Modal-->
  {#if LoginPopup}
     <LoginPopup form={form}/>    
  {/if}
  <!--End Login Modal-->
  
  
  {#if data?.user}
      
  <!--Start Delete Strategy Modal-->
  
  <input type="checkbox" id="deletePostModal" class="modal-toggle" />
  
  <dialog id="deletePostModal" class="modal modal-bottom sm:modal-middle">
  
  
  <label for="deletePostModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-600 overflow-hidden">
  
      <h3 class="font-bold text-xl mb-5 pt-5 text-white m-auto w-3/4 text-center">
      Are you sure you want to delete the post?
      </h3>
  
      <div class="modal-action w-full m-auto p-5 flex flex-col sm:flex-row items-center">
          
      <label on:click={handleDeletePost} class="sm:ml-3 btn bg-[#FF3131] hover:bg-[#ff4343] text-white btn-md w-full rounded-lg text-white font-bold text-md">
          Proceed
      </label>
  
      </div>
      </div>
  </dialog>
  
  <!--End Delete Strategy Modal-->
  
  {/if}
  
  
  
  
  
  
  <style>
  
  
  .info-card {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
  
  </style>