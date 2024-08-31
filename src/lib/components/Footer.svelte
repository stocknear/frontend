<script lang='ts'>

  let discordURL = import.meta.env.VITE_DISCORD_URL;


</script>


 <!--Footer-->
 <footer class="bg-[#09090B] border-t border-slate-800 z-20 sm:z-50 relative bottom-0 w-full sm:px-10 m-auto">
  <div class="container mx-auto px-3">
      
    <div class="w-full flex flex-col md:flex-row py-6">
      <div class="flex-1 mb-8">
        <div class="flex flex-row items-center mt-4">

          <a href="https://www.ko-fi.com/stocknear" rel="noopener noreferrer" target="_blank" class="flex flex-row items-center">
            <svg class="w-5 h-5 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015"/></svg>
          </a>

          <a href={discordURL} rel="noopener noreferrer" target="_blank" class="flex flex-row items-center">
            <svg class="w-6 h-6 ml-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>
          </a>


          <a href="https://twitter.com/intent/follow?screen_name=stocknear" rel="noopener noreferrer" target="_blank" class="flex flex-row items-center">
            <svg class="w-5 h-5 ml-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M18.205 2.25h3.308l-7.227 8.26l8.502 11.24H16.13l-5.214-6.817L4.95 21.75H1.64l7.73-8.835L1.215 2.25H8.04l4.713 6.231l5.45-6.231Zm-1.161 17.52h1.833L7.045 4.126H5.078L17.044 19.77Z"/></svg>
          </a>
          
          <a href="https://github.com/stocknear" rel="noopener noreferrer" target="_blank" class="flex flex-row items-center ml-3">
            <svg class="w-6 h-6 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/></svg>
          </a>


        </div>

        <!--
        <a href="https://stats.uptimerobot.com/MP0zLix9yk" rel="noopener noreferrer" target="_blank" class="flex flex-row items-center mt-4">
          <span class="text-white sm:hover:text-purple-400">
            Server Status
          </span>
          <span class="relative flex h-3 w-3 ml-2">
            <span class="absolute inline-flex h-full w-full rounded-full"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
          </span>
        </a>
        -->

      </div>
      
      <div class="flex-1 mb-2 sm:mb-0">
        <p class="uppercase text-slate-100 md:mb-6">Products</p>
        <ul class="list-reset mb-6">
          <li class="mt-2 inline-block mr-2 md:block md:mr-0" >
            <a href="/pricing" class="no-underline hover:underline text-gray-300  sm:hover:text-purple-400">Pricing</a>
          </li>
          <!--
          <li class="mt-2 inline-block mr-2 md:block md:mr-0" >
            <a href="/changelog" class="no-underline hover:underline text-gray-300  sm:hover:text-purple-400">Changelog</a>
          </li>
          -->
        </ul>
      </div>

      <div class="flex-1 mb-2 sm:mb-0">
        <p class="uppercase text-slate-100 md:mb-6">Legal</p>
        <ul class="list-reset mb-6">
          <li class="mt-2 inline-block mr-2 md:block md:mr-0" >
            <a href="/terms-of-use" class="no-underline hover:underline text-gray-300  sm:hover:text-purple-400">Terms of Use</a>
          </li>
          <li class="mt-2 inline-block mr-2 md:block md:mr-0" >
            <a href="/privacy-policy" class="no-underline hover:underline text-gray-300  sm:hover:text-purple-400">Privacy Policy</a>
          </li>
          <li class="mt-2 inline-block mr-2 md:block md:mr-0" >
            <a href="/imprint" class="no-underline hover:underline text-gray-300  sm:hover:text-purple-400">Imprint</a>
          </li>
        </ul>
      </div>
    
      <div class="flex-1 mb-2 sm:mb-0">
        <p class="uppercase text-slate-100 md:mb-6">Company</p>
        <ul class="list-reset mb-6">

          <li class="mt-2 inline-block mr-2 md:block md:mr-0">
            <a href="/about" class="no-underline hover:underline text-gray-300 sm:hover:text-purple-400">
              About Us
            </a>
          </li>
          <li class="mt-2 inline-block mr-2 md:block md:mr-0">
            <a href="/contact" class="no-underline hover:underline text-gray-300 sm:hover:text-purple-400">
              Contact Us
            </a>
          </li>
          <li class="mt-2 inline-block mr-2 md:block md:mr-0">
            <a href="/blog" class="no-underline hover:underline text-gray-300 sm:hover:text-purple-400">
              Blog
            </a>
          </li>
          <!--
          <li class="mt-2 inline-block mr-2 md:block md:mr-0">
            <a href="/newsletter" class="no-underline hover:underline text-gray-300 sm:hover:text-purple-400">
              Newsletter
            </a>
          </li>
          -->
      
        </ul>
      </div>
      <!--
      <div class="flex-1">
        <p class="uppercase text-slate-100 md:mb-6">App</p>
        <ul class="list-reset mb-6">
        
          <li class="mt-6 sm:mt-2 inline-block mr-2 md:block md:mr-0">
            <a href="https://play.google.com/store/apps/details?id=com.stocknear.bundleId" rel="noopener noreferrer" target="_blank" class="flex flex-row items-center no-underline text-white">
              <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M48 59.49v393a4.33 4.33 0 0 0 7.37 3.07L260 256L55.37 56.42A4.33 4.33 0 0 0 48 59.49M345.8 174L89.22 32.64l-.16-.09c-4.42-2.4-8.62 3.58-5 7.06l201.13 192.32ZM84.08 472.39c-3.64 3.48.56 9.46 5 7.06l.16-.09L345.8 338l-60.61-57.95ZM449.38 231l-71.65-39.46L310.36 256l67.37 64.43L449.38 281c19.49-10.77 19.49-39.23 0-50"/></svg>
              <span class="ml-2 text-white text-[0.92rem] sm:text-md">
                Google Playstore
              </span>
            </a>
          </li>

          <li class="mt-2 sm:mt-3 inline-block mr-2 md:block md:mr-0 ">
            <label class="flex flex-row items-center no-underline text-white">
              <svg class="w-7 h-7 -ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25"/></svg>
              <span class="ml-2 text-white text-[0.92rem] sm:text-md">
                App Store (Coming Soon)
              </span>
            </label>
          </li>

    
        </ul>
      </div>
      -->

      
    </div>

    <div class="hidden sm:flex flex-col">
      <div class="border-b border-gray-700 w-full"/>
      <span class="flex flex-row items-center mt-6 text-md text-gray-300 mb-5">
        © 2024 Stocknear. All Rights Reserved.
      </span>
    </div>


  </div>  
</footer>
