import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import client from "./graphql-client";
import LayoutContainer from "./LayoutContainer";

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
