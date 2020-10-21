import React, { lazy, Suspense, useEffect } from "react";
import {
  Route,
  withRouter,
  Switch,
  Redirect,
  generatePath,
} from "react-router";
import PrivateRoute from "login/PrivateRoute";
import { trackPageView } from "tracker";
import Loader from "common/components/Loaders";
import Layout from "./Layout";
import { routes } from "common/routes";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

const Dashboard = lazy(() => import("dashboard/Dashboard"));
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

const GET_ME = gql`
  query GetMe {
    me {
      id
      companies {
        siret
      }
    }
  }
`;

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

  const { data, loading } = useQuery<{
    me: { id: string; companies: Array<{ siret: string }> };
  }>(GET_ME);
  const isAuthenticated = !loading && data != null;

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

              <PrivateRoute
                path={routes.dashboard.slips.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <FormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.slips.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <FormContainer />
              </PrivateRoute>

              {/*
                This is a legacy URL we need to keep for some time
                in order to redirect users from the old URL to the new one
              */}
              <PrivateRoute path="/form/:id?" isAuthenticated={isAuthenticated}>
                {({ match }) => (
                  <Redirect
                    to={
                      data && data.me.companies.length > 0
                        ? match?.params?.id
                          ? generatePath(routes.dashboard.slips.edit, {
                              siret: data.me.companies[0].siret,
                              id: match.params.id,
                            })
                          : generatePath(routes.dashboard.slips.create, {
                              siret: data.me.companies[0].siret,
                            })
                        : routes.account.companies
                    }
                  />
                )}
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
