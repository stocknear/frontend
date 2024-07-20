<script>
import { numberOfUnreadNotification } from '$lib/store';
import ParticleEffect from '$lib/components/ParticleEffect.svelte';

export let data;
</script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Changelog · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <!-- Other meta tags -->
  <meta property="og:title" content="Changelog · stocknear"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Changelog · stocknear"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
	    



<section class="w-full max-w-5xl overflow-hidden m-auto min-h-screen  pb-40">
    

    <body class="font-inter antialiased text-slate-100 tracking-tight">

        <!-- Page wrapper -->
        <div class="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
    
       
    
            <!-- Page content -->
            <main class="grow">
    
                <!-- Content -->
                <section class="relative">
    
                    <!-- Radial gradient -->
                    <div class="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none w-[500px] aspect-square" aria-hidden="true">
                        <div class="absolute inset-0 translate-z-0 bg-gradient-to-r from-[#E8BB28] to-purple-600 rounded-full blur-[120px] opacity-20"></div>
                        <div class="absolute w-32 h-32 translate-z-0 bg-gradient-to-r from-[#E8BB28] to-purple-700 rounded-full blur-[80px] opacity-40"></div>
                    </div>
    
                    <!-- Particles animation -->
                    <div class="absolute inset-0 h-96 z-10" aria-hidden="true">
                        <ParticleEffect quantity={50} staticity={40} ease={60} />
                    </div>
     
                    <div class="max-w-6xl mx-auto px-4 sm:px-6">
                        <div class="pt-32 pb-12 md:pt-40 md:pb-20">
    
                            <!-- Page header -->
                            <div class="text-center pb-12 md:pb-20">
                                <h1 class="text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E8BB28] to-purple-500 via-slate-200 to-slate-200/60 pb-4">
                                    What's New
                                </h1>
                                <div class="max-w-3xl m-auto flex justify-center items-center">
                                    <p class="w-5/6 text-center text-xl sm:text-2xl text-white">New updates and improvements to Stocknear.</p>
                                </div>
                            </div>
    
                            <!-- Content -->
                            <div class="max-w-3xl mx-auto">
                                <div class="relative">
                                    <div class="absolute h-full top-4 left-[2px] w-0.5 bg-slate-800 [mask-image:_linear-gradient(0deg,transparent,theme(colors.white)_150px,theme(colors.white))] -z-10 overflow-hidden after:absolute after:h-4 after:top-0 after:-translate-y-full after:left-0 after:w-0.5 after:bg-[linear-gradient(180deg,_transparent,_theme(colors.purple.500/.65)_25%,_theme(colors.purple.200)_50%,_theme(colors.purple.500/.65)_75%,_transparent)] after:animate-shine" aria-hidden="true"></div>
                                    <!-- Post -->

                                    <article class="pt-12 first-of-type:pt-0 group">
                                        <div class="md:flex">
                                            <div class="w-48 shrink-0">
                                                <time class="text-sm inline-flex items-center text-white md:leading-8 before:w-1.5 before:h-1.5 before:rounded-full before:bg-purple-500 before:ring-4 before:ring-purple-500/30 mb-3">
                                                    <span class="ml-[1.625rem] md:ml-5">July 15-19, 2024</span>
                                                </time>
                                            </div>
                                            <div class="grow ml-8 md:ml-0 pb-12 group-last-of-type:pb-0 border-b [border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1] group-last-of-type:border-none">
                                                <header>
                                                    <h2 class="text-xl sm:text-2xl font-semibold text-white leading-8 pb-3">
                                                        Weekly Update
                                                    </h2>
                                                </header>
                                                    <ol class="text-white list-disc ml-5 sm:ml-3">
                                                        <li class="p-1">
                                                            Sidebar Improved.
                                                        </li>
                                                        <li class="p-1">
                                                            New Feature: Adding Dashboard for logged in Users.
                                                        </li>
                                                        <li class="p-1">
                                                            Adding Implied Volatility for ETFs.
                                                        </li>
                                                        <li class="p-1">
                                                            Enhancing UI/UX of Options 0DTE Flow for easier navigation.
                                                        </li>
                                                    </ol>
                                            </div>
                                        </div>
                                    </article>

                                    <article class="pt-12 first-of-type:pt-0 group">
                                        <div class="md:flex">
                                            <div class="w-48 shrink-0">
                                                <time class="text-sm inline-flex items-center text-white md:leading-8 before:w-1.5 before:h-1.5 before:rounded-full before:bg-purple-500 before:ring-4 before:ring-purple-500/30 mb-3">
                                                    <span class="ml-[1.625rem] md:ml-5">July 8-12, 2024</span>
                                                </time>
                                            </div>
                                            <div class="grow ml-8 md:ml-0 pb-12 group-last-of-type:pb-0 border-b [border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1] group-last-of-type:border-none">
                                                <header>
                                                    <h2 class="text-xl sm:text-2xl font-semibold text-white leading-8 pb-3">
                                                        Weekly Update
                                                    </h2>
                                                </header>
                                                    <ol class="text-white list-disc ml-5 sm:ml-3">
                                                        <li class="p-1">
                                                            New Feature: Adding Realtime Darkpool Trades of Hedge Funds & Major Institutional Traders
                                                        </li>
                                                        <li class="p-1">
                                                            New Feature: Adding AI Analyst Insight
                                                        </li>
                                                        <li class="p-1">
                                                            Improving frontend and backend code for faster loading times.
                                                        </li>
                                                        <li class="p-1">
                                                            Enhancing UI/UX for easier navigation.
                                                        </li>
                                                    </ol>
                                            </div>
                                        </div>
                                    </article>

                                    <article class="pt-12 first-of-type:pt-0 group">
                                        <div class="md:flex">
                                            <div class="w-48 shrink-0">
                                                <time class="text-sm inline-flex items-center text-white md:leading-8 before:w-1.5 before:h-1.5 before:rounded-full before:bg-purple-500 before:ring-4 before:ring-purple-500/30 mb-3">
                                                    <span class="ml-[1.625rem] md:ml-5">July 1-5, 2024</span>
                                                </time>
                                            </div>
                                            <div class="grow ml-8 md:ml-0 pb-12 group-last-of-type:pb-0 border-b [border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1] group-last-of-type:border-none">
                                                <header>
                                                    <h2 class="text-xl sm:text-2xl font-semibold text-white leading-8 pb-3">
                                                        Weekly Update
                                                    </h2>
                                                </header>
                                                    <ol class="text-white list-disc ml-5 sm:ml-3">
                                                        <li class="p-1">
                                                            New Feature: Adding Implied Volatility
                                                        </li>
                                                        <li class="p-1">
                                                            New Feature: Adding Options Net Flow
                                                        </li>
                                                    </ol>
                                            </div>
                                        </div>
                                    </article>

                                    <article class="pt-12 first-of-type:pt-0 group">
                                        <div class="md:flex">
                                            <div class="w-48 shrink-0">
                                                <time class="text-sm inline-flex items-center text-white md:leading-8 before:w-1.5 before:h-1.5 before:rounded-full before:bg-purple-500 before:ring-4 before:ring-purple-500/30 mb-3">
                                                    <span class="ml-[1.625rem] md:ml-5">June 28, 2024</span>
                                                </time>
                                            </div>
                                            <div class="grow ml-8 md:ml-0 pb-12 group-last-of-type:pb-0 border-b [border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1] group-last-of-type:border-none">
                                                <header>
                                                    <h2 class="text-xl sm:text-2xl font-semibold text-white leading-8 pb-3">
                                                        Announcement 🎉
                                                    </h2>
                                                </header>
                                                    <span class="text-white">
                                                        Starting today, I'll keep you updated on the changes from the past week: new features, improvements, bug fixes, and more.
                                                    </span>
                                            </div>
                                        </div>
                                    </article>

                                </div>
                            </div>
    
                            <!-- Pagination -->
                             <!--
                            <div class="max-w-3xl mx-auto">
                                <ul class="flex items-center justify-between mt-12 pl-8 md:pl-48">
                                    <li>
                                        <span class="btn-sm text-slate-700 transition duration-150 ease-in-out group [background:linear-gradient(theme(colors.slate.900),_theme(colors.slate.900))_padding-box,_conic-gradient(theme(colors.slate.400),_theme(colors.slate.700)_25%,_theme(colors.slate.700)_75%,_theme(colors.slate.400)_100%)_border-box] relative before:absolute before:inset-0 before:bg-slate-800/30 before:rounded-full before:pointer-events-none cursor-not-allowed">
                                            <span class="relative inline-flex items-center">
                                                <span class="tracking-normal text-slate-700 mr-1">&lt;-</span> Previous Page
                                            </span>
                                        </span>
                                    </li>
                                    <li>
                                        <a class="btn-sm text-slate-300 hover:text-white transition duration-150 ease-in-out group [background:linear-gradient(theme(colors.slate.900),_theme(colors.slate.900))_padding-box,_conic-gradient(theme(colors.slate.400),_theme(colors.slate.700)_25%,_theme(colors.slate.700)_75%,_theme(colors.slate.400)_100%)_border-box] relative before:absolute before:inset-0 before:bg-slate-800/30 before:rounded-full before:pointer-events-none" href="#0">
                                            <span class="relative inline-flex items-center">
                                                Next Page <span class="tracking-normal text-purple-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">-&gt;</span>
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            -->
    
                        </div>
                    </div>
    
                </section>
    
                <!-- CTA -->
                {#if !data?.user}
                <section class="mt-10">
                    <div class="max-w-6xl mx-auto px-4 sm:px-6">
                        <div class="relative px-8 py-12 md:py-20 rounded-[3rem] overflow-hidden">
                            <!-- Radial gradient -->
                            <div class="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/3 aspect-square" aria-hidden="true">
                                <div class="absolute inset-0 translate-z-0 bg-purple-500 rounded-full blur-[120px] opacity-70"></div>
                                <div class="absolute w-1/4 h-1/4 translate-z-0 bg-purple-400 rounded-full blur-[40px]"></div>
                            </div>
                            <!-- Blurred shape -->
                            <div class="absolute bottom-0 translate-y-1/2 left-0 blur-2xl opacity-50 pointer-events-none -z-10" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
                                    <defs>
                                        <linearGradient id="bs5-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                                            <stop offset="0%" stop-color="#A855F7" />
                                            <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path fill="url(#bs5-a)" fill-rule="evenodd" d="m0 0 461 369-284 58z" transform="matrix(1 0 0 -1 0 427)" />
                                </svg>
                            </div>
                            <!-- Content -->
                            <div class="max-w-3xl mx-auto text-center">
                                <div>
                                    <div class="text-2xl sm:text-4xl font-bold inline-flex pb-3">
                                        Start your free trial today
                                    </div>
                                </div>
                                <h2 class="text-center m-auto text-[1rem] sm:text-lg text-white font-medium pb-4">
                                    Try Stocknear Platform for 7 days. No credit card required.
                                </h2>
                                    <a href='/register'
                                    class="animate-shine mt-5 w-56 sm:w-80 m-auto group relative grid overflow-hidden rounded-xl px-6 py-3 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors"
                                >
                                    <span>
                                    <span
                                        class="spark mask-gradient animate-flip before:animate-kitrotate absolute inset-0 h-[100%] w-[100%] overflow-hidden rounded-xl [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]"
                                    />
                                    </span>
                                    <span
                                    class="backdrop absolute inset-px rounded-[11px] bg-[#FBCE3C] transition-colors duration-200 group-hover:bg-[#be9204"
                                    />
                                    <span class="z-10 text-black text-[1rem] sm:text-lg font-semibold">
                                    <slot>Free trial for 7 days</slot>
                                    </span>
                                    
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                {/if}
    
            </main>
    
    
        </div>

    
    </body>
    
</section>