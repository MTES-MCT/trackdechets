import React, { lazy, Suspense, useEffect } from "react";
import {
  Route,
  withRouter,
  Switch,
  Redirect,
  generatePath,
  RouteChildrenProps,
} from "react-router-dom";
import PrivateRoute from "login/PrivateRoute";
import { trackPageView } from "tracker";
import * as Sentry from "@sentry/browser";
import Loader from "common/components/Loaders";
import Layout from "./Layout";
import routes from "common/routes";
import { useQuery, gql } from "@apollo/client";

const Dashboard = lazy(() => import("dashboard/Dashboard"));
const Account = lazy(() => import("account/Account"));
const AccountMembershipRequest = lazy(() =>
  import("account/AccountMembershipRequest")
);
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

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      companies {
        siret
      }
    }
  }
`;

export default withRouter(function LayoutContainer({ history }) {
  const { data, loading } = useQuery<{
    me: { id: string; email: string; companies: Array<{ siret: string }> };
  }>(GET_ME);
  const isAuthenticated = !loading && data != null;
  const email = data?.me?.email;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const unlisten = history.listen((location, action) =>
      trackPageView(location.pathname)
    );
    return () => unlisten();
  });

  useEffect(() => {
    if (process.env.REACT_APP_SENTRY_DSN && email) {
      Sentry.setUser({ email });
    }
  }, [email]);

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

              <Route path="/dashboard/:siret/bsds/edit/:id" exact>
                {({
                  match,
                }: RouteChildrenProps<{ siret: string; id: string }>) => (
                  <Redirect
                    to={generatePath(routes.dashboard.bsdds.edit, {
                      siret: match!.params.siret,
                      id: match!.params.id,
                    })}
                  />
                )}
              </Route>
              <PrivateRoute
                path={routes.dashboard.bsdds.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <FormContainer />
              </PrivateRoute>

              <Route path="/dashboard/:siret/bsds/create" exact>
                {({ match }: RouteChildrenProps<{ siret: string }>) => (
                  <Redirect
                    to={generatePath(routes.dashboard.bsdds.create, {
                      siret: match!.params.siret,
                    })}
                  />
                )}
              </Route>
              <PrivateRoute
                path={routes.dashboard.bsdds.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <FormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.index}
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
              <PrivateRoute
                path={routes.membershipRequest}
                isAuthenticated={isAuthenticated}
              >
                <AccountMembershipRequest />
              </PrivateRoute>
              <Redirect
                to={
                  data
                    ? data.me.companies.length > 0
                      ? generatePath(routes.dashboard.index, {
                          siret: data.me.companies[0].siret,
                        })
                      : routes.account.companies
                    : routes.login
                }
              />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
});
