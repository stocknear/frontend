import type { RequestHandler } from '@sveltejs/kit';
import webPush from 'web-push';
import https from 'https';

const agent = new https.Agent({
  family: 4 // Forces IPv4
});


const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY;

webPush.setVapidDetails(
  'mailto:contact@stocknear.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, apiKey } = locals;
  // Extract 'url' from the request body
  const { title, body, key, url, userId } = await request?.json();

  if (apiKey !== key) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid API key' }), { status: 401 });
  }

  try {
    const subscriptions = await pb.collection('pushSubscription').getFullList({ filter: `user="${userId}"`, sort: '-created' });

    if (!subscriptions.length) {
      return new Response(JSON.stringify({ success: false, error: 'No subscriptions found' }), { status: 404 });
    }

    const sendNotifications = subscriptions?.map(async (subRecord) => {
      try {
        const subscriptionData = subRecord.subscription?.subscription;
        
        if (!subscriptionData?.endpoint) {
          console.warn(`Skipping invalid subscription: ${subRecord.id}`);
          return;
        }

        // Always send JSON payload with title, body, and url
        const payload = JSON?.stringify({ title, body, url });

        await webPush.sendNotification(subscriptionData, payload, { agent });
        //console.log(`Notification sent to: ${subscriptionData.endpoint}`);
        
      } catch (error: any) {
        console.error(`Error sending notification to ${subRecord.id}:`, error);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await pb.collection('pushSubscription').delete(subRecord.id);
        }
      }
    });

    await Promise.all(sendNotifications);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notifications sent to ${subscriptions.length} devices` 
    }));
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};