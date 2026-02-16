import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

/// Constants
const CACHE_DURATION = 60 * 1000; // 60 seconds

// LRU Cache implementation
class LRUCache {
  cache: Map<string, { data: any; timestamp: number }>;
  maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string) {
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

  set(key: string, data: any) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const dashboardCache = new LRUCache();

export async function load({ locals }) {
  const { pb, locale } = locals;

  if (!pb.authStore.isValid) {
    // Anonymous user — render landing page
    return { getDashboard: null };
  }

  // Logged-in user — fetch dashboard data inline (no redirect)
  const cacheKey = `dashboard:${locale}`;
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
