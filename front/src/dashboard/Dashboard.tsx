import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
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
  const { siret } = useParams();
  const history = useHistory();

  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: (data) => {
      // try to retrieve current siret from localstorage, if not set use siret from first associated company
      let currentSiret = currentSiretService.getSiret();
      if (!currentSiret) {
        const companies = data.me.companies || [];
        currentSiret = companies.length > 0 ? companies[0].siret : "";
        currentSiretService.setSiret(currentSiret);
      }
    },
  });
  const match = useRouteMatch();

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  // As long as you don't belong to a company, you can't access the dashnoard
  if (data.me.companies.length === 0) {
    return <Redirect to="/account/companies" />;
  }
  if (!siret)
    return <Redirect to={`${match.url}/${data.me.companies[0].siret}`} />;

  return (
    <div id="dashboard" className="dashboard">
      <DashboardMenu
        me={data.me}
        match={match}
        siret={siret}
        handleCompanyChange={(siret) => history.replace(siret)}
      />

      <div className="dashboard-content">
        <Route
          exact
          path={match.url}
          render={() => <Redirect to={`${match.url}/slips`} />}
        />

        <Route
          path={`${match.url}/slips`}
          render={() => <SlipsContainer me={data.me} siret={siret} />}
        />
        <Route
          path={`${match.url}/transport`}
          render={() => <Transport me={data.me} siret={siret} />}
        />
        <Route
          path={`${match.url}/exports`}
          render={() => <Exports me={data.me} />}
        />

        <div className="dashboard-content">
          <Route
            path={`${match.path}/slips`}
            render={() => <SlipsContainer me={data.me} siret={activeSiret} />}
          />
          <Route
            path={`${match.path}/transport`}
            render={() => <Transport me={data.me} siret={activeSiret} />}
          />
          <Route
            path={`${match.path}/exports`}
            render={() => <Exports me={data.me} />}
          />
        </div>
      </div>
    );
  }

  return <p>Aucune donnée à afficher</p>;
}
