import React, { Component } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import client from "./graphql-client";
import LayoutContainer from "./LayoutContainer";

class App extends Component {
  render() {
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
}

export default App;
