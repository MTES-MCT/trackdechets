// Polyfills
import "unfetch/polyfill";
import "react-app-polyfill/ie11";

import React from "react";
import ReactDOM from "react-dom";
import "template.data.gouv.fr/dist/main.min.css";
import "./index.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import * as Sentry from "@sentry/browser";

// Sentry setup
const { REACT_APP_SENTRY_DSN } = process.env;
if (!!REACT_APP_SENTRY_DSN) {
  Sentry.init({ dsn: REACT_APP_SENTRY_DSN });
  Sentry.configureScope(scope => scope.setTag("service", "frontend")); // tell apart logs from our different services
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
