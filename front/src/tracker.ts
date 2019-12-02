declare global {
  interface Window {
    _paq: any;
  }
  const Piwik: any;
}
// Piwik/Matomo tracker
window._paq = window._paq || [];
window._paq.push(["setDomains", ["*." + process.env.REACT_APP_HOSTNAME]]);
window._paq.push(["setDoNotTrack", true]);
window._paq.push(["trackPageView"]);
window._paq.push(["enableLinkTracking"]);

if (process.env.NODE_ENV === "production") {
  loadTracker();
}

function loadTracker() {
  var u = process.env.REACT_APP_MATOMO_TRACKER_URL;
  window._paq.push(["setTrackerUrl", u + "piwik.php"]);
  window._paq.push(["setSiteId", process.env.REACT_APP_MATOMO_TRACKER_SITE_ID]);
  var d = document;
  var g = d.createElement("script");
  var s = d.getElementsByTagName("script")[0];
  g.type = "text/javascript";
  g.async = true;
  g.defer = true;
  g.src = u + "piwik.js";
  if (s.parentNode != null) {
    s.parentNode.insertBefore(g, s);
  }
}

export function getTracker() {
  if (typeof Piwik !== "undefined") {
    const tracker = Piwik.getAsyncTracker(
      `${process.env.REACT_APP_MATOMO_TRACKER_URL}piwik.php`,
      process.env.REACT_APP_MATOMO_TRACKER_SITE_ID
    );
    return tracker;
  }
  return null;
}

export function trackPageView(pageTitle: string) {
  const tracker = getTracker();
  if (tracker) {
    tracker.trackPageView(pageTitle);
  }
}

export function trackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number
) {
  const tracker = getTracker();
  if (tracker) {
    tracker.trackEvent(category, action);
  }
}
