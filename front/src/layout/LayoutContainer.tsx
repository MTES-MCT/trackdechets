import React, { lazy, Suspense, useEffect } from "react";
import { Route, withRouter, Switch, Redirect } from "react-router";
import { useAuth } from "./use-auth";
import PrivateRoute from "login/PrivateRoute";
import { trackPageView } from "tracker";
import Loader from "common/components/Loaders";
import Layout from "./Layout";
import { routes } from "common/routes";

const dashBoardPreload = import("dashboard/Dashboard");
const Dashboard = lazy(() => dashBoardPreload);
const Account = lazy(() => import("account/Account"));
const FormContainer = lazy(() => import("form/FormContainer"));
const SignupInfo = lazy(() => import("login/SignupInfos"));
const WasteSelector = lazy(() => import("login/WasteSelector"));

const Invite = lazy(() => import("login/Invite"));
const ResetPassword = lazy(() => import("login/ResetPassword"));
const Login = lazy(() => import("login/Login"));
const Signup = lazy(() => import("login/Signup"));
const Dialog = lazy(() => import("oauth2/Dialog"));
const Company = lazy(() => import("company/Company"));
const WasteTree = lazy(() => import("search/WasteTree"));

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
    <Suspense fallback={<Loader />}>
      <Switch>
        <PrivateRoute
          exact
          path="/oauth2/authorize/dialog"
          isAuthenticated={isAuthenticated}
        >
          <Dialog />
        </PrivateRoute>

        <Route>
          <Layout isAuthenticated={isAuthenticated}>
            <Switch>
              <Route exact path={routes.login}>
                <Login />
              </Route>

              <Route exact path={routes.invite}>
                <Invite />
              </Route>

              <Route exact path={routes.signup.index}>
                <Signup />
              </Route>

              <Route exact path={routes.signup.details}>
                <WasteSelector />
              </Route>

              <Route exact path={routes.signup.activation}>
                <SignupInfo />
              </Route>

              <Route exact path={routes.resetPassword}>
                <ResetPassword />
              </Route>

              <Route exact path={routes.company}>
                <Company />
              </Route>

              <Route exact path={routes.wasteTree}>
                <WasteTree />
              </Route>

              <PrivateRoute path="/form/:id?" isAuthenticated={isAuthenticated}>
                <FormContainer />
              </PrivateRoute>

              <PrivateRoute
                path="/dashboard/:siret?"
                isAuthenticated={isAuthenticated}
              >
                <Dashboard />
              </PrivateRoute>

              <PrivateRoute
                path={routes.account.index}
                isAuthenticated={isAuthenticated}
              >
                <Account />
              </PrivateRoute>

              <Redirect to={isAuthenticated ? "/dashboard" : routes.login} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
});
