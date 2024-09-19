import React from "react";
import SideBar from "../../Apps/common/Components/SideBar/SideBar";
import { generatePath, NavLink } from "react-router-dom";
import routes from "../../Apps/routes";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { getDefaultOrgId } from "../../Apps/common/Components/CompanySwitcher/CompanySwitcher";

export const RegistryMenuContent = () => (
  <Accordion defaultExpanded label="Mes Registres" className="fr-mt-4w">
    <ul>
      <li className="tw-mb-1">
        <NavLink
          to={routes.registry_new.myImports}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Mes imports
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={generatePath(routes.registry_new.companyImports, {
            siret: getDefaultOrgId([])
          })}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Imports par établissement
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.registry_new.export}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Exports
        </NavLink>
      </li>
    </ul>
  </Accordion>
);

export default function RegistryMenu() {
  return (
    <SideBar>
      <RegistryMenuContent />
    </SideBar>
  );
}
