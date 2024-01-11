import React, { useCallback, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import { Modal } from "../../common/components";
import SideBar from "../common/Components/SideBar/SideBar";
import routes, { getRelativeRoute } from "../routes";
import { RouteControlPdf } from "../../dashboard/components/BSDList/BSDasri/BSDasriActions/RouteControlPdf";
import { RoutePublishBsdasri } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RoutePublishBsdasri";
import { RouteSignBsdasri } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import { RouteBSDasrisSignEmissionSecretCode } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { OnboardingSlideshow } from "../../dashboard/components/OnboardingSlideshow";
import { BsdasriSignatureType, Query } from "@td/codegen-ui";
import DashboardPage from "../../Pages/Dashboard";
import { Redirect } from "../utils/routerUtils";
import {
  generatePath,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useParams
} from "react-router-dom";
import Loader from "../common/Components/Loader/Loaders";
import { ExtraSignatureType } from "../../dashboard/components/BSDList/BSDasri/types";
import { RouteBsdaRequestRevision } from "../../dashboard/components/RevisionRequestList/bsda/request";
import { RouteBsddRequestRevision } from "../../dashboard/components/RevisionRequestList/bsdd/request/RouteBsddRequestRevision";
import {
  RouteBSDasrisView,
  RouteBSDasView,
  RouteBSDDsView,
  RouteBsffsView,
  RouteBsvhusView
} from "../../dashboard/detail";
import Exports from "../../dashboard/exports/Exports";
import DashboardTabs from "./Components/DashboardTabs/DashboardTabs";
import { usePermissions } from "../../common/contexts/PermissionsContext";

import "./dashboard.scss";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        userRole
        siret
        orgId
        companyTypes
        userPermissions
      }
    }
  }
