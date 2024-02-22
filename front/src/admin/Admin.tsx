import SideBar from "../Apps/common/Components/SideBar/SideBar";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import routes, { getRelativeRoute } from "../Apps/routes";
import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { AnonymousCompanies } from "./anonymousCompany";
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
      <SideBar>
        <Accordion defaultExpanded label="Administration" className="fr-mt-4w">
          <ul>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.verification}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Vérification
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.anonymousCompanies}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Entreprises anonymes
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.reindex}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
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
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Comptes utilisateurs
              </NavLink>
            </li>
          </ul>
        </Accordion>
      </SideBar>

      <div className="dashboard-content">
        <Routes>
          <Route
            path={toRelative(routes.admin.verification)}
            element={<CompaniesVerification />}
          />

          <Route
            path={toRelative(routes.admin.anonymousCompanies)}
            element={<AnonymousCompanies />}
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
