import React from "react";
import { Route } from "react-router";
import Cgu from "./Cgu";
import Dashboard from "./dashboard/Dashboard";
import FormContainer from "./form/FormContainer";
import Header from "./Header";
import Home from "./Home";
import ChangePassword from "./login/ChangePassword";
import Login from "./login/Login";
import PrivateRoute from "./login/PrivateRoute";
import Signup from "./login/Signup";
import SignupInfo from "./login/SignupInfos";
import WasteSelector from "./login/WasteSelector";
import Search from "./search/Search";
import WasteTree from "./search/WasteTree";

export default function LayoutContainer() {
  return (
    <React.Fragment>
      <Header />

      <Route exact path="/" component={Home} />
      <Route exact path="/cgu" component={Cgu} />
      <Route exact path="/login" component={Login} />
      <Route exact path="/signup" component={Signup} />
      <Route exact path="/signup/details" component={WasteSelector} />
      <Route exact path="/signup/activation" component={SignupInfo} />
      <Route exact path="/password" component={ChangePassword} />

      <Route exact path="/search" component={Search} />
      <Route exact path="/wasteTree" component={WasteTree} />

      <PrivateRoute path="/form/:id?" component={FormContainer} />
      <PrivateRoute path="/dashboard" component={Dashboard} />
    </React.Fragment>
  );
}
