<script>
    import logo from '$lib/images/terms_of_use_logo_v3.png';
    import { numberOfUnreadNotification } from '$lib/store';


</script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Terms of Use · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <!-- Other meta tags -->
  <meta property="og:title" content="Terms of Use · stocknear"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Terms of Use · stocknear"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
	    



<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
    
    <!--
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Terms of Use</li>
      </ul>
    </div>
    -->
  
    <div  class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto p-10 mt-3 mb-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Terms of Use
            </h1>
          </div>
  
          <span class="text-white text-md font-medium text-center flex justify-center  items-center ">
            The best unread bedtime story you agree to in your sleep.
          </span>
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="relative m-auto ">
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
            <img class="w-28 ml-5" src={logo} alt="logo">
          </div>
        </div>
        <!-- End Column -->
    
      </div>
      
    </div>



      <div class="card w-full bg-[#09090B] border-t sm:border rounded-none sm:rounded-xl border-slate-700 m-auto ">
        <div class="card-body">

            <p class="text-gray-400 italic mb-2 text-sm">Last updated: 24.07.2024</p>
            
            <p class="text-gray-300 mb-5">
                Please carefully read the terms and conditions before using this website.
                By using the site, you agree to these terms as well as our
                <a href="/privacy-policy" class="text-blue-400 hover:text-white hover:underline">Privacy Policy</a>
                Stocknear has the right to alter or modify these conditions at any time. 
            </p>

         
        
            <h1 class="text-white text-2xl font-medium text-start underline">
                Stocknear does not provide investment advice
            </h1> 
            <p class="text-gray-300 mb-5">
                The information provided is solely for educational purposes only.
                Before making any investments or financial decisions, we recommend that you consult with a knowledgeable financial adviser.
                <br>
                <br>
                Stocknear's content is not financial advice in any way. We do not and will never make recommendations on our website. Our analyst data is supplied by a third source, and we do not recommend making judgments primarily exclusively on analyst price predictions or projections. We give this information so that users may learn more about equities and discover what analysts say about them. Analysts can make mistakes, thus making a conclusion purely on this data we believe is risky.
                <br>
                <br>
                Stocknear does not know you, your personal investment goals, or your risk tolerance, so we do not and will not give you any financial advice on our platform. 
                
                <br>
                <br>
                We always advise seeking expert assistance, whether it is financial, legal, or tax guidance. We do not offer any.
                <br>
                <br>
                Stocknear is not a broker/dealer or a licensed investment advisor.
                <br>
                <br>
                IN NO EVENT SHALL ANY OF THE STOCKNEAR PARTIES BE LIABLE FOR ANY INVESTMENT GAIN/LOSS YOU INCUR IN THE STOCK MARKET.
                <br>
                <br>
                YOU AGREE THAT THE SERVICE DOES NOT PROVIDE TRADING, INVESTING, FINANCIAL, TAX, LEGAL, OR OTHER ADVICE, AND YOU ACCEPT SOLE RESPONSIBILITY FOR ANY DECISIONS YOU MAKE BASED ON INFORMATION OBTAINED FROM THE SERVICE. THE SERVICE DOES NOT PROVIDE FINANCIAL PLANNING, INVESTMENT ADVICE, BROKERAGE, OR TAX ADVICE. 
            </p>

            <h1 class="text-2xl font-medium text-white text-start underline">
                Stocknear does not guarantee accuracy of data        
            </h1>
            <p class="text-gray-300 mb-5">
                Our stock data comes from a variety of sources.
                Although every attempt is made to assure correctness, it cannot always be guaranteed.    
                Before making an investment choice, stocknear recommends that you confirm the accuracy of any data by reviewing a company's SEC filings.
                
            </p>
    
            <h1 class="text-2xl font-medium text-white text-start underline">
                Use of our content       
            </h1>
            <p class="text-gray-300 mb-5 ">
                It is not permitted to republish our content in its entirety without our express authorization. You can, however, utilize snippets of the content as long as you do not edit it and clearly mention where you received it.
            </p>
    
            <h1 class="text-2xl font-medium text-white text-start underline">
                Liability of stocknear and its authors        
            </h1>
            <p class="text-gray-300 mb-5 ">
                Stocknear or its authors will not be liable to any party for any damages resulting from the use of the site's content.
                The contents of our pages were created with the utmost care. However, we cannot guarantee the accuracy, completeness and timeliness of the content. As a service provider, we are responsible for our own content on these pages under the general laws according to § 7 para.1 TMG. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under the general laws remain unaffected. However, liability in this regard is only possible from the point in time at which a concrete infringement of the law becomes known. If we become aware of such infringements, we will remove this content immediately. 
            </p>
    
            <h1 class="text-2xl font-medium text-white text-start underline">
                Copyright        
            </h1>        
            <p class="text-gray-300 mb-5 ">
                The content and works created by the site operators on these pages are subject to German copyright law. The reproduction, editing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use. Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is identified as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. If we become aware of any infringements, we will remove such content immediately.
                <br>
                <br>
                We respect other people's intellectual property rights. It is our policy to react to any accusation that Content submitted on the Service violates the copyright or other intellectual property rights of any person or entity ("Infringement").
                <br>
                <br>
                If you are a copyright owner, or authorized to act on their behalf, and believe that a copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to dcma@stockunlock.com, with the subject line: "Copyright Infringement," and include in your claim a detailed description of the alleged Infringement as detailed below, under "DMCA Notice and Procedure for Copyright Infringement Claims."

                <br>
                <br>
                You may be held accountable for damages (including costs and attorneys' fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through Service on your copyright. 
                <br>
                <br>
                On this website we use some images on this website from <a href="https://de.freepik.com/" class="text-blue-400 sm:hover:text-white">FreePik</a>.
              </p>


            <h3 class="text-2xl font-medium text-white text-start underline">
              Subscriptions        
            </h3>        
            <p class="text-gray-300 mb-5 ">
              We may offer you the ability to purchase subscriptions via Lemon Squeezy. Terms specific to a subscription will be disclosed to you at or prior to the time at which you purchase the subscription, and by purchasing the subscription you are agreeing to those terms.
                <br>
                <br>
                Subscription fees are due in advance and your subscription will automatically renew for the annual or other subscription period you originally signed up for, until you notify us of your decision to terminate your subscription.
                <br>
                <br>
                Cancellation can be performed via the billing portal on the Account Settings page or via email to support@stocknear.com.

                <br>
                <br>
                If you are not 100% satisfied with your purchase, you can get a full refund on subscription fees up to 30 days from the initial date of purchase (i.e., subscription date). After 30 days, the fees for this product are completely non-refundable. Refund requests can be made to support@stocknear.com.
            
            </p>

            <h3 class="text-2xl font-medium text-white text-start underline">
              Changes to the Price and Service Plans.     
            </h3>        
            <p class="text-gray-300 mb-5 ">
              We may at our reasonable discretion change the price of our subscription plans from time to time to reflect the effect of changes in the total costs associated with our service. Examples of costs elements that affect the price of our subscription plans include production and licensing costs, costs for the technical provision and distribution of our service, customer service and other costs of sales (e.g., billing and payment, marketing), general administration and other overhead costs (e.g., rent, interest and other financing costs, costs of personnel, service providers and services, IT systems, energy), as well as state-imposed fees, contributions, taxes and duties. Any price changes will apply no earlier than 7 days following notice to you. You can cancel your membership at any time during the notice period to avoid future charges.
            </p>

            <h1 class="text-2xl font-medium text-white text-start underline">
              Lifetime Access    
            </h1>

            <div class="text-gray-300">
              Lifetime access refers to the right to use our Services for as long as they are provided by Stocknear.
                <br>
                <br>
                Stocknear intends to provide access to its Services for the lifetime of the company. As long as Stocknear continues to operate and offer the Services, users with lifetime access will be able to use the Services.
                <br>
                <br>
                While Stocknear commits to maintaining the Services for the lifetime of the company, we do not guarantee perpetuity. In the event that Stocknear ceases to operate or decides to discontinue the Services, lifetime access will terminate.
            </div>


            <h1 class="text-2xl font-medium text-white text-start underline">
                Termination      
            </h1>

            <div class="text-gray-300">
                We may cancel or suspend your account and deny access to the Service at any time, without prior notice or responsibility, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                <br>
                <br>
                If you want to close your account, simply stop using the Service or contact us via email and we will delete your account.
                <br>
                <br>
                All provisions of the Terms that, by their nature, should survive termination shall do so, including, without limitation, ownership sections, warranty disclaimers, indemnification, and liability limitations. 
            </div>

            <h1 class="text-2xl font-medium text-white text-start underline">
                Amendments To Terms     
            </h1>

            <div class="text-gray-300">
                We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically.
                <br>
                <br>
                Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
                <br>
                <br>
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Service. 
            </div>

            <h1 class="text-2xl font-medium text-white text-start underline">
                Data Disclaimer  
            </h1>

            <div class="text-gray-300">
                All data on this website is provided solely for informational reasons and should not be used to make trading or investing decisions.
                <br>
                <br>
                We are, nevertheless, dedicated to displaying the highest-quality and most accurate statistics possible. If you see any errors or inconsistencies, please let us know by using the contact form or emailing us directly at support@stocknear.com.
                <br>
                <br>
                Our Financial Data is provided soley by <a href="https://site.financialmodelingprep.com/" class="text-blue-400 hover:underline">FMP</a> and <a href="https://docs.benzinga.com/home" class="text-blue-400 hover:underline">Benzinga</a>.
            </div>
    

          

            <h1 class="text-2xl font-medium text-white text-start underline">
                Complete Agreement        
            </h1>        
            <p class="text-gray-300 mb-5">
                These terms and conditions of use, together with our
                <a href="/privacy-policy" class="text-blue-400 hover:text-white hover:underline">Privacy Policy</a>
                and
                <a href="/imprint" class="text-blue-400 hover:text-whitehover:underline">Imprint</a>
                <!--
                <a href="/impressum/" > 
                    <span class="text-[#FB6A67]">Imprint</span>,
                
                </a> 
                -->
                represent the whole agreement between you and stocknear.
                <br>
                <br>
                YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM BY USING SERVICE OR OTHER SERVICES PROVIDED BY US. 
            </p>

            
        </div>
      </div>

    
        


    
</section>