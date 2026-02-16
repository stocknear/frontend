// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

// Locale type from Paraglide
type Locale = "en" | "de";

declare namespace App {
  // interface Error {}
  interface Locals {
    pb: import("pocketbase").default;
    apiURL: string;
    fastifyURL: string;
    wsURL: string;
    apiKey: string;
    themeMode: string;
    clientIp: string | undefined;
    user?: Record<string, unknown>;
    cookieConsent: {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      timestamp?: number;
    } | null;
    locale: Locale;
  }
  // interface PageData {}
  // interface Platform {}
}

// Global type declarations for tracking scripts
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export {};
