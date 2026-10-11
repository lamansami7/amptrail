'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  createPageViewTracker,
  GA_CONSENT_EVENT,
  GA_READY_EVENT,
  type Gtag,
} from '@/lib/analytics/google-analytics';

declare global {
  interface Window {
    gtag?: Gtag;
    __amptrailGaInitialized?: boolean;
  }
}

export function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const tracker = useRef<ReturnType<typeof createPageViewTracker> | null>(null);

  useEffect(() => {
    tracker.current ??= createPageViewTracker();
    const trackPageView = () => {
      if (pathname && window.__amptrailGaInitialized && window.gtag) {
        tracker.current?.(pathname, window.gtag);
      }
    };

    // Handles either effect order; events queue even while gtag.js is still loading.
    // A Consent Mode update retries the current route. The tracker deliberately
    // does not consume a denied route, so granting consent produces one page_view.
    window.addEventListener(GA_READY_EVENT, trackPageView);
    window.addEventListener(GA_CONSENT_EVENT, trackPageView);
    trackPageView();
    return () => {
      window.removeEventListener(GA_READY_EVENT, trackPageView);
      window.removeEventListener(GA_CONSENT_EVENT, trackPageView);
    };
  }, [pathname]);

  return null;
}
