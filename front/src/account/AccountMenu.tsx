import React from "react";
import SideMenu from "../common/components/SideMenu";
import { NavLink } from "react-router-dom";
import { match } from "react-router";
import styles from "./AccountMenu.module.scss";
import { accountRoutes } from "src/common/routes";

export const AccountMenuContent = () => (
  <>
    <h5 className={styles.title}>Mon Compte</h5>
    <ul>
      <li className="tw-mb-1">
        <NavLink
          to={accountRoutes.accountInfo}
          className="sidebar__link  "
          activeClassName="sidebar__link--active"
        >
          Informations générales
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={accountRoutes.accountCompanies}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
        >
          Établissements
        </NavLink>
      </li>
      <li>
        <NavLink
          to={accountRoutes.accountApi}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
        >
          Intégration API
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
