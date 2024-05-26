<script>
	
	import { enhance } from '$app/forms';
	import Input from '$lib/components/Input.svelte';
	
	import toast from 'svelte-french-toast';
	import logo from '$lib/images/login_v2_logo.png';

	export let form;
	
		let loading = false;
		const submitRegistration= () => {
			loading = true;
			return async ({ result, update}) => {

				switch (result.type) {
					case 'redirect':
						toast.success('Registration successfully!', {
						 style: 'border-radius: 200px; background: #333; color: #fff;'});
						await update();
						break;
					case 'failure':
						toast.error('Invalid credentials', {
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
	
	  let password = '';
	  let hasLetter = false;
	  let hasNumber = false;
	  let isLengthValid = false;
	  let hasSpecialChar = false;
	
	
	
	
	function checkPassword() {
		hasLetter = /[a-zA-Z]/.test(password);
		hasNumber = /\d/.test(password);
		isLengthValid = password.length >= 8;
		hasSpecialChar = /[!@#$%^&*()]/.test(password);
	  }
	
	
	  let isHoveredGoogle = false;
		let isHoveredDiscord = false;
	
	
	  function handleHoverGoogle() {
		isHoveredGoogle = !isHoveredGoogle;
	  }
	
	  function handleHoverDiscord() {
		isHoveredDiscord = !isHoveredDiscord;
	  }
	
	</script>
	
	<!-- HEADER FOR BETTER SEO -->
	<svelte:head>
		<meta charset="utf-8">
		<title> Sign Up · stocknear</title>
		<meta name="viewport" content="width=device-width,initial-scale=1">
		<meta name="description" content="Sign Up to stocknear to become part of the largest trading community in the world.">
	</svelte:head>
	
		
			<!--
	<label class="w-full max-w-lg">
		<input
		  class="input input-bordered w-full max-w-lg bg-[#2A303C] whitespace-normal ring-2"
		  type="password"
		  bind:value={password}
		  on:input={checkPassword}
		/>
		
	
	  </label>
	
	
	  <div class="flex flex-row w-full max-w-lg">
		<svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSBlockSix0"><path fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M18 18h12v12H18V18ZM6 18h12v12H6V18Zm24 0h12v12H30V18Z"/></mask><path fill={hasLetter ? 'green' : 'red'} d="M0 0h48v48H0z" mask="url(#ipSBlockSix0)"/></svg>
		<svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSBlockSix0"><path fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M18 18h12v12H18V18ZM6 18h12v12H6V18Zm24 0h12v12H30V18Z"/></mask><path fill={hasNumber ? 'green' : 'red'} d="M0 0h48v48H0z" mask="url(#ipSBlockSix0)"/></svg>
		<svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSBlockSix0"><path fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M18 18h12v12H18V18ZM6 18h12v12H6V18Zm24 0h12v12H30V18Z"/></mask><path fill={isLengthValid ? 'green' : 'red'} d="M0 0h48v48H0z" mask="url(#ipSBlockSix0)"/></svg>
		<svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSBlockSix0"><path fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M18 18h12v12H18V18ZM6 18h12v12H6V18Zm24 0h12v12H30V18Z"/></mask><path fill={hasSpecialChar ? 'green' : 'red'} d="M0 0h48v48H0z" mask="url(#ipSBlockSix0)"/></svg>
	</div>
	
	-->
	
	
	
	
	<div class="w-full max-w-3xl min-h-screen m-auto pb-40 sm:mt-10">
	
		<div class="grid grid-cols-1 gap-4text-white">
		  
			<div class="relative">
				<h2 class="text-center text-white text-2xl sm:text-3xl pt-10 sm:pt-0 font-bold">
					Sign up to
					<span class="self-center text-white font-bold whitespace-nowrap">stocknear</span>
				</h2>
				<img src={logo} class="w-28 mt-4 sm:w-36 m-auto" loading="lazy"/>
			</div>
		
			<form method="post" action="?/oauth2" class="flex flex-col items-center w-5/6 pt-4 ml-auto mr-auto">
				<div class="w-3/4 sm:w-1/2 max-w-lg  m-auto ">
					<input class="hidden" name='provider' value='google'/>
					<button 
						on:mouseenter={handleHoverGoogle}
						on:mouseleave={handleHoverGoogle}	
						class="py-3 flex flex-row items-center justify-center bg-blue-700 text-white hover:bg-blue-600 w-full rounded-full" type="submit">
						<svg class="{isHoveredGoogle ? 'shake-logo' : ''} w-5 h-5 sm:w-5 sm:h-5 inline-block" viewBox="-3 0 262 262" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M255.878,133.451 C255.878,122.717 255.007,114.884 253.122,106.761 L130.55,106.761 L130.55,155.209 L202.497,155.209 C201.047,167.249 193.214,185.381 175.807,197.565 L175.563,199.187 L214.318,229.21 L217.003,229.478 C241.662,206.704 255.878,173.196 255.878,133.451" fill="#4285F4"> </path> <path d="M130.55,261.1 C165.798,261.1 195.389,249.495 217.003,229.478 L175.807,197.565 C164.783,205.253 149.987,210.62 130.55,210.62 C96.027,210.62 66.726,187.847 56.281,156.37 L54.75,156.5 L14.452,187.687 L13.925,189.152 C35.393,231.798 79.49,261.1 130.55,261.1" fill="#34A853"> </path> <path d="M56.281,156.37 C53.525,148.247 51.93,139.543 51.93,130.55 C51.93,121.556 53.525,112.853 56.136,104.73 L56.063,103 L15.26,71.312 L13.925,71.947 C5.077,89.644 0,109.517 0,130.55 C0,151.583 5.077,171.455 13.925,189.152 L56.281,156.37" fill="#FBBC05"> </path> <path d="M130.55,50.479 C155.064,50.479 171.6,61.068 181.029,69.917 L217.873,33.943 C195.245,12.91 165.798,0 130.55,0 C79.49,0 35.393,29.301 13.925,71.947 L56.136,104.73 C66.726,73.253 96.027,50.479 130.55,50.479" fill="#EB4335"> </path> </g> </g></svg>
						<span class="ml-2 text-white font-medium">
							Sign in with Google
						</span>
					</button>
				</div>
			</form>
			
			<form method="post" action="?/oauth2" class="flex flex-col items-center mb-5 w-5/6 ml-auto mr-auto">
				<div class="w-3/4 sm:w-1/2 max-w-lg m-auto">
					<input class="hidden" name='provider' value='discord'/>
					<button 
						on:mouseenter={handleHoverDiscord}
						on:mouseleave={handleHoverDiscord}
						class="py-3 flex flex-row items-center justify-center bg-[#A24D51] hover:bg-[#B46266] text-white w-full rounded-full mt-5" type="submit">
						<svg class="{isHoveredDiscord ? 'shake-logo' : ''}  w-6 h-6 sm:w-7 sm:h-7 inline-block" viewBox="0 0 100 100" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#FFFFFF;} .st1{fill:#F5BB41;} .st2{fill:#2167D1;} .st3{fill:#3D84F3;} .st4{fill:#4CA853;} .st5{fill:#398039;} .st6{fill:#D74F3F;} .st7{fill:#D43C89;} .st8{fill:#B2005F;} .st9{fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} .st10{fill-rule:evenodd;clip-rule:evenodd;fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} .st11{fill-rule:evenodd;clip-rule:evenodd;fill:none;stroke:#040404;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} .st12{fill-rule:evenodd;clip-rule:evenodd;} .st13{fill-rule:evenodd;clip-rule:evenodd;fill:#040404;} .st14{fill:url(#SVGID_1_);} .st15{fill:url(#SVGID_2_);} .st16{fill:url(#SVGID_3_);} .st17{fill:url(#SVGID_4_);} .st18{fill:url(#SVGID_5_);} .st19{fill:url(#SVGID_6_);} .st20{fill:url(#SVGID_7_);} .st21{fill:url(#SVGID_8_);} .st22{fill:url(#SVGID_9_);} .st23{fill:url(#SVGID_10_);} .st24{fill:url(#SVGID_11_);} .st25{fill:url(#SVGID_12_);} .st26{fill:url(#SVGID_13_);} .st27{fill:url(#SVGID_14_);} .st28{fill:url(#SVGID_15_);} .st29{fill:url(#SVGID_16_);} .st30{fill:url(#SVGID_17_);} .st31{fill:url(#SVGID_18_);} .st32{fill:url(#SVGID_19_);} .st33{fill:url(#SVGID_20_);} .st34{fill:url(#SVGID_21_);} .st35{fill:url(#SVGID_22_);} .st36{fill:url(#SVGID_23_);} .st37{fill:url(#SVGID_24_);} .st38{fill:url(#SVGID_25_);} .st39{fill:url(#SVGID_26_);} .st40{fill:url(#SVGID_27_);} .st41{fill:url(#SVGID_28_);} .st42{fill:url(#SVGID_29_);} .st43{fill:url(#SVGID_30_);} .st44{fill:url(#SVGID_31_);} .st45{fill:url(#SVGID_32_);} .st46{fill:url(#SVGID_33_);} .st47{fill:url(#SVGID_34_);} .st48{fill:url(#SVGID_35_);} .st49{fill:url(#SVGID_36_);} .st50{fill:url(#SVGID_37_);} .st51{fill:url(#SVGID_38_);} .st52{fill:url(#SVGID_39_);} .st53{fill:url(#SVGID_40_);} .st54{fill:url(#SVGID_41_);} .st55{fill:url(#SVGID_42_);} .st56{fill:url(#SVGID_43_);} .st57{fill:url(#SVGID_44_);} .st58{fill:url(#SVGID_45_);} .st59{fill:#040404;} .st60{fill:url(#SVGID_46_);} .st61{fill:url(#SVGID_47_);} .st62{fill:url(#SVGID_48_);} .st63{fill:url(#SVGID_49_);} .st64{fill:url(#SVGID_50_);} .st65{fill:url(#SVGID_51_);} .st66{fill:url(#SVGID_52_);} .st67{fill:url(#SVGID_53_);} .st68{fill:url(#SVGID_54_);} .st69{fill:url(#SVGID_55_);} .st70{fill:url(#SVGID_56_);} .st71{fill:url(#SVGID_57_);} .st72{fill:url(#SVGID_58_);} .st73{fill:url(#SVGID_59_);} .st74{fill:url(#SVGID_60_);} .st75{fill:url(#SVGID_61_);} .st76{fill:url(#SVGID_62_);} .st77{fill:none;stroke:#000000;stroke-width:3;stroke-miterlimit:10;} .st78{fill:none;stroke:#FFFFFF;stroke-miterlimit:10;} .st79{fill:#4BC9FF;} .st80{fill:#5500DD;} .st81{fill:#FF3A00;} .st82{fill:#E6162D;} .st83{fill:#F1F1F1;} .st84{fill:#FF9933;} .st85{fill:#B92B27;} .st86{fill:#00ACED;} .st87{fill:#BD2125;} .st88{fill:#1877F2;} .st89{fill:#fff;} .st90{fill:#CE3056;} .st91{fill:#5BB381;} .st92{fill:#61C3EC;} .st93{fill:#E4B34B;} .st94{fill:#181EF2;} .st95{fill:#FF0000;} .st96{fill:#FE466C;} .st97{fill:#FA4778;} .st98{fill:#FF7700;} .st99{fill-rule:evenodd;clip-rule:evenodd;fill:#1F6BF6;} .st100{fill:#520094;} .st101{fill:#4477E8;} .st102{fill:#3D1D1C;} .st103{fill:#FFE812;} .st104{fill:#344356;} .st105{fill:#00CC76;} .st106{fill-rule:evenodd;clip-rule:evenodd;fill:#345E90;} .st107{fill:#1F65D8;} .st108{fill:#EB3587;} .st109{fill-rule:evenodd;clip-rule:evenodd;fill:#603A88;} .st110{fill:#E3CE99;} .st111{fill:#783AF9;} .st112{fill:#FF515E;} .st113{fill:#FF4906;} .st114{fill:#503227;} .st115{fill:#4C7BD9;} .st116{fill:#69C9D0;} .st117{fill:#1B92D1;} .st118{fill:#EB4F4A;} .st119{fill:#513728;} .st120{fill:#FF6600;} .st121{fill-rule:evenodd;clip-rule:evenodd;fill:#B61438;} .st122{fill:#FFFC00;} .st123{fill:#141414;} .st124{fill:#94D137;} .st125{fill-rule:evenodd;clip-rule:evenodd;fill:#F1F1F1;} .st126{fill-rule:evenodd;clip-rule:evenodd;fill:#66E066;} .st127{fill:#2D8CFF;} .st128{fill:#F1A300;} .st129{fill:#4BA2F2;} .st130{fill:#1A5099;} .st131{fill:#EE6060;} .st132{fill-rule:evenodd;clip-rule:evenodd;fill:#F48120;} .st133{fill:#222222;} .st134{fill:url(#SVGID_63_);} .st135{fill:#0077B5;} .st136{fill:#FFCC00;} .st137{fill:#EB3352;} .st138{fill:#F9D265;} .st139{fill:#F5B955;} .st140{fill:#DD2A7B;} .st141{fill:#66E066;} .st142{fill:#EB4E00;} .st143{fill:#FFC794;} .st144{fill:#B5332A;} .st145{fill:#4E85EB;} .st146{fill:#58A45C;} .st147{fill:#F2BC42;} .st148{fill:#D85040;} .st149{fill:#464EB8;} .st150{fill:#7B83EB;} </style> <g id="Layer_1"></g> <g id="Layer_2"> <g> <g> <path class="st89" d="M85.22,24.958c-11.459-8.575-22.438-8.334-22.438-8.334l-1.122,1.282 c13.623,4.087,19.954,10.097,19.954,10.097c-19.491-10.731-44.317-10.654-64.59,0c0,0,6.571-6.331,20.996-10.418l-0.801-0.962 c0,0-10.899-0.24-22.438,8.334c0,0-11.54,20.755-11.54,46.319c0,0,6.732,11.54,24.442,12.101c0,0,2.965-3.526,5.369-6.571 c-10.177-3.045-14.024-9.376-14.024-9.376c6.394,4.001,12.859,6.505,20.916,8.094c13.108,2.698,29.413-0.076,41.591-8.094 c0,0-4.007,6.491-14.505,9.456c2.404,2.965,5.289,6.411,5.289,6.411c17.71-0.561,24.441-12.101,24.441-12.02 C96.759,45.713,85.22,24.958,85.22,24.958z M35.055,63.824c-4.488,0-8.174-3.927-8.174-8.815 c0.328-11.707,16.102-11.671,16.348,0C43.229,59.897,39.622,63.824,35.055,63.824z M64.304,63.824 c-4.488,0-8.174-3.927-8.174-8.815c0.36-11.684,15.937-11.689,16.348,0C72.478,59.897,68.872,63.824,64.304,63.824z"></path> </g> </g> </g> </g></svg>
						<span class="ml-2 text-white font-medium">
							Sign up with Discord
						</span>
					</button>
				</div>
			</form>
				
	
				<div class="divider divider-[#fff]">
					<span class="text-white text-lg font-bold z-10">or</span>
				</div>
				<!--
				<h2 class="mt-5 text-center text-3xl font-bold text-white">
					Create your account
				</h2>
				-->
	
	
				<form action="?/register" method="POST" use:enhance={submitRegistration} class="flex flex-col items-center space-y-2 w-full max-w-lg pt-4 pl-3 pr-3 sm:pl-0 sm:pr-0 ml-auto mr-auto">
					<!--<Input id="name" label="Your first and last name" value={form?.data?.name} errors={form?.errors?.name} />-->
					<Input
						id="username"
						label="Username"
						value={form?.data?.username}
						errors={form?.errors?.username}
						disabled={loading} 
					/>
					<Input
						type="email"
						id="email"
						label="Email"
						value={form?.data?.email}
						errors={form?.errors?.email}
						disabled={loading} 
					/>
					
					<Input 
						type="password" 
						id="password" 
						label="Password" 
						errors={form?.errors?.password} 
						disabled={loading} 
					/>
					
				

					<Input
						type="password"
						id="passwordConfirm"
						label="Confirm Password"
						errors={form?.errors?.passwordConfirm}
						disabled={loading} 
					/>
	
					<div class="w-3/4 sm:w-1/2 max-w-lg pt-5 m-auto pb-3">
						<button type="submit" class="py-3 bg-blue-700 text-white hover:bg-blue-600 w-full rounded-full m-auto font-bold text-md">
							Register
						</button>
					</div>
					<p class="pb-1 text-sm w-full max-w-lg text-white">By registering you agree to stocknear's
						<a href="/terms-of-use" class="text-blue-400 hover:underline">Terms of Use</a>
						and acknowledge that you've read our <a href="/privacy-policy" class="text-blue-400 hover:underline">Privacy Policy</a>.
					</p>
	
					<p class="pt-2 pb-1 text-sm w-full max-w-lg text-white flex justify-center items-center">You already have an account?
						<a href="/login" class="text-blue-400 hover:underline ml-1">Sign in</a>
					</p>
	
					
				</form>
	
				
	
	
			</div>		  
	</div>
	
	
	
	
	<style>
		.shake-logo{
	animation-name: shake;
	animation-duration: 0.5s;
	animation-iteration-count: infinite;
	animation-timing-function: ease-in-out;
	}
	
	
	@keyframes shake {
	0% { transform: rotate(0deg); }
	25% { transform: rotate(10deg); }
	50% { transform: rotate(0deg); }
	75% { transform: rotate(-10deg); }
	100% { transform: rotate(0deg); }
	}
	
	</style>