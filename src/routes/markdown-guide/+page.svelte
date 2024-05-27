<script>
    import { numberOfUnreadNotification } from '$lib/store';

  </script>
  
  
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Markdown Guide · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="Markdown Guide to Post on Stocknear Community Page">
    <!-- Other meta tags -->
    <meta property="og:title" content="Markdown Guide · stocknear"/>
    <meta property="og:description" content="Markdown Guide to Post on Stocknear Community Page">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Markdown Guide · stocknear"/>
    <meta name="twitter:description" content="Markdown Guide to Post on Stocknear Community Page">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
  
  
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-10 pb-40 px-3">
    <!--  
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Markdown Guide</li>
      </ul>
    </div>
    -->

    <h1 class="text-white text-2xl sm:text-3xl font-bold mb-3">
        Markdown Guide
    </h1>
    
    <span class="text-white">
        We use <a href="https://en.wikipedia.org/wiki/Markdown" rel="noopener noreferrer" target="_blank" class="text-blue-400 sm:hover:text-white">Markdown</a> to format posts and comments on Stocknear. We support CommonMark and Github Flavored Markdown (with the exception of image tags and raw HTML).
    </span>

    <div class="w-full m-auto mt-10 bg-[#202020] rounded-lg">
    <table class="table table-sm table-compact h-full w-full text-white">
        <tbody class="">
            <tr>
                <td class="text-md sm:text-lg font-semibold">Heading</td>
                <td class="text-md sm:text-lg font-semibold"># heading</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Bold</td>
                <td class="text-md sm:text-lg font-semibold">**bold text**</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Italic</td>
                <td class="text-md sm:text-lg font-semibold">*italic text*</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">List</td>
                <td class="text-md font-semibold">- Item 1 <br>- Item 2</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Ordered list</td>
                <td class="text-md font-semibold">1. Item 1<br>2. Item 2</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Inline code</td>
                <td class="text-md sm:text-lg font-semibold">`some inline code`</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Code block</td>
                <td class="text-md sm:text-lg font-semibold">```<br>some code here<br>```</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Link</td>
                <td class="text-md sm:text-lg font-semibold">[link-text](https://en.wikipedia.org)</td>
            </tr>
            <tr>
                <td class="text-md sm:text-lg font-semibold">Blockquote</td>
                <td class="text-md sm:text-lg font-semibold">&gt; blockquote</td>
            </tr>
        </tbody>
    </table>
    </div>

    


  </section>