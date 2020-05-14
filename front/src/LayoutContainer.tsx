import React, { lazy, Suspense, useEffect } from "react";
import { Route, withRouter, Switch } from "react-router";
import { useAuth } from "./use-auth";
import Home from "./Home";
import PrivateRoute from "./login/PrivateRoute";
import { trackPageView } from "./tracker";
import Loader from "./common/Loader";
import Layout from "./Layout";

const dashBoardPreload = import("./dashboard/Dashboard");
const Dashboard = lazy(() => dashBoardPreload);
const Account = lazy(() => import("./account/Account"));
const FormContainer = lazy(() => import("./form/FormContainer"));
const SignupInfo = lazy(() => import("./login/SignupInfos"));
const WasteSelector = lazy(() => import("./login/WasteSelector"));
const Invite = lazy(() => import("./login/Invite"));
const Partners = lazy(() => import("./Partners"));
const ResetPassword = lazy(() => import("./login/ResetPassword"));
const Cgu = lazy(() => import("./Cgu"));
const Login = lazy(() => import("./login/Login"));
const Signup = lazy(() => import("./login/Signup"));
const Dialog = lazy(() => import("./oauth2/Dialog"));
const Company = lazy(() => import("./company/Company"));
const WasteTree = lazy(() => import("./search/WasteTree"));
const Stats = lazy(() => import("./Stats"));

export default withRouter(function LayoutContainer({ history }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const unlisten = history.listen((location, action) =>
      trackPageView(location.pathname)
    );
    return () => unlisten();
  });

  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <Switch>
      <PrivateRoute
        exact
        path="/oauth2/authorize/dialog"
        isAuthenticated={isAuthenticated}
        component={WaitingComponent(Dialog)}
      />
      <Layout isAuthenticated={isAuthenticated}>
        <Route
          exact
          path="/"
          render={() => <Home isAuthenticated={isAuthenticated} />}
        />
        <Route exact path="/cgu" component={WaitingComponent(Cgu)} />
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
          path="/reset-password"
          component={WaitingComponent(ResetPassword)}
        />

        <Route
          exact
          path="/company/:siret"
          component={WaitingComponent(Company)}
        />

        <Route
          exact
          path="/wasteTree"
          component={WaitingComponent(WasteTree)}
        />
        <Route exact path="/stats" component={WaitingComponent(Stats)} />
        <PrivateRoute
          path="/form/:id?"
          isAuthenticated={isAuthenticated}
          component={WaitingComponent(FormContainer)}
        />
        <PrivateRoute
          path="/dashboard/:siret?"
          isAuthenticated={isAuthenticated}
          component={WaitingComponent(Dashboard)}
        />
        <PrivateRoute
          path="/account"
          isAuthenticated={isAuthenticated}
          component={WaitingComponent(Account)}
        />
      </Layout>
    </Switch>
  );
});

function WaitingComponent(Component: React.ComponentType<any>) {
  return (props: any) => (
    <Suspense fallback={<div>Chargement...</div>}>
      <Component {...props} />
    </Suspense>
  );
}
