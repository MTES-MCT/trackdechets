import React from "react";
import { Route, RouteComponentProps } from "react-router";
import DashboardMenu from "./DashboardMenu";
import SlipsContainer from "./slips/SlipsContainer";
import "./Dashboard.scss";

export default function Dashboard({ match }: RouteComponentProps) {
  return (
    <div id="dashboard" className="dashboard">
      <DashboardMenu />

      <div className="dashboard-content">
        <Route path={`${match.path}/slips`} component={SlipsContainer} />
      </div>
    </div>
  );
}
