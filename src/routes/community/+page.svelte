<script lang='ts'>
  
  import { onMount,onDestroy } from 'svelte';
  import { screenWidth, userRegion, discordMembers, twitchStatus, setCache, getCache, cachedPosts, currentPagePosition, numberOfUnreadNotification, postIdDeleted } from '$lib/store';

  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths'
  import CreateNewPost from '$lib/components/CreateNewPost.svelte';
  import PostSection from '$lib/components/PostSection.svelte';
  import SkeletonLoading from '$lib/components/SkeletonLoading.svelte';
	import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import communityBanner from '$lib/images/community_banner.jpg';
  import { abbreviateNumber } from '$lib/utils';
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


  let discordURL = import.meta.env.VITE_DISCORD_URL;
  

  let loading = true;


  let moderators ;
  let communityStats;
  let discordData = [];
  let tickerMentioning = [];
  let posts = null;
  


let currentPage = 1;
let postLoading = false;
let seenPostId = [];

let noPostMore = false;



async function infiniteHandler({ detail: { loaded, complete } }) 
{

  // console.log("Page position:", window.pageYOffset);
  seenPostId = posts?.map(obj => obj?.id);

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


1

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

/*
const getTickerMentioning = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getTickerMentioning');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/ticker-mentioning', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      setCache('', output, 'getTickerMentioning');
    }

    return output;
};
*/

const getCommunityStats = async () => {
    let output;
    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getCommunityStats');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(fastifyURL + '/get-community-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = (await response.json())?.items;


      setCache('', output, 'getCommunityStats');
    }

    return output;
};



async function getPost() {
 
  let postData;

  if (Object?.keys($cachedPosts)?.length === 0)
  {
    postData = {
      //userId: data?.user.id,
      startPage: currentPage,
      seenPostId: seenPostId.length === 0 ? [] : seenPostId,
      sortingPosts: sortingPosts,
    };
  }
  else
  {
    postData = {
      //userId: data?.user.id,
      startPage: $cachedPosts?.currentPage,
      seenPostId: $cachedPosts?.seenPostId.length === 0 ? [] :  $cachedPosts?.seenPostId,
      sortingPosts: sortingPosts,
    };
  }

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


const getDiscordWidget = async () => {
    let output;
    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDiscordWidget');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch('https://discord.com/api/guilds/1165618982133436436/widget.json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();
      setCache('', output, 'getDiscordWidget');
    }

    return output;
};



let LoginPopup;
let BottomNavigation;

onMount(async () => {
  if (Object?.keys($cachedPosts)?.length === 0) {
    // Only make API requests if cached posts are not available
    [communityStats, moderators, posts, discordData] = await Promise?.all([
      getCommunityStats(),
      getModerators(),
      getPost(),
      getDiscordWidget(),
      //getTickerMentioning(),
    ]);


      window.scrollTo(0, 0);
      loading = false;
  }

  else {
    // Use cached data if available
    posts = $cachedPosts?.posts;
    communityStats = getCache('', 'getCommunityStats');
    moderators = getCache('', 'getModerators');
    discordData = getCache('','getDiscordWidget');
    //tickerMentioning = getCache('','getTickerMentioning');
    loading = false; // Mark loading as complete
  }

  if(!data?.user)
    {
      LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
    }

    BottomNavigation = (await import('$lib/components/BottomNavigation.svelte')).default;

});


onDestroy(async () => {
    $postIdDeleted ='';
  });




let sortingPosts = $cachedPosts?.sortingPosts?.length > 0 ? $cachedPosts?.sortingPosts : 'hot';

async function handleCategoryOfPosts(state) {
  loading = true;
  posts = [];
  currentPage = 1;
  postLoading = false;
  seenPostId = [];
  noPostMore = false;

  sortingPosts = state;
  $cachedPosts = {};
  posts = await getPost();
  loading = false;
}



let yPosition;
let goBackToPosition = false;



let previousPage : string = base ;

afterNavigate(({from}) => {
   previousPage = from?.url.pathname || previousPage

   if (previousPage.startsWith('/community/post'))
    {
        goBackToPosition = true;
    }
    

}) 


