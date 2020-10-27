import React from "react";
import SideMenu from "../common/components/SideMenu";
import { NavLink } from "react-router-dom";
import styles from "./AccountMenu.module.scss";
import routes from "common/routes";

export const AccountMenuContent = ({
  mobileCallback,
}: {
  mobileCallback?: () => void;
}) => (
  <>
    <h5 className={styles.title}>Mon Compte</h5>
    <ul>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.info}
          className="sidebar__link  "
          activeClassName="sidebar__link--active"
          onClick={() => !!mobileCallback && mobileCallback()}
        >
          Informations générales
        </NavLink>
      </li>
      <li className="tw-mb-1">
        <NavLink
          to={routes.account.companies}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
          onClick={() => !!mobileCallback && mobileCallback()}
        >
          Établissements
        </NavLink>
      </li>
      <li>
        <NavLink
          to={routes.account.api}
          className="sidebar__link"
          activeClassName="sidebar__link--active"
          onClick={() => !!mobileCallback && mobileCallback()}
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
