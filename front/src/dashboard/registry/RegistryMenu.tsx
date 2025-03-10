import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { NavLink } from "react-router-dom";
import SideBar from "../../Apps/common/Components/SideBar/SideBar";
import routes from "../../Apps/routes";

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
        <li className="tw-mb-1">
          <NavLink
            to={routes.registry_new.lines}
            className={({ isActive }) =>
              isActive
                ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                : "sidebarv2__item sidebarv2__item--indented"
            }
          >
            Déclarations
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
    <div className="fr-mt-4w tw-flex tw-justify-center">
      <Button
        iconId="fr-icon-draft-line"
        iconPosition="right"
        linkProps={{
          href: "https://tally.so/r/mKWxXA",
          target: "_blank",
          rel: "noopener"
        }}
        priority="secondary"
      >
        Donnez votre avis
      </Button>
    </div>
  </div>
);

export default function RegistryMenu() {
  return (
    <SideBar>
      <RegistryMenuContent />
    </SideBar>
  );
}
