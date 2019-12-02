import React, { lazy, Suspense, useEffect } from "react";
import { Route, withRouter } from "react-router";
import Header from "./Header";
import Home from "./Home";
import PrivateRoute from "./login/PrivateRoute";
import { trackPageView } from "./tracker";

const dashBoardPreload = import("./dashboard/Dashboard");
const Dashboard = lazy(() => dashBoardPreload);
const Account = lazy(() => import("./account/Account"));
const FormContainer = lazy(() => import("./form/FormContainer"));
const SignupInfo = lazy(() => import("./login/SignupInfos"));
const WasteSelector = lazy(() => import("./login/WasteSelector"));
const Invite = lazy(() => import("./login/Invite"));
const Faq = lazy(() => import("./Faq"));
const Partners = lazy(() => import("./Partners"));
const ResetPassword = lazy(() => import("./login/ResetPassword"));
const Cgu = lazy(() => import("./Cgu"));
const ChangePassword = lazy(() => import("./login/ChangePassword"));
const Login = lazy(() => import("./login/Login"));
const Signup = lazy(() => import("./login/Signup"));
const Company = lazy(() => import("./company/Company"));
const WasteTree = lazy(() => import("./search/WasteTree"));
const Stats = lazy(() => import("./Stats"));

export default withRouter(function LayoutContainer({ history }) {
  if (process.env.NODE_ENV === "production") {
    useEffect(() => {
      const unlisten = history.listen((location, action) =>
        trackPageView(location.pathname)
      );
      return () => unlisten();
    });
  }

  return (
    <React.Fragment>
      <Header />

      <Route exact path="/" component={Home} />
      <Route exact path="/cgu" component={WaitingComponent(Cgu)} />
      <Route exact path="/faq" component={WaitingComponent(Faq)} />
      <Route exact path="/partners" component={WaitingComponent(Partners)} />
      <Route exact path="/login" component={WaitingComponent(Login)} />
      <Route exact path="/invite" component={WaitingComponent(Invite)} />
      <Route exact path="/signup" component={WaitingComponent(Signup)} />
      <Route
        exact
        path="/signup/details"
        component={WaitingComponent(WasteSelector)}
      />
      <Route
        exact
        path="/signup/activation"
        component={WaitingComponent(SignupInfo)}
      />
      <Route
        exact
        path="/password"
        component={WaitingComponent(ChangePassword)}
      />
      <Route
        exact
        path="/reset-password"
        component={WaitingComponent(ResetPassword)}
      />

      <Route
        exact
        path="/company/:siret"
        component={WaitingComponent(Company)}
      />

      <Route exact path="/wasteTree" component={WaitingComponent(WasteTree)} />
      <Route exact path="/stats" component={WaitingComponent(Stats)} />
      <PrivateRoute
        path="/form/:id?"
        component={WaitingComponent(FormContainer)}
      />
      <PrivateRoute path="/dashboard" component={WaitingComponent(Dashboard)} />
      <PrivateRoute path="/account" component={WaitingComponent(Account)} />
    </React.Fragment>
  );
});

function WaitingComponent(Component: React.ComponentType<any>) {
  return (props: any) => (
    <Suspense fallback={<div>Chargement...</div>}>
      <Component {...props} />
    </Suspense>
  );
}
