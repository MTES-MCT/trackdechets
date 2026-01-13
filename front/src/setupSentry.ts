import * as Sentry from "@sentry/browser";
import { envConfig } from "./common/envConfig";

if (envConfig.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: envConfig.VITE_SENTRY_DSN,
    environment: envConfig.VITE_SENTRY_ENV_NAME,
    ...(envConfig.VITE_SENTRY_USE_TUNNEL ? { tunnel: "/sentry" } : {}),
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
    ],
    beforeSend(event) {
      const removeKeys = [
        "token",
        "access_token",
        "secret",
        "password",
        "hash"
      ];

      // Remove sensitive info from request URL
      if (event.request?.url) {
        const url = new URL(event.request.url);
        removeKeys.forEach(key => {
          url.searchParams.delete(key);
        });
        event.request.url = url.toString();
      }

      // Also remove from tags or extra data if needed
      if (event.tags?.url) {
        const tagUrl = new URL(event.tags.url as string);
        removeKeys.forEach(key => {
          tagUrl.searchParams.delete(key);
        });
        event.tags.url = tagUrl.toString();
      }

      return event;
    }
  });
}
