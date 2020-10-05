import React, { lazy, Suspense, useEffect } from "react";
import { Route, withRouter, Switch, Redirect } from "react-router";
import { useAuth } from "./use-auth";
import PrivateRoute from "src/login/PrivateRoute";
import { trackPageView } from "src/tracker";
import Loader from "src/common/components/Loaders";
import Layout from "./Layout";

const dashBoardPreload = import("src/dashboard/Dashboard");
const Dashboard = lazy(() => dashBoardPreload);
const Account = lazy(() => import("src/account/Account"));
const FormContainer = lazy(() => import("src/form/FormContainer"));
const SignupInfo = lazy(() => import("src/login/SignupInfos"));
const WasteSelector = lazy(() => import("src/login/WasteSelector"));

const Invite = lazy(() => import("src/login/Invite"));
const ResetPassword = lazy(() => import("src/login/ResetPassword"));
const Login = lazy(() => import("src/login/Login"));
const Signup = lazy(() => import("src/login/Signup"));
const Dialog = lazy(() => import("src/oauth2/Dialog"));
const Company = lazy(() => import("src/company/Company"));
const WasteTree = lazy(() => import("src/search/WasteTree"));

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
              <Route exact path="/login">
                <Login />
              </Route>

              <Route exact path="/invite">
                <Invite />
              </Route>

              <Route exact path="/signup">
                <Signup />
              </Route>

              <Route exact path="/signup/details">
                <WasteSelector />
              </Route>

              <Route exact path="/signup/activation">
                <SignupInfo />
              </Route>

              <Route exact path="/reset-password">
                <ResetPassword />
              </Route>

              <Route exact path="/company/:siret">
                <Company />
              </Route>

              <Route exact path="/wasteTree">
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

              <PrivateRoute path="/account" isAuthenticated={isAuthenticated}>
                <Account />
              </PrivateRoute>

              <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
});
