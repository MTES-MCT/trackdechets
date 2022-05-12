import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "./scss/index.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import * as Sentry from "@sentry/browser";
import "@reach/tooltip/styles.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT as string,
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
      /Loading chunk [0-9]+ failed/,
    ],
  });
}

const rootElement = document.getElementById("root");

if (rootElement && rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <App />);
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
