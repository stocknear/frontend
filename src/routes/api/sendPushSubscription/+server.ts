import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'node:crypto';
import webPush from 'web-push';
import { VAPID_PRIVATE_KEY } from "$env/static/private";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

webPush.setVapidDetails(
  'mailto:contact@stocknear.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const extractSubscription = (subRecord: Record<string, any>) => {
  const rawSubscription = subRecord.subscription;

  if (rawSubscription?.subscription?.endpoint) {
    return rawSubscription.subscription;
  }

  if (rawSubscription?.endpoint) {
    return rawSubscription;
  }

  return null;
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, apiKey } = locals;

  // Accept the shared secret from either the X-Stocknear-Key header or the JSON body.
  // The header is preferred because Cloudflare inspects it to bypass WAF/bot rules.
  const headerKey = request.headers.get('x-stocknear-key') ?? '';
  const { title, body, key, url, userId } = await request?.json();
  const providedKey = headerKey || key || '';

  // Timing-safe API key comparison to prevent timing attacks
  const apiKeyBuf = Buffer.from(apiKey ?? '', 'utf8');
  const providedBuf = Buffer.from(providedKey, 'utf8');
  if (apiKeyBuf.length !== providedBuf.length || !crypto.timingSafeEqual(apiKeyBuf, providedBuf)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid API key' }), { status: 401 });
  }

  try {
    const subscriptions = await pb.collection('pushSubscription').getFullList({ filter: `user="${userId}"`, sort: '-created' });

    if (!subscriptions.length) {
      return new Response(JSON.stringify({ success: false, error: 'No subscriptions found' }), { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url });

    const sendNotifications = subscriptions?.map(async (subRecord) => {
      try {
        const subscriptionData = extractSubscription(subRecord);
        
        if (!subscriptionData?.endpoint) {
          console.warn(`Skipping invalid subscription: ${subRecord.id}`);
          return { ok: false, recordId: subRecord.id };
        }

        await webPush.sendNotification(subscriptionData, payload);
        return { ok: true, recordId: subRecord.id };
        
      } catch (error: any) {
        console.error(`Error sending notification to ${subRecord.id}:`, error);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await pb.collection('pushSubscription').delete(subRecord.id);
        }

        return { ok: false, recordId: subRecord.id, statusCode: error?.statusCode };
      }
    });

    const results = await Promise.all(sendNotifications);
    const successfulCount = results.filter((result) => result?.ok).length;
    const failedCount = results.length - successfulCount;

    return new Response(JSON.stringify({ 
      success: successfulCount > 0,
      message: `Notifications sent to ${successfulCount} devices`,
      failedCount,
    }));
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
