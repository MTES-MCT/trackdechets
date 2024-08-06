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

    <Accordion defaultExpanded label="Intégration API">
      <ul>
        <li>
          <NavLink
            to={routes.account.tokens.list}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Jetons d'accès API
          </NavLink>
        </li>
        <li className="tw-mb-1">
          <NavLink
            to={routes.account.authorizedApplications}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Applications autorisées
          </NavLink>
        </li>
        <li>
          <NavLink
            to={routes.account.oauth2.list}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Mes applications
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
