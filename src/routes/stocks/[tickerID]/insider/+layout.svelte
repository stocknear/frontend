<script lang='ts'>
    import { stockTicker, screenWidth } from "$lib/store";
    import { page } from "$app/stores";
    
    let displaySubSection = '';
    
    
    
    
    if (!displaySubSection || displaySubSection.length === 0) {
      const parts = $page?.url?.pathname.split('/');
      const sectionMap = {
        'congress-trading': 'congress-trading',
        'transcripts': 'transcripts',
      };
    
      const foundSection = parts?.find(part => Object?.values(sectionMap)?.includes(part));
    
      displaySubSection = Object?.keys(sectionMap)?.find(key => sectionMap[key] === foundSection) || 'insider';
    }
    
    
    
    function changeSubSection(state) {
      const subSectionMap = {
        'congress-trading': '/insider/congress-trading',
        'transcripts': '/insider/transcripts',
      };
    
      if (state !== 'insider' && subSectionMap[state]) {
        displaySubSection = state;
        //goto(`/stocks/${$stockTicker}${subSectionMap[state]}`);
      } else {
        displaySubSection = state;
        //goto(`/stocks/${$stockTicker}/insider`);
      }
    }
    
    
    
    </script>
    
    <section class="w-auto max-w-3xl bg-[#0F0F0F] overflow-hidden text-black h-full mb-40">
      <div class="m-auto h-full overflow-hidden">
                <main class="w-fit sm:w-full sm:max-w-2xl ">
                    <div class="m-auto">
                                        
    
                    

   
                        <div class="sm:ml-8 w-screen sm:w-full {$screenWidth < 640 ? 'overflow-auto scrollbar no-scrollbar' : ''} mb-2" >
                          <ul class="pr-4 sm:pr-0 w-screen flex flex-row items-center bg-[#0F0F0F] overflow-x-scroll space-x-6 rtl:space-x-reverse py-2">
                            <li class="cursor-pointer flex flex-col items-center">
                              <a href={`/stocks/${$stockTicker}/insider`} on:click={() => (changeSubSection('insider'))} class="text-xs sm:text-[0.85rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'insider' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                                Insider Trading
                              </a>
                              <div class="{displaySubSection === 'insider' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[5rem]" />
                            </li>
                            <li class="cursor-pointer flex flex-col items-center">
                              <a href={`/stocks/${$stockTicker}/insider/congress-trading`} on:click={() => (changeSubSection('congress-trading'))} class="text-xs sm:text-[0.85rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'congress-trading' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                                Congress Trading
                              </a>
                              <div class="{displaySubSection === 'congress-trading' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[5rem]" />
                            </li>
                            <li class="cursor-pointer flex flex-col items-center">
                              <a href={`/stocks/${$stockTicker}/insider/transcripts`} on:click={() => (changeSubSection('transcripts'))} class="text-xs sm:text-[0.85rem] font-medium text-gray-400 sm:hover:text-white {displaySubSection === 'transcripts' ? 'text-white ' : 'bg-[#0F0F0F]'}" >
                                Transcripts
                              </a>
                              <div class="{displaySubSection === 'transcripts' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[3.5rem]" />
                            </li>
                          </ul>
                        </div>

                        
                        
                    </div>
    
                </main>
    
                <slot/>
            </div>
    </section>
    
    
    
    
    <style lang='scss'>
       

      .scrollbar {
          display: grid;
          grid-gap: 17px;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          grid-auto-flow: column;
          overflow-x: auto;
          scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
          scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
      }
      
      /* Custom scrollbar for Webkit (Chrome, Safari) */
      .scrollbar::-webkit-scrollbar {
          width: 0; /* Hide the width of the scrollbar */
          height: 0; /* Hide the height of the scrollbar */
      }
      
      .scrollbar::-webkit-scrollbar-thumb {
          background: transparent; /* Make the thumb transparent */
      }
      
      ::-webkit-scrollbar {
          height: 7px;
          width: 10px;
          background: #0F0F0F;
      }
      
      ::-webkit-scrollbar-thumb {
          background: #6B6F79;
          -webkit-border-radius: 1ex;
          -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
      }
      
      ::-webkit-scrollbar-corner {
          background: #0F0F0F;
      }
      
      
      </style>