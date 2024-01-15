import SideMenu from "../common/components/SideMenu";
import routes, { getRelativeRoute } from "../Apps/routes";
import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { CreateAnonymousCompany } from "./anonymousCompany";
import Reindex from "./reindex/Reindex";
import AnonymizeUser from "./user/anonymizeUser";
import CompaniesVerification from "./verification/CompaniesVerification";

const toRelative = route => {
  return getRelativeRoute(routes.admin.index, route);
};

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
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                Vérification
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.anonymousCompany}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                Entreprise anonyme
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.reindex}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                Réindexation
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.user}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                Comptes utilisateurs
              </NavLink>
            </li>
          </ul>
        </>
      </SideMenu>
      <div className="dashboard-content">
        <Routes>
          <Route
            path={toRelative(routes.admin.verification)}
            element={<CompaniesVerification />}
          />

          <Route
            path={toRelative(routes.admin.anonymousCompany)}
            element={<CreateAnonymousCompany />}
          />

          <Route
            path={toRelative(routes.admin.reindex)}
            element={<Reindex />}
          />

          <Route
            path={toRelative(routes.admin.user)}
            element={<AnonymizeUser />}
          />

          <Route
            path={`${routes.admin.index}/*`}
            element={<Navigate to={routes.admin.verification} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}
