import React from "react";
import SideBar from "../../Apps/common/Components/SideBar/SideBar";
import { NavLink } from "react-router-dom";
import routes from "../../Apps/routes";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export const RegistryMenuContent = () => (
  <Accordion defaultExpanded label="Mes Registres" className="fr-mt-4w">
    <ul>
      <li className="tw-mb-1">
        <NavLink
          to={routes.registry}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Exporter
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
