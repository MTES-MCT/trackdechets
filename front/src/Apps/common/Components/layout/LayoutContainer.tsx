import React, { lazy, Suspense } from "react";
import {
  Route,
  Routes,
  Navigate,
  generatePath,
  useMatch
} from "react-router-dom";
import * as Sentry from "@sentry/browser";
import Loader from "../Loader/Loaders";
import Layout from "./Layout";
import routes from "../../../routes";
import { useQuery, gql } from "@apollo/client";
import { Query, UserRole } from "@td/codegen-ui";
import ResendActivationEmail from "../../../../login/ResendActivationEmail";
import Login from "../../../../login/Login";
import SurveyBanner from "../SurveyBanner/SurveyBanner";
import { RequireAuth, Redirect } from "../../../utils/routerUtils";

const Admin = lazy(() => import("../../../../admin/Admin"));
const DashboardRoutes = lazy(
  () => import("../../../Dashboard/DashboardRoutes")
);
const CompaniesRoutes = lazy(
  () => import("../../../../account/CompaniesRoutes")
);
const Account = lazy(() => import("../../../../account/Account"));
const AccountMembershipRequest = lazy(
  () => import("../../../../account/AccountMembershipRequest")
);
const FormContainer = lazy(() => import("../../../../form/bsdd/FormContainer"));
const BsvhuFormContainer = lazy(
  () => import("../../../../form/bsvhu/FormContainer")
);
const BsffFormContainer = lazy(
  () => import("../../../../form/bsff/FormContainer")
);
const BsdasriFormContainer = lazy(
  () => import("../../../../form/bsdasri/FormContainer")
);
const BsdaFormContainer = lazy(
  () => import("../../../../form/bsda/FormContainer")
);
const WasteSelector = lazy(() => import("../../../../login/WasteSelector"));

const Invite = lazy(() => import("../../../../login/Invite"));
const UserActivation = lazy(() => import("../../../../login/UserActivation"));
const PasswordResetRequest = lazy(
  () => import("../../../../login/PasswordResetRequest")
);
const PasswordReset = lazy(() => import("../../../../login/PasswordReset"));
const Signup = lazy(() => import("../../../../login/Signup"));
const OauthDialog = lazy(() => import("../../../../oauth/Oauth2Dialog"));
const OidcDialog = lazy(() => import("../../../../oauth/OidcDialog"));
const Company = lazy(() => import("../../../../company/Company"));
const WasteTree = lazy(() => import("../../../../search/WasteTree"));

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      isAdmin
      companies {
        orgId
        siret
      }
      featureFlags
    }
  }
`;

export default function LayoutContainer() {
  const { data, loading } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: ({ me }) => {
      if (import.meta.env.VITE_SENTRY_DSN && me.email) {
        Sentry.setUser({ email: me.email });
      }
    }
  });

  const isAuthenticated = !loading && data != null;
  const isAdmin = isAuthenticated && Boolean(data?.me?.isAdmin);

  const isDashboard = !!useMatch("/dashboard/*");
  if (loading) {
    return <Loader />;
  }

  const v2banner = isDashboard ? (
    <SurveyBanner
      message="Trackdéchets évolue ! L’onglet « Mon Espace » cède sa place au nouveau tableau de bord (« Mes bordereaux ») et de nouvelles fonctionnalités sont disponibles depuis la dernière mise à jour. Pour en savoir plus sur ces dernières évolutions, consultez notre FAQ."
      button={{
        title: "Voir la FAQ",
        href: "https://faq.trackdechets.fr/pour-aller-plus-loin/les-dernieres-evolutions-de-trackdechets"
      }}
    ></SurveyBanner>
  ) : undefined;

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route
          path="/oauth2/authorize/dialog"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <OauthDialog />
            </RequireAuth>
          }
        />

        <Route
          path="/oidc/authorize/dialog"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <OidcDialog />
            </RequireAuth>
          }
        />
        <Route
          element={
            <Layout
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              v2banner={v2banner}
              defaultOrgId={data?.me.companies[0]?.orgId}
            />
          }
        >
          <Route
            path={`${routes.admin.index}/*`}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                {isAdmin ? (
                  <Admin />
                ) : (
                  <div>Vous n'êtes pas autorisé à consulter cette page</div>
                )}
              </RequireAuth>
            }
          />

          <Route path={routes.login} element={<Login />} />

          <Route path={routes.invite} element={<Invite />} />

          <Route path={routes.signup.index} element={<Signup />} />

          <Route path={routes.signup.details} element={<WasteSelector />} />

          <Route
            path={routes.passwordResetRequest}
            element={<PasswordResetRequest />}
          />

          <Route path={routes.passwordReset} element={<PasswordReset />} />

          <Route path={routes.userActivation} element={<UserActivation />} />

          <Route
            path={routes.resendActivationEmail}
            element={<ResendActivationEmail />}
          />

          <Route path={routes.company} element={<Company />} />

          <Route path={routes.wasteTree} element={<WasteTree />} />

          <Route
            path={"/dashboard/:siret/bsds/edit/:id"}
            element={<Redirect path={routes.dashboard.bsdds.edit} />}
          />

          <Route
            path={routes.dashboard.bsdds.edit}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <FormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={"/dashboard/:siret/bsds/create"}
            element={<Redirect path={routes.dashboard.bsdds.create} />}
          />

          <Route
            path={routes.dashboard.bsdds.create}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <FormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsvhus.create}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsvhuFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsvhus.edit}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsvhuFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsffs.create}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsffFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsffs.edit}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsffFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdasris.create}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsdasriFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdasris.edit}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsdasriFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdas.create}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsdaFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdas.edit}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <BsdaFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.dashboard.index}/*`}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <DashboardRoutes />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.account.index}/*`}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <Account />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.companies.index}/*`}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <CompaniesRoutes />
              </RequireAuth>
            }
          />

          <Route
            path={routes.membershipRequest}
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <AccountMembershipRequest />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  data
                    ? data.me.companies.length > 0
                      ? generatePath(
                          data?.me.companies[0].userRole?.includes(
                            UserRole.Driver
                          )
                            ? routes.dashboard.transport.toCollect
                            : routes.dashboard.index,
                          {
                            siret: data.me.companies[0].orgId
                          }
                        )
                      : routes.companies.index
                    : routes.login
                }
                replace
              />
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
