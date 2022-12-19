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
        fallback={errorData => {
          if (
            // After a deploy, users navigating from one page to another without
            // refreshing the page will encounter the error "Failed to fetch dynamically
            // imported module"
            errorData?.error?.message?.includes("dynamically imported module")
          ) {
            return (
              <SimpleNotificationError
                message={
                  <>
                    Une nouvelle version du site est disponible. Veuillez
                    rafraichir votre page. Si le problème persiste, merci de
                    contacter{" "}
                    <a
                      target="_blank"
                      href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                      rel="noreferrer"
                    >
                      l'assistance Trackdéchets.
                    </a>
                  </>
                }
              />
            );
          }
          return (
            <SimpleNotificationError
              message={
                <>
                  Une erreur s'est produite, veuillez nous en excuser. Si le
                  problème persiste, merci de contacter{" "}
                  <a
                    target="_blank"
                    href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                    rel="noreferrer"
                  >
                    l'assistance Trackdéchets
                  </a>{" "}
                  en précisant le numéro d'erreur suivant : {errorData.eventId}.
                </>
              }
            />
          );
        }}
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
