import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter as Router } from "react-router-dom";
import client from "./graphql-client";
import LayoutContainer from "./layout/LayoutContainer";
import setYupLocale from "./common/setYupLocale";
import BrowserDetect from "./BrowserDetect";
import ErrorBoundary from "./ErrorBoundary";
import { FeatureFlagsProvider } from "common/contexts/FeatureFlagsContext";
import { PermissionsProvider } from "common/contexts/PermissionsContext";

// Defines app-wide french error messages for yup
// See https://github.com/jquense/yup#using-a-custom-locale-dictionary
setYupLocale();

export default function App() {
  return (
    <BrowserDetect>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <Router>
            <PermissionsProvider defaultPermissions={[]}>
              <FeatureFlagsProvider defaultFeatureFlags={{}}>
                <div className="App">
                  <LayoutContainer />
                </div>
              </FeatureFlagsProvider>
            </PermissionsProvider>
          </Router>
        </ApolloProvider>
      </ErrorBoundary>
    </BrowserDetect>
  );
}
