import ApolloClient from "apollo-client";
import React, { Component } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./dashboard/Dashboard";
import FormIntro from "./form/FormIntro";
import Home from "./Home";
import Login from "./login/Login";
import Signup from "./login/Signup";
import ChangePassword from "./login/ChangePassword";
import client from "./graphql-client";
import PrivateRoute from "./login/PrivateRoute";

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Router>
          <div className="App">
            <Route exact path="/" component={Home} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/password" component={ChangePassword} />
            <PrivateRoute path="/form" component={FormIntro} />
            <PrivateRoute path="/dashboard" component={Dashboard} />
          </div>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
