import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import React from "react";
import {
  generatePath,
  Redirect,
  Route,
  Switch,
  useHistory,
} from "react-router";
import { useParams } from "react-router-dom";
import { routes } from "common/routes";
import { InlineError } from "../common/components/Error";
import Loader from "../common/components/Loaders";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import Exports from "./exports/Exports";
import SlipsContainer from "./slips/SlipsContainer";
import Transport from "./transport/Transport";

import { Query } from "generated/graphql/types";
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

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  if (data) {
    const companies = data.me.companies!;

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
          <Switch>
            <Route path={routes.dashboard.slips.index}>
              <SlipsContainer />
            </Route>
            <Route path={routes.dashboard.transport.index}>
              <Transport />
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
    );
  }

  return <p>Aucune donnée à afficher</p>;
}
