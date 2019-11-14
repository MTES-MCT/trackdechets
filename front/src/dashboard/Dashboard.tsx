import gql from "graphql-tag";
import React from "react";
import { Query } from "react-apollo";
import { Route, RouteComponentProps } from "react-router";
import Account from "./account/Account";
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
      name
      email
      phone
      companies {
        id
        admins {
          id
          name
        }
        siret
        name
        address
        securityCode
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

  componentDidMount() {
    // set activeSiret from localStorage if any
    const cachedSiret = currentSiretService.getSiret();
    if (cachedSiret) {
      this.setState({ activeSiret: cachedSiret });
    }
  }

  handleCompanyChange(siret: string) {
    this.setState({ activeSiret: siret });
  }

  render() {
    const { match } = this.props;
    const { activeSiret } = this.state;

    return (
      <Query<MeData> query={GET_ME}>
        {({ loading, error, data }) => {
          if (loading) return "Chargement...";
          if (error) return `Erreur ! ${error.message}`;

          if (data) {
            // default to first company siret if it is not set
            // in the component state
            const siret = !!activeSiret
              ? activeSiret
              : data.me.companies.length > 0
              ? data.me.companies[0].siret
              : "";

            return (
              <div id="dashboard" className="dashboard">
                <DashboardMenu
                  me={data.me}
                  match={match}
                  siret={siret}
                  handleCompanyChange={this.handleCompanyChange.bind(this)}
                />

                <div className="dashboard-content">
                  <Route
                    path={`${match.path}/slips`}
                    render={() => <SlipsContainer me={data.me} siret={siret} />}
                  />
                  <Route
                    path={`${match.path}/transport`}
                    render={() => <Transport me={data.me} siret={siret} />}
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
          }
        }}
      </Query>
    );
  }
}
