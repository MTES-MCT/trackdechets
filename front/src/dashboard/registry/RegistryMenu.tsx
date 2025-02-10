import React from "react";
import SideBar from "../../Apps/common/Components/SideBar/SideBar";
import { NavLink } from "react-router-dom";
import routes from "../../Apps/routes";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export const RegistryMenuContent = () => (
  <div>
    <Accordion defaultExpanded label="Registre national" className="fr-mt-4w">
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
            to={routes.registry_new.companyImports}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Imports par établissement
          </NavLink>
        </li>
      </ul>
    </Accordion>
    <Accordion defaultExpanded label="Exports">
      <ul>
        <li className="tw-mb-1">
          <NavLink
            to={routes.registry_new.export}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Mes exports
          </NavLink>
        </li>
      </ul>
    </Accordion>
  </div>
);

export default function RegistryMenu() {
  return (
    <SideBar>
      <RegistryMenuContent />
    </SideBar>
  );
}
