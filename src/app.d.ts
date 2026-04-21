// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

// Locale type from Paraglide
type Locale = "en" | "de" | "zh";

declare namespace App {
  // interface Error {}
  interface Locals {
    pb: import("pocketbase").default;
    apiURL: string;
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

declare module "pulltorefreshjs" {
  interface PtrInitOptions {
    mainElement?: string | HTMLElement;
    triggerElement?: string | HTMLElement;
    ptrElement?: string | HTMLElement;
    classPrefix?: string;
    distThreshold?: number;
    distMax?: number;
    distReload?: number;
    distIgnore?: number;
    refreshTimeout?: number;
    passive?: boolean;
    instructionsPullToRefresh?: string;
    instructionsReleaseToRefresh?: string;
    instructionsRefreshing?: string;
    iconArrow?: string;
    iconRefreshing?: string;
    resistanceFunction?: (t: number) => number;
    shouldPullToRefresh?: () => boolean;
    onInit?: () => void;
    onRefresh?: () => void | Promise<void>;
    getStyles?: () => string;
    getMarkup?: () => string;
  }
  interface PtrInstance {
    destroy(): void;
  }
  const PullToRefresh: {
    init(options: PtrInitOptions): PtrInstance;
    destroyAll(): void;
    setPassiveMode(passive: boolean): void;
  };
  export default PullToRefresh;
}

export {};
