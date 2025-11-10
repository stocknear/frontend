// Non-blocking Service Worker Registration
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return;
  }

  // Defer registration completely until after page is interactive
  const deferredRegistration = () => {
    // Use requestIdleCallback with very low priority
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        performRegistration();
      }, { timeout: 10000 }); // Very long timeout
    } else {
      // Use setTimeout with significant delay
      setTimeout(() => {
        performRegistration();
      }, 3000);
    }
  };

  // Wait for complete page load + additional delay
  if (document.readyState === 'complete') {
    setTimeout(deferredRegistration, 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(deferredRegistration, 2000);
    }, { once: true });
  }
}

// Immediate registration for push notifications
export async function registerServiceWorkerImmediate() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return null;
  }

  try {
    // Check if already registered
    let registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('[SW] Service worker already registered (immediate)');
      return registration;
    }

    // Register immediately
    console.log('[SW] Registering service worker immediately...');
    registration = await navigator.serviceWorker.register('/service-worker.js', {
      updateViaCache: 'none',
      scope: '/'
    });
    
    console.log('[SW] Service worker registered successfully (immediate)');
    
    // Setup update handling
    setupUpdateHandlers(registration);
    
    return registration;
  } catch (error) {
    console.error('[SW] Immediate registration failed:', error);
    return null;
  }
}

function performRegistration() {
  // Check if already registered (non-blocking check)
  navigator.serviceWorker.getRegistration().then(existingRegistration => {
    if (existingRegistration) {
      console.log('[SW] Service worker already registered');
      return;
    }

    // Perform actual registration
    navigator.serviceWorker.register('/service-worker.js', {
      updateViaCache: 'none',
      scope: '/'
    }).then(registration => {
      console.log('[SW] Registration successful');
      setupUpdateHandlers(registration);
    }).catch(error => {
      console.error('[SW] Registration failed:', error);
    });
  }).catch(() => {
    // If getRegistration fails, try direct registration
    navigator.serviceWorker.register('/service-worker.js', {
      updateViaCache: 'none',
      scope: '/'
    }).then(registration => {
      console.log('[SW] Registration successful');
      setupUpdateHandlers(registration);
    }).catch(error => {
      console.error('[SW] Registration failed:', error);
    });
  });
}

function setupUpdateHandlers(registration: ServiceWorkerRegistration) {
  // Minimal update handling - don't interrupt user
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('[SW] New version available - will activate on next visit');
        // Don't prompt user immediately - let them finish current session
      }
    });
  });
}

// Monitor cache usage (optional utility)
export async function getCacheStats() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );
  });
}


