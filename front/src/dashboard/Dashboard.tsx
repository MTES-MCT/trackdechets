import React from "react";
import { Route, RouteComponentProps } from "react-router";
import DashboardMenu from "./DashboardMenu";
import SlipsContainer from "./slips/SlipsContainer";

export default function Dashboard({ match }: RouteComponentProps) {
  return (
    <div id="dashboard" className="dashboard">
      <DashboardMenu />

      <div>
        <Route path={`${match.path}/slips`} component={SlipsContainer} />
      </div>
    </div>
  );
}
