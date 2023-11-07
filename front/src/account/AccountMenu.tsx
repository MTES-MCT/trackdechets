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
          className="sidebar__link  "
          activeClassName="sidebar__link--active"
        >
          Informations générales
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.companies.list}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
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
          className="sidebar__link"
          activeClassName="sidebar__link--active"
        >
          Jetons d'accès API
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.authorizedApplications}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
        >
          Applications autorisées
        </NavLink>
      </li>
      <li>
        <NavLink
          to={routes.account.oauth2.list}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
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
