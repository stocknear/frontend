<script lang='ts'>
  import CreateNewPost from '$lib/components/CreateNewPost.svelte';
  import PostSection from '$lib/components/PostSection.svelte';
  import SkeletonLoading from '$lib/components/SkeletonLoading.svelte';
  import Input from '$lib/components/Input.svelte';
  import { serialize } from 'object-to-formdata';

  import { onMount, onDestroy } from 'svelte';
  import {getImageURL } from '$lib/utils';
  import {screenWidth, userRegion, setCache, getCache, newAvatar, clientSideCache, numberOfUnreadNotification, postIdDeleted } from '$lib/store';

  import toast from 'svelte-french-toast';
	import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

  import { pb } from '$lib/pocketbase';
  import { z } from 'zod';
  import { updatePersonalDataSchema, updatePasswordSchema} from '$lib/schemas';
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL;
  let fastifyURL;

  userRegion.subscribe(value => {
    if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
      fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
      fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
  });


  let zodErrors = [];
  let moderators;
  let numberOfPosts = '-';
  let loading = true;
  let isLoaded = false;
  let errorAvatar;
  let errorUsername = '';
  let errorOldPassword = '';
  let errorPassword = '';
  let errorPasswordConfirm = '';
  let subscriptionData = data?.getSubscriptionData;
  let isClicked = false;
  let userStats = {'numberOfPosts': 0, 'numberOfComments': 0}

  const showPreview = (event) => {
    const target = event.target;
    const files = target.files;

    if (files.length > 0) {
      const src = URL.createObjectURL(files[0]);
      const preview = document.getElementById('avatar-preview');
      preview.src = src;

      document.getElementById('submit-btn').click();

    }
  };





