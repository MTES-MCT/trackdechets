import React, { useCallback } from "react";
import { Modal } from "../../common/components";
import SideBar from "../common/Components/SideBar/SideBar";
import routes, { getRelativeRoute } from "../routes";
import { RouteControlPdf } from "../../dashboard/components/BSDList/BSDasri/BSDasriActions/RouteControlPdf";
import { RoutePublishBsdasri } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RoutePublishBsdasri";
import { RouteSignBsdasri } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import { RouteBSDasrisSignEmissionSecretCode } from "../../dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { BsdasriSignatureType, UserRole } from "@td/codegen-ui";
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
import { RouteBsdaRequestRevision } from "./Components/RevisionRequestList/bsda/request";
import { RouteBsdasriRequestRevision } from "./Components//RevisionRequestList/bsdasri/request";
import { RouteBsddRequestRevision } from "./Components//RevisionRequestList/bsdd/request/RouteBsddRequestRevision";
import {
  RouteBSDasrisView,
  RouteBSDasView,
  RouteBSDDsView,
  RouteBsffsView,
  RouteBspaohsView
} from "../../dashboard/detail";
import DashboardTabs from "./Components/DashboardTabs/DashboardTabs";
import "./dashboard.scss";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import FormContainer from "./Creation/FormContainer";
import { BsdTypename } from "../common/types/bsdTypes";
import BSDPreviewContainer from "./Preview/BSDPreviewContainer";
import { usePermissions } from "../../common/contexts/PermissionsContext";
import { useAuth } from "../../common/contexts/AuthContext";
import { useMyCompany } from "../common/hooks/useMyCompany";

const toRelative = route => {
  return getRelativeRoute(routes.dashboard.index, route);
};

