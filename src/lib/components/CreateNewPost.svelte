<script lang='ts'>
  import {getImageURL} from '$lib/utils';
  
  export let data;

</script>

<!-- Create Post -->
  <!-- List container -->                  
  <div class="flex flex-col">
      <!-- Item -->
      <div class="sm:border border-gray-700 sm:hover:border-gray-600 rounded-none sm:rounded-md bg-[#09090B] rounded-[4px] sm:rounded-[8px]">
        <div class="flex h-14 sm:h-16 justify-start items-center">
          <div class="ml-2 sm:ml-3 avatar relative">
            <div class="w-8 sm:w-10 rounded-full">
              <img src={data?.avatar
                ? getImageURL(data?.collectionId, data?.id, data?.avatar)
                : `https://avatar.vercel.sh/${data?.user?.username}`} />
            </div>
            <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-400 border border-2 border-slate-800 rounded-full absolute bottom-0 right-0"></div>
          </div>
          

          <a href="/community/create-post/" class="pl-3 sm:pl-5 text-white text-sm rounded-md h-10 sm:h-12 w-full bg-[#313131] cursor-pointer ml-3 flex justify-start items-center">
              Create Post
          </a>
          <div class="flex justify-start items-center ml-2">

            <a href="/community/create-post" class="text-white mr-2">
              <svg class="w-6 h-6 inline-block ml-1 mr-1"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="#A6ADBB" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="#E5E7EB"></path> </g></svg>
            </a>

            <a href="/community/create-post"  class="text-white mr-2">
              <svg class="w-6 h-6 inline-block ml-1 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#A6ADBB"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.975 14.51a1.05 1.05 0 0 0 0-1.485 2.95 2.95 0 0 1 0-4.172l3.536-3.535a2.95 2.95 0 1 1 4.172 4.172l-1.093 1.092a1.05 1.05 0 0 0 1.485 1.485l1.093-1.092a5.05 5.05 0 0 0-7.142-7.142L9.49 7.368a5.05 5.05 0 0 0 0 7.142c.41.41 1.075.41 1.485 0zm2.05-5.02a1.05 1.05 0 0 0 0 1.485 2.95 2.95 0 0 1 0 4.172l-3.5 3.5a2.95 2.95 0 1 1-4.171-4.172l1.025-1.025a1.05 1.05 0 0 0-1.485-1.485L3.87 12.99a5.05 5.05 0 0 0 7.142 7.142l3.5-3.5a5.05 5.05 0 0 0 0-7.142 1.05 1.05 0 0 0-1.485 0z" fill="#A6ADBB"></path></g></svg>
            </a>

            <!--
            <a href="#" class="text-gray-300">
                <svg class="w-6 h-6 inline-block" fill="#545B61" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M448 432V80c0-26.5-21.5-48-48-48H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48zM112 192c-8.84 0-16-7.16-16-16v-32c0-8.84 7.16-16 16-16h128c8.84 0 16 7.16 16 16v32c0 8.84-7.16 16-16 16H112zm0 96c-8.84 0-16-7.16-16-16v-32c0-8.84 7.16-16 16-16h224c8.84 0 16 7.16 16 16v32c0 8.84-7.16 16-16 16H112zm0 96c-8.84 0-16-7.16-16-16v-32c0-8.84 7.16-16 16-16h64c8.84 0 16 7.16 16 16v32c0 8.84-7.16 16-16 16h-64z"></path></g></svg>

            </a>
            -->
          </div>
        </div>
      </div>
  </div>
