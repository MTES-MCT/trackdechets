import SideBar from "../Apps/common/Components/SideBar/SideBar";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import routes, { getRelativeRoute } from "../Apps/routes";
import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { AnonymousCompanyDashboard } from "./anonymousCompany/AnonymousCompaniesDashboard";
import Reindex from "./reindex/Reindex";
import AnonymizeUser from "./user/anonymizeUser";
import CompaniesVerification from "./verification/CompaniesVerification";
import "../Apps/Dashboard/dashboard.scss";
import { Impersonate } from "./user/impersonate";
import { Registry } from "./registry/Registry";
import { MembersAdmin } from "./company/MembersAdmin";
import { CompaniesDashboard } from "./companies/CompaniesDashboard";
import { BsdAdmin } from "./bsd/BsdAdmin";
import { BulkProfileUpdateAdmin } from "./bulkProfilesUpdate/BulkprofilesUpdateAdmin";
import { AdminRequests } from "./adminRequests/AdminRequests";

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
                to={routes.admin.companies}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Données entreprises
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.anonymousCompany}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
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
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.impersonate}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Impersonation
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.registry}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Registre
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.membersAdmin}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Gestion des admins
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.massProfilesAdmin}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Maj profils en masse
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.bsdAdmin}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Consultation BSD
              </NavLink>
            </li>
            <li className="tw-mb-1">
              <NavLink
                to={routes.admin.adminRequests}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                Demandes admin
              </NavLink>
            </li>
          </ul>
        </Accordion>
      </SideBar>

      <div id="admin-content" className="dashboard-content" tabIndex={-1}>
        <Routes>
          <Route
            path={toRelative(routes.admin.verification)}
            element={<CompaniesVerification />}
          />

          <Route
            path={toRelative(routes.admin.companies)}
            element={<CompaniesDashboard />}
          />

          <Route
            path={toRelative(routes.admin.anonymousCompany)}
            element={<AnonymousCompanyDashboard />}
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
            path={toRelative(routes.admin.impersonate)}
            element={<Impersonate />}
          />

          <Route
            path={toRelative(routes.admin.registry)}
            element={<Registry />}
          />

          <Route
            path={toRelative(routes.admin.membersAdmin)}
            element={<MembersAdmin />}
          />

          <Route
            path={toRelative(routes.admin.massProfilesAdmin)}
            element={<BulkProfileUpdateAdmin />}
          />

          <Route
            path={toRelative(routes.admin.bsdAdmin)}
            element={<BsdAdmin />}
          />

          <Route
            path={toRelative(routes.admin.adminRequests)}
            element={<AdminRequests />}
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