$: {
  if($postIdDeleted.length !== 0)
  {
    posts = posts?.filter(item => item?.id !== $postIdDeleted);

  }

}


$: {
  if(posts)
  {
    $cachedPosts = {"sortingPosts": sortingPosts,'currentPage': currentPage, 'seenPostId': seenPostId, 'posts': posts};
  }
}

$: {
  if(yPosition)
  {
    $currentPagePosition = Math.floor(yPosition);
  }
}

$: {
  if(goBackToPosition && typeof window !== 'undefined')
  {
    goBackToPosition = false;
    window?.scrollTo({top: $currentPagePosition});

  }
}





</script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Best Funny Memes and Breaking News · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Best Funny Memes and Breaking News · stocknear"/>
  <meta property="og:description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Best Funny Memes and Breaking News · stocknear"/>
  <meta name="twitter:description" content="Your daily dose of stock market funny memes, GIFs, videos and weird news stories. We deliver hundreds of new stock market memes daily.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    



<svelte:window bind:scrollY={yPosition} />





<body class="bg-[#0F0F0F] text-slate-200 sm:mt-5 ">


    <!-- Page wrapper -->
    <div class="flex flex-col min-h-screen overflow-hidden pl-0 lg:pl-20 m-auto w-full max-w-6xl supports-[overflow:clip]:overflow-clip pb-40">



        <main class="m-auto w-full max-w-3xl lg:max-w-6xl">

          <!--Start Header-->
          <div class="w-full max-w-6xl sm:rounded-2xl m-auto h-44 sm:h-60 bg-[#202020] bg-cover bg-center bg-no-repeat" style="background-image: url('{communityBanner}');" />
          <!--End Header-->



  

            <!-- Page content -->
            <section>
                <div class="w-full">
                    <div class="sm:flex sm:justify-start w-full">

                        <!-- Main content -->
                        <div class="sm:pt-6 pb-12 w-full">
                            <div class="lg:pr-5">
                                <!--<CreateNewPost />-->
                                <div class="{!loading? 'hidden' : ''}">
                                  {#each Array(5) as _}
                                    <SkeletonLoading />
                                  {/each}
                                </div>
                                {#if posts !== null}
                              
                                <div class="">
                                  <CreateNewPost data={data?.user} />
                                </div>

                                 <!--Start choose Hot or New Posts-->
                                  <!-- List container -->                  
                                  <div class="flex flex-col mt-4">
                                    <!-- Item -->
                                    <div class="border-t border-b sm:border border-gray-700 sm:hover:border-gray-600 rounded-none sm:rounded-md bg-[#202020] rounded-[4px] sm:rounded-[8px]">
                                      <div class="flex h-14 justify-start items-center">                                           
                                        <div class="flex flex-row ml-3">
                                          <label on:click={() => handleCategoryOfPosts('hot')} class="flex flex-row w-fit pl-3 pr-4 pt-1 pb-1 tab mr-2 font-medium transition duration-150 ease-out hover:ease-in rounded-full hover:bg-[#333333] {sortingPosts === 'hot' ? 'bg-[#333333] text-white' : 'text-gray-300'} rounded-full cursor-pointer">
                                            <svg class="w-5 h-5 sm:w-6 sm:h-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="{sortingPosts === 'hot' ? 'red' : '#737487'}" d="M17.66 11.2c-.23-.3-.51-.56-.77-.82c-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32c-2.59 2.08-3.61 5.75-2.39 8.9c.04.1.08.2.08.33c0 .22-.15.42-.35.5c-.23.1-.47.04-.66-.12a.58.58 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5c.14.6.41 1.2.71 1.73c1.08 1.73 2.95 2.97 4.96 3.22c2.14.27 4.43-.12 6.07-1.6c1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6c-1.12.4-2.24-.16-2.9-.82c1.19-.28 1.9-1.16 2.11-2.05c.17-.8-.15-1.46-.28-2.23c-.12-.74-.1-1.37.17-2.06c.19.38.39.76.63 1.06c.77 1 1.98 1.44 2.24 2.8c.04.14.06.28.06.43c.03.82-.33 1.72-.93 2.27Z"/></svg>
                                            <p class="ml-1 font-bold text-sm sm:text-[1rem]">Hot</p>
                                          </label>
        
                                          <label on:click={() => handleCategoryOfPosts('new')} class="flex flex-row w-fit ml-3 pl-3 pr-4 pt-1 pb-1 tab mr-2 font-medium transition duration-150 ease-out hover:ease-in rounded-full hover:bg-[#333333] {sortingPosts === 'new' ? 'bg-[#333333] text-white' : 'text-gray-300'} rounded-full cursor-pointer">
                                            <svg class="w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15.3895 5.21125L16.7995 8.03125C16.9895 8.42125 17.4995 8.79125 17.9295 8.87125L20.4795 9.29125C22.1095 9.56125 22.4895 10.7413 21.3195 11.9213L19.3295 13.9113C18.9995 14.2413 18.8095 14.8913 18.9195 15.3613L19.4895 17.8213C19.9395 19.7613 18.8995 20.5213 17.1895 19.5013L14.7995 18.0813C14.3695 17.8213 13.6495 17.8213 13.2195 18.0813L10.8295 19.5013C9.11945 20.5113 8.07945 19.7613 8.52945 17.8213L9.09945 15.3613C9.18945 14.8813 8.99945 14.2313 8.66945 13.9013L6.67945 11.9113C5.50945 10.7413 5.88945 9.56125 7.51945 9.28125L10.0695 8.86125C10.4995 8.79125 11.0095 8.41125 11.1995 8.02125L12.6095 5.20125C13.3795 3.68125 14.6195 3.68125 15.3895 5.21125Z" fill={sortingPosts === 'new' ? '#D6B329' : '#737487'}></path> <path d="M8 5.75H2C1.59 5.75 1.25 5.41 1.25 5C1.25 4.59 1.59 4.25 2 4.25H8C8.41 4.25 8.75 4.59 8.75 5C8.75 5.41 8.41 5.75 8 5.75Z" fill={sortingPosts === 'new' ? '#D6B329' : '#737487'}></path> <path d="M5 19.75H2C1.59 19.75 1.25 19.41 1.25 19C1.25 18.59 1.59 18.25 2 18.25H5C5.41 18.25 5.75 18.59 5.75 19C5.75 19.41 5.41 19.75 5 19.75Z" fill={sortingPosts === 'new' ? '#D6B329' : '#737487'}></path> <path d="M3 12.75H2C1.59 12.75 1.25 12.41 1.25 12C1.25 11.59 1.59 11.25 2 11.25H3C3.41 11.25 3.75 11.59 3.75 12C3.75 12.41 3.41 12.75 3 12.75Z" fill={sortingPosts === 'new' ? '#D6B329' : '#737487'}></path> </g></svg>
                                            <p class="ml-1 font-bold text-sm sm:text-[1rem]">New</p>
                                          </label>
      
                                        </div>
                                      </div>
                                    </div>
                                    
                                </div>
                              <!--End choose Hot or New Posts-->

                               {#if !loading}
                        
                                {#each posts as post}
                                
                                <div class="flex items-start w-full">
                                    <div class="w-full m-auto">
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

                        
                                {#if postLoading && !noPostMore && data?.user}
                                  <SkeletonLoading />
                                  {:else if noPostMore}
                                  <div class=" mt-10 flex flex-col justify-center items-center text-lg sm:text-xl font-bold text-gray-400 mb-20 m-auto">
                                    We reached the bottom brother
                                    <p class="mt-2 text-md text-gray-400 font-medium">Share your insight with others</p>
  
                                    <div class="tooltip tooltip-bottom mt-2 break-all" data-tip="Create a Post">
                                      {#if !data?.user}
                                      <label for="userLogin" class="flex rounded-full w-fit h-fit cursor-pointer">
                                        <svg class="m-auto mt-1 w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#78818E" d="M11 13v3q0 .425.288.713T12 17q.425 0 .713-.288T13 16v-3h3q.425 0 .713-.288T17 12q0-.425-.288-.713T16 11h-3V8q0-.425-.288-.713T12 7q-.425 0-.713.288T11 8v3H8q-.425 0-.713.288T7 12q0 .425.288.713T8 13h3Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                                      </label>
                                      {:else}
                                      <a href="/community/create-post/" class="flex rounded-full w-fit h-fit">
                                        <svg class="m-auto mt-1 w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#78818E" d="M11 13v3q0 .425.288.713T12 17q.425 0 .713-.288T13 16v-3h3q.425 0 .713-.288T17 12q0-.425-.288-.713T16 11h-3V8q0-.425-.288-.713T12 7q-.425 0-.713.288T11 8v3H8q-.425 0-.713.288T7 12q0 .425.288.713T8 13h3Zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Z"/></svg>
                                      </a>
                                      {/if}
                                    </div>
  
                                    </div>
                                {/if}
                              
                                {/if}
                            </div>
                        </div>

                        <!-- Sidebar -->
                        <aside class="hidden lg:inline-block h-sh lg:w-1/2 pt-[1.5rem] pr-0 lg:pr-2 xl:pr-0">

                          {#if !loading}
                          
                           <!-- Sidebar content -->
                            <div class="lg:pl-2 z-20 h-full">
                        
                                <!-- Sidebar content -->


                                 <!--Start About Community -->
                                 <div class="space-y-3 mb-5">  
                                  <div class="rounded-t-2xl bg-[#202020] h-auto sm:w-96">
                                    <!--Start Header-->
                                    <div class="bg-[#202020] w-full p-3 rounded-t-2xl">
                                      <span class="text-white text-xl ml-1 font-semibold">
                                        About Community
                                      </span>
                                    </div>
                                  <!--End Header-->
                                    <!--Start Content-->
                                    <div class="w-full p-4 -mt-2 text-white">
                                      A community for discussion, insights, news and memes about financial markets. 
                                    </div>
                                    <!--End Content-->

                                    <div class="mt-4 mb-4 border-t border-slate-700 w-11/12 m-auto" />
                                    <!--Start Content-->
                                    <div class="w-full pl-5 pt-2 pb-2 flex flex-row items-center">
                                      <div class="flex flex-col">
                                        <span class="text-white font-bold text-lg">
                                          {communityStats?.totalUsers}
                                        </span>
                                        <span class="text-white text-opacity-[0.7] text-[1rem">
                                          Members
                                        </span>
                                      </div>
                                      <div class="flex flex-col ml-12">
                                        <span class="text-white font-bold text-lg">
                                          {communityStats?.totalPosts}
                                        </span>
                                        <span class="text-white text-opacity-[0.7] text-[1rem">
                                          Posts
                                        </span>
                                      </div>

                                      <div class="flex flex-col ml-12">
                                        <span class="text-white font-bold text-lg">
                                          {communityStats?.totalComments}
                                        </span>
                                        <span class="text-white text-opacity-[0.7] text-[1rem">
                                          Comments
                                        </span>
                                      </div>

                                    </div>
                                    <!--End Content-->

                                    <div class="mt-4 border-t border-slate-700 w-11/12 m-auto" />

                                    <div class="flex justify-center items-center mb-8 pt-5">
                                      <a href="/community/create-post" class="rounded-full cursor-pointer w-11/12 py-2 h-full mt-2 text-md text-center font-semibold text-white m-auto hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] mb-6 duration-150">
                                        Create Post
                                      </a>
                                    </div>


                                  </div>
                                </div>
                              <!--End About Community -->


                              <!--Start Discord -->
                              {#if discordData?.length !== 0}
                                <div class="space-y-3 mb-5">  
                                  <div class="rounded-t-2xl bg-[#202020] h-auto sm:w-96">

                                  <!--Start Image-->
                                  <div class="flex flex-row items-center w-full p-3">
                                    <svg class="w-12 mt-3 ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"/></svg>
                                    <div class="flex justify-center items-center text-2xl font-medium ml-3 mt-3">
                                      <span class="self-center text-2xl text-white font-bold whitespace-nowrap">
                                        Official Discord
                                      </span>
                                    </div>
                                  </div>
                                  <!--End Image-->
                                    <!--Start Content-->
                                    <div class="w-full p-4 text-white">
                                      Daily discussions on our open source project.
                                    </div>
                                    <!--End Content-->

                                    <div class="mt-4 mb-4 border-t border-slate-700 w-11/12 m-auto" />
                                    <!--Start Content-->
                                    <div class="w-full pl-5 pt-2 pb-2 flex flex-row items-center">
                                      <div class="flex flex-col">
                                        <span class="text-white font-bold text-lg">
                                          {$discordMembers}
                                        </span>
                                        <span class="text-white text-opacity-[0.7] text-[1rem">
                                          Members
                                        </span>
                                      </div>
                                      <div class="flex flex-col ml-12">
                                        <div class="flex flex-row items-center text-white font-bold text-lg">
                                          <div class="mr-1 inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#75D377] border border-2 border-slate-800 rounded-full" />
                                          {discordData?.members?.length}
                                        </div>
                                        <span class="text-white text-opacity-[0.7] text-[1rem">
                                          Online
                                        </span>
                                      </div>

                                        <div class="ml-12 avatar-group -space-x-6 rtl:space-x-reverse">
                                          {#each discordData?.members?.slice(0,5) as item, index}
                                            {#if index < 4}
                                              <div class="avatar">
                                                <div class="w-8">
                                                  <img src={item['avatar_url']} />
                                                </div>
                                              </div>
                                            {/if}
                                            {#if index >=4}
                                            <div class="avatar placeholder">
                                              <div class="w-8 bg-neutral text-sm text-white">
                                                <span>+{discordData?.members?.length -4}</span>
                                              </div>
                                            </div>
                                            {/if}
                                          {/each}
                                        </div>
                                      </div>

                                    <!--End Content-->

                                    <div class="mt-4 border-t border-slate-700 w-11/12 m-auto" />

                                    <div class="flex justify-center items-center mb-8 pt-5">
                                      <a href={discordURL} rel="noopener noreferrer" target="_blank" class="rounded-full cursor-pointer w-11/12 py-2 h-full mt-2 text-md text-center font-semibold text-white m-auto hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] mb-6 duration-150">
                                        Join us
                                      </a>
                                    </div>


                                  </div>
                                </div>
                                {/if}

                              <!--End Discord -->

                              <!--Ticker Mentioning-->
                              <!--
                              <div class="space-y-3 mt-5 pb-3">  
                                <div class="rounded-2xl bg-[#202020] h-96 sm:w-96">
                                  Start Header
                                  <div class="bg-[#202020] border-b border-slate-700 w-full p-3 rounded-t-2xl ">
                                    <span class="text-white text-xl ml-1 font-semibold">
                                      Ticker Mentions
                                    </span>
                                  </div>
                                End Header

                                  Start Content
                                  <div class="w-full text-gray-300">
                                    <table class="table table-xs table-zebra table-compact w-full bg-[#202020] border-b border-[#202020]">
                                      <thead>
                                        <tr class="border-b border-slate-700">
                                          <th class="text-white font-medium text-sm border-b border-slate-800">Company</th>
                                          <th class="text-white font-medium text-sm border-b border-slate-800">Mentioned</th>
                                          <th class="text-white font-medium text-sm border-b border-slate-800 text-end">Market Cap</th>
                                        </tr>
                                      </thead>
                                      <tbody class="p-3">
                                        {#each tickerMentioning?.slice(0,5) as item}
                                        <tr class="bg-[#202020] border-b border-[#202020] shake-ticker w-full">
                                          <td class="text-gray-200 border-b border-[#202020]">
                                            <div class="flex flex-row">
                                              <div class="rounded-full w-8 h-8 relative bg-[#20202E] flex items-center justify-center">
                                                <img style="clip-path: circle(50%);" class="w-4 h-4" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} loading="lazy"/>
                                              </div>
                                              <div class="flex flex-col ml-2">
                                                <span class="text-blue-400">{item?.symbol}</span>
                                                <span class="text-white text-xs">{item?.name.length > 10 ? item?.name.slice(0,10) + "..." : item?.name}</span>
                                              </div>
                                            </div>
                                          </td>
                        
                            
                                        <td class="text-gray-200 border-b border-[#202020]">
                                          <span class="text-white font-medium text-[0.93rem] flex justify-center items-center">
                                            {item?.count}
                                          </span>
                                        </td>

                                        <td class="text-gray-200 border-b border-[#202020]">
                                          <span class="text-white font-medium text-[0.93rem] flex justify-end items-center">
                                            {abbreviateNumber(item?.marketCap,true)}
                                          </span>
                                        </td>
                            
                                        </tr>
                                        
                                     
                            
                            
                                        {/each}
                                      </tbody>
                                    </table>
                                    
                                  </div>
                                  End Content

                                  </div>
                                </div>
                              -->
                              <!--End Ticker Mentioning-->


                               <!--Community Rules-->
                               <div class="space-y-3 mt-5 fixed sticky" style="top: 5rem;">  
                                <div class="rounded-t-2xl bg-[#202020]  sm:w-96 rounded-2xl">
                                  <!--Start Header-->
                                  <div class="bg-[#202020] border-b border-slate-700 w-full p-3 rounded-t-2xl">
                                    <span class="text-white text-xl ml-1 font-semibold">
                                      Community Rules
                                    </span>
                                  </div>
                                <!--End Header-->

                                  <!--Start Content-->
                                  <div class="w-full p-4 text-gray-300">
                                    <ol class="list-disc pl-4 ">
                                      <li class="text-[1rem] mb-3">
                                        Avoid Purely Policital Discussion
                                      </li>
                                      <li class="text-[1rem] mb-3">
                                        No violence or gory contents
                                      </li>
                                      <li class="text-[1rem] mb-3">
                                        No Advertisement, Self-Promotion, Fundraising, or Begging
                                      </li>
                                      <li class="text-[1rem]">
                                        No illegal activities
                                      </li>
                                    </ol>
                                    
                                  </div>
                                  <!--End Content-->

                                  </div>

                                  <div class="flex flex-col items-start ml-4 mt-4">
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
                              <!--End Community Rules-->
                            
                            
                            </div>
                            {/if}

                        </aside>

                    </div>

                </div>
            </section>

        </main>
       
    </div>




<!--
{#if BottomNavigation}
    <BottomNavigation data={data} />
{/if}
-->

<!--Start Login Modal-->
{#if LoginPopup}
   <LoginPopup form={form}/>    
{/if}
<!--End Login Modal-->





</body>



<style>
  

.pageTransitionOut {
  view-transition-name: pageTransitionOut;
}

@keyframes fade-in {
    from {
        opacity: 1;
    }
  }
  
  @keyframes fade-out {
    to {
        opacity: 1;
    }
  }
  
  @keyframes slide-from-right {
    from {
        transform: translateX(500px);
    }
  }
  
  @keyframes slide-to-left {
    to {
        transform: translateX(-200px);
    }
  }
  
  :root::view-transition-old(root) {
    animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out, 230ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
  }
  
  :root::view-transition-new(root) {
    animation: 210ms cubic-bezier(0, 0, 0.2, 1) 180ms both fade-in, 230ms cubic-bezier(0.4, 0, 0.2, 1) both
            slide-from-right;
  }

  @media (prefers-reduced-motion: no-preference) {
	:root::view-transition-old(root) {
		animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out, 300ms cubic-bezier(0.4, 0, 0.2, 1) both
				slide-to-left;
	}

	:root::view-transition-new(root) {
		animation: 210ms cubic-bezier(0, 0, 0.2, 1) 180ms both fade-in, 300ms cubic-bezier(
					0.4,
					0,
					0.2,
					1
				) both slide-from-right;
	}
}
  

  .vote-counter {
    transition: transform 0.3s ease-out;
  }

  .vote-counter.changed {
    transform: translateY(-20px);
  }


  .grid-background {
    background: linear-gradient(to bottom, #404040, #14284B);
    width: 24rem;
    position: relative;
}

.grid-background::before {
  content: "";
  position: absolute;
  border-radius: 10%;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0, rgba(255, 255, 255, 0.15) 1px, transparent 1px, transparent 40px),
    repeating-linear-gradient(to right, rgba(255, 255, 255, 0.15) 0, rgba(255, 255, 255, 0.15) 1px, transparent 1px, transparent 40px);
  background-size: 20px 100% 100% 20px; /* Adjust the grid spacing as needed */
}


</style>