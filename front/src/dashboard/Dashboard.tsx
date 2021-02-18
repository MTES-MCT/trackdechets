import { useQuery, gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import React from "react";
import {
  generatePath,
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import { Location } from "history";
import routes from "common/routes";
import { Modal } from "common/components";
import { InlineError } from "../common/components/Error";
import Loader from "../common/components/Loaders";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import Exports from "./exports/Exports";
import { OnboardingSlideshow } from "./OnboardingSlideshow";
import { RouteSlipsCollected, RouteSlipsToCollect } from "./transport";
import {
  RouteSlipsView,
  RouteSlipsAct,
  RouteSlipsDrafts,
  RouteSlipsFollow,
  RouteSlipsHistory,
} from "./slips";

import { Query } from "generated/graphql/types";
import DisclaimerBanner from "./DisclaimerBanner";
import Stats from "./stats/Stats";

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
  const history = useHistory();
  const location = useLocation<{ background?: Location }>();
  const backgroundLocation = location.state?.background;

  const { error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  if (error) {
    return <InlineError apolloError={error} />;
  }

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
            ? generatePath(routes.dashboard.slips.drafts, {
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
              generatePath(routes.dashboard.slips.drafts, {
                siret,
              })
            )
          }
        />

        <div className="dashboard-content">
          <DisclaimerBanner />
          <Switch location={backgroundLocation ?? location}>
            <Route path={routes.dashboard.slips.view}>
              <RouteSlipsView />
            </Route>
            <Route path={routes.dashboard.slips.drafts}>
              <RouteSlipsDrafts />
            </Route>
            <Route path={routes.dashboard.slips.act}>
              <RouteSlipsAct />
            </Route>
            <Route path={routes.dashboard.slips.follow}>
              <RouteSlipsFollow />
            </Route>
            <Route path={routes.dashboard.slips.history}>
              <RouteSlipsHistory />
            </Route>
            <Route path={routes.dashboard.transport.toCollect}>
              <RouteSlipsToCollect />
            </Route>
            <Route path={routes.dashboard.transport.collected}>
              <RouteSlipsCollected />
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
              to={generatePath(routes.dashboard.slips.drafts, {
                siret,
              })}
            />
          </Switch>
        </div>
      </div>

      {backgroundLocation && (
        <Route path={routes.dashboard.slips.view}>
          <Modal
            ariaLabel="Aperçu"
            onClose={() => {
              history.goBack();
            }}
            isOpen
          >
            <RouteSlipsView />
          </Modal>
        </Route>
      )}
    </>
  );
}
