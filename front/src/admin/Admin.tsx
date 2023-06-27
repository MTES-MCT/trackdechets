import SideMenu from "common/components/SideMenu";
import routes from "Apps/routes";
import React from "react";
import { NavLink, Switch, Route, Redirect } from "react-router-dom";
import { CreateAnonymousCompany } from "./anonymousCompany";
import Reindex from "./reindex/Reindex";
import AnonymizeUser from "./user/anonymizeUser";
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
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.anonymousCompany}
                className="sidebar__link"
                activeClassName="sidebar__link--active"
              >
                Entreprise anonyme
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.reindex}
                className="sidebar__link"
                activeClassName="sidebar__link--active"
              >
                Réindexation
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.user}
                className="sidebar__link"
                activeClassName="sidebar__link--active"
              >
                Comptes utilisateurs
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
          <Route exact path={routes.admin.anonymousCompany}>
            <CreateAnonymousCompany />
          </Route>
          <Route exact path={routes.admin.reindex}>
            <Reindex />
          </Route>
          <Route exact path={routes.admin.user}>
            <AnonymizeUser />
          </Route>
          <Redirect to={routes.admin.verification} />
        </Switch>
      </div>
    </div>
  );
}
