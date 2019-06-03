import React from "react";
import { Me } from "../login/model";
import "./DashboardMenu.scss";
import { NavLink, match } from "react-router-dom";
import CompanySelector from "./CompanySelector";

interface IProps {
  me: Me;
  match: match<{}>;
  setActiveSiret: (s: string) => void;
}

export default function DashboardMenu({ me, match, setActiveSiret }: IProps) {
  return (
    <aside className="dashboard-menu side-menu" role="navigation">
      <div className="company-title">
        <h3>{me.name}</h3>
        <p>{me.email}</p>
        <CompanySelector me={me} setActiveSiret={setActiveSiret} />
      </div>
      <ul>
        <li>
          <NavLink to={`${match.url}/slips`} activeClassName="active">
            Mes bordereaux
          </NavLink>
        </li>
        {me.userType.indexOf("TRANSPORTER") > -1 && (
          <li>
            <NavLink to={`${match.url}/transport`} activeClassName="active">
              Transport
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to={`${match.url}/account`} activeClassName="active">
            Mon compte
          </NavLink>
        </li>
        <li>
          <NavLink to={`${match.url}/exports`} activeClassName="active">
            Registre
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}
