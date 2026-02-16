import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { redirect } from "@sveltejs/kit";

/// Constants
const CACHE_DURATION = 10 * 1000; // 10 seconds

// LRU Cache implementation
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const { data, timestamp } = entry;
    if (Date.now() - timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    // Refresh order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const dashboardCache = new LRUCache();

// Load function
export async function load({ locals }) {
  const { locale, pb } = locals;

  if (!pb.authStore.isValid) {
    redirect(303, "/");
  }

  const cacheKey = `dashboard:${locale}`;

  // Check cache
  let dashboardData = dashboardCache.get(cacheKey);

  if (!dashboardData) {
    try {
      dashboardData = await postAPI(locals, "/dashboard-info", { lang: locale ?? 'en' });
      dashboardCache.set(cacheKey, dashboardData);
    } catch (err) {
      console.error('Dashboard fetch error', err);
      dashboardData = {};
    }
  }

  return {
    getDashboard: dashboardData,
  };
}

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
