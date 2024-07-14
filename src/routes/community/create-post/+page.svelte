<script lang='ts'>

	import { enhance } from '$app/forms';
	import Input from '$lib/components/Input.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import Tags from '$lib/components/Tags.svelte'
	import toast from 'svelte-french-toast';
	import { numberOfUnreadNotification } from '$lib/store';
	
	export let form;
	let isClicked = false;
	let loading = false;
	
	const submitPost = () => {
		loading = true;
		return async ({ result, update}) => {
			switch (result.type) {
				case 'redirect':
					isClicked = true;
					toast.success('Posted successfully!', {
						style: 'border-radius: 200px; background: #333; color: #fff;'});
					await update();
					break;
				case 'failure':
					toast.error('Invalid inputs', {
					style: 'border-radius: 200px; background: #333; color: #fff;'});
					await update();
					break;
	
				case 'error':
					toast.error(result.error.message, {
					style: 'border-radius: 200px; background: #333; color: #fff;'});
					break;
				default:
					await update();
			}
			loading = false;
		}
	
		
	}
	
	let postType = 'text';

	async function changePostType(state)
	{
		switch (state)
		{
			case 'text':
				postType = 'text';
				break;
			case 'image':
				postType = 'image';
				break;
			case 'link':
				postType = 'link';
				//title = await getTitle()
				break;
		}
	
	}
	  
		
	
	
	
	</script>
		
	
	<!-- HEADER FOR BETTER SEO -->
	<svelte:head>
		<title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Create a Post · stocknear</title>
		<meta name="description" content="
		Create a post to share your insights, latest news and memes to the stocknear community.">
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
	</svelte:head>
	
	
		<div  class="flex flex-col w-full min-h-screen p-2 pt-10 pb-40">
			<div class="w-full">
				<form
					action= {postType === 'text' ? '?/createPostText' : postType === 'image' ? '?/createPostImage' : '?/createPostLink'}
					method="POST"
					class="flex flex-col space-y-2 w-full items-center"
					enctype="multipart/form-data"
					use:enhance={submitPost}
				>
					<h3 class="text-3xl font-bold mb-3 text-white">Create a Post</h3>
					<!--<p class="mt-2 text-lg">We'll need the title, tagline, url, and description</p>-->
					
					<div class="w-full max-w-3xl sm:max-w-2xl pt-10 flex justify-center items-center m-auto pb-5 bg-[#09090B]"  style="top: 4rem;">
						<!--<svg class="w-4 h-4 sm:w-6 sm:h-6 inline-block mr-0 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M2.66992 7.16979V5.34979C2.66992 4.19979 3.59992 3.27979 4.73992 3.27979H19.2599C20.4099 3.27979 21.3299 4.20979 21.3299 5.34979V7.16979" stroke="#A6ADBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M12 20.7199V4.10986" stroke="#A6ADBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8.06055 20.7202H15.9405" stroke="#A6ADBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>-->
					   
						<div class="flex flex-col items-center mr-5 sm:mr-10">
						  <label class="tab font-semibold hover:text-gray-300 {postType === 'text' ? 'text-gray-200' : 'text-[#9A9996]'}" on:click={() => changePostType('text')}>
							  <span class="text-lg sm:text-xl">Text</span>
							</label> 
							<div class="{postType === 'text' ? 'bg-[#75D377]' : 'bg-[#09090B]'} h-1 w-[5rem]" />
					   </div>
					
  
					  <!--<svg class="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-0 sm:mr-2"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="{ postType === 'image' ? 'white' : '#A6ADBB'}" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="#E5E7EB"></path> </g></svg>-->
					  <div class="flex flex-col items-center mr-5">
						  <label class="tab font-semibold hover:text-gray-200 {postType === 'image' ? 'text-gray-200' : 'text-[#9A9996]'}" on:click={() => changePostType('image')}>
							  <span class="text-lg sm:text-xl">Image/Video</span>
						  </label> 
						  <div class="{postType === 'image' ? 'bg-[#75D377]' : 'bg-[#09090B]'} h-1 w-[8rem] sm:w-[6rem]" />
					   </div> 
					  <!--<svg class="w-5 h-5 sm:w-6 sm:h-6 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="{ postType === 'link' ? 'white' : '#A6ADBB'}"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.975 14.51a1.05 1.05 0 0 0 0-1.485 2.95 2.95 0 0 1 0-4.172l3.536-3.535a2.95 2.95 0 1 1 4.172 4.172l-1.093 1.092a1.05 1.05 0 0 0 1.485 1.485l1.093-1.092a5.05 5.05 0 0 0-7.142-7.142L9.49 7.368a5.05 5.05 0 0 0 0 7.142c.41.41 1.075.41 1.485 0zm2.05-5.02a1.05 1.05 0 0 0 0 1.485 2.95 2.95 0 0 1 0 4.172l-3.5 3.5a2.95 2.95 0 1 1-4.171-4.172l1.025-1.025a1.05 1.05 0 0 0-1.485-1.485L3.87 12.99a5.05 5.05 0 0 0 7.142 7.142l3.5-3.5a5.05 5.05 0 0 0 0-7.142 1.05 1.05 0 0 0-1.485 0z" fill="{ postType === 'link' ? 'white' : '#A6ADBB'}"></path></g></svg>-->
					  <div class="flex flex-col items-center">
						  <label class="tab font-semibold hover:text-gray-200 {postType === 'link' ? 'text-gray-200' : 'text-[#9A9996]'}" on:click={() => changePostType('link')}>
							  <span class="text-lg sm:text-xl">Link</span>
							</label> 
						  <div class="{postType === 'link' ? 'bg-[#75D377]' : 'bg-[#09090B]'} h-1 w-[2.5rem]" />
					   </div>   
					</div>
	
	
				
	
	
					<Input 
						id="title" 
						label="" 
						placeholder='Title'
						value={form?.data?.title} 
						errors={form?.errors?.title}
						disabled={loading}
						maxLength = {300}
						showCounter = {true}
					/>
	
					
					<Input 
						id="link" 
						label="" 
						placeholder='Url'
						value={form?.data?.link} 
						errors={form?.errors?.link}
						hidden={postType === 'link' ? false : true}
						disabled={loading}
						useTitle = {true}
	
					/>
					
					
					<TextArea
						id="description"
						label=""
						placeholder='Write your Post Content here (optional)'
						value={form?.data?.description}
						errors={form?.errors?.description}
						hidden={postType === 'text' ? false : true}
						disabled={loading}
					/>
		
					<Input
						id="thumbnail" 
						label="" 
						type="file" 
						errors={form?.errors?.thumbnail}
						hidden={postType === 'image' ? false : true}
						disabled={loading}
					/>
	
					<Tags
						id = "atLeastOneTag"
						errors ={form?.errors?.atLeastOneTag}
						placeholder={'Please pick at least 1 tag but no more than 3' }
					/>
	
					
					<span class="hidden sm:block text-white text-sm sm:text-[1rem] text-start w-full max-w-lg">
						Use <a href="/markdown-guide" rel="noopener noreferrer" target="_blank" class="text-blue-500 sm:hover:text-white">
							Markdown
						</a> to format posts.
					</span>
					

					<input type="hidden" name="postType" value={postType}>
		
					<div class="w-full max-w-sm sm:max-w-lg pt-5 sm:pt-3">

						{#if !loading && !isClicked}
						<button type="submit" class="btn bg-purple-600 hover:bg-purple-500 w-full max-w-lg normal-case text-lg mb-3">
							<span class="text-white">Post</span>
						</button>
						{:else}
						<label class="cursor-not-allowed btn bg-purple-600  w-full max-w-lg normal-case text-lg mb-3">
							<div class="flex flex-row m-auto">
								<span class="loading loading-infinity"></span>
								<span class="text-white ml-2">Loading</span>
							</div>
						</label>
						{/if}

						<span class="sm:hidden text-white text-sm sm:text-[1rem] text-start w-full max-w-sm sm:max-w-lg ">
							Use <a href="/markdown-guide" rel="noopener noreferrer" target="_blank" class="text-blue-500 sm:hover:text-white">
								Markdown
							</a> to format posts.
						</span>
						
					</div>
	
	
					
				</form>
	
		
	
	
			</div>
		</div>
		