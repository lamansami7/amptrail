'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createPageViewTracker, GA_READY_EVENT, type Gtag } from '@/lib/analytics/google-analytics';

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
    window.addEventListener(GA_READY_EVENT, trackPageView);
    trackPageView();
    return () => window.removeEventListener(GA_READY_EVENT, trackPageView);
  }, [pathname]);

  return null;
}
