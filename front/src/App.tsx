import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import client from "./graphql-client";
import LayoutContainer from "./LayoutContainer";
import { Settings } from "luxon";

Settings.defaultLocale = "fr";

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
