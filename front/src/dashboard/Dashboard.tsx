import gql from "graphql-tag";
import React, { useState } from "react";
import { Query } from "react-apollo";
import { Route, RouteComponentProps } from "react-router";
import Account from "./account/Account";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import SlipsContainer from "./slips/SlipsContainer";
import Exports from "./exports/exports";

export const GET_ME = gql`
  {
    me {
      id
      name
      email
      phone
      companies {
        admin {
          id
          name
        }
        siret
        name
        address
      }
      userType
    }
  }
`;

export default function Dashboard({ match }: RouteComponentProps) {
  const [activeSiret, setActiveSiret] = useState("");

  return (
    <Query query={GET_ME}>
      {({ loading, error, data }) => {
        if (loading) return "Chargement...";
        if (error) return `Erreur ! ${error.message}`;

        return (
          <div id="dashboard" className="dashboard">
            <DashboardMenu
              me={data.me}
              match={match}
              setActiveSiret={(v: string) => setActiveSiret(v)}
            />

            <div className="dashboard-content">
              <Route
                path={`${match.path}/slips`}
                render={() => (
                  <SlipsContainer me={data.me} siret={activeSiret} />
                )}
              />
              <Route
                path={`${match.path}/account`}
                render={() => <Account me={data.me} />}
              />
              <Route
                path={`${match.path}/exports`}
                render={() => <Exports me={data.me} />}
              />
            </div>
          </div>
        );
      }}
    </Query>
  );
}
