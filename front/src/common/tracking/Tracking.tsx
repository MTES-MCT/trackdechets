import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

declare global {
  interface Window {
    _mtm?: Array<Record<string, any>>;
    _matomoLoaded?: boolean;
    matomoHeatmapSessionRecordingAsyncInit?: (args: any) => void;
    Matomo: any;
  }
}

window.matomoHeatmapSessionRecordingAsyncInit = function (_: any) {
  if (window?.Matomo) {
    window.Matomo.HeatmapSessionRecording.enable();
  }
};

export function MatomoTracker() {
  const { VITE_MATOMO_TRACKER_SITE_ID, VITE_MATOMO_TRACKER_URL } = import.meta
    .env;
  const { user } = useAuth();

  const trackingConsentUntil = user?.trackingConsentUntil;
  const trackingConsent = user?.trackingConsent;

  useEffect(() => {
    if (!VITE_MATOMO_TRACKER_SITE_ID || !VITE_MATOMO_TRACKER_URL) {
      return;
    }

    const hasConsent =
      trackingConsent &&
      (trackingConsentUntil
        ? new Date(trackingConsentUntil) > new Date()
        : false);

    if (hasConsent) {
      if (window._matomoLoaded) return;

      const _mtm = (window._mtm = window._mtm || []);
      _mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });

      const d = document;
      const g = d.createElement("script");
      const s = d.getElementsByTagName("script")[0];
      g.async = true;
      g.src = `https://${VITE_MATOMO_TRACKER_URL}/js/${VITE_MATOMO_TRACKER_SITE_ID}.js`;

      if (s.parentNode) {
        s.parentNode.insertBefore(g, s);
      }

      window._matomoLoaded = true;
    }

    if (!hasConsent) {
      // Remove Matomo script when consent is withdrawn
      if (window._matomoLoaded) {
        // the process of removing in-memory matomo code is a pita, let's just refesh the page
        window.location.reload();
      }
    }
  }, [
    trackingConsentUntil,
    trackingConsent,
    VITE_MATOMO_TRACKER_SITE_ID,
    VITE_MATOMO_TRACKER_URL
  ]);

  return null;
}
