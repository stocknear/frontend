<script lang ='ts'>
import { numberOfUnreadNotification, discordMembers} from '$lib/store';
import {getImageURL} from '$lib/utils';

export let data;


//let discordURL = import.meta.env.VITE_DISCORD_URL;
const article = data?.getArticle;
//const discordData = data?.getDiscordWidget;
    
</script>




<svelte:head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {article?.title} · stocknear</title>
    <meta name="description" content="Latest articles on stocks, finance and investing">
    <!-- Other meta tags -->
    <meta property="og:title" content="{article?.title}"/>
    <meta property="og:description" content="{article?.abstract}"/>
    <meta property="og:image" content="{getImageURL(article?.collectionId, article?.id, article?.cover)}"/>
    <meta property="og:type" content="article"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="{article?.title}"/>
    <meta name="twitter:description" content="{article?.abstract}"/>
    <meta name="twitter:image" content="{getImageURL(article?.collectionId, article?.id, article?.cover)}"/>
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>

            
<section class="w-full max-w-6xl m-auto pt-5 pb-60 min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
        
    <div class="text-sm breadcrumbs ml-4 sm:ml-0">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li><a href="/blog" class="text-gray-300">All Blog Post</a></li> 
          <li class="text-gray-300">Post</li>
        </ul>
    </div>


        <div class="mt-3 w-full max-w-4xl h-72 flex flex-col bg-cover bg-center bg-no-repeat" 
          style="background-image: url('{article?.cover ? getImageURL(article?.collectionId, article?.id, article?.cover) : ''}');" />
    
            <main class="grow m-auto"> 
                    <div class="w-full max-w-4xl ">
                        <div class="sm:flex sm:justify-start">
    
                            <!-- Main content -->
                            <div class="md:grow pt-6 pb-12 w-full sm:mr-4 rounded-2xl sm:rounded-none">
                                <div class="sm:pr-5">
                                   <!--Start Title-->
                                   <h1 class="text-white font-bold text-3xl bg-[#111011] sm:bg-[#09090B] p-6 sm:p-3 rounded-t-xl -mt-36 sm:mt-0 bg-opacity-[0.9]">
                                    {@html article?.title}
                                    </h1>
                                   <!--End Title-->
                                    <!--Start Writer-->
                                    <div class="flex flex-row items-center pl-3 pr-3 pt-8 pb-6">
                                        <a href={"/community/user/"+article?.user} class="cursor-pointer text-sm text-slate-200 flex flex-row items-center">
                                          <img 
                                          class="rounded-full w-10 h-10 mr-2"
                                          src={article?.expand?.user?.avatar
                                            ? getImageURL(article?.expand?.user?.collectionId, article?.expand?.user?.id, article?.expand?.user?.avatar)
                                            : `https://avatar.vercel.sh/${article?.expand?.user?.username}`} 
                                            alt="User avatar" loading='lazy'/>
                                            <div class="flex flex-col items-start">
                                                <span class="text-white text-sm">
                                                    mrahimi
                                                </span>
                                                <span class="text-white text-opacity-[0.7] text-sm">
                                                    {article?.readingTime} min read &centerdot; {new Date(article?.created)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                                </span>
                                            </div>
                                        </a>
                                        

                                    </div>
                                    <!--End Write-->

                                   
                                   <!--Start Description-->
                                   <div class="text-white text-lg p-6 sm:p-3">
                                      {@html article?.description}                
                                    </div>
                                   <!--End Description-->

                                   {#if !data?.user}
                                    <div class="rounded-lg border border-slate-800 w-11/12 sm:w-full m-auto p-6 mt-16">
                                    
                                    <span class="text-white text-md text-center p-4 mb-3 flex justify-center">
                                        Stay up to date with the market without the redudant BS
                                    </span>
                                    <a class="w-64 flex mb-5 justify-center items-center m-auto btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group" href="/register">
                                        Get Started 
                                        <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
                                        </span>
                                    </a>
                                    </div>
                                    {/if}
    
    
                                </div>
                            </div>
    
                            <!-- Sidebar -->
                            <!--
                            <aside class="hidden sm:inline-block min-h-screen sm:w-96 pt-[1rem]">
    
                              
                                <div class="z-20 fixed sticky">
                                
    
                              {#if discordData?.length !== 0}
                              <div class="space-y-3 mb-5">  
                                <div class="rounded-2xl h-auto sm:w-96">

                                <div class="flex flex-row items-center w-full p-3">
                                  <svg class="w-12 mt-3 ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"/></svg>
                                  <div class="flex justify-center items-center text-2xl font-medium ml-3 mt-3">
                                    <span class="self-center text-2xl text-white font-bold whitespace-nowrap">
                                      Official Discord
                                    </span>
                                  </div>
                                </div>

                                <div class="w-full p-4 text-white">
                                    Daily pre-market discussions, feature request, bug reports & more.
                                  </div>


                                  <div class="mt-4 mb-4 border-t border-slate-700 w-11/12 m-auto" />

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
                                                {#if item['avatar_url']?.length !== 0}
                                                <img src={item['avatar_url']} />
                                                {:else}
                                                <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=test`} />
                                                {/if}
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


                                  <div class="mt-4 border-t border-slate-700 w-11/12 m-auto" />

                                  <div class="flex justify-center items-center mb-8 pt-5">
                                    <a href={discordURL} rel="noopener noreferrer" target="_blank" class="text-[1rem] btn btn-md w-11/12 text-[#1A1A1B] rounded-full bg-[#C7CACC] cursor-pointer py-2.5 px-4 btn hover:bg-[#fff] mb-4">
                                      Join us
                                    </a>
                                  </div>


                                </div>
                              </div>
                              {/if}

    
    
                                </div>
    
                            </aside>
                          -->
    
                        </div>
    
                    </div>
    
        </main>
    </section>
    
      
    
    
    
    
    <style>
    
    #content {
      position: relative;
    }
    
    #content:before,
    #content:after {
      position: absolute;
      width: 120px;
      height: 40px;
      border-color: #FF8C6C; /* or whatever color */
      border-style: solid; /* or whatever style */
      content: ' ';
    }
    
    #content:before {
      top: 0;
      left: 0;
      border-width: 1px 0 0 1px;
    }
    
    #content:after {
      bottom: 0;
      right: 0;
      border-width: 0 1px 1px 0;
    }
    
      
    .grid-background {
        background: linear-gradient(to bottom, #27272A, #111011);
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