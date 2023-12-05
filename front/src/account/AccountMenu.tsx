import React from "react";
import SideMenu from "../common/components/SideMenu";
import { NavLink } from "react-router-dom";
import styles from "./AccountMenu.module.scss";
import routes from "../Apps/routes";
import Tooltip from "../common/components/Tooltip";

export const AccountMenuContent = () => (
  <>
    <h5 className={styles.title}>Paramètres du compte</h5>
    <ul>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.info}
          className={({ isActive }) =>
            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
          }
        >
          Informations générales
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.companies.list}
          className={({ isActive }) =>
            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
          }
        >
          Établissements
        </NavLink>
      </li>
    </ul>
    <h5 className={styles.title}>
      Intégration API
      <Tooltip msg="L'API Trackdéchets permet de se connecter à un compte Trackdéchets à partir de systèmes informatiques tiers" />
    </h5>

    <ul>
      <li>
        <NavLink
          to={routes.account.tokens.list}
          className={({ isActive }) =>
            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
          }
        >
          Jetons d'accès API
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.authorizedApplications}
          className={({ isActive }) =>
            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
          }
        >
          Applications autorisées
        </NavLink>
      </li>
      <li>
        <NavLink
          to={routes.account.oauth2.list}
          className={({ isActive }) =>
            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
          }
        >
          Mes applications
        </NavLink>
      </li>
    </ul>
  </>
);

export default function AccountMenu() {
  return (
    <SideMenu>
      <AccountMenuContent />
    </SideMenu>
  );
}