const submitCancellation = () => {
  return async ({ result, update}) => {
      switch (result.type) {
          case 'success':
            toast.success('Subscription Cancelled successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'redirect':
              toast.success('Subscription Cancelled successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'failure':
              toast.error('Something went wrong.', {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'error':
              toast.error(result.error.message, {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              break;
          default:
              await update();
      }

setTimeout(() => {
    if (result.type === 'redirect') {
      const anchor = document.createElement('a');
      anchor.href = '/community/profile';
      anchor.dataset.sveltekitReload = true;
      document.body.appendChild(anchor);
      anchor.dispatchEvent(new MouseEvent('click'));
    }
  }, 1500);
  
  }
}

const submitReactivate = () => {
  return async ({ result, update}) => {
      switch (result.type) {
          case 'success':
            toast.success('Subscription Reactivate successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'redirect':
              toast.success('Subscription Reactivate successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'failure':
              toast.error('Something went wrong.', {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'error':
              toast.error(result.error.message, {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              break;
          default:
              await update();
      }

setTimeout(() => {
    if (result.type === 'redirect') {
      const anchor = document.createElement('a');
      anchor.href = '/community/profile';
      anchor.dataset.sveltekitReload = true;
      document.body.appendChild(anchor);
      anchor.dispatchEvent(new MouseEvent('click'));
    }
  }, 1500);
  
  }
}



const submitChangePlan = () => {
  return async ({ result, update}) => {
      switch (result.type) {
          case 'success':
            toast.success('Changing to Annual Plan successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'redirect':
              toast.success('Changing to Annual Plan successfully!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'failure':
              toast.error('Something went wrong.', {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              await update();
              break;
          case 'error':
              toast.error(result.error.message, {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
              break;
          default:
              await update();
      }

setTimeout(() => {
    if (result.type === 'redirect') {
      const anchor = document.createElement('a');
      anchor.href = '/community/profile';
      anchor.dataset.sveltekitReload = true;
      document.body.appendChild(anchor);
      anchor.dispatchEvent(new MouseEvent('click'));
    }
  }, 5000);
  
  }
}




async function updateAvatar(event)
  {

  event.preventDefault(); // prevent the default form submission behavior
  const formData = new FormData(event.target); // create a FormData object from the form
  const postData = {}

	for (const [key, value] of formData.entries()) {
		postData[key] = value;
	}
  try {
    //To-do
    //const cleanedData = updateAvatarSchema.parse({postData});

    const { avatar } = await pb.collection('users').update(data?.user?.id, serialize(postData));
    data.user.avatar = avatar;
    $newAvatar = avatar;
    /*
    toast.success('Avatar updated successfully!', {
        style: 'border-radius: 200px; background: #333; color: #fff;'});
    */
  }
  catch(error) {

    if (error instanceof z.ZodError) {
        // Handle Zod validation errors
		zodErrors = error.errors;

		errorAvatar = zodErrors.find((err) => err.path[0] === 'avatar')?.message ?? '';


      toast.error(errorAvatar, {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
    else {
      toast.error('Something went wrong. Please try again!', {
          style: 'border-radius: 200px; background: #333; color: #fff;',
        });
    }
    
  }

}

async function handleAvatar(event) {
  toast.promise(
	updateAvatar(event),
	{
		loading: 'Saving...',
		success: 'Avatar updated successfully!',
		error: 'Could not save.',
	}, 
  {
    style: 'border-radius: 200px; background: #333; color: #fff;',
  }
);
  
}

async function updatePersonalData(event) {
  event.preventDefault(); // prevent the default form submission behavior
  errorUsername = '';
  const formData = new FormData(event.target); // create a FormData object from the form
  const postData = {}

	for (const [key, value] of formData.entries()) {
		postData[key] = value;
	}

  try {
    // Use Zod validation
    const cleanedData = updatePersonalDataSchema.parse(postData);
    const { username } = await pb.collection('users').update(data?.user?.id, cleanedData);
    toast.success('Username updated!', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
    data.user.username = username;
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
    zodErrors = error.errors;

    errorUsername = zodErrors?.find((err) => err.path[0] === 'username')?.message ?? '';

      toast.error('Invalid credentials', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    } 
    else {
      // Handle other errors
      console.error('Unexpected error during registration:', error);

      toast.error('An unexpected error occurred', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
  }


 
}

async function updatePassword(event) {
  
  event.preventDefault(); // prevent the default form submission behavior
  errorOldPassword = '';
  errorPassword = '';
  errorPasswordConfirm = '';


  const formData = new FormData(event.target); // create a FormData object from the form
  const postData = {}

	for (const [key, value] of formData.entries()) {
		postData[key] = value;
	}

  try {
    // Use Zod validation
    const cleanedData = updatePasswordSchema.parse(postData);
    await pb.collection('users').update(data?.user?.id, cleanedData);
    toast.success('Password updated!', {
      style: 'border-radius: 200px; background: #333; color: #fff;',
    });
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
    zodErrors = error.errors;

    errorOldPassword = zodErrors?.find((err) => err.path[0] === 'oldPassword')?.message ?? '';
    errorPassword = zodErrors?.find((err) => err.path[0] === 'password')?.message ?? '';
    errorPasswordConfirm = zodErrors?.find((err) => err.path[0] === 'passwordConfirm')?.message ?? '';

      toast.error('Invalid credentials', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    } 
    else {
      // Handle other errors
      console.error('Unexpected error during registration:', error);

      toast.error('An unexpected error occurred', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
    }
  }

}



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


  
function isModerator(data, moderators) {
    return moderators?.some(moderator => data?.user?.id === moderator?.expand?.user?.id);
  }
  

const getUserStats = async () => {
  let output;

  // Get cached data for the specific tickerID
  const cachedData = getCache(data?.user?.id, 'getUserStats');
  if (cachedData) {
    output = cachedData;
  } else {

    const postData = {'userId': data?.user?.id};

    // make the POST request to the endpoint
    const response = await fetch(fastifyURL + '/get-user-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    output = (await response.json())?.items;


    setCache(data?.user?.id, output, 'getUserStats');
  }

  return output
};




let posts: any[] = [];



let currentPage = 1;
let postLoading = false;
let seenPostId = [];

let noPostMore = false;


async function infiniteHandler({ detail: { loaded, complete } }) 
{

  // console.log("Page position:", window.pageYOffset);
  seenPostId = posts.map(obj => obj.id);

  if (!postLoading && !noPostMore) {
    postLoading = true;

    const newPosts = await getPost();
    if (newPosts.length === 0) {
      noPostMore = true;
      complete();
    } else {
      // Remove new posts with duplicate IDs
      const filteredNewPosts = newPosts.filter((newPost) => !posts.find((post) => post.id === newPost.id));
      posts = [...posts, ...filteredNewPosts];
      currentPage++;
      loaded();
    }
    postLoading = false;
  }

}


async function getPost() {


  const postData = {
    startPage: currentPage,
    seenPostId: seenPostId.length === 0 ? [] : seenPostId,
    userId: data?.user?.id,
  };

  // Make the POST request to the endpoint
  const response = await fetch(fastifyURL+'/get-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  const output = (await response.json())?.items;


  return output
}






let showTab = 'subscription';

let settingsTab = 'personalData';

const changeTab = (state) => {
  switch (state) {
    case 'post':
      showTab = 'post';
      break;
    case 'settings':
      showTab = 'settings';
      break;
    case 'subscription':
      showTab = 'subscription';
      break;
    case 'personalData':
      settingsTab = 'personalData';
      break;
    case 'changePassword':
      settingsTab = 'changePassword';
      break;
    
  }
};


onMount(async () => {

  window.scrollTo(0, 0);

  [posts, moderators, userStats] = await Promise.all([
      getPost(),
      getModerators(),
      getUserStats(),
    ]);

  loading = false;
  isLoaded = true;

});


onDestroy(async () => {
    $postIdDeleted ='';

  });


  $: {
  if($postIdDeleted.length !== 0)
  {
    posts = posts?.filter(item => item?.id !== $postIdDeleted);


  }
}




</script>




<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {data?.user?.username} · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Explore {data?.user?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <!-- Other meta tags -->
  <meta property="og:title" content="{data?.user?.username} · stocknear"/>
  <meta property="og:description" content="Explore {data?.user?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{data?.user?.username} · stocknear"/>
  <meta name="twitter:description" content="Explore {data?.user?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

<section>







<body class="bg-[#0F0F0F] text-slate-200 overflow-hidden mt-10 sm:mt-5">

  <!-- Page wrapper -->
  <div class="flex flex-col min-h-screen overflow-hidden">

   
      <main class="grow">
        

         
          <!-- Page content -->
          <section>
              <div class="w-full max-w-6xl m-auto sm:px-20 ml-auto ">


            <div class="w-full flex flex-row">
            <!--Start Profile Pic-->
            <div class="flex items-center justify-start mb-5 w-screen sm:w-full bg-[#202020] h-48 sm:rounded-xl border border-gray-700 sm:hover:border-gray-600">
              <form 
                on:submit={handleAvatar}
                class="ml-5"
                >
                <input
                  type="file"
                  name="avatar"
                  id="avatar"
                  value=""
                  accept="image/*"
                  hidden
                  on:change={showPreview}
                />
                <label for="avatar" class="avatar w-20 h-20 sm:w-24 sm:h-24 rounded-full hover:cursor-pointer">
                  <label for="avatar" class="absolute z-10 -bottom-0.5 -right-0.5 hover:cursor-pointer">
                    <span class="btn btn-circle btn-sm btn-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24"><path fill="white" d="m14.06 9l.94.94L5.92 19H5v-.92L14.06 9m3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75Z"/></svg>
                    </span>
                  </label>
                    <img style="clip-path: circle(50%);" class="w-24 bg-slate-300 border border-slate-400 rounded-full inline-block "
                    src={data?.user?.avatar
                        ? getImageURL(data?.user?.collectionId, data?.user?.id, data?.user?.avatar)
                        : `https://api.dicebear.com/7.x/thumbs/svg?scale=200`} 
                        alt="User avatar"
                        id="avatar-preview"
                      />
                   
          
                </label>
                  <button id="submit-btn" class="hidden" type="submit"></button>
                  
                </form>
                <div class="mt-5 ml-5 p-2">
                    <p class="text-sm sm:text-xl text-gray-200 font-semibold">
                        @{data?.user?.username}
                        {#if isModerator(data, moderators)}
                          <svg class="inline-block w-5 h-5 -ml-0.5 mr-0.5 mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#75d377" d="M256 32C174 69.06 121.38 86.46 32 96c0 77.59 5.27 133.36 25.29 184.51a348.86 348.86 0 0 0 71.43 112.41c49.6 52.66 104.17 80.4 127.28 87.08c23.11-6.68 77.68-34.42 127.28-87.08a348.86 348.86 0 0 0 71.43-112.41C474.73 229.36 480 173.59 480 96c-89.38-9.54-142-26.94-224-64Z"/></svg>
                        {/if}
                    </p>
                    <span class="text-sm text-gray-200">
                      Joined on {new Date(data?.user?.created ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                    </span>
                </div>
              
              
            </div>

                      <!-- Sidebar -->
            <aside class="hidden lg:inline-block h-sh lg:w-1/2 lg:pr-2 xl:pr-0">
              <div class="lg:pl-5 z-20 h-full">
            
                    <!-- Sidebar content -->

                      <!--Start User Profile -->
                      <div class="space-y-6 ml-4">  
                      <div class="rounded-xl bg-[#202020] h-48 w-full border border-gray-700 font-mono">
                        <!--Start Header-->
                        <div class="ml-2 w-full p-3">
                            <span class="text-white text-lg font-medium ml-0.5">User Profile</span>
                        </div>
                        <hr class="border-b border-gray-700"/>
                        <!--End Header-->
                        <!--Start Content-->
                        <div class="w-full p-2">

                          <table class="font-semibold table table-compact bg-[#202020] text-start flex justify-start items-center w-full px-3 m-auto">
                            <tbody class="bg-[#202020]">
                              <!-- row 1 -->
                              <tr class="text-gray-300">
                                <td class="bg-[#202020] border-b border-[#202020]">Karma: {data?.user?.karma}</td>
                                <td class="bg-[#202020 border-b border-[#202020]">Posts: {userStats?.numberOfPosts}</td>
                              </tr>
                              <!-- row 2 -->
                              <tr class="text-gray-300">
                                <td class="bg-[#202020]">Comments: {userStats?.numberOfComments}</td>
                                <td class="bg-[#202020]"></td>
                              </tr>
                            </tbody>
                          </table>
                      </div>
                    <!--End User Profile -->

                    {#if data?.user?.tier === 'Pro'}
                    <!--Start Badge-->
                      <div class="rounded-xl bg-[#202020] h-48 w-full border border-gray-700 mt-14">
                        <!--Start Header-->
                        <div class="ml-2 w-full p-3">
                            <span class="text-white text-lg font-medium ml-0.5 ">Badge</span>
                        </div>
                        <hr class="border-b border-gray-700"/>
                        <!--End Header-->
                        <!--Start Content-->
                        <div class="w-full p-2 flex flex-col items-start">
                          <div class="ml-2 mt-3 rounded-full border border-gray-500 w-16 h-16 relative bg-[#20202E] flex items-center justify-center">
                            <svg style="clip-path: circle(50%);" class="rounded-full w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#F9784E" d="M273.857 21.904c-24.193.012-51.198 5.552-81.1 17.467c143.7 12.608 150.35 129.263 84.032 132.814c-85.27 4.565-53.232-57.217-133.34-103.03C200.445 201.48 94.44 190.33 21.054 59.23c12.805 85.755 24.28 116.942 78.26 153.596C261.996 323.294 94.618 347.8 36.82 245.53c14.568 93.454 68.364 132.803 131.707 139.93c-42.753 24.49-99.452 32.49-143.01 25.556c51.025 42.317 131.606 40.94 193.515 8.576c-37.137 36.123-97.446 70.644-116.803 74.728H276.36C517 405.563 530.305 232.45 454.827 124.492c-2.433 26.21-10.08 49.507-25.545 70.23c-18.48-102.394-69.02-172.86-155.426-172.818zm2.82 184.666l141.384 52.155c.286-3.207.86-6.495 1.747-9.807c5.62-20.973 21.605-34.913 35.705-31.135s20.973 23.842 15.353 44.815c-5.62 20.974-21.603 34.914-35.703 31.136a18 18 0 0 1-2.113-.72l-60.58 49.394l70.637 19.584l-140.023 84.71l65.848-68.866l-31.32-7.006l-150.335 122.58l158.06-196.89l-137.39-41.137l137.006 5.654l-68.275-54.467z"/></svg>
                          </div>
                          <span class="ml-7 mt-2 text-white font-mono font-medium">Pro</span>
                        </div>
                        <!--End Content-->
                      </div>
                    <!--End Badge-->
                    {/if}

                    <div class="flex flex-col items-start {data?.user?.tier === 'Pro' ? 'mt-3' : 'mt-12'} ml-2 font-sans">
                      <div class="flex flex-row gap-x-3">
                        <a href="/about" class="text-sm text-gray-400 hover:text-gray-300 hover:underline">
                          About
                        </a>
                        <a href="/terms-of-use" class="text-sm text-gray-400 hover:text-gray-300 hover:underline">
                          Terms
                        </a>
                        <a href="/privacy-policy" class="text-sm text-gray-400 hover:text-gray-300 hover:underline">
                          Privacy
                        </a>
                        <a href="/contact" class="text-sm text-gray-400 hover:text-gray-300 hover:underline">
                          Contact
                        </a>
                        <a href="/imprint" class="text-sm text-gray-400 hover:text-gray-300 hover:underline">
                          Imprint
                        </a>
                
                      </div>

                      <span class="text-sm text-gray-400  mt-1.5">
                        © 2024 stocknear
                      </span>

                    </div>
                    

                    </div>
                </div>
            </aside>

  
        </div>
    
              <!--End Profile Pic-->

              

              <div class="w-full" >
                <ul class="w-full  font-medium flex flex-row items-center bg-[#0F0F0F] space-x-5 rtl:space-x-reverse py-2">
                  <li class="cursor-pointer flex flex-col items-center">
                    <label on:click={() => changeTab('post')} class="cursor-pointer px-3 text-sm sm:text-[0.9rem] font-medium text-gray-400 sm:hover:text-white {showTab === 'post' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                      Posts
                    </label>
                    <div class="{showTab === 'post' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[2.6rem]" />
                  </li>
                  <li class="cursor-pointer flex flex-col items-center">
                    <label on:click={() => changeTab('settings')} class="cursor-pointer px-3 text-sm sm:text-[0.9rem] font-medium text-gray-400 sm:hover:text-white {showTab === 'settings' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                      Settings
                    </label>
                    <div class="{showTab === 'settings' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[3.5rem]" />
                  </li>
                  <li class="cursor-pointer flex flex-col items-center">
                    <label on:click={() => changeTab('subscription')} class="cursor-pointer px-3 text-sm sm:text-[0.9rem] font-medium text-gray-400 sm:hover:text-white {showTab === 'subscription' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                      Subscription
                    </label>
                    <div class="{showTab === 'subscription' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[5rem]" />
                  </li>
                </ul>
              </div>
          

                  <div class="md:flex md:justify-between">
                      <!-- Main content -->

                      
                      <div class="md:grow  pb-12 md:pb-20">
                          <div class="md:pr-6 lg:pr-10 mt-6">
                            {#if showTab === 'post'}

                              <CreateNewPost data={data?.user}/>
                              
                              <div class="{!loading? 'hidden' : ''}">
                                {#each Array(5) as _}
                                  <SkeletonLoading />
                                {/each}
                              </div>
                              {#if posts?.length === 0}
                              <div class="flex flex-col justify-center items-center ">
                                <p class="text-center text-gray-400 text-md sm:text-xl mt-10">You didn't post anything yet</p>
                                <p class="text-center text-gray-400 text-md sm:text-xl mt-3">Contribute to the community and make your first post</p> 
                              </div>
                              {:else}
                              {#each posts as post, index} 
                                  <div class="flex items-start w-full">
                                  <div class="w-full m-auto ">
                                      <PostSection
                                        data={data}
                                        posts= {post}
                                        moderators={moderators}
                                        />
                                  </div>
                                  
                                </div>

                        
                              {/each}
                              <InfiniteLoading on:infinite={infiniteHandler} />

                              {/if}
                            
                            <!--Start Settings Tab-->
                            {:else if showTab === 'settings'}

                            
                            <div class="flex flex-col w-full h-screen p-2">
                              <div class="w-full">

                              <div class="tabs pb-10 pt-10 flex flex-row items-center">
                                <label on:click={() => changeTab('personalData')} class="tab tab-sm pr-5 text-gray-400 hover:text-white {settingsTab === 'personalData' ? 'rounded text-white bg-[#333333]' : 'bg-[#0F0F0F]'}">Personal Data</label> 
                                <label on:click={() => changeTab('changePassword')} class="tab tab-sm pl-5 text-gray-400 hover:text-white {settingsTab === 'changePassword' ? 'rounded text-white bg-[#333333]' : 'bg-[#0F0F0F]'}">Change Password</label> 
                              </div>

                              {#if settingsTab ==='personalData'}
                              <form
                                on:submit={updatePersonalData}
                                class="flex flex-col space-y-2 w-full"
                              >
                                    <Input
                                    id="username"
                                    type="text"
                                    label="Username"
                                    required={true}
                                    disabled={loading}
                                    errors={errorUsername}
                                  />
                                <!--
                                  <Input
                                    id="email"
                                    type="email"
                                    label="Email address"
                                    required={true}
                                    value={form?.data?.email ?? data?.user?.email}
                                    disabled={loading}
                                    errors={form?.errors?.email}
                                  />
                                -->
                                  <div class="w-full max-w-lg pt-3">
                                    <button type="submit" class="btn bg-blue-700 hover:bg-blue-600 text-white w-full max-w-lg normal-case">Update your data</button>
                                  </div>
                                
                              </form>
                              {:else}
                              <form
                              on:submit={updatePassword}
                              class="flex flex-col space-y-2 w-full"
                              >
                              <Input
                                    id="oldPassword"
                                    label="Old Password"
                                    type="password"
                                    required
                                    errors={errorOldPassword}
                                    disabled={loading}
                                  />
                                  <Input
                                    id="password"
                                    label="New Password"
                                    type="password"
                                    required
                                    errors={errorPassword}
                                    disabled={loading}
                                  />
                                  <Input
                                    id="passwordConfirm"
                                    label="Confirm New Password"
                                    type="password"
                                    required
                                    errors={errorPasswordConfirm}
                                    disabled={loading}
                                  />    
                                  
                                  <div class="w-full max-w-lg pt-3">
                                    <button type="submit" class="btn bg-blue-700 text-white hover:bg-blue-600 w-full max-w-lg normal-case text-md">Update Password</button>
                                  </div>
                                </form>
                              {/if}
                            </div>
                            </div>

                            <!--End Settings Tab-->
                            <!--Start Info Tab -->
                            {:else if showTab === 'subscription'}
                            <div class="flex flex-col sm:flex-row overflow-hidden pl-5 p-0 sm:p-5">
    
                              
                              <div class="flex flex-col justify-start items-start w-full text-white">
                          
                                <h2 class="text-xl sm:text-2xl font-bold text-start mt-5 mb-5">
                                  Manage Subscription
                                </h2>
                                <div class="flex flex-row items-center">
                                  <span class="text-white text-[1rem] sm:text-lg">
                                    Status:
                                  </span> 
                                  <div class="ml-2 flex flex-row items-center">
                                
                                    <span class="relative flex h-2 w-2 ">
                                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full {subscriptionData?.status_formatted === 'Active' || subscriptionData?.status_formatted === 'Paid' || subscriptionData?.status_formatted === 'On Trial' ? 'bg-[#10DB06]' : 'bg-[#FF3131]'} opacity-75"></span>
                                      <span class="relative inline-flex rounded-full h-2 w-2 {subscriptionData?.status_formatted === 'Active' || subscriptionData?.status_formatted === 'Paid' || subscriptionData?.status_formatted === 'On Trial' ? 'bg-[#10DB06]' : 'bg-[#FF3131]'}"></span>
                                    </span>

                                    <span class="ml-2 text-[1rem] text-slate-200 font-medium">
                                      {subscriptionData?.status_formatted ?? 'Inactive'}
                                    </span>  
                                  </div>

                                </div>
                                {#if subscriptionData?.status_formatted === 'Active'}
                                <span class="text-white text-sm font-medium pr-5">
                                  Your subscription will automatically renew on {new Date(subscriptionData?.renews_at)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                {:else if subscriptionData?.status_formatted === 'On Trial'}
                                <span class="text-white text-sm font-medium pr-5">
                                  Your trial will end on {new Date(subscriptionData?.trial_ends_at)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                                </span>
                                {:else if subscriptionData?.status_formatted === 'Cancelled'}
                                <span class="text-white text-sm font-medium">
                                  Your subscription will remain active until {new Date(subscriptionData?.ends_at)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                {/if}

                              
                                <div class="flex flex-col justify-start items-start mt-8">
                                  <span class="text-white font-medium mr-2 text-lg">
                                    Current Plan:
                                  </span>
                                  <span class="text-[1rem]">
                                    {['Active', 'Paid', 'On Trial', 'Cancelled']?.includes(subscriptionData?.status_formatted) ? subscriptionData?.product_name : 'Free Subscription'}
                                  </span>
                                  <span class="text-sm text-white {subscriptionData?.status_formatted !== 'Active' ? 'hidden' : ''}">
                                    {subscriptionData?.product_name?.includes('Monthly') ? '$9.99 billed every month' : '$90 billed every year'}
                                  </span>
                                </div>
                                
                                {#if subscriptionData?.status_formatted === 'Active' || subscriptionData?.status_formatted === 'On Trial'}
                                <div class="flex flex-col items-start sm:flex-row sm:items-center">
                                  <label for="cancelSubscriptionModal" class="cursor-pointer text-white bg-[#FF3131] sm:hover:bg-red-600 bg-opacity-[0.5]  text-sm sm:text-[1rem] px-4 py-2 rounded-lg mt-5">
                                    Cancel Subscription
                                  </label>
                                  {#if subscriptionData?.product_name?.includes('Monthly')}
                                  <label on:click={() => handleChangePlan(subscriptionData?.card_brand)} for={subscriptionData?.card_brand !== null && subscriptionData?.card_brand?.length !== 0 ? 'changeSubscriptionModal' : 'errorSubscriptionModal'} class="sm:ml-3 {subscriptionData?.card_brand !== null && subscriptionData?.card_brand?.length !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'} {subscriptionData?.card_brand !== null && subscriptionData?.card_brand?.length !== 0 ? 'bg-[#0DDE00] text-black' : 'bg-gray-600 opacity-[0.8] text-white'} text-sm sm:text-[1rem] px-4 py-2 rounded-lg mt-5">
                                    Change to Annual Plan
                                  </label>
                                  {/if}
                                </div>
                               

                                {:else if subscriptionData?.status_formatted === 'Cancelled'}
                                <label for="reactivateSubscriptionModal" class="cursor-pointer text-white bg-[#75D377] bg-opacity-[0.5]  text-sm sm:text-[1rem] px-4 py-2 rounded-lg mt-5">
                                  Reactivate Subscription
                                </label>
                                {:else if subscriptionData?.status_formatted === 'Paid'}
                                <span class="text-white mt-5">
                                  Please wait a moment; you will be updated to Pro in a second.
                                </span>
                                {:else}
                                <a href="/pricing" class="text-blue-400 mt-5">
                                  Get Full Access with Pro Subscription.
                                </a>
                               {/if}
                    
                      
                              </div>
                              
                            </div>
                            <!--End Info Tab-->
                          {/if}
                          </div>
                      </div>


                  <!-- Sidebar -->
                  <aside class="hidden {showTab === 'post' ? 'lg:inline-block' : 'hidden'} h-sh w-[300px] pt-[1.5rem]">
                    <div class="lg:pl-5 z-20 h-full invisible">
                  
                          <!-- Sidebar content -->

                            <!--Start User Profile -->
                            <div class="space-y-6">  
                            <div class="shadow-lg rounded-md bg-[#202020] h-auto w-full md:w-80 border border-gray-700">
                              <!--Start Header-->
                              <div class="bg-[#202020] w-full p-3 ">
                                <svg style="clip-path: circle(50%);" class="flex-shrink-0 w-10 h-10 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="white"><path d="M32 20a8 8 0 1 1-16 0a8 8 0 0 1 16 0"/><path fill-rule="evenodd" d="M23.184 43.984C12.517 43.556 4 34.772 4 24C4 12.954 12.954 4 24 4s20 8.954 20 20s-8.954 20-20 20h-.274q-.272 0-.542-.016M11.166 36.62a3.028 3.028 0 0 1 2.523-4.005c7.796-.863 12.874-.785 20.632.018a2.99 2.99 0 0 1 2.498 4.002A17.94 17.94 0 0 0 42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 4.916 1.971 9.373 5.166 12.621" clip-rule="evenodd"/></g></svg>
                                  <span class="text-white text-md ml-0.5 ">User Profile</span>
                              </div>
                              <!--End Header-->
                              <!--Start Content-->
                              <div class="w-full p-2 flex-1 flex flex-wrap">

                                <table class="table table-compact bg-[#202020] text-start flex justify-start items-center w-full px-3 m-auto">
                                  <tbody class="bg-[#202020]">
                                    <!-- row 1 -->
                                    <tr class="text-gray-300">
                                      <td class="bg-[#202020] border-b border-[#202020]">Karma: {data?.user?.karma}</td>
                                      <td class="bg-[#202020 border-b border-[#202020]">Posts: {userStats?.numberOfPosts}</td>
                                    </tr>
                                    <!-- row 2 -->
                                    <tr class="text-gray-300">
                                      <td class="bg-[#202020]">Comments: {userStats?.numberOfComments}</td>
                                      <td class="bg-[#202020]"></td>
                                    </tr>
                                  </tbody>
                                </table>
                            </div>
                          <!--End User Profile -->
                          

                          </div>
                      </div>
                  </aside>

                                            
                  </div>

              </div>
          </section>

      </main>

     
  </div>



</body>



</section>




<!-- Start Cancel Subscription Modal -->
<input type="checkbox" id="cancelSubscriptionModal" class="modal-toggle" />

<dialog id="cancelSubscriptionModal" class="modal modal-bottom sm:modal-middle">


  <label for="cancelSubscriptionModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

  <!-- Desktop modal content -->
  <form method="POST" action="?/cancelSubscription" use:enhance={submitCancellation}  class="modal-box w-full bg-[#202020] flex flex-col items-center">
    <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
    <div class="text-white mb-5 text-center">
      <h3 class="font-bold text-2xl mb-5">Are you sure?</h3>
      <span class="text-white text-[1rem] font-normal">
        You will no longer be charged for this subscription, and at the end of the billing period, your account will transfer to the Free Plan.
      </span>
    </div>

    <button on:click={() => isClicked = !isClicked} class="{!isClicked ? '' : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-red-600  text-center text-white text-[1rem] font-normal">
      Cancel Subscription
      <input class="hidden" name='subscriptionId' value={subscriptionData?.first_subscription_item?.subscription_id}/>
    </button>
    {#if isClicked === true}
    <label class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-red-600 text-center text-white text-[1rem] font-normal">
      <div class="flex flex-row m-auto">
        <span class="loading loading-infinity"></span>
        <span class="text-white ml-2">Proceeding</span>
      </div>
    </label>
    {/if}
    
  </form>
</dialog>
<!-- End Cancel Subscription Modal -->



<!-- Start Reactivate Subscription Modal -->
<input type="checkbox" id="reactivateSubscriptionModal" class="modal-toggle" />

<dialog id="reactivateSubscriptionModal" class="modal modal-bottom sm:modal-middle">


  <label for="reactivateSubscriptionModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

  <!-- Desktop modal content -->
  <form method="POST" action="?/reactivateSubscription" use:enhance={submitReactivate}  class="modal-box w-full bg-[#202020] flex flex-col items-center">
    <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
    <div class="text-white mb-5 text-center">
      <h3 class="font-bold text-2xl mb-5">Reactivate Subscription</h3>
      <span class="text-white text-[1rem] font-normal">
        Reactivate your Pro Subscription now to unlock unlimited features and gain the edge over the competition.
      </span>
    </div>

    
    <button on:click={() => isClicked = !isClicked} class="{!isClicked ? '' : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#417143] text-center text-white text-[1rem] font-normal">
      Reactivate Subscription
      <input class="hidden" name='subscriptionId' value={subscriptionData?.first_subscription_item?.subscription_id}/>
    </button>
    {#if isClicked === true}
    <label class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#417143] text-center text-white text-[1rem] font-normal">
      <div class="flex flex-row m-auto">
        <span class="loading loading-infinity"></span>
        <span class="text-white ml-2">Proceeding</span>
      </div>
    </label>
    {/if}
    
  </form>
</dialog>
<!-- End Reactivate Subscription Modal -->




<!-- Start Cancel Subscription Modal -->
<input type="checkbox" id="changeSubscriptionModal" class="modal-toggle" />

<dialog id="changeSubscriptionModal" class="modal modal-bottom sm:modal-middle">


  <label for="changeSubscriptionModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

  <!-- Desktop modal content -->
  <form method="POST" action="?/changeSubscription" use:enhance={submitChangePlan}  class="modal-box w-full bg-[#202020] flex flex-col items-center">
    <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
    <div class="text-white mb-5 text-center">
      <h3 class="font-bold text-2xl mb-5">Are you sure?</h3>
      <span class="text-white text-[1rem] font-normal">
        You're account will transfer from from monthly plan to annual plan. 
      </span>
    </div>

    <button on:click={() => isClicked = !isClicked} class="{!isClicked ? '' : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#0DDE00]  text-center text-black text-[1rem] font-normal">
      Change to Annual Plan
      <input class="hidden" name='subscriptionId' value={subscriptionData?.first_subscription_item?.subscription_id}/>
    </button>
    {#if isClicked === true}
    <label class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#0DDE00] text-center text-black text-[1rem] font-normal">
      <div class="flex flex-row m-auto">
        <span class="loading loading-infinity"></span>
        <span class="text-black ml-2">Proceeding</span>
      </div>
    </label>
    {/if}
    
  </form>
</dialog>
<!-- End Cancel Subscription Modal -->


<!-- Start Cancel Subscription Modal -->
<input type="checkbox" id="errorSubscriptionModal" class="modal-toggle" />

<dialog id="errorSubscriptionModal" class="modal modal-bottom sm:modal-middle">


  <label for="errorSubscriptionModal"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

  <!-- Desktop modal content -->
  <div class="modal-box w-full bg-[#202020] flex flex-col items-center">
    <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
    <div class="text-white mb-5 text-center">
      <h3 class="font-bold text-2xl mb-5">Paypal not supported</h3>
      <span class="text-white text-[1rem] font-normal">
        Apologies, our payment provider currently only supports credit cards for changing plans from monthly to annual. We are working to expand this to other payment methods.
      </span>
    </div>

    <button class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#0DDE00]  text-center text-black text-[1rem] font-normal">
      OK
    </button>
    
  </div>
</dialog>
<!-- End Cancel Subscription Modal -->