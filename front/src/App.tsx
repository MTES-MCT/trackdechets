import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import client from "./graphql-client";
import LayoutContainer from "./LayoutContainer";
import { Settings } from "luxon";
import setYupLocale from "./common/setYupLocale";

Settings.defaultLocale = "fr";

// Defines app-wide french error messages for yup
// See https://github.com/jquense/yup#using-a-custom-locale-dictionary
setYupLocale();

export default function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="App">
          <LayoutContainer />
        </div>
      </Router>
    </ApolloProvider>
  );
}
