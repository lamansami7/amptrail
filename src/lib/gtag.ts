
export const GA_MEASUREMENT_ID = "G-MBG985L02V";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Google Analytics 4.
 * Call once after the Google tag script is loaded.
 */
export function initGA(): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }

  window.gtag("js", new Date());

  // Manual page tracking for single-page applications.
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });
}

/**
 * Track page navigation.
 */
export function trackPageView(
  path: string,
  title?: string
): void {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

/**
 * Track custom GA4 events.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, params);
}

/**
 * Track successful user registration.
 */
export function trackSignUp(): void {
  trackEvent("sign_up", {
    method: "email",
  });
}

/**
 * Track successfully submitted leads.
 */
export function trackLead(): void {
  trackEvent("generate_lead", {
    lead_source: "website",
  });
}
