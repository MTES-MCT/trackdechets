import { useEffect } from "react";

import { envConfig } from "../envConfig";

declare global {
  interface Window {
    _paq?: Array<unknown[]>;
    _matomoLoaded?: boolean;
    _matomoNavigationTrackingInitialized?: boolean;
  }
}

function normalizeMatomoUrl(url: string): string {
  const urlWithScheme =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;

  return `${urlWithScheme.replace(/\/+$/, "")}/`;
}

function trackPageView(): void {
  if (!window._paq) {
    return;
  }

  window._paq.push(["setCustomUrl", window.location.href]);
  window._paq.push(["setDocumentTitle", document.title]);
  window._paq.push(["trackPageView"]);
}

function initializeNavigationTracking(): void {
  if (window._matomoNavigationTrackingInitialized) {
    return;
  }

  window._matomoNavigationTrackingInitialized = true;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);

    window.setTimeout(() => {
      trackPageView();
    }, 0);
  };

  window.history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);

    window.setTimeout(() => {
      trackPageView();
    }, 0);
  };

  window.addEventListener("popstate", () => {
    window.setTimeout(() => {
      trackPageView();
    }, 0);
  });
}

export function MatomoTracker() {
  const { VITE_MATOMO_TRACKER_SITE_ID, VITE_MATOMO_TRACKER_URL } = envConfig;

  useEffect(() => {
    if (!VITE_MATOMO_TRACKER_SITE_ID || !VITE_MATOMO_TRACKER_URL) {
      return;
    }

    if (window._matomoLoaded) {
      return;
    }

    const matomoUrl = normalizeMatomoUrl(VITE_MATOMO_TRACKER_URL);
    const _paq = (window._paq = window._paq || []);

    /*
     * Trackdéchets utilise Matomo sans cookies.
     * Cette commande doit être exécutée avant la première page vue.
     */
    _paq.push(["disableCookies"]);

    _paq.push(["setTrackerUrl", `${matomoUrl}matomo.php`]);
    _paq.push(["setSiteId", VITE_MATOMO_TRACKER_SITE_ID]);
    _paq.push(["enableLinkTracking"]);

    trackPageView();
    initializeNavigationTracking();

    const script = document.createElement("script");

    script.async = true;
    script.src = `${matomoUrl}matomo.js`;
    script.dataset.matomo = "true";

    script.onerror = () => {
      window._matomoLoaded = false;

      console.error(
        `Impossible de charger Matomo depuis ${script.src}. Vérifiez l'URL BRGM et la CSP.`
      );
    };

    document.head.appendChild(script);

    window._matomoLoaded = true;
  }, [VITE_MATOMO_TRACKER_SITE_ID, VITE_MATOMO_TRACKER_URL]);

  return null;
}
