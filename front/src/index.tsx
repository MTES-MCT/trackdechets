import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

// setup sentry just after polyfills to be able to capture all exceptions
import "./setupSentry";
import "./setupPlausible";

import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import App from "./App";
import * as serviceWorker from "./serviceWorker";
import * as Sentry from "@sentry/browser";
import "./scss/index.scss";

import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
startReactDsfr({ defaultColorScheme: "light" });

try {
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, <App />);
  } else {
    const root = createRoot(rootElement!);
    root.render(<App />);
  }
} catch (error) {
  Sentry.addBreadcrumb({
    message: "Blank screen",
  });
  Sentry.captureException(error);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
