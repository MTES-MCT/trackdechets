import { gql, useQuery } from "@apollo/client";
import { Modal } from "common/components";
import SideMenu from "common/components/SideMenu";
import routes from "Apps/routes";
import { RouteControlPdf } from "dashboard/components/BSDList/BSDasri/BSDasriActions/RouteControlPdf";
import { RoutePublishBsdasri } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RoutePublishBsdasri";
import { RouteSignBsdasri } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import { RouteBSDasrisSignEmissionSecretCode } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { OnboardingSlideshow } from "dashboard/components/OnboardingSlideshow";
import { BsdasriSignatureType, Query } from "generated/graphql/types";
import { filter } from "graphql-anywhere";
import { Location } from "history";
import DashboardPage from "Pages/Dashboard";
import React, { useCallback } from "react";
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
import Loader from "../common/Components/Loader/Loaders";
import { ExtraSignatureType } from "../../dashboard/components/BSDList/BSDasri/types";
import { RouteBsdaRequestRevision } from "../../dashboard/components/RevisionRequestList/bsda/request";
import { RouteBsddRequestRevision } from "../../dashboard/components/RevisionRequestList/bsdd/request/RouteBsddRequestRevision";
import {
  RouteBSDasrisView,
  RouteBSDasView,
  RouteBSDDsView,
  RouteBsffsView,
  RouteBsvhusView,
} from "../../dashboard/detail";
import Exports from "../../dashboard/exports/Exports";
import DashboardTabs from "./Components/DashboardTabs/DashboardTabs";

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

  const goBack = useCallback(() => {
    history.goBack();
  }, [history]);

  const location = useLocation<{ background?: Location }>();
  const backgroundLocation = location.state?.background;

  const goToCollectDashboard = useCallback(() => {
    history.push({
      pathname: generatePath(routes.dashboardv2.transport.toCollect, {
        siret,
      }),
    });
  }, [history, siret]);

  const goToActionDashboard = useCallback(() => {
    history.push({
      pathname: generatePath(routes.dashboardv2.bsds.act, {
        siret,
      }),
    });
  }, [history, siret]);

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
            ? generatePath(routes.dashboardv2.bsds.drafts, {
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
            <Route path="/v2/dashboard/:siret/slips/view/:id" exact>
              {({
                match,
              }: RouteChildrenProps<{ siret: string; id: string }>) => (
                <Redirect
                  to={generatePath(routes.dashboardv2.bsdds.view, {
                    siret: match!.params.siret,
                    id: match!.params.id,
                  })}
                />
              )}
            </Route>
            <Route path="/v2/dashboard/:siret/slips">
              {({ location }) => (
                <Redirect to={location.pathname.replace(/slips/, "bsds")} />
              )}
            </Route>

            <Route path={routes.dashboardv2.bsdds.view}>
              <RouteBSDDsView />
            </Route>
            <Route path={routes.dashboardv2.bsdds.review}>
              <RouteBsddRequestRevision />
            </Route>
            <Route path={routes.dashboardv2.bsdasris.view}>
              <RouteBSDasrisView />
            </Route>
            <Route path={routes.dashboardv2.bsvhus.view}>
              <RouteBsvhusView />
            </Route>
            <Route path={routes.dashboardv2.bsdas.view}>
              <RouteBSDasView />
            </Route>
            <Route path={routes.dashboardv2.bsdas.review}>
              <RouteBsdaRequestRevision />
            </Route>
            <Route path={routes.dashboardv2.bsffs.view}>
              <RouteBsffsView />
            </Route>
            <Route path={routes.dashboardv2.exports}>
              <Exports
                companies={filter(Exports.fragments.company, companies)}
              />
            </Route>

            <Route
              path={[
                routes.dashboardv2.bsds.drafts,
                routes.dashboardv2.bsds.act,
                routes.dashboardv2.bsds.follow,
                routes.dashboardv2.bsds.history,
                routes.dashboardv2.bsds.reviews,
                routes.dashboardv2.transport.toCollect,
                routes.dashboardv2.transport.collected,
              ]}
            >
              {dashboardPageComponent}
            </Route>

            <Redirect
              to={generatePath(routes.dashboardv2.bsds.drafts, {
                siret,
              })}
            />
          </Switch>

          {backgroundLocation && (
            <Switch location={location}>
              <Route path={routes.dashboardv2.bsdds.view}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDDsView />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdds.review}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Demande de révision"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsddRequestRevision />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.roadControl}>
                <Modal onClose={goBack} ariaLabel="Contrôle routier" isOpen>
                  <RouteControlPdf />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.publish}>
                <Modal onClose={goBack} ariaLabel="Publier un dasri" isOpen>
                  <RoutePublishBsdasri />
                </Modal>
              </Route>

              <Route path={routes.dashboardv2.bsdasris.sign.emissionSecretCode}>
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Signature producteur avec code de sécurité"
                  isOpen
                >
                  <RouteBSDasrisSignEmissionSecretCode />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.directTakeover}>
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Emport direct transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.DirectTakeover}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.synthesisTakeover}>
                <Modal
                  onClose={goToCollectDashboard}
                  ariaLabel="Bordereau de synthèse: Transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={ExtraSignatureType.SynthesisTakeOver}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.transporter}>
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature transporteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Transport}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.emission}>
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature producteur"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Emission}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.reception}>
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature réception"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Reception}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.sign.operation}>
                <Modal
                  onClose={goToActionDashboard}
                  ariaLabel="Signature traitement"
                  isOpen
                >
                  <RouteSignBsdasri
                    UIsignatureType={BsdasriSignatureType.Operation}
                  />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdasris.view}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDasrisView />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsvhus.view}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsvhusView />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdas.view}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Aperçu du bordereau"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBSDasView />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsdas.review}>
                <Modal
                  onClose={goBack}
                  ariaLabel="Demande de révision"
                  isOpen
                  padding={false}
                  wide={true}
                >
                  <RouteBsdaRequestRevision />
                </Modal>
              </Route>
              <Route path={routes.dashboardv2.bsffs.view}>
                <Modal
                  onClose={goBack}
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
