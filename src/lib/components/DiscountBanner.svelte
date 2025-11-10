<script lang='ts'>
    import {screenWidth} from '$lib/store';
    import discountBanner from '$lib/images/discountBanner.jpg';

</script>
    

<input type="checkbox" id="discountBanner" class="modal-toggle" />
    
    <dialog id="discountBanner" class="modal modal-bottom sm:modal-middle">
    
    
        <label id="discountBanner" for="discountBanner"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.05]"></label>
        
        
        <div class="modal-box w-full bg-[#000]">

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
    