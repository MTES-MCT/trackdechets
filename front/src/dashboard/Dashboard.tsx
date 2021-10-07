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
import Loader from "../common/components/Loaders";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import Exports from "./exports/Exports";
import { OnboardingSlideshow } from "./components/OnboardingSlideshow";
import { ExtraSignatureType } from "dashboard/components/BSDList/BSDasri/types";

import { Query, BsdasriSignatureType } from "generated/graphql/types";
import Stats from "./stats/Stats";
import {
  RouteBsdsAct,
  RouteBsdsDrafts,
  RouteBsdsFollow,
  RouteBsdsHistory,
} from "./bsds";
import { RouteBSDasrisSignEmissionSecretCode } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasriSecretCode";
import { RouteSignBsdasri } from "dashboard/components/BSDList/BSDasri/WorkflowAction/RouteSignBsdasri";
import {
  RouteBSDasrisView,
  RouteBsvhusView,
  RouteBsffsView,
  RouteBSDDsView,
} from "./detail";
import { RouteTransportToCollect, RouteTransportCollected } from "./transport";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        companyTypes
      }
    }
  }
`;

export default function Dashboard() {
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

  // if the user is not part of the company whose siret is in the url
  // redirect them to their first company or account if they're not part of any company
  if (!companies.find(company => company.siret === siret)) {
    return (
      <Redirect
        to={
          companies.length > 0
            ? generatePath(routes.dashboard.bsds.drafts, {
                siret: companies[0].siret,
              })
            : routes.account.companies
        }
      />
    );
  }

  return (
    <>
      <OnboardingSlideshow />
      <div id="dashboard" className="dashboard">
        <DashboardMenu
          me={data.me}
          handleCompanyChange={siret =>
            history.push(
              generatePath(routes.dashboard.bsds.drafts, {
                siret,
              })
            )
          }
        />

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
            <Route path={routes.dashboard.bsdasris.view}>
              <RouteBSDasrisView />
            </Route>
            <Route path={routes.dashboard.bsvhus.view}>
              <RouteBsvhusView />
            </Route>
            <Route path={routes.dashboard.bsffs.view}>
              <RouteBsffsView />
            </Route>
            <Route path={routes.dashboard.bsds.drafts}>
              <RouteBsdsDrafts />
            </Route>
            <Route path={routes.dashboard.bsds.act}>
              <RouteBsdsAct />
            </Route>
            <Route path={routes.dashboard.bsds.follow}>
              <RouteBsdsFollow />
            </Route>
            <Route path={routes.dashboard.bsds.history}>
              <RouteBsdsHistory />
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
            <Route path={routes.dashboard.stats}>
              <Stats />
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
