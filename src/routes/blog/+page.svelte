<script lang="ts">

import logo from '$lib/images/blog_logo.png';
import { articleId, numberOfUnreadNotification } from '$lib/store';
import { goto } from '$app/navigation';
import {getImageURL} from '$lib/utils';


export let data;

function blogSelector(state:string)
{
  $articleId = state;
  goto('/blog/article/'+$articleId)
}


/*
let allBlogPosts = [
    {
        'title': 'How the Stock Market is Corrupted by Market Makers',
        'description': `If you've explored the stock market, you've probably heard of "Market Makers." In this article, we'll break down what Market Makers are and discuss why they faced allegations of corruption during the GameStop Rally.`,
        'created': '2023-11-04',
        'username': 'mrahimi',
        'userId': 'db5s41oatgoeh0q',
        'link': 'how-the-stock-market-is-corrupted-by-market-makers',
        'readingTime': '4',
        'image': coverLogo1,
    },
    {
        'title': `Ken Griffin's Vision for Miami: A Financial Hub Rivaling New York`,
        'description': `Ken Griffin, the founder of Citadel hedge fund, foresees a transformative shift in the financial landscape, with Miami poised to surpass New York as a financial hub. Griffin, who is currently overseeing the construction of Citadel's $1 billion headquarters in Miami's Brickell Bay district, emphasizes the city's potential to outpace its northern counterpart.`,
        'created': '2023-11-29',
        'username': 'mrahimi',
        'userId': 'db5s41oatgoeh0q',
        'link': 'ken-griffin-vision-for-miami',
        'readingTime': '2',
        'image': coverLogo2,
    },
    {
        'title': `Amazon's Expansion in Generative AI: A New Collaboration with Nvidia`,
        'description': `During the recent AWS re:Invent event, Amazon (NASDAQ: AMZN) made significant strides in amplifying its AI capabilities, unveiling an array of innovative products centered around generative AI. Wedbush's latest report highlights Amazon's triple-layered strategy in the generative AI landscape, spanning infrastructure, foundational models, and applications.`,
        'created': '2023-12-01',
        'username': 'mrahimi',
        'userId': 'db5s41oatgoeh0q',
        'link': 'amazon-expansion-in-generative-ai',
        'readingTime': '2',
        'image': coverLogo3,
    }

    
]
*/
let allBlogPosts = data?.getAllBlogPost;
    
  
</script>
  
  

<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Stock Analysis Blog · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Get the latest blog post to understand and invest correctly into companies.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Stock Analysis Blog · stocknear"/>
  <meta property="og:description" content="Get the latest blog post to understand and invest correctly into companies.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Stock Analysis Blog · stocknear"/>
  <meta name="twitter:description" content="Get the latest blog post to understand and invest correctly into companies.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    



    
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40 ">
            

  <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">All Blog Post</li>
      </ul>
  </div>

    <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10 ">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Stock Analysis Blog
            </h1>
          </div>
  
          <span class="w-3/4 m-auto text-white text-md font-medium text-center flex justify-center items-center ">
            An investment in knowledge pays the best
          </span>
          <!--
          <label for="marketMoverInfo" class="cursor-pointer flex justify-center items-center mt-2">
            <span class="text-white text-md font-medium">
              Learn more
            </span>
            <svg class="w-6 h-6 inline-block ml-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
          </label>
          -->
  
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
          <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
          </svg>
          
          
          <div class="z-1 absolute top-3 right-0">
            <img class="w-28 mr-6" src={logo} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
      </div>
  
     
  
  
    </div>
  
  
        
        <div class="mt-10 sm:mt-5 w-full m-auto px-3">

            <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-5">
                {#if allBlogPosts?.length !== 0}
                {#each allBlogPosts as item}
                    <div class="flex flex-col w-full min-h-fit mb-5 mt-5 bg-[#fff] bg-opacity-[0.01] sm:bg-opacity-[1.0] sm:bg-[#0F0F0F] border border-slate-700 rounded-xl m-auto">
                        
                        <label on:click={() => blogSelector(item?.id)} class="cursor-pointer">
                            <div class="flex-shrink-0 m-auto">
                                <img 
                                class="w-full h-56 rounded-t-xl" 
                                src={getImageURL(item?.collectionId, item?.id, item?.cover)}
                                alt="User avatar" loading="lazy"/>
                            </div>

                            <div class="pl-4 pt-3 w-11/12">
                                <h1 class="text-xl font-bold text-white">
                                    {item?.title}
                                </h1>
                                <p class="text-white text-sm mt-4">
                                    {item?.abstract.length > 250 ? item?.abstract?.slice(0,250) + "..." : item?.abstract}
                                </p>
                            </div>

                        </label>
                        
                      
                        <div class="flex flex-row items-center pl-4 pr-3 pt-8 pb-6">
                            <a href={"/community/user/"+item?.expand?.user?.id} class="cursor-pointer text-sm text-white sm:text-opacity-[0.7] flex flex-row items-center">
                                <img 
                                  class="rounded-full w-10 h-10 mr-2"
                                  src={item?.expand?.user?.avatar
                                    ? getImageURL(item?.expand?.user?.collectionId, item?.expand?.user?.id, item?.expand?.user?.avatar)
                                    : `https://api.dicebear.com/7.x/thumbs/svg?seed=${item?.expand?.user?.username}`} 
                                alt="User avatar" loading='lazy'/>

                                {item?.expand?.user?.username} &centerdot; {new Date(item?.created)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                            </a>
                            

                            <div class="ml-auto">
                                <span class="text-white sm:text-opacity-[0.7] text-sm ml-1 mr-4">
                                    {item?.readingTime} min read
                                </span>
                            </div>
                            
                        </div>
                    
                        
                    </div>

                
                    {/each}

                
                {/if}
            </div>

        </div>


    
  
</section>

  
