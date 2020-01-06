import gql from "graphql-tag";
import React from "react";
import { Query } from "@apollo/react-components";
import { Route, RouteComponentProps } from "react-router";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import SlipsContainer from "./slips/SlipsContainer";
import Exports from "./exports/exports";
import Transport from "./transport/Transport";
import { currentSiretService } from "./CompanySelector";
import { Me } from "../login/model";

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

interface MeData {
  me: Me;
}

type S = {
  activeSiret: string;
};

export default class Dashboard extends React.Component<RouteComponentProps, S> {
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = { activeSiret: "" };
  }

  handleCompanyChange(siret: string) {
    this.setState({ activeSiret: siret });
  }

  render() {
    const { match } = this.props;
    const { activeSiret } = this.state;

    return (
      <Query<MeData>
        query={GET_ME}
        onCompleted={data => {
          // try to retrieve current siret from localstorage, if not set use siret from first associated company
          let currentSiret = currentSiretService.getSiret();
          if (!currentSiret) {
            const companies = data.me.companies;
            currentSiret =
              companies.length > 0 ? data.me.companies[0].siret : "";
            currentSiretService.setSiret(currentSiret);
          }
          this.setState({ activeSiret: currentSiret });
        }}
      >
        {({ loading, error, data }) => {
          if (loading) return <p>Chargement...</p>;
          if (error) return <p>{`Erreur ! ${error.message}`}</p>;

          if (data) {
            return (
              <div id="dashboard" className="dashboard">
                <DashboardMenu
                  me={data.me}
                  match={match}
                  siret={activeSiret}
                  handleCompanyChange={this.handleCompanyChange.bind(this)}
                />

                <div className="dashboard-content">
                  <Route
                    path={`${match.path}/slips`}
                    render={() => (
                      <SlipsContainer me={data.me} siret={activeSiret} />
                    )}
                  />
                  <Route
                    path={`${match.path}/transport`}
                    render={() => (
                      <Transport me={data.me} siret={activeSiret} />
                    )}
                  />
                  <Route
                    path={`${match.path}/exports`}
                    render={() => <Exports me={data.me} />}
                  />
                </div>
              </div>
            );
          }

          return null;
        }}
      </Query>
    );
  }
}
