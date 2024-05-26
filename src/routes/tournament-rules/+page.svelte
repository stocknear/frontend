<script lang='ts'>
  import { numberOfUnreadNotification } from '$lib/store';

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  

</script>


<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Portfolio Tournament Rules · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Tournament Rules for our monthyl Portfolio competition.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Portfolio Tournament Rules · stocknear"/>
  <meta property="og:description" content="Tournament Rules for our monthyl Portfolio competition.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Portfolio Tournament Rules · stocknear"/>
  <meta name="twitter:description" content="Tournament Rules for our monthyl Portfolio competition.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
  
      
  
  
<div class="w-full max-w-4xl overflow-hidden m-auto mt-10 min-h-screen pt-10 mb-40">
  

  <div class="w-full sm:rounded-xl bg-[#202020] h-auto sm:p-10 mt-3">
    <div class="text-white text-4xl sm:text-5xl text-center p-3 mt-10 sm:mt-5">
        <h1 class="font-bold ">Announcement and Rules</h1>
    </div>

    <div class="text-white text-lg mt-3 text-center pl-10 pr-10">
        I am thrilled to announce our latest stocknear exclusive Portfolio Tournament! This exciting event offers you the incredible opportunity to win fantastic prizes each and every month. Join us now and experience the thrill of competing for one or more prizes on a regular basis!

         <!-- Start Image -->
         <div class="m-auto flex justify-center mt-3">
          <div class="relative">
              <div class="z-1 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <img class="w-28 mr-4" src={cloudFrontUrl+"/assets/announcement_logo.png"} alt="logo" loading="lazy">
              </div>
                <svg id="visual" viewBox="0 0 960 540" width="380" height="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="12" result="glow"/>
                      <feMerge>
                        <feMergeNode in="glow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <g transform="translate(506.6556351091302 253.49315711627338)">
                    <path d="M141.5 -60.2C185.5 -5.4 224.8 73.5 200.5 122.1C176.1 170.7 88 188.8 -4.7 191.5C-97.4 194.3 -194.9 181.5 -236.6 122.9C-278.3 64.3 -264.3 -40.1 -215.6 -97.5C-166.9 -155 -83.4 -165.5 -17.4 -155.5C48.7 -145.5 97.4 -114.9 141.5 -60.2" fill="#1E40AF" stroke-width="10" filter="url(#glow)"></path>
                  </g>
                </svg>
              </div>
          </div>
          <!-- End Image -->


    </div>
  </div>

  
  <div class="flex flex-col bg-[#202020] w-full sm:rounded-xl h-auto sm:p-10 mt-10">

      <h2 class="text-white text-4xl sm:text-5xl text-center font-medium mt-10 sm:mt-5">
          Winning Prizes
      </h2>
  
      <div class="text-white text-md mt-5 text-center pl-10 pr-10">
          Each month, participants stand a chance to win amazing prizes, including 3x Discounts on the Pro Subscription Plan. The winners will be chosen on the first day of the following month. Don't miss out on this fantastic opportunity to be a winner!
      </div>

      <!--
      <img class="w-11/12 m-auto mt-10 rounded-lg" src={cloudFrontUrl+"/assets/tournament_logo.jpg"} alt="Logo" loading="lazy"/>
        -->


      <span class="text-white text-md mt-10 p-3 text-center ">
          The Top 3 participant in the <a href="/leaderboard" class="text-blue-400 hover:text-white">
              Leaderboard</a>
               will be rewarded accordingly:
      </span>

      <ol class="text-white list-disc  ml-10 sm:ml-3 p-3 pb-10 sm:pb-5 sm:flex sm:justify-center sm:items-center">
          <li class="p-1">
              First Place: 
              <span class="font-bold">1x 30% Discount</span>
          </li>
          <li class="p-1">
              Second Place:
              <span class="font-bold">1x 20% Discount</span>
          </li>
          <li class="p-1">
              Third Place:
              <span class="font-bold">1x 10% Discount</span>
          </li>
        </ol> 
  </div>


  <div class="flex flex-col bg-[#202020] w-full sm:rounded-xl h-auto sm:p-10 mt-10">

      <h3 class="text-white text-4xl sm:text-5xl font-medium text-center m-auto mt-10 sm:mt-5">
          Rules
      </h3>

      <span class="text-white text-md mt-8 text-center sm:text-start pl-10 pr-10">
          Participating in the tournament is simple, and we've outlined the rules for you below:
      </span>
      
      <ol class="text-white list-disc ml-5 sm:ml-3 p-3">
          <li class="p-1">
              To join, you must create a User Account and be at least 18 years old. Don't forget to accept our Terms and Conditions to complete your participation.
          </li>
          <li class="p-1">
              One account per participant is allowed. Any form of cheating, including the use of multiple accounts by the same person, is strictly prohibited.
          </li>
          <li class="p-1">
              You'll begin with an initial in-game Budget of $100,000.00 to kickstart your investment journey.
          </li>
          <li class="p-1">
              Utilize your trading skills to buy and sell stocks strategically, aiming to maximize your Return on Investment.
          </li>
          <li class="p-1">
              The ranking system is solely based on your Overall Return, so make every move count.
          </li>
          <li class="p-1">
              Once the tournament concludes, the Top 3 participants with the highest Overall Return will each be awarded a prize for their outstanding performance.
          </li>
      </ol>
      
      <span class="text-white text-md mt-4 text-center font-bold mb-5 ">
          Now that you know the rules, gear up for an exciting investment challenge! Good luck!
      </span>

  </div>
 




