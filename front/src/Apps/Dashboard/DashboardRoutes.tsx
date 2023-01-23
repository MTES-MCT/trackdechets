import { useQuery, gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import React from "react";
import {
  generatePath,
  Redirect,
  Route,
  RouteChildrenProps,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import { Location } from "history";
import routes from "common/routes";
import { Modal } from "common/components";
import Loader from "../../common/components/Loaders";
import Exports from "../../dashboard/exports/Exports";
import { ExtraSignatureType } from "../../dashboard/components/BSDList/BSDasri/types";
import { Query, BsdasriSignatureType } from "generated/graphql/types";
import { RouteBSDasrisSignEmissionSecretCode } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { RoutePublishBsdasri } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RoutePublishBsdasri";
import { RouteSignBsdasri } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import { RouteControlPdf } from "dashboard/components/BSDList/BSDasri/BSDasriActions/RouteControlPdf";
import {
  RouteBSDasrisView,
  RouteBsvhusView,
  RouteBsffsView,
  RouteBSDDsView,
  RouteBSDasView,
} from "../../dashboard/detail";
import {
  RouteTransportToCollect,
  RouteTransportCollected,
} from "../../dashboard/transport";
import { RouteBsdsReview } from "../../dashboard/bsds/review";
import { RouteBsddRequestRevision } from "../../dashboard/components/RevisionRequestList/bsdd/request/RouteBsddRequestRevision";
import { RouteBsdaRequestRevision } from "../../dashboard/components/RevisionRequestList/bsda/request";
import { OnboardingSlideshow } from "dashboard/components/OnboardingSlideshow";
import SideMenu from "common/components/SideMenu";
import { DashboardTabs } from "dashboard/DashboardTabs";
import DashboardPage from "Pages/Dashboard";

import "./dashboard.scss";

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
      }
    }
  }
`;

function DashboardRoutes() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "me">>(GET_ME);

  const history = useHistory();
  const location = useLocation<{ background?: Location }>();
  const backgroundLocation = location.state?.background;
  const toCollectDashboard = {
    pathname: generatePath(routes.dashboard.transport.toCollect, {
      siret,
    }),
  };
  const actionDashboard = {
    pathname: generatePath(routes.dashboard.bsds.act, {
      siret,
    }),
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
      <Redirect
        to={
          companies.length > 0
            ? generatePath(routes.dashboard.bsds.drafts, {
                siret: companies[0].orgId,
              })
            : routes.account.companies.list
        }
      />
    );
  }

  const dashboardPageComponent = <DashboardPage />;

  return (
    <>
      <OnboardingSlideshow />
      <div id="dashboard" className="dashboard">
        <SideMenu>
          <DashboardTabs
            currentCompany={currentCompany}
            companies={companies}
          />
        </SideMenu>
        <div className="dashboard-content">
          <Switch location={backgroundLocation ?? location}>
            <Route path="/dashboard/:siret/slips/view/:id" exact>
              {({
                match,
              }: RouteChildrenProps<{ siret: string; id: string }>) => (
                <Redirect
                  to={generatePath(routes.dashboard.bsdds.view, {
                    siret: match!.params.siret,
                    id: match!.params.id,
                  })}
                />
              )}
            </Route>
            <Route path="/dashboard/:siret/slips">
              {({ location }) => (
                <Redirect to={location.pathname.replace(/slips/, "bsds")} />
              )}
            </Route>

            <Route path={routes.dashboard.bsdds.view}>
              <RouteBSDDsView />
            </Route>
            <Route path={routes.dashboard.bsdds.review}>
              <RouteBsddRequestRevision />
            </Route>
            <Route path={routes.dashboard.bsdasris.view}>
              <RouteBSDasrisView />
            </Route>
            <Route path={routes.dashboard.bsvhus.view}>
              <RouteBsvhusView />
            </Route>
            <Route path={routes.dashboard.bsdas.view}>
              <RouteBSDasView />
            </Route>
            <Route path={routes.dashboard.bsdas.review}>
              <RouteBsdaRequestRevision />
            </Route>
            <Route path={routes.dashboard.bsffs.view}>
              <RouteBsffsView />
            </Route>

            <Route path={routes.dashboard.bsds.drafts}>
              {dashboardPageComponent}
            </Route>
            <Route path={routes.dashboard.bsds.act}>
              {dashboardPageComponent}
            </Route>
            <Route path={routes.dashboard.bsds.follow}>
              {dashboardPageComponent}
            </Route>
            <Route path={routes.dashboard.bsds.history}>
              {dashboardPageComponent}
            </Route>

            <Route path={routes.dashboard.bsds.reviews}>
              <RouteBsdsReview />
            </Route>
            <Route path={routes.dashboard.transport.toCollect}>
              <RouteTransportToCollect />
            </Route>
            <Route path={routes.dashboard.transport.collected}>
              <RouteTransportCollected />
            </Route>
            <Route path={routes.dashboard.exports}>
              <Exports
                companies={filter(Exports.fragments.company, companies)}
              />
            </Route>
            <Redirect
              to={generatePath(routes.dashboard.bsds.drafts, {
                siret,
              })}
            />
          </Switch>

          {backgroundLocation && (
            <Switch location={location}>
              <Route path={routes.dashboard.bsdds.view}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDDsView />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdds.review}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Demande de révision"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsddRequestRevision />
                </Modal>
              </Route>
              <Route path={routes.dashboard.roadControl}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Contrôle routier"
                  isOpen
                >
                  <RouteControlPdf />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.publish}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Publier un dasri"
                  isOpen
                >
                  <RoutePublishBsdasri />
                </Modal>
              </Route>

              <Route path={routes.dashboard.bsdasris.sign.emissionSecretCode}>
                <Modal
                  onClose={() => history.push(toCollectDashboard)}
                  ariaLabel="Signature producteur avec code de sécurité"
                  isOpen
                >
                  <RouteBSDasrisSignEmissionSecretCode />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.directTakeover}>
                <Modal
                  onClose={() => history.push(toCollectDashboard)}
                  ariaLabel="Emport direct transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.DirectTakeover}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.synthesisTakeover}>
                <Modal
                  onClose={() => history.push(toCollectDashboard)}
                  ariaLabel="Bordereau de synthèse: Transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.SynthesisTakeOver}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.transporter}>
                <Modal
                  onClose={() => history.push(actionDashboard)}
                  ariaLabel="Signature transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Transport}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.emission}>
                <Modal
                  onClose={() => history.push(actionDashboard)}
                  ariaLabel="Signature producteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Emission}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.reception}>
                <Modal
                  onClose={() => history.push(actionDashboard)}
                  ariaLabel="Signature réception"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Reception}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.sign.operation}>
                <Modal
                  onClose={() => history.push(actionDashboard)}
                  ariaLabel="Signature traitement"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Operation}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdasris.view}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDasrisView />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsvhus.view}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsvhusView />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdas.view}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDasView />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsdas.review}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Demande de révision"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsdaRequestRevision />
                </Modal>
              </Route>
              <Route path={routes.dashboard.bsffs.view}>
                <Modal
                  onClose={() => history.goBack()}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsffsView />
                </Modal>
              </Route>
            </Switch>
          )}
        </div>
      </div>
    </>
  );
}
export default DashboardRoutes;
