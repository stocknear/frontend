import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'node:crypto';
import webPush from 'web-push';
import { VAPID_PRIVATE_KEY as BUILT_IN_VAPID_PRIVATE_KEY } from "$env/static/private";
import { env } from "$env/dynamic/private";

// The VAPID halves must move together. setVapidDetails only length-validates, so a mismatched
// pair is accepted silently and then every send returns 403 - so only take the runtime override
// when BOTH halves are present, otherwise use the build-time pair as a unit.
const RUNTIME_VAPID = env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY;
const VAPID_PUBLIC_KEY = RUNTIME_VAPID
  ? env.VAPID_PUBLIC_KEY
  : import.meta.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = RUNTIME_VAPID
  ? env.VAPID_PRIVATE_KEY
  : BUILT_IN_VAPID_PRIVATE_KEY;

// Configured per request rather than at module scope: a missing/invalid key used to throw at
// import time, which took down every request to this route with an opaque 500.
const configureVapid = () => {
  webPush.setVapidDetails(
    'mailto:contact@stocknear.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
};

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
  let payloadBody: Record<string, any>;
  try {
    payloadBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { status: 400 });
  }
  const { title, body, key, url, userId } = payloadBody ?? {};
  const providedKey = request.headers.get('x-stocknear-key') || key || '';

  // Timing-safe API key comparison to prevent timing attacks.
  // Both sides must be non-empty: timingSafeEqual('', '') is true, so an empty configured key
  // would otherwise let anyone push to any userId.
  const apiKeyBuf = Buffer.from(apiKey ?? '', 'utf8');
  const providedBuf = Buffer.from(providedKey, 'utf8');
  if (
    apiKeyBuf.length === 0 ||
    apiKeyBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(apiKeyBuf, providedBuf)
  ) {
    // Lengths only, never the values: 64 vs 32 identifies a stale build immediately.
    console.warn('sendPushSubscription 401', { providedLen: providedBuf.length, expectedLen: apiKeyBuf.length });
    return new Response(JSON.stringify({ success: false, error: 'Invalid API key' }), { status: 401 });
  }

  try {
    configureVapid();

    const subscriptions = await pb.collection('pushSubscription').getFullList({
      filter: pb.filter('user = {:user}', { user: userId ?? '' }),
      sort: '-created',
    });

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
        // error.body carries the push service's reason (e.g. VapidPkHashMismatch) - log it.
        console.error('Push send failed', {
          recordId: subRecord.id,
          statusCode: error?.statusCode,
          body: error?.body,
        });

        // 410/404 mean the push service dropped the endpoint - safe to prune.
        // 403 (VAPID key mismatch) is deliberately NOT pruned: it also fires when the server's
        // own keypair is misconfigured, which would wipe every subscription in one pass. The
        // client re-subscribes with the current key and addPushSubscription replaces the row.
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          await pb.collection('pushSubscription').delete(subRecord.id).catch(() => {});
        }

        return { ok: false, recordId: subRecord.id, statusCode: error?.statusCode };
      }
    });

    const results = await Promise.all(sendNotifications);
    const successfulCount = results.filter((result) => result?.ok).length;
    const failedCount = results.length - successfulCount;

    // 502 when nothing got through, so callers checking response.ok actually see the failure.
    return new Response(JSON.stringify({
      success: successfulCount > 0,
      message: `Notifications sent to ${successfulCount} devices`,
      failedCount,
    }), { status: successfulCount > 0 ? 200 : 502 });
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
