import { goto } from '$app/navigation';


function urlBase64ToUint8Array(base64String) {
	// Add padding if necessary
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
	  // Convert URL-safe chars to standard Base64
	  .replace(/-/g, '+')
	  .replace(/_/g, '/');
  
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
  
	for (let i = 0; i < rawData.length; ++i) {
	  outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
  }

  
export async function requestNotificationPermission() {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }
  // Check the current permission status
  if (Notification.permission === 'granted') {
    return true;
  }
  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
}


export function sendNotification(
    title: string,
    options?: NotificationOptions & { iconSize?: number; url?: string }
) {
    // Only send if permission is granted
    if (Notification.permission === 'granted') {
        // Extract custom properties and remaining NotificationOptions
        const { iconSize, url, ...notificationOptions } = options || {};

        const notification = new Notification(title, {
            icon: "/pwa-192x192.png",
            ...notificationOptions // Spread only valid NotificationOptions
        });

        // Navigate when the notification is clicked
        if (url) {
            notification.onclick = () => {
                window.focus(); // Ensure the window is focused
                goto(url); // Client-side navigation
            };
        }
    }
}


export async function unsubscribe() {
		if ('serviceWorker' in navigator) {
			try {
				const registration = await navigator.serviceWorker.getRegistration();
				if (!registration) {
					console.log('No service worker registration found');
					return;
				}
				
				const readyRegistration = await navigator.serviceWorker.ready;
				const subscription = await readyRegistration.pushManager.getSubscription();
				if (subscription) {
					await subscription.unsubscribe();
					await deleteSubscriptionOnServer();
					console.log('Successfully unsubscribed from push notifications');
				} else {
					console.log('No push subscription found');
				}
			} catch (error) {
				console.error('Error unsubscribing:', error);
			}
		}
	}

// State-changing, so POST: a GET is sent cross-site with sameSite=lax cookies and is not
// covered by SvelteKit's CSRF protection.
async function deleteSubscriptionOnServer() {
	const res = await fetch('/api/deletePushSubscription', {
		method: 'POST',
		cache: 'no-store',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) {
		console.warn('Failed to delete push subscription from server:', await res.text());
	}
	return res.ok;
}

// A subscription is bound for life to the applicationServerKey it was created with. After a
// VAPID rotation the old ones still look healthy client-side but every send returns 403.
// An ABSENT key counts as a match: some browsers do not expose options.applicationServerKey,
// and tearing down a working subscription on every page load is worse than a stale one.
function keyMatches(subscription, vapidKey) {
	const current = subscription?.options?.applicationServerKey;
	if (!current) return true;
	const bytes = new Uint8Array(current);
	return bytes.length === vapidKey.length && bytes.every((b, i) => b === vapidKey[i]);
}

async function subscribeWithCurrentKey(registration) {
	const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
	const existing = await registration.pushManager.getSubscription();

	if (existing && keyMatches(existing, vapidKey)) return existing;

	if (existing) {
		console.log('Push subscription bound to a retired VAPID key, re-subscribing');
		// subscribe() with a different key throws InvalidStateError while the old one is live.
		await existing.unsubscribe();
	}

	try {
		return await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: vapidKey
		});
	} catch (err) {
		// The old subscription is gone and a new one could not be minted - drop the stale server
		// row so client and server at least agree that push is off.
		if (existing) await deleteSubscriptionOnServer().catch(() => {});
		throw err;
	}
}

async function sendSubscriptionToServer(subscription) {
			try {
				const response = await fetch('/api/addPushSubscription', {
					method: 'POST',
					cache: 'no-store',
					headers: {
						'Content-Type': 'application/json'
				},
				body: JSON.stringify({ subscription })
			});

			const output = await response?.json();
			if (!response.ok || !output?.success) {
				console.error('Push subscription sync failed:', output);
				return { success: false, error: output?.error ?? output?.message ?? 'Unable to save subscription' };
			}
			return output;
			
		} catch (error) {
			console.error('Error saving subscription on server:', error);
			return { success: false, error: 'Network error while saving subscription' };
		}
	}

	export async function subscribeUser() {
		try {
			// Ensure service worker is registered first
			if (!('serviceWorker' in navigator)) {
				console.error('Service workers not supported');
				return { success: false };
			}

			// Register service worker if not already registered
			let registration = await navigator.serviceWorker.getRegistration();
			
			if (!registration) {
				console.log('Registering service worker for push notifications...');
				registration = await navigator.serviceWorker.register('/service-worker.js');
				// Wait a bit for the service worker to activate
				await new Promise(resolve => setTimeout(resolve, 1000));
			}

			// Wait for service worker to be ready
			registration = await navigator.serviceWorker.ready;
			console.log('Service worker ready:', registration);
			
			const subscription = await subscribeWithCurrentKey(registration);

			const output = await sendSubscriptionToServer(subscription);
			return output;
		} catch (err) {
			console.error('Error subscribing:', err);
			return { success: false };
		}
	}
	  

export async function checkSubscriptionStatus() {
		if ('serviceWorker' in navigator) {
			try {
				// Check if service worker is registered
				const registration = await navigator.serviceWorker.getRegistration();
				if (!registration) {
					return false;
				}

				// Wait for it to be ready
				const readyRegistration = await navigator.serviceWorker.ready;
				const existing = await readyRegistration.pushManager.getSubscription();
				// Only repair what is already there - never create a subscription from a status check.
				if (!existing) {
					return false;
				}
				// Repairs a retired-key binding, otherwise returns the same subscription.
				const subscription = await subscribeWithCurrentKey(readyRegistration);
				// Keep the server-side record in sync with the browser subscription.
				await sendSubscriptionToServer(subscription);
				return true;
			} catch (error) {
				console.error('Error checking subscription status:', error);
				return false;
			}
		}
		return false;
	}
