<script lang='ts'>

import toast from 'svelte-french-toast';
import Input from '$lib/components/Input.svelte';
import { pb } from '$lib/pocketbase';
import { goto } from '$app/navigation';


let loading = false;
let email:String;

async function resetPassword(event) {
    event.preventDefault();
	try {
		await pb.collection('users').requestPasswordReset(email);
		toast.success('Password resetted. Check your emails!', {
			style: 'border-radius: 200px; background: #333; color: #fff;',
		});
		goto('/login')
	} catch (err) {
		toast.error({err}, {
          style: 'border-radius: 200px; background: #333; color: #fff;',
        });
	};
  }
	
</script>

<!-- HEADER FOR BETTER SEO -->
<svelte:head>
    <meta charset="utf-8">
    <title> Reset Password · stocknear</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Reset your password to sign in to your stocknear account.">
</svelte:head>

<div class="flex flex-col items-center min-h-screen w-full max-w-3xl m-auto mt-40">
	<h2 class="text-center text-3xl font-bold tracking-tight text-white">
		Reset Your Password
	</h2>
	<p class="text-center mt-1 text-white">We'll send you an email with a link to reset your password.</p>
	<form on:submit={resetPassword} class="flex flex-col items-center space-y-2 w-5/6 sm:w-full pt-4" >
		<input
			class="input input-bordered w-full max-w-lg bg-[#242527] placeholder-gray-400 text-white whitespace-normal ring-2"
			type="email"
			required={true}
			bind:value={email}
			autocomplete="off"
		/>
		<div class="w-full max-w-lg pt-2">
			<button type="submit" class="btn bg-blue-600 hover:bg-blue-500 text-white w-full">
				Request Password Reset
			</button>
		</div>
	</form>
</div>


  