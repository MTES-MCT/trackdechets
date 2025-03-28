import React from "react";
import SideBar from "../common/Components/SideBar/SideBar";
import { NavLink } from "react-router-dom";
import routes from "../routes";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export const CompaniesMenuContent = () => (
  <Accordion
    titleAs="h2"
    defaultExpanded
    label="Mes établissements"
    className="fr-mt-4w"
  >
    <ul>
      <li className="tw-mb-1">
        <NavLink
          end
          to={routes.companies.index}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Établissements
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.companies.manage.index}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          Gestion avancée
        </NavLink>
      </li>
    </ul>
  </Accordion>
);

export default function CompaniesMenu() {
  return (
    <SideBar>
      <CompaniesMenuContent />
    </SideBar>
  );
}
