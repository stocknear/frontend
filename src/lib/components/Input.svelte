<script lang='ts'>
	import { onMount } from 'svelte';
	//import { linkTitle } from '$lib/store';

	export let value = '';
	export let placeholder = '';
	export let id;
	export let label;
	export let type = 'text';
	export let disabled = false;
	export let required = false;
	export let maxLength = 100;
	export let showCounter = false;
	export let hidden = false;
	export let errors;
    export let useTitle = false; // new prop

	let videoInput;
	let showVideo = false;

	onMount( () => {
		window.addEventListener('dragover', (event) => event.preventDefault());
  		window.addEventListener('drop', (event) => event.preventDefault());
	})

	const showPreview = (event) => {
		const target = event.target;
		const files = target.files;
		if (files.length > 0) {

			if (['.mp4', '.webm'].some(format => files[0]?.name?.includes(format)) )
			{
				videoInput = URL.createObjectURL(files[0]);
			}
			else {

			
				const src = URL.createObjectURL(files[0]);

				const preview = document.getElementById('image-preview');
				preview.src = src;
			}

		}
	};



	let inputValue = value;


	//$: value = useTitle === false ? $linkTitle : '';

	

	let counterColor;

	$: counter = `${inputValue.length}/${maxLength}`;

	$: {
		if (inputValue.length > maxLength) {
			counterColor = 'text-error';
		} else {
			counterColor = 'text-white';
		}
	}
  
	function handleInput(event) {
		inputValue = event.target.value;
		
		if(inputValue.includes('.mp4'))
		{
			showVideo = true;
		}
		/*
		if (useTitle) {
			// Check if the input value is a valid URL
			try {
			const urlObject = new URL(inputValue);
			const url = urlObject.href;
			getTitle(url);
			

			
			} catch (error) {
			// The URL is not valid, so don't do anything
			console.error(error);
			}
		}

		$: value = useTitle === false ? $linkTitle : '';
		*/
		
	}

	/*
	async function getTitle(url) {
		try {

		
		const response = await fetch('/api/create-post', {
			method: 'POST',
			body: JSON.stringify(url)
		});

		const output = await response.json();
		linkTitle.update( value => output);
		

		}
		catch(e)
		{
			console.log(e)
		}
	}
	*/


function handleDrop(e) {
	e.preventDefault()

	let element_id = e.detail

}



const handleCancel= () => {
	inputValue = '';
	showVideo = false;
}

let isHovering = false;


$: {
	if(inputValue)
	{
		errors = null;
	}
}


</script>


<div class="form-control w-full max-w-lg mb-2 {hidden ? 'hidden' : ''}">
	<label for={id} class="label font-medium pb-1">
		<span class="text-white label-text">{label}</span>
	</label>
	<div class="relative">
		{#if type === 'file'}
			<label for={id} class="flex flex-col items-center bg-[#313131] rounded-md cursor-pointer {inputValue.length === 0 ? 'p-10' : ''} {isHovering ? 'ring-2' : ''}"
			on:dragenter={() => isHovering = true}
			on:dragleave={() => isHovering = false}
			on:drop={handleDrop}
			>

			

			{#if inputValue.length !== 0}
			<label on:click={handleCancel} class="btn btn-sm btn-circle bg-red-600 absolute right-0 -top-3 z-20">✕</label>
			
			<div class="absolute inset-0 bg-cover object-fill bg-center bg-[#000]"></div>
			<img class="w-auto max-h-[400px] object-fill bg-center bg-contain z-10 {showVideo ? 'hidden' : ''} "
				alt="Image preview"
				id="image-preview"
				loading="lazy" />
			{:else}
			{#if !isHovering}
				<svg class="w-10 h-10"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M22.0206 16.8198L18.8906 9.49978C18.3206 8.15978 17.4706 7.39978 16.5006 7.34978C15.5406 7.29978 14.6106 7.96978 13.9006 9.24978L12.0006 12.6598C11.6006 13.3798 11.0306 13.8098 10.4106 13.8598C9.78063 13.9198 9.15063 13.5898 8.64063 12.9398L8.42063 12.6598C7.71063 11.7698 6.83063 11.3398 5.93063 11.4298C5.03063 11.5198 4.26063 12.1398 3.75063 13.1498L2.02063 16.5998C1.40063 17.8498 1.46063 19.2998 2.19063 20.4798C2.92063 21.6598 4.19063 22.3698 5.58063 22.3698H18.3406C19.6806 22.3698 20.9306 21.6998 21.6706 20.5798C22.4306 19.4598 22.5506 18.0498 22.0206 16.8198Z" fill="white" ></path> <path d="M6.96984 8.38012C8.83657 8.38012 10.3498 6.86684 10.3498 5.00012C10.3498 3.13339 8.83657 1.62012 6.96984 1.62012C5.10312 1.62012 3.58984 3.13339 3.58984 5.00012C3.58984 6.86684 5.10312 8.38012 6.96984 8.38012Z" fill="white"></path> </g></svg>
				<span class="mt-2 mb-4 text-gray-200">Choose a file to upload</span>
			{:else}
				<svg class="w-10 h-10"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#9D64D9" d="M6 20q-.825 0-1.413-.588T4 18v-3h2v3h12v-3h2v3q0 .825-.588 1.413T18 20H6Zm5-4V7.85l-2.6 2.6L7 9l5-5l5 5l-1.4 1.45l-2.6-2.6V16h-2Z"/></svg>
				<span class="mt-2 mb-4 text-gray-200">Drop here to upload</span>
			{/if}
			<span class="text-xs sm:text-sm text-gray-400 m-auto mb-5 ">
				We support jpg/jpeg, png, webp and mp4.
			</span>
			<span class="text-xs sm:text-sm text-gray-400 m-auto mb-5 ">
				File must be smaller than 5MB.
			</span>
			<label for={id} class="cursor-pointer rounded-full bg-purple-600 text-sm text-white font-bold w-auto p-3">
				Choose File
			</label>
	
			{/if}
			<input class="hidden rounded text-gray-300"
					{type}
					{placeholder}
					{required}
					{disabled}
					{id}
					name={id}
					value={inputValue}
					accept="image"
					on:change={showPreview}
					on:input={handleInput}
					autocomplete="off"
					
			/>

			{#if showVideo}
			<div class="absolute inset-0 bg-cover object-fill bg-center bg-[#000]"></div>
			<video controls
			class="w-auto max-h-[500px] z-10"
			src={videoInput}
			>
			</video>
			{/if}


		</label>
		{:else}
			<input
				class="input input-bordered w-full max-w-lg bg-[#313131] placeholder-gray-300 text-white whitespace-normal ring-2"
				{type}
				{placeholder}
				{required}
				{disabled}
				{id}
				name={id}
				value={inputValue}
				on:input={handleInput}
				autocomplete="off"
			/>
		{/if}
		{#if showCounter}
			<div class="flex justify-end mt-1 -mb-1">
				<span class={`label-text text-xs ${counterColor}`}>{counter}</span>
			</div>
		{/if}
	</div>
	{#if errors}
		<label for={id} class="label py-0 pt-1">
			<span class="label-text-alt text-error">
				{errors}
			</span>
		</label>
	{/if}
</div>