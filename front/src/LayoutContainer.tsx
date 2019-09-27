import React, { lazy, Suspense, useEffect } from "react";
import { Route, withRouter } from "react-router";
import Header from "./Header";
import Home from "./Home";
import PrivateRoute from "./login/PrivateRoute";
import { trackPageView } from "./tracker";

const dashBoardPreload = import("./dashboard/Dashboard");
const Dashboard = lazy(() => dashBoardPreload);
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
const Search = lazy(() => import("./search/Search"));
const Company = lazy(() => import("./company/Company"));
const WasteTree = lazy(() => import("./search/WasteTree"));

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

      <Route exact path="/search" component={WaitingComponent(Search)} />
      <Route
        exact
        path="/company/:siret"
        component={WaitingComponent(Company)}
      />

      <Route exact path="/wasteTree" component={WaitingComponent(WasteTree)} />

      <PrivateRoute
        path="/form/:id?"
        component={WaitingComponent(FormContainer)}
      />
      <PrivateRoute path="/dashboard" component={WaitingComponent(Dashboard)} />
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
