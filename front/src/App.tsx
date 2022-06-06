import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ErrorBoundary } from "@sentry/react";
import client from "./graphql-client";
import LayoutContainer from "./layout/LayoutContainer";
import setYupLocale from "./common/setYupLocale";
import BrowserDetect from "./BrowserDetect";
import { SimpleNotificationError } from "common/components/Error";

// Defines app-wide french error messages for yup
// See https://github.com/jquense/yup#using-a-custom-locale-dictionary
setYupLocale();

export default function App() {
  return (
    <BrowserDetect>
      <ErrorBoundary
        fallback={
          <SimpleNotificationError
            message={
              "Une erreur s'est produite, nous nous en excusons." +
              "Si le problème persiste, merci de contacter le support hello@trackdechets.beta.gouv.fr"
            }
          />
        }
      >
        <ApolloProvider client={client}>
          <Router>
            <div className="App">
              <LayoutContainer />
            </div>
          </Router>
        </ApolloProvider>
      </ErrorBoundary>
    </BrowserDetect>
  );
}
