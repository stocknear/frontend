import crypto from "node:crypto"

export const config = {
  runtime: 'nodejs20.x',
};


// Your secret key provided by Lemon Squeezy
const SECRET_KEY = import.meta.env.VITE_LEMON_SQUEEZY_SECRET_KEY

// Request handler for the payment route
export const POST = async ({ request, locals }) => {
  try {
    // Retrieve the X-Signature header from the request
    const body = await request.text()

    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
    const signature = Buffer.from(request?.headers?.get('x-Signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      console.log('error')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
   
    // Print out the data (replace this with your actual handling logic)
    const output = JSON.parse(body);
    console.log('Received payment data:', output);
    const userId = output?.meta?.custom_data?.userId;
    const status = output?.data?.attributes?.status;
    const refunded = output?.data?.attributes?.refunded;
    let tier;
    if (status === 'paid' && refunded !== true) {
        tier = 'Pro';
    } else if (status === 'active' && refunded !== true) {
        tier = 'Pro';
    } else if (status === 'cancelled' && refunded !== true) {
        tier = 'Pro';
    } else if (status === 'on_trial' && refunded !== true) {
      tier = 'Pro';
    } else {
        tier = 'Free';
    }
    //console.log(status, refunded, tier)
    try {
      await locals.pb.collection('users').update(userId, {
        'tier': tier
      });

      if(status !== 'paid') {
        const data = {'user': userId, 'data': output}
        await locals.pb.collection('payments').create(data);
      }
      
    } catch(e) {
      console.log(e)
    }

  


    // Return a response indicating successful receipt of data
    return new Response(JSON.stringify({ message: 'Payment data received successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};