import React from "react";
import "./DashboardMenu.scss";

export default function DashboardMenu() {
  return (
    <aside className="dashboard-menu side-menu" role="navigation">
      <div className="company-title">
        <h3>Ma compagnie</h3>
        <p>SIRET: 143 245 567 00013</p>
      </div>
      <ul>
        <li>
          <a className="active">Mes bordereaux</a>
        </li>
        <li>
          <a>Mon compte</a>
        </li>
      </ul>
    </aside>
  );
}
