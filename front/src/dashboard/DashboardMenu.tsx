import React from "react";
import { Me } from "../login/model";
import "./DashboardMenu.scss";
import { NavLink, RouteComponentProps, match } from "react-router-dom";

interface IProps {
  me: Me;
  match: match<{}>;
}

export default function DashboardMenu({ me, match }: IProps) {
  return (
    <aside className="dashboard-menu side-menu" role="navigation">
      <div className="company-title">
        <h3>{me.name}</h3>
        <p>SIRET: {me.company.siret}</p>
      </div>
      <ul>
        <li>
          <NavLink to={`${match.url}/slips`} activeClassName="active">
            Mes bordereaux
          </NavLink>
        </li>
        <li>
          <NavLink to={`${match.url}/account`} activeClassName="active">
            Mon compte
          </NavLink>
        </li>
        <li>
          <NavLink to={`${match.url}/exports`} activeClassName="active">
            Exports
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}
