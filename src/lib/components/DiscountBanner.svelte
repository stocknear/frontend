<script lang='ts'>
    import {screenWidth} from '$lib/store';
    import discountBanner from '$lib/images/discountBanner.jpg';

</script>
    

<input type="checkbox" id="discountBanner" class="modal-toggle" />
    
    <dialog id="discountBanner" class="modal modal-bottom sm:modal-middle">
    
    
        <label id="discountBanner" for="discountBanner"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.05]"></label>
        
        
        <div class="modal-box w-full relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl">
          <label
            for="discountBanner"
            class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
            aria-label="Close modal"
          >
            <svg
              class="w-6 h-6 sm:w-7 sm:h-7"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              /></svg>
          </label>

            <div class="card bg-[#000] w-full">
                <figure><img class="rounded-xl" src={discountBanner} alt="discount" /></figure>
                <div class="card-body">
                    <h2 class="card-title">Only 100 Slots left: </h2>
                    <p>If a dog chews shoes whose shoes does he choose?</p>
                    <div class="card-actions justify-end">
                    <a href="/pricing" class="btn btn-primary">Buy Now</a>
                    </div>
                </div>
                </div>
        </div>
    
    </dialog>
<!--End Login Modal-->
    