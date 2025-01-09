import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "../Loader/Loaders";
import Layout from "./Layout";
import routes from "../../../routes";
import ResendActivationEmail from "../../../../login/ResendActivationEmail";
import Login from "../../../../login/Login";
import SurveyBanner from "../SurveyBanner/SurveyBanner";
import { RequireAuth, Redirect } from "../../../utils/routerUtils";
import Exports from "../../../../dashboard/exports/Registry";
import { Oauth2Dialog, OidcDialog } from "../../../../oauth/AuthDialog";
import { MyImports } from "../../../../dashboard/registry/MyImports";
import { CompanyImports } from "../../../../dashboard/registry/CompanyImports";
import { MyExports } from "../../../../dashboard/registry/MyExports";

const Admin = lazy(() => import("../../../../admin/Admin"));
const DashboardRoutes = lazy(
  () => import("../../../Dashboard/DashboardRoutes")
);
const CompaniesRoutes = lazy(
  () => import("../../../Companies/CompaniesRoutes")
);
const Account = lazy(() => import("../../../Account/Account"));
const FormContainer = lazy(() => import("../../../../form/bsdd/FormContainer"));

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
const Company = lazy(() => import("../../../../company/Company"));
const WasteTree = lazy(() => import("../search/WasteTree"));

const BANNER_MESSAGES = [
  `Abonnez-vous à notre lettre d'information mensuelle pour suivre les nouveautés de la plateforme, la programmation des formations, des conseils pratiques, ainsi que les évolutions réglementaires liées à la traçabilité des déchets.`
];

export default function LayoutContainer() {
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
          path="/oidc/authorize/dialog"
          element={
            <RequireAuth>
              <OidcDialog />
            </RequireAuth>
          }
        />

        <Route element={<Layout unauthenticatedRoutes />}>
          <Route path={"/"} element={<Login />} />

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
        </Route>

        <Route
          element={
            <Layout
              v2banner={
                <SurveyBanner
                  messages={BANNER_MESSAGES}
                  button={{
                    title: "Je m'abonne",
                    href: "https://0806de2d.sibforms.com/serve/MUIEAG29k1cikyqt55ql5CSQp_3hunRICQ8Eu8IvTZMpZl1EuQSEYeErCYUb31W6nx1mUfBKGfamqI9xMrql4caFpN2IUJQ_NR-00sPbnSv5Kw21AYm8tMHap8_7ah9NCHlcPqpNKrp7CPjO2zYsiAaBFX8r3PHDY72zP55LieF3N9gc3sUfOG16ioQgATXDPF0GeDpTuU46gBWT"
                  }}
                  persistedSurveyName="td-20240114"
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
            path={routes.dashboard.bsdas.create}
            element={
              <RequireAuth>
                <BsdaFormContainer />
              </RequireAuth>
            }
          />

          <Route
            path={routes.dashboard.bsdas.edit}
            element={
              <RequireAuth>
                <BsdaFormContainer />
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
            path={routes.registry}
            element={
              <RequireAuth>
                <Exports />
              </RequireAuth>
            }
          />

          <Route
            path={routes.registry_new.myImports}
            element={
              <RequireAuth>
                <MyImports />
              </RequireAuth>
            }
          />

          <Route
            path={routes.registry_new.companyImports}
            element={
              <RequireAuth>
                <CompanyImports />
              </RequireAuth>
            }
          />

          <Route
            path={routes.registry_new.export}
            element={
              <RequireAuth>
                <MyExports />
              </RequireAuth>
            }
          />

          <Route
            path="*"
            element={
              <RequireAuth replace>
                <DashboardRoutes />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
