import * as Sentry from "@sentry/browser";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT as string,
    ...(import.meta.env.VITE_SENTRY_USE_TUNNEL === "true"
      ? { tunnel: "/sentry" }
      : {}),
    ignoreErrors: [
      // The user is having issues with their internet connection
      "NetworkError when attempting to fetch resource.",

      // An error is thrown without a message
      // https://github.com/getsentry/sentry-javascript/issues/3440
      "Non-Error promise rejection captured with value: Object Not Found Matching Id:",

      // There's a cache mismatch, possibly because of the ServiceWorker
      "Unexpected token '<'",

      // Happens after a new release, when trying to load files that don't exist anymore
      // https://rollbar.com/blog/javascript-chunk-load-error
      /Loading chunk [0-9]+ failed/
    ]
  });
}
