import React from "react";
import { useQuery, gql } from "@apollo/client";
import {
  generatePath,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useParams
} from "react-router-dom";
import routes, { getRelativeRoute } from "../Apps/routes";
import { Modal } from "../common/components";
import Loader from "../Apps/common/Components/Loader/Loaders";
import "./Dashboard.scss";
import Exports from "./exports/Exports";
import { ExtraSignatureType } from "./components/BSDList/BSDasri/types";
import { Redirect } from "../Apps/utils/routerUtils";

import { Query, BsdasriSignatureType } from "@td/codegen-ui";
import {
  RouteBsdsAct,
  RouteBsdsDrafts,
  RouteBsdsFollow,
  RouteBsdsHistory
} from "./bsds";
import { RouteBSDasrisSignEmissionSecretCode } from "./components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { RoutePublishBsdasri } from "./components/BSDList/BSDasri/WorkflowAction/RoutePublishBsdasri";
import { RouteSignBsdasri } from "./components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import { RouteControlPdf } from "./components/BSDList/BSDasri/BSDasriActions/RouteControlPdf";
import {
  RouteBSDasrisView,
  RouteBsvhusView,
  RouteBsffsView,
  RouteBSDDsView,
  RouteBSDasView
} from "./detail";
import { RouteTransportToCollect, RouteTransportCollected } from "./transport";
import { RouteBsddRequestRevision } from "./components/RevisionRequestList/bsdd/request/RouteBsddRequestRevision";
import { DashboardTabs } from "./DashboardTabs";
import SideMenu from "../common/components/SideMenu";
import { RouteBsdaRequestRevision } from "./components/RevisionRequestList/bsda/request";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        orgId
        companyTypes
        userPermissions
      }
    }
  }
`;

const toRelative = route => {
  return getRelativeRoute(routes.dashboard.index, route);
};
//file to remove not used anymore
export default function Dashboard() {
  const { siret } = useParams<{ siret: string; id: string }>();
  const { data } = useQuery<Pick<Query, "me">>(GET_ME);

  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state?.background;
  const toCollectDashboard = {
    pathname: generatePath(routes.dashboard.transport.toCollect, {
      siret
    })
  };
  const actionDashboard = {
    pathname: generatePath(routes.dashboard.bsds.act, {
      siret
    })
  };

  if (data?.me == null) {
    return <Loader />;
  }

  const companies = data.me.companies;
  const currentCompany = companies.find(company => company.orgId === siret);

  // if the user is not part of the company whose siret is in the url
  // redirect them to their first company or account if they're not part of any company
  if (currentCompany == null) {
    return (
      <Navigate
        to={
          companies.length > 0
            ? generatePath(routes.dashboard.bsds.drafts, {
                siret: companies[0].orgId
              })
            : routes.account.companies.list
        }
      />
    );
  }

  return (
    <div id="dashboard" className="dashboard">
      <SideMenu>
        <DashboardTabs currentCompany={currentCompany} companies={companies} />
      </SideMenu>

      <div className="dashboard-content">
        <Routes location={backgroundLocation ?? location}>
          <Route
            index
            element={<Redirect path={routes.dashboard.bsds.drafts} />}
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
            element={<RouteBsvhusView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdas.view)}
            element={<RouteBSDasView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsdas.review)}
            element={<RouteBsdaRequestRevision />}
          />

          <Route
            path={toRelative(routes.dashboard.bsffs.view)}
            element={<RouteBsffsView />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.drafts)}
            element={<RouteBsdsDrafts />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.act)}
            element={<RouteBsdsAct />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.follow)}
            element={<RouteBsdsFollow />}
          />

          <Route
            path={toRelative(routes.dashboard.bsds.history)}
            element={<RouteBsdsHistory />}
          />

          <Route
            path={toRelative(routes.dashboard.transport.toCollect)}
            element={<RouteTransportToCollect />}
          />

          <Route
            path={toRelative(routes.dashboard.transport.collected)}
            element={<RouteTransportCollected />}
          />

          <Route
            path={toRelative(routes.dashboard.exports)}
            element={<Exports companies={companies} />}
          />

          <Route
            path={`${routes.dashboard.index}/*`}
            element={<Redirect path={routes.dashboard.bsds.drafts} />}
          />
        </Routes>

        {backgroundLocation && (
          <Routes location={location}>
            <Route
              path={toRelative(routes.dashboard.bsdds.view)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.bsdds.review)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.roadControl)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
                  ariaLabel="Contrôle routier"
                  isOpen
                >
                  <RouteControlPdf />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.publish)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
                  ariaLabel="Publier un dasri"
                  isOpen
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
                  onClose={() => navigate(toCollectDashboard)}
                  ariaLabel="Signature producteur avec code de sécurité"
                  isOpen
                >
                  <RouteBSDasrisSignEmissionSecretCode />
                </Modal>
              }
            />

            <Route
              path={toRelative(routes.dashboard.bsdasris.sign.directTakeover)}
              element={
                <Modal
                  onClose={() => navigate(toCollectDashboard)}
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
                routes.dashboard.bsdasris.sign.synthesisTakeover
              )}
              element={
                <Modal
                  onClose={() => navigate(toCollectDashboard)}
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
              path={toRelative(routes.dashboard.bsdasris.sign.transporter)}
              element={
                <Modal
                  onClose={() => navigate(toCollectDashboard)}
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
              path={toRelative(routes.dashboard.bsdasris.sign.emission)}
              element={
                <Modal
                  onClose={() => navigate(actionDashboard)}
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
              path={toRelative(routes.dashboard.bsdasris.sign.reception)}
              element={
                <Modal
                  onClose={() => navigate(actionDashboard)}
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
              path={toRelative(routes.dashboard.bsdasris.sign.operation)}
              element={
                <Modal
                  onClose={() => navigate(actionDashboard)}
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
              path={toRelative(routes.dashboard.bsdasris.view)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.bsvhus.view)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.bsdas.view)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.bsdas.review)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
              path={toRelative(routes.dashboard.bsffs.view)}
              element={
                <Modal
                  onClose={() => navigate(-1)}
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
  );
}
