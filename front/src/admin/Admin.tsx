import SideMenu from "common/components/SideMenu";
import routes from "common/routes";
import React from "react";
import { NavLink, Switch, Route, Redirect } from "react-router-dom";
import CompaniesVerification from "./verification/CompaniesVerification";

/**
 * Admin panel available for admin users only
 */
export default function Admin() {
  return (
    <div id="admin" className="admin dashboard">
      <SideMenu>
        <>
          <h5 className="tw-font-bold tw-m-4">Administration</h5>
          <ul>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.verification}
                className="sidebar__link"
                activeClassName="sidebar__link--active"
              >
                Vérification
              </NavLink>
            </li>
          </ul>
        </>
      </SideMenu>
      <div className="dashboard-content">
        <Switch>
          <Route exact path={routes.admin.verification}>
            <CompaniesVerification />
          </Route>
          <Redirect to={routes.admin.verification} />
        </Switch>
      </div>
    </div>
  );
}
