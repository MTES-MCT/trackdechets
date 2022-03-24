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
import { Query } from "../generated/graphql/types";
import ResendActivationEmail from "login/ResendActivationEmail";

const Admin = lazy(() => import("admin/Admin"));
const Dashboard = lazy(() => import("dashboard/Dashboard"));
const Account = lazy(() => import("account/Account"));
const AccountMembershipRequest = lazy(() =>
  import("account/AccountMembershipRequest")
);
const FormContainer = lazy(() => import("form/bsdd/FormContainer"));
const BsvhuFormContainer = lazy(() => import("form/bsvhu/FormContainer"));
const BsffFormContainer = lazy(() => import("form/bsff/FormContainer"));
const BsdasriFormContainer = lazy(() => import("form/bsdasri/FormContainer"));
const BsdaFormContainer = lazy(() => import("form/bsda/FormContainer"));
const SignupInfo = lazy(() => import("login/SignupInfos"));
const WasteSelector = lazy(() => import("login/WasteSelector"));

const Invite = lazy(() => import("login/Invite"));
const PasswordResetRequest = lazy(() => import("login/PasswordResetRequest"));
const PasswordReset = lazy(() => import("login/PasswordReset"));
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
      isAdmin
      companies {
        siret
      }
    }
  }
`;

export default withRouter(function LayoutContainer({ history }) {
  const { data, loading } = useQuery<Pick<Query, "me">>(GET_ME);
  const isAuthenticated = !loading && data != null;
  const isAdmin = (isAuthenticated && data?.me?.isAdmin) || false;
  const email = data?.me?.email;

  useEffect(() => {
    if (import.meta.env.NODE_ENV !== "production") {
      return;
    }

    const unlisten = history.listen((location, action) =>
      trackPageView(location.pathname)
    );
    return () => unlisten();
  });

  useEffect(() => {
    if (import.meta.env.VITE_SENTRY_DSN && email) {
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
          <Layout isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
            <Switch>
              <PrivateRoute
                path={routes.admin.index}
                isAuthenticated={isAuthenticated}
              >
                {isAdmin ? (
                  <Admin />
                ) : (
                  <div>Vous n'êtes pas autorisé à consulter cette page</div>
                )}
              </PrivateRoute>

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

              <Route exact path={routes.passwordResetRequest}>
                <PasswordResetRequest />
              </Route>

              <Route exact path={routes.passwordReset}>
                <PasswordReset />
              </Route>

              <Route exact path={routes.resendActivationEmail}>
                <ResendActivationEmail />
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
                path={routes.dashboard.bsvhus.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsvhuFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsvhus.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsvhuFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsffs.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsffFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsffs.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsffFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsdasris.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsdasriFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsdasris.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsdasriFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsdas.create}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsdaFormContainer />
              </PrivateRoute>

              <PrivateRoute
                path={routes.dashboard.bsdas.edit}
                isAuthenticated={isAuthenticated}
                exact
              >
                <BsdaFormContainer />
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
                      : routes.account.companies.list
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