`;

const toRelative = route => {
  return getRelativeRoute(routes.dashboardv2.index, route);
};

function DashboardRoutes() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "me">>(GET_ME);
  const { updatePermissions } = usePermissions();

  const navigate = useNavigate();
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  const goBack = () => {
    navigate(-1);
  };

  const location = useLocation();
  const backgroundLocation = location.state?.background;

  const goToCollectDashboard = useCallback(() => {
    navigate(
      generatePath(routes.dashboardv2.transport.toCollect, {
        siret
      })
    );
  }, [navigate, siret]);

  const goToActionDashboard = useCallback(() => {
    navigate(
      generatePath(routes.dashboardv2.bsds.act, {
        siret
      })
    );
  }, [navigate, siret]);

  useEffect(() => {
    if (data && siret) {
      const companies = data.me.companies;
      const currentCompany = companies.find(company => company.orgId === siret);
      if (currentCompany) {
        updatePermissions(
          currentCompany.userPermissions,
          currentCompany.userRole!
        );
      }
    }
  }, [updatePermissions, data, siret]);

  if (data?.me == null) {
    return <Loader />;
  }

  const companies = data.me.companies;
  const currentCompany = companies.find(company => company.orgId === siret);

  // if the user is not part of the company whose siret is in the url
  // redirect them to their first company or account if they're not part of any company
  if (!currentCompany) {
    return (
      <Navigate
        to={
          companies.length > 0
            ? generatePath(routes.dashboardv2.bsds.index, {
                siret: companies[0].orgId
              })
            : routes.account.companies.list
        }
      />
    );
  }

  return (
    <>
      <OnboardingSlideshow />
      <div id="dashboard" className="dashboard">
        {!isMobile && (
          <SideBar>
            <DashboardTabs
              currentCompany={currentCompany}
              companies={companies}
            />
          </SideBar>
        )}
        <div className="dashboard-content">
          <Routes location={backgroundLocation ?? location}>
            <Route
              index
              element={<Redirect path={routes.dashboardv2.bsds.index} />}
            />

            <Route
              path=":siret/slips/view/:id"
              element={<Redirect path={routes.dashboardv2.bsdds.view} />}
            />

            <Route
              path=":siret/slips"
              element={
                <Navigate
                  to={location.pathname.replace(/slips/, "bsds")}
                  replace
                />
              }
            />

            <Route
              path={toRelative(routes.dashboardv2.bsdds.view)}
              element={<RouteBSDDsView />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsdds.review)}
              element={<RouteBsddRequestRevision />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsdasris.view)}
              element={<RouteBSDasrisView />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsvhus.view)}
              element={<RouteBsvhusView />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsdas.view)}
              element={<RouteBSDasView />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsdas.review)}
              element={<RouteBsdaRequestRevision />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsffs.view)}
              element={<RouteBsffsView />}
            />

            <Route
              path={toRelative(routes.dashboardv2.exports)}
              element={<Exports companies={companies} />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.index)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.drafts)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.act)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.follow)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.history)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.reviews)}
              element={<DashboardPage key="reviewsPage" />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.toReviewed)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.bsds.reviewed)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.transport.toCollect)}
              element={<DashboardPage />}
            />

            <Route
              path={toRelative(routes.dashboardv2.transport.collected)}
              element={<DashboardPage />}
            />

            <Route
              path={`${routes.dashboardv2.index}/*`}
              element={<Redirect path={routes.dashboardv2.bsds.index} />}
            />
          </Routes>

          {backgroundLocation && (
            <Routes location={location}>
              <Route
                path={toRelative(routes.dashboardv2.bsdds.view)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Aperçu du bordereau"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBSDDsView />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdds.review)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Demande de révision"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBsddRequestRevision />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.roadControl)}
                element={
                  <Modal onClose={goBack} ariaLabel="Contrôle routier" isOpen>
                    <RouteControlPdf />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.sign.publish)}
                element={
                  <Modal onClose={goBack} ariaLabel="Publier un dasri" isOpen>
                    <RoutePublishBsdasri />
                  </Modal>
                }
              />

              <Route
                path={toRelative(
                  routes.dashboardv2.bsdasris.sign.emissionSecretCode
                )}
                element={
                  <Modal
                    onClose={goToCollectDashboard}
                    ariaLabel="Signature producteur avec code de sécurité"
                    isOpen
                  >
                    <RouteBSDasrisSignEmissionSecretCode />
                  </Modal>
                }
              />

              <Route
                path={toRelative(
                  routes.dashboardv2.bsdasris.sign.directTakeover
                )}
                element={
                  <Modal
                    onClose={goToCollectDashboard}
                    ariaLabel="Emport direct transporteur"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={ExtraSignatureType.DirectTakeover}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(
                  routes.dashboardv2.bsdasris.sign.synthesisTakeover
                )}
                element={
                  <Modal
                    onClose={goToCollectDashboard}
                    ariaLabel="Bordereau de synthèse: Transporteur"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={ExtraSignatureType.SynthesisTakeOver}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.sign.transporter)}
                element={
                  <Modal
                    onClose={goToActionDashboard}
                    ariaLabel="Signature transporteur"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={BsdasriSignatureType.Transport}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.sign.emission)}
                element={
                  <Modal
                    onClose={goToActionDashboard}
                    ariaLabel="Signature producteur"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={BsdasriSignatureType.Emission}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.sign.reception)}
                element={
                  <Modal
                    onClose={goToActionDashboard}
                    ariaLabel="Signature réception"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={BsdasriSignatureType.Reception}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.sign.operation)}
                element={
                  <Modal
                    onClose={goToActionDashboard}
                    ariaLabel="Signature traitement"
                    isOpen
                  >
                    <RouteSignBsdasri
                      UIsignatureType={BsdasriSignatureType.Operation}
                    />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdasris.view)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Aperçu du bordereau"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBSDasrisView />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsvhus.view)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Aperçu du bordereau"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBsvhusView />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdas.view)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Aperçu du bordereau"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBSDasView />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsdas.review)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Demande de révision"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBsdaRequestRevision />
                  </Modal>
                }
              />

              <Route
                path={toRelative(routes.dashboardv2.bsffs.view)}
                element={
                  <Modal
                    onClose={goBack}
                    ariaLabel="Aperçu du bordereau"
                    isOpen
                    padding={false}
                    wide={true}
                  >
                    <RouteBsffsView />
                  </Modal>
                }
              />
            </Routes>
          )}
        </div>
      </div>
    </>
  );
}
export default DashboardRoutes;
