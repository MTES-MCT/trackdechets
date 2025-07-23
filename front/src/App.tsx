import React from "react";
import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import client from "./graphql-client";
import LayoutContainer from "./Apps/common/Components/layout/LayoutContainer";
import setYupLocale from "./common/setYupLocale";
import BrowserDetect from "./BrowserDetect";
import ErrorBoundary from "./ErrorBoundary";
import { AuthProvider } from "./common/contexts/AuthContext";
import { FeatureFlagsProvider } from "./common/contexts/FeatureFlagsContext";
import { PermissionsProvider } from "./common/contexts/PermissionsContext";
import { MatomoTracker } from "./common/tracking/Tracking";
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
import translation from "zod-i18n-map/locales/fr/zod.json";

// Zod in FR
i18next.init({
  lng: "fr",
  resources: {
    fr: { zod: translation }
  }
});
z.setErrorMap(zodI18nMap);

// Defines app-wide french error messages for yup
// See https://github.com/jquense/yup#using-a-custom-locale-dictionary
setYupLocale();

const router = createBrowserRouter([
  { path: "*", element: <LayoutContainer /> }
]);

export default function App() {
  return (
    <BrowserDetect>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <AuthProvider>
            <PermissionsProvider>
              <FeatureFlagsProvider defaultFeatureFlags={{}}>
                <div className="App">
                  <MatomoTracker />
                  <RouterProvider router={router} />
                </div>
              </FeatureFlagsProvider>
            </PermissionsProvider>
          </AuthProvider>
        </ApolloProvider>
      </ErrorBoundary>
    </BrowserDetect>
  );
}
