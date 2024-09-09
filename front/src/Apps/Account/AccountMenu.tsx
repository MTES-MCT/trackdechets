import React from "react";
import SideBar from "../common/Components/SideBar/SideBar";
import { NavLink } from "react-router-dom";
import routes from "../routes";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export const AccountMenuContent = () => (
  <>
    <Accordion defaultExpanded label="Mon compte" className="fr-mt-4w">
      <ul>
        <li className="tw-mb-1">
          <NavLink
            to={routes.account.info}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Mes paramètres
          </NavLink>
        </li>
      </ul>
    </Accordion>

    <Accordion defaultExpanded label="Paramètres avancés">
      <ul>
        <li>
          <NavLink
            to={routes.account.applications}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Applications et API
          </NavLink>
        </li>
      </ul>
    </Accordion>
  </>
);

export default function AccountMenu() {
  return (
    <SideBar>
      <AccountMenuContent />
    </SideBar>
  );
}
