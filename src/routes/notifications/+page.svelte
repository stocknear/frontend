<script lang='ts'>
    import {getImageURL, formatDate} from '$lib/utils';
    import { goto } from '$app/navigation';
	import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

    import { onMount } from 'svelte';
    import {userRegion, numberOfUnreadNotification, scrollToComment } from '$lib/store';

    export let data;
    export let form;

    let rawData = data?.getNotifications;
    let notificationList = rawData?.slice(0,20);

    let isLoaded = false;
        
    const usRegion = ['cle1','iad1','pdx1','sfo1'];
    
    let fastifyURL;
    
    userRegion.subscribe(value => {
    
        if (usRegion.includes(value)) {
          fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
        } else {
          fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
        }
      });
    
    
async function updateNotifications()
{

let notificationIdList = [];

for(let i = 0; i < notificationList?.length; i++)
{
  if(notificationList[i]?.readed == false)
  {
    notificationIdList?.push(notificationList[i]?.id)
  }
}


if (notificationIdList.length !== 0)
{
  const postData = {'unreadList': notificationIdList};

    await fetch(fastifyURL+'/update-notifications', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)

  });

  $numberOfUnreadNotification = 0;

}


}

function goToPost(item) {
  if (item?.comment && item?.notifyType === 'vote') {
    $scrollToComment = item?.comment;
  }
  goto("/community/post/"+item?.post)
}

async function infiniteHandler({ detail: { loaded, complete } }) 
{
if (notificationList?.length === rawData?.length) {
    complete();
  } else {
    const nextIndex = notificationList?.length;
    const newArticles = rawData?.slice(nextIndex, nextIndex + 20);
    notificationList = [...notificationList, ...newArticles];
    console.log(notificationList)
    loaded();
  }
}

    
    
onMount(async () => {

    await updateNotifications();
    isLoaded = true;

})   
</script>
    
    
        
<svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Notifications · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />

    <meta name="description" content="Free Stock Analysis">
    <!-- Other meta tags -->
    <meta property="og:title" content="Notifications · stocknear"/>
    <meta property="og:description" content="Free Stock Analysis">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Notifications · stocknear"/>
    <meta name="twitter:description" content="Free Stock Analysis">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
      
  <section class="w-full max-w-5xl overflow-hidden m-auto min-h-screen sm:pt-5 sm:pb-40 bg-[#09090B]">
      
  
  
    <div class="w-full max-w-3xl m-auto min-h-screen bg-[#09090B] sm:rounded-lg sm:border sm:border-gray-700 overflow-hidden sm:overflow-y-scroll scroller sm:max-h-[1100px] pt-5 sm:pb-10 sm:pt-10 sm:mt-3 sm:mb-8">
                    
        <h1 class="pl-5 text-2xl text-white font-semibold mt-2 sm:mt-0">
            Notifications
        </h1>
 
 
     <div class="w-full m-auto mb-10 bg-[#09090B] mt-10">
         <div class="flex flex-col sm:flex-row items-center w-full">

        
        
 
         {#if isLoaded }

         {#if notificationList?.length !== 0}
         <!-- svelte-ignore a11y-click-events-have-key-events -->
         <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
         <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
         <div class="flex flex-col items-start w-full text-white">
         {#each notificationList as item}
           <!-- svelte-ignore a11y-click-events-have-key-events -->
           <div on:click={()=> goToPost(item)} class="hover:bg-[#2B2B2B] p-3 mb-3 ml-1 text-gray-200 w-full {!item?.readed ? 'bg-[#F9AB00] bg-opacity-[0.1]' : ''} cursor-pointer">
            <div class="flex flex-row items-center w-full">

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label on:click|stopPropagation={()=> goto("/community/user/"+item?.expand?.user?.id)} class="avatar w-8 h-8 sm:w-11 sm:h-11 flex-shrink-0 cursor-pointer mr-4">
              <img style="clip-path: circle(50%);" class="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full inline-block" 
                src={item?.expand?.user?.avatar
                    ? getImageURL(item?.expand?.user?.collectionId, item?.expand?.user?.id, item?.expand?.user?.avatar)
                    : `https://avatar.vercel.sh/${item?.expand?.user?.username}`} 
                alt="User avatar"
              />
              </label>
      
             <div class="text-white text-sm sm:text-[1rem]">
               {#if item?.notifyType === 'vote'}
               <div class="flex flex-col items-start">
                <div>
                 <label on:click|stopPropagation={()=> goto("/community/user/"+item?.expand?.user?.id)} class="text-blue-400 cursor-pointer">
                   {item?.expand?.user?.username}
                 </label>
                 <span class="text-white text-xs sm:text-sm">
                  upvoted your {item?.comment ? 'comment' : 'post'}
                 </span>
                </div>
                <span class="text-xs sm:text-sm text-[#A6ADBB0">{formatDate(item?.created)} ago</span>
                </div>
                 {:else if item?.notifyType === 'priceAlert'}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <div class="flex flex-col items-start">
                    <div>
                    <label on:click|stopPropagation={()=>  goto(`/${item?.liveResults?.assetType === 'stock' ? 'stocks' : 'etf'}/${item?.liveResults?.symbol}`)} class="flex flex-col items-start cursor-pointer">
                        <div class="text-md mt-0.5">
                        Price Alert triggered for <span class="text-blue-400">${item?.liveResults?.symbol}</span>
                        </div>
                        <div class="text-md mt-0.5">
                        The price of <span class="font-bold">${item?.liveResults?.currentPrice}</span> is {item?.liveResults?.condition} your target of <span class="font-bold">${item?.liveResults?.targetPrice}</span>
                        </div>
                    </label>
                    </div>
                  <span class="text-xs sm:text-sm text-[#A6ADBB0">{formatDate(item?.created)} ago</span>
                </div>
      
               {:else if item?.notifyType === 'comment'}
               <div class="flex flex-col items-start">
                <div>
                 <label on:click={() => goto("/community/user/"+item?.expand?.user?.id)} class="text-blue-400 hover:underline cursor-pointer">
                   {item?.expand?.user?.username} 
                 </label>
                 <span class="text-white text-xs sm:text-sm">
                  commented on your post:
                  </span>
                 {@html item?.expand?.comment?.comment?.length > 30 ? item?.expand?.comment?.comment?.slice(0, 30) + "..." : item?.expand?.comment?.comment}
                </div>
                 <span class="text-xs sm:text-sm text-[#A6ADBB0">{formatDate(item?.created)} ago</span>
                </div>
                
               {/if}
                </div>
             <!--
             {#if item?.expand?.post?.thumbnail}
             <img 
             src="{getImageURL(item?.expand?.post?.collectionId, item?.expand?.post?.id, item?.expand?.post?.thumbnail)}" 
             class="w-24 sm:w-20 max-h-[50px] rounded-md inline-block"
             alt="post thumbnail"
             />
             {/if}
             -->
             
              </div>
            </div>
         {/each}

        </div>

      
        <InfiniteLoading on:infinite={infiniteHandler} />

      
        {:else}
        <div class="text-white font-semibold text-lg justify-center items-center m-auto">
          Empty just like our souls...
          <svg class="inline-block w-4 h-4 m-auto mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><path fill="white" d="M567.663 0v190.423h64.679V0h-64.685h.006zm-264.11 57.225l-52.992 37.103l109.203 155.946l52.963-37.104L303.553 57.225zm592.886 0L787.268 213.171l52.971 37.104L949.44 94.328l-52.992-37.103h-.009zm-296.45 185.299c-158.227 0-286.493 96.083-286.493 214.625l162.772 492.948h247.47l162.758-492.948c0-118.54-128.258-214.625-286.492-214.625h-.015zM85.465 299.673l-22.099 60.814l178.849 65.114l22.181-60.785l-178.935-65.143h.004zm1029.062 0l-178.936 65.148l22.106 60.792l178.936-65.125l-22.106-60.815zM255.756 577.681l-183.9 49.326l16.686 62.431l183.9-49.255l-16.683-62.502h-.003zm688.48 0l-16.674 62.501l183.9 49.247l16.674-62.432l-183.9-49.318v.002zM472.66 986.032v85.686h254.687v-85.673H472.661l-.001-.013zm0 128.282V1200h254.687v-85.672H472.661l-.001-.014z"/></svg>
        </div>
         {/if}
 
    
 
 
 
         {:else}
         <div class="flex justify-center items-center h-80">
          <div class="relative">
          <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="loading loading-spinner loading-md"></span>
          </label>
          </div>
      </div>
 
         {/if}

     </div>        
     
     </section>
     
   

<style>

.scroller {
    scrollbar-width: thin;
}

</style>