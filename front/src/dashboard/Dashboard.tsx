import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import React, { useState } from "react";
import { Redirect, Route } from "react-router";
import { useRouteMatch } from "react-router-dom";
import { InlineError } from "../common/Error";
import Loader from "../common/Loader";
import { Me } from "../login/model";
import { currentSiretService } from "./CompanySelector";
import "./Dashboard.scss";
import DashboardMenu from "./DashboardMenu";
import Exports from "./exports/exports";
import SlipsContainer from "./slips/SlipsContainer";
import Transport from "./transport/Transport";

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

export default function Dashboard() {
  const [activeSiret, setActiveSiret] = useState("");
  const { loading, error, data } = useQuery<MeData>(GET_ME, {
    onCompleted: data => {
      // try to retrieve current siret from localstorage, if not set use siret from first associated company
      let currentSiret = currentSiretService.getSiret();
      if (!currentSiret) {
        const companies = data.me.companies;
        currentSiret = companies.length > 0 ? data.me.companies[0].siret : "";
        currentSiretService.setSiret(currentSiret);
      }
      setActiveSiret(currentSiret);
    }
  });
  const match = useRouteMatch();

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Aucune donnée à afficher</p>;

  // As long as you don't belong to a company, you can't access the dashnoard
  if (data.me.companies.length === 0) {
    return <Redirect to="/account/companies" />;
  }

  if (!activeSiret) return null;

  return (
    <div id="dashboard" className="dashboard">
      <DashboardMenu
        me={data.me}
        match={match}
        siret={activeSiret}
        handleCompanyChange={setActiveSiret}
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
