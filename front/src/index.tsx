import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

// setup sentry just after polyfills to be able to capture all exceptions
import "./setupSentry";

import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "@codegouvfr/react-dsfr/main.css";
import "./scss/index.scss";

import App from "./App";
import * as Sentry from "@sentry/browser";
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
    message: "Blank screen"
  });
  Sentry.captureException(error);
}
