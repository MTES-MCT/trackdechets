import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

// setup sentry just after polyfills to be able to capture all exceptions
import "./setupSentry";

import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./App";
import * as serviceWorker from "./serviceWorker";
import * as Sentry from "@sentry/browser";
import "remixicon/fonts/remixicon.css";
import "./scss/index.scss";

try {
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.hasChildNodes()) {
    ReactDOM.hydrate(<App />, rootElement);
  } else {
    ReactDOM.render(<App />, rootElement);
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
