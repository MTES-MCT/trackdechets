// Polyfills
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

import * as React from "react";
import * as ReactDOM from "react-dom";

import "./scss/index.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import * as Sentry from "@sentry/browser";

const { REACT_APP_SENTRY_DSN, REACT_APP_SENTRY_ENVIRONMENT } = process.env;

if (REACT_APP_SENTRY_DSN && REACT_APP_SENTRY_ENVIRONMENT) {
  Sentry.init({
    dsn: REACT_APP_SENTRY_DSN,
    environment: REACT_APP_SENTRY_ENVIRONMENT,
  });
}

const rootElement = document.getElementById("root");

if (rootElement && rootElement.hasChildNodes()) {
  ReactDOM.hydrate(<App />, rootElement);
} else {
  ReactDOM.render(<App />, rootElement);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
