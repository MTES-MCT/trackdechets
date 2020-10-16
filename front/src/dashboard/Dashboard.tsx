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
import { useParams, useRouteMatch } from "react-router-dom";
import { routes } from "common/routes";
import { InlineError } from "../common/components/Error";
import Loader from "../common/components/Loaders";
import { currentSiretService } from "./DashboardCompanySelector";
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

export const SiretContext = React.createContext({
  siret: "",
});

export default function Dashboard() {
  const match = useRouteMatch();
  const { siret } = useParams<{ siret?: string }>();
  const history = useHistory();

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: () => {
      if (siret) {
        currentSiretService.setSiret(siret);
        return;
      }
    },
  });

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  if (data) {
    const companies = data.me.companies;

    // if user doesn't belong to any company, redirect them to their account's companies
    if (!companies || companies.length === 0) {
      return <Redirect to="/account/companies" />;
    }

    // redirect to the user's first company if the siret is missing or invalid
    if (!siret || !companies.find(company => company.siret === siret)) {
      return (
        <Redirect
          to={generatePath(routes.dashboard.slips.drafts, {
            siret: companies[0].siret,
          })}
        />
      );
    }

    return (
      <SiretContext.Provider value={{ siret }}>
        <div id="dashboard" className="dashboard">
          <DashboardMenu
            me={data.me}
            match={match}
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
      </SiretContext.Provider>
    );
  }

  return <p>Aucune donnée à afficher</p>;
}
