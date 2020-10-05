import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import React from "react";
import { Redirect, Route, useHistory } from "react-router";
import { useParams, useRouteMatch } from "react-router-dom";
import { InlineError } from "../common/Error";
import Loader from "../common/Loader";
import { currentSiretService } from "./CompanySelector";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import Exports from "./exports/Exports";
import SlipsContainer from "./slips/SlipsContainer";
import Transport from "./transport/Transport";
import { Query } from "../generated/graphql/types";
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
  const { siret } = useParams();
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

    // As long as you don't belong to a company, you can't access the dashnoard
    if (!companies || companies.length === 0) {
      return <Redirect to="/account/companies" />;
    }

    if (!siret) {
      return <Redirect to={`${match.url}/${companies[0].siret}`} />;
    }

    if (!companies.find(company => company.siret === siret)) {
      return <Redirect to={`/dashboard/${companies[0].siret}`} />;
    }

    return (
      <SiretContext.Provider value={{ siret }}>
        <div id="dashboard" className="dashboard">
          <DashboardMenu
            me={data.me}
            match={match}
            handleCompanyChange={siret => history.push(`/dashboard/${siret}`)}
          />

          <div className="dashboard-content">
            <Route exact path={match.url}>
              <Redirect to={`${match.url}/slips`} />
            </Route>

            <Route path={`${match.path}/slips`}>
              <SlipsContainer />
            </Route>

            <Route path={`${match.url}/transport`}>
              <Transport />
            </Route>

            <Route path={`${match.url}/exports`}>
              <Exports
                companies={filter(Exports.fragments.company, companies)}
              />
            </Route>
            <Route path={`${match.path}/stats`}>
              <Stats />
            </Route>
          </div>
        </div>
      </SiretContext.Provider>
    );
  }

  return <p>Aucune donnée à afficher</p>;
}