function DashboardRoutes() {
  const { siret } = useParams<{ siret: string | undefined }>();
  const { user } = useAuth();
  const { company: currentCompany } = useMyCompany(siret);
  const { defaultOrgId, permissionsInfos } = usePermissions(siret);

  const navigate = useNavigate();
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  const goBack = () => {
    navigate(-1);
  };

  const location = useLocation();
  const backgroundLocation = location.state?.background;

  const goToCollectDashboard = useCallback(() => {
    navigate(
      generatePath(routes.dashboard.transport.toCollect, {
        siret
      })
    );
  }, [navigate, siret]);

  const goToActionDashboard = useCallback(() => {
    navigate(
      generatePath(routes.dashboard.bsds.act, {
        siret
      })
    );
  }, [navigate, siret]);

  if (!user) {
    return <Loader />;
  }

  // if the user is not part of the company whose siret is in the url
  // redirect them to their first company or account if they're not part of any company
  if (!currentCompany) {
    return (
      <Navigate
        to={
          defaultOrgId
            ? generatePath(
                permissionsInfos.orgPermissionsInfos
                  .find(infos => infos.orgId === defaultOrgId)
                  ?.role?.includes(UserRole.Driver)
                  ? routes.dashboard.transport.toCollect
                  : routes.dashboard.bsds.index,
                {
                  siret: defaultOrgId
                }
              )
            : routes.companies.index
        }
      />
    );
  }

  const overviewModalSize = "XL";
  const reviewModalSize = "TD_SIZE";

  return (
    <div id="dashboard" className="dashboard">
      {!isMobile && (
        <SideBar>
          <DashboardTabs currentCompany={currentCompany} />
        </SideBar>
      )}
      <div className="dashboard-content">
        <Routes location={backgroundLocation ?? location}>
          <Route
            index
            element={
              <Redirect
                path={
                  currentCompany.userRole?.includes(UserRole.Driver)
                    ? routes.dashboard.transport.toCollect
                    : routes.dashboard.bsds.index
                }
              />
            }
          />

          <Route
            path=":siret/slips/view/:id"
            element={<Redirect path={routes.dashboard.bsdds.view} />}
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
            path={toRelative(routes.dashboard.bsdds.view)}
            element={<RouteBSDDsView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdds.review)}
            element={<RouteBsddRequestRevision />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdasris.view)}
            element={<RouteBSDasrisView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsvhus.view)}
            element={<BSDPreviewContainer bsdTypeName={BsdTypename.Bsvhu} />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdas.view)}
            element={<RouteBSDasView />}
          />

          <Route
            path={toRelative(routes.dashboard.bspaohs.view)}
            element={<RouteBspaohsView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdas.review)}
            element={<RouteBsdaRequestRevision />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdasris.review)}
            element={<RouteBsdasriRequestRevision />}
          />
          <Route
            path={toRelative(routes.dashboard.bsffs.view)}
            element={<RouteBsffsView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.index)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.drafts)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.act)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.follow)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.history)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.revisions.pending)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.revisions.emitted)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.revisions.received)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.revisions.reviewed)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.transport.toCollect)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.transport.collected)}
            element={<DashboardPage />}
          />

          <Route
            path={toRelative(routes.dashboard.transport.return)}
            element={<DashboardPage />}
          />

          <Route
            path={`${routes.dashboard.index}/:siret/*`}
            element={
              <Redirect
                path={
                  currentCompany.userRole?.includes(UserRole.Driver)
                    ? routes.dashboard.transport.toCollect
                    : routes.dashboard.bsds.index
                }
              />
            }
          />
        </Routes>

        {backgroundLocation && (
          <Routes location={location}>
            <Route
              path={toRelative(routes.dashboard.bsdds.view)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  size={overviewModalSize}
                >
                  <RouteBSDDsView />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdds.review)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Demande de révision"
                  isOpen
                  size={reviewModalSize}
                >
                  <RouteBsddRequestRevision />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.roadControl)}
              element={
                <Modal onClose={goBack} ariaLabel="Contrôle routier" isOpen>
                  <RouteControlPdf />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.publish)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Publier un dasri"
                  isOpen
                  size="L"
                >
                  <RoutePublishBsdasri />
                </Modal>
              }
            />

            <Route
              path={toRelative(
                routes.dashboard.bsdasris.sign.emissionSecretCode
              )}
              element={
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Signature producteur avec code de sécurité"
                  isOpen
                  size="L"
                >
                  <RouteBSDasrisSignEmissionSecretCode />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.directTakeover)}
              element={
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Emport direct transporteur"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.DirectTakeover}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(
                routes.dashboard.bsdasris.sign.synthesisTakeover
              )}
              element={
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Bordereau de synthèse: Transporteur"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.SynthesisTakeOver}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.transporter)}
              element={
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature transporteur"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Transport}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.emission)}
              element={
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature producteur"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Emission}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.reception)}
              element={
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature réception"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Reception}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.operation)}
              element={
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature traitement"
                  isOpen
                  size="L"
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Operation}
                  />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.view)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  size={overviewModalSize}
                >
                  <RouteBSDasrisView />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsvhus.view)}
              element={<BSDPreviewContainer bsdTypeName={BsdTypename.Bsvhu} />}
            />

            <Route
              path={toRelative(routes.dashboard.bsdas.view)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  size={overviewModalSize}
                >
                  <RouteBSDasView />
                </Modal>
              }
            />
            <Route
              path={toRelative(routes.dashboard.bspaohs.view)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  size={overviewModalSize}
                >
                  <RouteBspaohsView />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdas.review)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Demande de révision"
                  isOpen
                  size={reviewModalSize}
                >
                  <RouteBsdaRequestRevision />
                </Modal>
              }
            />
            <Route
              path={toRelative(routes.dashboard.bsdasris.review)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Demande de révision"
                  isOpen
                  size={reviewModalSize}
                >
                  <RouteBsdasriRequestRevision />
                </Modal>
              }
            />
            <Route
              path={toRelative(routes.dashboard.bsffs.view)}
              element={
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  size={overviewModalSize}
                >
                  <RouteBsffsView />
                </Modal>
              }
            />

            {/** create / update Form modals */}
            <Route
              path={toRelative(routes.dashboard.bspaohs.create)}
              element={<FormContainer bsdTypeName={BsdTypename.Bspaoh} />}
            />
            <Route
              path={toRelative(routes.dashboard.bspaohs.edit)}
              element={<FormContainer bsdTypeName={BsdTypename.Bspaoh} />}
            />

            <Route
              path={toRelative(routes.dashboard.bsvhus.create)}
              element={<FormContainer bsdTypeName={BsdTypename.Bsvhu} />}
            />

            <Route
              path={toRelative(routes.dashboard.bsvhus.edit)}
              element={<FormContainer bsdTypeName={BsdTypename.Bsvhu} />}
            />
          </Routes>
        )}
      </div>
    </div>
  );
}
export default DashboardRoutes;