<div class="bg-[#202020] w-full sm:rounded-xl h-auto sm:p-10 mt-10">
  <h4 class="text-white text-4xl text-center font-medium mb-3 mt-10 sm:mt-3 p-3">
      Terms and Conditions of Participation
  </h4>

      
      <ol class="text-white list-decimal ml-6 sm:ml-3 p-2">
        <li class="p-1">The organizer of the Prize competition is stocknear.</li>
        <li class="p-1">Participation is free of charge.</li>
        <li class="p-1">
          All individuals worldwide who have reached the age of 18 and comply with the laws and regulations of their respective countries are eligible to participate. Persons involved in the conception and implementation of this prize competition are excluded - this explicitly does not apply to voluntary moderators or other voluntary members who have a special status on the platform.
        </li>
        <li class="p-1">
          The prerequisite for participation in the competition is the creation of a portfolio whereby the user can buy and sell shares. Each user starts with a play money of 100,000 $. To be considered in the final draw and eligible for any prizes, participants must make at least one trade (buy or sell shares) during the tournament period.
        </li>
        <li class="p-1">
          The prize competition will take place automated once a month for an indefinite period of time. The potential winners are drawn automatically, randomly on the first day of each month, whereby the chance of winning depends on the overall return of the portfolio. If a participant has collected too little return of the portfolio, the chance can also be 0 percent.
        </li>
        <li class="p-1">
          The prizes to be awarded may change from month to month.
        </li>
        <li class="p-1">
          After the draw, the accounts of the winners will be checked for possible fraud attempts. If no abnormalities are found, the potential winners will be notified by email from stocknear.
          If any abnormalities are found, the draw will be repeated. The organizer reserves the right to refuse and reclaim prizes even after the fact and to permanently exclude participants from competitions in case of suspicion of attempted fraud or manipulation for their own benefit or the benefit of third parties as well as to temporarily or permanently block their accounts.
        </li>
        <li class="p-1">
          The potential winner must respond to the respective prize notification within 14 days, 
          which will be sent via email, in order to claim the prize. 
          Only a response via email will be considered. 
          Otherwise, unclaimed prizes will be included in the next monthly draw.
        </li>
        <li class="p-1">
          The organizer points out that the availability and functionality of the prize draw cannot be guaranteed.
          The organizer is not responsible for entries not being included due to technical failures or other reasons. 
          The prize competition may be terminated or removed due to external circumstances and constraints 
          without any claims arising for the participants against the organizer.
        </li>
        <li class="p-1">
          The organizer reserves the right to change, discontinue, or suspend the game 
          and the draw in whole or in part without prior notice in the event 
          of unforeseen circumstances. These circumstances include, but are not limited to, 
          the appearance of a computer virus, a program error, unauthorized intervention by third parties, 
          or mechanical or technical problems beyond the control and influence of the organizer.
        </li>
        <li class="p-1">
          The organizer reserves the right to terminate the prize draw at any time without prior notice.
          In this case, any outstanding prizes will be properly awarded.
        </li>
        <li class="p-1">
          Should individual provisions of these terms and conditions of participation be or become invalid,
          inadmissible, or unenforceable, this shall not affect the validity of the remaining terms 
          and conditions. In place of the invalid, inadmissible, or unenforceable clause, provisions 
          shall be deemed to have been agreed upon that come as close as possible to the economic objectives.
        </li>
        <li class="p-1">
          Furthermore, the <a href="/imprint" class="text-blue-400 hover:text-white">Imprint</a>, <a href="/terms-of-use" class="text-blue-400 hover:text-white">
            Terms of Use
          </a> and our 
          <a href="/privacy-policy" class="text-blue-400 hover:text-white">
            Privacy Policy
          </a>
          apply. 
          The applicable law and jurisdiction for this prize draw shall be determined based on the participant's 
          country of residence. In case of any legal disputes, the competent courts of the participant's 
          country of residence shall have exclusive jurisdiction.
        </li>
        <li class="p-1">
          The right of recourse to the courts is excluded.
        </li>

      </ol> 

</div>


</div>

