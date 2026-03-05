import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Loader from "../Loader/Loaders";
import Layout from "./Layout";
import routes from "../../../routes";
import { useQuery, gql } from "@apollo/client";
import { Query } from "@td/codegen-ui";
import ResendActivationEmail from "../../../../login/ResendActivationEmail";
import Login from "../../../../login/Login";
import SecondFactor from "../../../../login/SecondFactor";
import SurveyBanner from "../SurveyBanner/SurveyBanner";
import { RequireAuth, Redirect } from "../../../utils/routerUtils";
import { Oauth2Dialog } from "../../../../oauth/AuthDialog";
import Admin from "../../../../admin/Admin";
import DashboardRoutes from "../../../Dashboard/DashboardRoutes";
import CompaniesRoutes from "../../../Companies/CompaniesRoutes";
import RegistryRoutes from "../../../../dashboard/registry/RegistryRoutes";
import Account from "../../../Account/Account";
import FormContainer from "../../../../form/bsdd/FormContainer";
import BsffFormContainer from "../../../../form/bsff/FormContainer";
import BsdasriFormContainer from "../../../../form/bsdasri/FormContainer";
import WasteSelector from "../../../../login/WasteSelector";
import Invite from "../../../../login/Invite";
import UserActivation from "../../../../login/UserActivation";
import PasswordResetRequest from "../../../../login/PasswordResetRequest";
import PasswordReset from "../../../../login/PasswordReset";
import Signup from "../../../../login/Signup";
import WasteTree from "../search/WasteTree";

const Company = lazy(() => import("../../../../Pages/Company/Company"));

const BANNER_MESSAGES = [
  <>
    Partagez vos besoins afin de nous aider à proposer des formations
    Trackdéchets plus adaptées et personnalisées.
  </>
];

const IS_AUTHENTICATED = gql`
  query IsAuthenticated {
    isAuthenticated
  }
`;

export default function LayoutContainer() {
  const { data, loading } =
    useQuery<Pick<Query, "isAuthenticated">>(IS_AUTHENTICATED);

  if (loading) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route
          path="/oauth2/authorize/dialog"
          element={
            <RequireAuth>
              <Oauth2Dialog />
            </RequireAuth>
          }
        />

        <Route
          element={
            <Layout
              isAuthenticated={data?.isAuthenticated}
              v2banner={
                <SurveyBanner
                  messages={BANNER_MESSAGES}
                  button={{
                    title: "Accéder au formulaire",
                    href: "https://tally.so/r/gDqRV4"
                  }}
                  persistedSurveyName="td-20260210"
                />
              }
            />
          }
        >
          <Route
            path={`${routes.admin.index}/*`}
            element={
              <RequireAuth needsAdminPrivilege>
                <Admin />
              </RequireAuth>
            }
          />

          <Route path={routes.login} element={<Login />} />

          <Route path={routes.secondFactor} element={<SecondFactor />} />

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

          <Route
            path={routes.company}
            element={
              <RequireAuth>
                <Company />
              </RequireAuth>
            }
          />

          <Route
            path={routes.wasteTree}
            element={
              <RequireAuth>
                <WasteTree />
              </RequireAuth>
            }
          />

          <Route
            path={"/dashboard/:siret/bsds/edit/:id"}
            element={<Redirect path={routes.dashboard.bsdds.edit} />}
          />

          <Route
            path={routes.dashboard.bsdds.edit}
            element={
              <RequireAuth>
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
              <RequireAuth>
                <FormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsffs.create}
            element={
              <RequireAuth>
                <BsffFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsffs.edit}
            element={
              <RequireAuth>
                <BsffFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdasris.create}
            element={
              <RequireAuth>
                <BsdasriFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdasris.edit}
            element={
              <RequireAuth>
                <BsdasriFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.default}
            element={
              <RequireAuth>
                <DashboardRoutes />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.dashboard.index}/*`}
            element={
              <RequireAuth>
                <DashboardRoutes />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.account.index}/*`}
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.companies.index}/*`}
            element={
              <RequireAuth>
                <CompaniesRoutes />
              </RequireAuth>
            }
          />

          <Route
            path={`${routes.registry_new.index}/*`}
            element={
              <RequireAuth>
                <RegistryRoutes />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  data?.isAuthenticated
                    ? routes.dashboard.default
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
