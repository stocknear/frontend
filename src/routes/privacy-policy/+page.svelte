<script>
    import logo from '$lib/images/privacy_policy_logo_v2.png';
    import { numberOfUnreadNotification } from '$lib/store';
    const emailAddress = 'support@stocknear.com';

</script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Privacy Policy · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <!-- Other meta tags -->
  <meta property="og:title" content="Privacy Policy · stocknear"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Privacy Policy · stocknear"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
	    


<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">
  
    <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Privacy Policy</li>
      </ul>
    </div>
    
  
    <div  class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Privacy Policy
            </h1>
          </div>
  
          <span class="text-white text-md font-medium text-center flex justify-center  items-center ">
            We don't sell data; we're not a garage sale like Facebook!
          </span>
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="relative m-auto">
          <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
          </svg>
          
          
          <div class="z-1 absolute top-5">
            <img class="w-24 ml-7" src={logo} alt="logo">
          </div>
        </div>
        <!-- End Column -->
    
      </div>
      
    </div>

    



      <div class="card w-full bg-[#09090B] border-t sm:border rounded-none sm:rounded-xl border-slate-700 m-auto ">
        <div class="card-body">

            <p class="text-gray-400 italic mb-2 text-sm">Last updated: 22.06.2023</p>

            <p class="text-gray-300 mb-5">
                Stocknear (the "website" or "site") respects your privacy.
                This privacy statement describes what information and data we collect from you and how we use it.
                Please read the whole privacy policy as well as our
                <a href="/terms-of-use" class="text-blue-400 hover:underline hover:text-white">Terms of use</a>
                The use of our website is generally possible without providing personal data. Insofar as personal data (for example name, address or e-mail addresses) is collected on our pages, this is always done, as far as possible, on a voluntary basis. This data will not be passed on to third parties without your express consent.
                We point out that data transmission over the Internet (e.g. communication by e-mail) security gaps. A complete protection of data against access by third parties is not possible.
                The use of contact data published within the framework of the imprint obligation by third parties for the purpose of sending unsolicited advertising and information material is hereby expressly prohibited. The operators of the pages expressly reserve the right to take legal action in the event of the unsolicited sending of advertising information, such as spam e-mails.
            </p>

           
            <h1 class="text-white text-2xl font-medium text-start underline">
                Cookies      
            </h1> 
            <p class="text-gray-300">
                Cookies are used by us. 
                By visiting stocknear.com, you accepted to use cookies in accordance with the stocknear Privacy Policy.
                Most interactive websites employ cookies to allow us to retrieve the user's information for each visit.
                Cookies are used by our website to facilitate the functionality of specific areas, making it easier for visitors.
            </p>

            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Links to other Sites
            </h1>

            <div class="text-gray-300">
                Our Service may contain connections to websites that we do not control. When you click on a third-party link, you will be sent to that third-party's website. We strongly recommend that you read the Privacy Policies of any website you visit.
                <br>
                <br>
                We have no control over, and accept no responsibility for, any third-party website or services' content, privacy policies, or practices. 
            </div>

            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Security of Data
            </h1>

            <div class="text-gray-300">
                We care about the security of your data, but keep in mind that no form of Internet transmission or electronic storage is completely safe. While we endeavor to protect your Personal Data using commercially acceptable techniques, we cannot guarantee its ultimate security. 
            </div>

            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Your Data Protection Rights Under General Data Protection Regulation (GDPR)
            </h1>

            <div class="text-gray-300">
                If you are a resident of the European Union (EU) and European Economic Area (EEA), you have certain data protection rights, covered by GDPR.
                <br>
                <br>
                We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data. 
            
                <br>
                <br>
                If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please email us at 
                <a href={`mailto:${emailAddress}`} class="text-blue-400 hover:text-white hover:underline">{emailAddress}</a>.
            
                <br>
                <br>
                In certain circumstances, you have the following data protection rights: 
                <ol class="list-decimal ml-8 mt-2">
                    <li>
                        The right to access, update or to delete the information we have on you 
                    </li>
                    <li>
                        The right of rectification. You have the right to have your information rectified if that information is inaccurate or incomplete 
                    </li>
                    <li>
                        The right to object. You have the right to object to our processing of your Personal Data; 
                    </li>
                    <li>
                        The right of restriction. You have the right to request that we restrict the processing of your personal information
                    </li>
                    <li>
                        The right to data portability. You have the right to be provided with a copy of your Personal Data in a structured, machine-readable and commonly used format; 
                    </li>
                    <li>
                        The right to withdraw consent. You also have the right to withdraw your consent at any time where we rely on your consent to process your personal information; 
                    </li>
                    
                </ol>
                <br>
                <br>
                Please note that we may ask you to verify your identity before responding to such requests. Please note, we may not able to provide Service without some necessary data. 

                <br>
                <br>
                You have the right to complain to a Data Protection Authority about our collection and use of your Personal Data. For more information, please contact your local data protection authority in the European Economic Area (EEA). 
            </div>



            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Your Data Protection Rights under the California Privacy Protection Act (CalOPPA)
            </h1>

            <div class="text-gray-300">
                CalOPPA is the nation's first state law requiring commercial websites and online services to disclose a privacy policy. The law's scope extends far beyond California, requiring any person or company in the United States (and possibly the world) that operates websites collecting personally identifiable information from California consumers to post a prominent privacy policy on its website stating exactly what information is being collected and with whom it is being shared, and to comply with this policy. 
            <br>
            <br>
                According to CalOPPA, we agree to the following:
                <ol class="list-decimal ml-8 mt-2">
                    <li>
                        Users can visit our site anonymously
                    </li>
                    <li>
                        Our Privacy Policy link includes the word "Privacy" and is easily found on the bottom page of our website
                    </li>
                    <li>
                        Users will be notified of any privacy policy changes on our Privacy Policy page.
                    </li>
                    <li>
                        Users can change their personal information by emailing us at
                        <a href={`mailto:${emailAddress}`} class="text-blue-400 hover:text-white hover:underline">{emailAddress}</a>.
                    </li>
                    
                </ol>
            <br>
            <br>
            Our Policy on “Do Not Track” Signals:
            We honor Do Not Track signals and do not track, plant cookies, or use advertising when a Do Not Track browser mechanism is in place. Do Not Track is a preference you can set in your web browser to inform websites that you do not want to be tracked.
            You can enable or disable Do Not Track by visiting the Preferences or Settings page of your web browser. 
            </div>



            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Childrens Privacy
            </h1>

            <div class="text-gray-300">
                Children under the age of 18 ("Child" or "Children") are not permitted to use our Services.

                We do not collect personally identifying information from children under the age of 18. Please inform us if you become aware that a Child has provided us with Personal Data. If we discover that we collected Personal Data from Children without parental agreement, we take steps to erase that information from our servers. 
            </div>


           

            <h1 class="text-white text-2xl font-medium text-start mt-5 underline">
                Changes to this Privacy Policy
            </h1>

            <div class="text-gray-300">
                We reserve the right to change our Privacy Policy at any moment. Any changes will be communicated to you by posting the revised Privacy Policy on this page.
                <br>
                <br>
                It is recommended that you examine this Privacy Policy on a regular basis for any updates. When changes to this Privacy Policy are posted on this page, they become effective. 
            </div>

        </div>
      </div>

        
     

  

</section>