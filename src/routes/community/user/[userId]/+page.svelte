<script lang='ts'>
    
  import PostSection from '$lib/components/PostSection.svelte';
  import SkeletonLoading from '$lib/components/SkeletonLoading.svelte';


  import { onMount} from 'svelte';
  import {getImageURL } from '$lib/utils';
  import {userRegion, setCache, getCache, numberOfUnreadNotification } from '$lib/store';

	import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import communityBanner from '$lib/images/community_banner.jpg';


  export let data;
  export let form;
  
  const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL = import.meta.env.VITE_EU_API_URL; // Set a default API URL
  let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;

  userRegion.subscribe(value => {
    if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
      fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
      fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
  });

  let userData = {
  "karma": 0,
  "stockfinder": true,
  "username": '-',
}

let userStats = {'numberOfPosts': 0, 'numberOfComments': 0}

  let moderators;
  let showTab = 'post'
  let isLoaded = false;


  let posts: any[] = [];



let currentPage = 1;
let postLoading = false;
let seenPostId = [];


let noPostMore = false;


const getUserData = async() => {

  const postData = {'userId': data?.userId};

  const response = await fetch(fastifyURL+'/get-user-data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
      });

  const output = (await response.json())?.items;
  
  return output;
};

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



const getUserStats = async () => {
  let output;

  // Get cached data for the specific tickerID
  const cachedData = getCache(data?.userId, 'getUserStats');
  if (cachedData) {
    output = cachedData;
  } else {

    const postData = {'userId': data?.userId};

    // make the POST request to the endpoint
    const response = await fetch(fastifyURL + '/get-user-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    output = (await response.json())?.items;


    setCache(data?.userId, output, 'getUserStats');
  }

  return output
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


  
function isModerator(moderators) {
    return moderators?.some(moderator => data?.userId === moderator?.expand?.user?.id);
  }
  



async function getPost() {


  const postData = {
    startPage: currentPage,
    seenPostId: seenPostId.length === 0 ? [] : seenPostId,
    userId: data?.userId,
  };

  // Make the POST request to the endpoint
  const response = await fetch(fastifyURL+'/get-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });


  const output = await response.json();


  return output?.items
}

 let loading = true;
 let LoginPopup;

onMount(async () => {

  window.scrollTo(0, 0);

  [posts, moderators, userData, userStats] = await Promise?.all([
      getPost(),
      getModerators(),
      getUserData(),
      getUserStats(),
    ]);
  console.log(moderators)
  if(!data?.userData)
  {
    LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
  }

  loading = false;
  isLoaded = true;

});




</script>
  


<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {userData?.username} · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Explore {userData?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <!-- Other meta tags -->
  <meta property="og:title" content="{userData?.username} · stocknear"/>
  <meta property="og:description" content="Explore {userData?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{userData?.username} · stocknear"/>
  <meta name="twitter:description" content="Explore {userData?.username}'s latest posts, comments, and notebooks on stocknear. Discover new insights and connect with other users in the stocknear community.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>



<section>
 





  <body class="bg-[#09090B] text-slate-200 overflow-hidden mt-10 sm:mt-5">

    <!-- Page wrapper -->
    <div class="flex flex-col min-h-screen overflow-hidden">
  
     
        <main class="grow">
          
  
           
            <!-- Page content -->
            <section>
                <div class="w-full max-w-6xl m-auto sm:px-20 ml-auto ">
  
  
              <div class="w-full flex flex-row">
              <!--Start Profile Pic-->
              <div class="flex items-center justify-start mb-5 w-screen sm:w-full bg-[#09090B] h-48 sm:rounded-xl border border-gray-700 sm:hover:border-gray-600">
                  <label class="ml-5 avatar w-20 h-20 sm:w-24 sm:h-24 rounded-full hover:cursor-pointer">
                      <img style="clip-path: circle(50%);" class="w-24 bg-slate-300 border border-slate-400 rounded-full inline-block "
                      src={userData?.avatar
                          ? getImageURL(userData?.collectionId, userData?.id, userData?.avatar)
                          : `https://avatar.vercel.sh/${userData?.username}`} 
                          alt="User avatar"
                          id="avatar-preview"
                        />
                     
            
                  </label>
                    <button id="submit-btn" class="hidden" type="submit"></button>
                    
                  <div class="mt-5 ml-5 p-2">
                      <p class="text-sm sm:text-xl text-gray-200 font-semibold">
                          @{userData?.username}
                         
                          {#if isLoaded}
                          {#if isModerator(moderators)}
                            <svg class="inline-block w-5 h-5 -ml-0.5 mr-0.5 mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#75d377" d="M256 32C174 69.06 121.38 86.46 32 96c0 77.59 5.27 133.36 25.29 184.51a348.86 348.86 0 0 0 71.43 112.41c49.6 52.66 104.17 80.4 127.28 87.08c23.11-6.68 77.68-34.42 127.28-87.08a348.86 348.86 0 0 0 71.43-112.41C474.73 229.36 480 173.59 480 96c-89.38-9.54-142-26.94-224-64Z"/></svg>
                          {/if}
                          {/if}
                      
                          
                      </p>
                      <span class="text-sm text-gray-200">
                        Joined on {new Date(userData?.created ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                      </span>
                  </div>
                
                
              </div>
  
                        <!-- Sidebar -->
                        <aside class="hidden lg:inline-block h-sh lg:w-1/2 lg:pr-2 xl:pr-0">
                          <div class="lg:pl-5 z-20 h-full">
                        
                                <!-- Sidebar content -->
            
                                  <!--Start User Profile -->
                                  <div class="space-y-6 ml-4">  
                                  <div class="rounded-xl bg-[#09090B] h-48 w-full border border-gray-700 font-mono">
                                    <!--Start Header-->
                                    <div class="ml-2 w-full p-3">
                                        <span class="text-white text-lg font-medium ml-0.5">User Profile</span>
                                    </div>
                                    <hr class="border-b border-gray-700"/>
                                    <!--End Header-->
                                    <!--Start Content-->
                                    <div class="w-full p-2">
            
                                      <table class="font-semibold table table-compact bg-[#09090B] text-start flex justify-start items-center w-full px-3 m-auto">
                                        <tbody class="bg-[#09090B]">
                                          <!-- row 1 -->
                                          <tr class="text-gray-300">
                                            <td class="bg-[#09090B] border-b border-[#27272A]">Karma: {userData?.karma}</td>
                                            <td class="bg-[#27272A border-b border-[#27272A]">Posts: {userStats?.numberOfPosts}</td>
                                          </tr>
                                          <!-- row 2 -->
                                          <tr class="text-gray-300">
                                            <td class="bg-[#09090B]">Comments: {userStats?.numberOfComments}</td>
                                            <td class="bg-[#09090B]"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                  </div>
                                <!--End User Profile -->
            
                                {#if userData?.tier === 'Pro'}
                                <!--Start Badge-->
                                  <div class="rounded-xl bg-[#09090B] h-48 w-full border border-gray-700 mt-14">
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
            
                                <div class="flex flex-col items-start {userData?.tier === 'Pro' ? 'mt-3' : 'mt-12'} ml-2 font-sans">
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
  
                
  
                <div class=" w-full " >
                  <ul class="w-full  font-medium flex flex-row items-center bg-[#09090B] space-x-5 rtl:space-x-reverse py-2">
                    <li class="cursor-pointer flex flex-col items-center">
                      <label class="cursor-pointer px-3 text-sm sm:text-[0.9rem] font-medium text-gray-400 sm:hover:text-white {showTab === 'post' ? 'text-white ' : 'bg-[#09090B]'}" >
                        Posts
                      </label>
                      <div class="{showTab === 'post' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[2.6rem]" />
                    </li>
                  </ul>
                </div>
            
  
                    <div class="md:flex md:justify-between">
                        <!-- Main content -->
  
                        
                        <div class="md:grow  pb-12 md:pb-20">
                            <div class="md:pr-6 lg:pr-10 mt-6">
                              {#if showTab === 'post'}
                                  
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

                            {/if}
                            </div>
                        </div>
  
  
                    <!-- Sidebar -->
                    <aside class="hidden {showTab === 'post' ? 'lg:inline-block' : 'hidden'} h-sh w-[300px] pt-[1.5rem]">
                      <div class="lg:pl-5 z-20 h-full invisible">
                    
                            <!-- Sidebar content -->
  
                              <!--Start User Profile -->
                              <div class="space-y-6">  
                              <div class="shadow-lg rounded-md bg-[#09090B] h-auto w-full md:w-80 border border-gray-700">
                                <!--Start Header-->
                                <div class="bg-[#09090B] w-full p-3 ">
                                  <svg style="clip-path: circle(50%);" class="flex-shrink-0 w-10 h-10 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="white"><path d="M32 20a8 8 0 1 1-16 0a8 8 0 0 1 16 0"/><path fill-rule="evenodd" d="M23.184 43.984C12.517 43.556 4 34.772 4 24C4 12.954 12.954 4 24 4s20 8.954 20 20s-8.954 20-20 20h-.274q-.272 0-.542-.016M11.166 36.62a3.028 3.028 0 0 1 2.523-4.005c7.796-.863 12.874-.785 20.632.018a2.99 2.99 0 0 1 2.498 4.002A17.94 17.94 0 0 0 42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 4.916 1.971 9.373 5.166 12.621" clip-rule="evenodd"/></g></svg>
                                    <span class="text-white text-md ml-0.5 ">User Profile</span>
                                </div>
                                <!--End Header-->
                                <!--Start Content-->
                                <div class="w-full p-2 flex-1 flex flex-wrap">
  
                                  <table class="table table-compact bg-[#09090B] text-start flex justify-start items-center w-full px-3 m-auto">
                                    <tbody class="bg-[#09090B]">
                                      <!-- row 1 -->
                                      <tr class="text-gray-300">
                                        <td class="bg-[#09090B] border-b border-[#27272A]">Karma: {userData?.karma}</td>
                                        <td class="bg-[#27272A border-b border-[#27272A]">Posts: {userStats?.numberOfPosts}</td>
                                      </tr>
                                      <!-- row 2 -->
                                      <tr class="text-gray-300">
                                        <td class="bg-[#09090B]">Comments: {userStats?.numberOfComments}</td>
                                        <td class="bg-[#09090B]"></td>
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

<!--Start Login Modal-->
{#if LoginPopup}
   <LoginPopup form={form}/>    
{/if}
<!--End Login Modal-->