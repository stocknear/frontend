import type { RequestHandler } from './$types';

function secondsUntilEndOfDay() {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const secondsUntilEndOfDay = (endOfDay - now) / 1000;
    return secondsUntilEndOfDay;
}



export const POST = (async ( {request, cookies, locals} ) => {
  
    let output = 'error';
    const data = await request.json()
    const sentiment = data?.sentiment;
    const ticker = data?.ticker
    const sentimentId = data?.sentimentId;
    const maxAge = secondsUntilEndOfDay();

    let newData;

    if (cookies?.get('community-sentiment-'+ticker)) {
        //console.log('already voted')
        return new Response(JSON.stringify(output))
    }
    else {
        try {    
            if (sentimentId) {
                if (sentiment === 'upvote') {
                    await locals?.pb?.collection('sentiment').update( sentimentId, {'upvote+': 1})
                }
                else if (sentiment === 'downvote') {
                    await locals?.pb?.collection('sentiment').update( sentimentId, {'downvote+': 1})
                }
            }

            else {

                if (sentiment === 'upvote') {
                    newData = await locals?.pb?.collection('sentiment').create({'ticker': ticker, 'upvote': 1})
                }
                else if (sentiment === 'downvote') {
                    newData = await locals?.pb?.collection('sentiment').create({'ticker': ticker, 'downvote': 1})
                }
            }
          
    
    
            output = 'success';

            cookies.set('community-sentiment-'+ticker, sentiment, {httpOnly: true,
                sameSite: 'lax',
                secure: true,
                path: '/',
                maxAge: maxAge // End of day expiry
            });
            
    
        } catch(e) {
            console.log(e);
        }
    }
   
   

    return new Response(JSON.stringify(output))
}) satisfies RequestHandler;

