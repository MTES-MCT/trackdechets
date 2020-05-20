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
    <Suspense fallback={<Loader />}>
      <Switch>
        <PrivateRoute
          exact
          path="/oauth2/authorize/dialog"
          isAuthenticated={isAuthenticated}
        >
          <Dialog />
        </PrivateRoute>

        <Layout isAuthenticated={isAuthenticated}>
          <Route exact path="/">
            <Home isAuthenticated={isAuthenticated} />
          </Route>
          <Route exact path="/cgu">
            <Cgu />
          </Route>
          <Route exact path="/partners">
            <Partners />
          </Route>
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
          <Route exact path="/stats">
            <Stats />
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
        </Layout>
      </Switch>
    </Suspense>
  );
});
