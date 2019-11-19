import gql from "graphql-tag";
import React from "react";
import SideMenu from "../common/SideMenu";
import { NavLink } from "react-router-dom";
import { match } from "react-router";
import styles from "./AccountMenu.module.scss";

type Props = {
  me: {
    name: string;
  };
  match: match;
};

AccountMenu.fragments = {
  me: gql`
    fragment AccountMenuFragment on User {
      name
    }
  `
};

export default function AccountMenu({ me, match }: Props) {
  return (
    <SideMenu>
      <h5 className={styles["menu-title"]}>Mon Compte</h5>
      <NavLink to={`${match.url}/info`}>Informations générales</NavLink>
      <NavLink to={`${match.url}/integration`}>Intégration API</NavLink>
    </SideMenu>
  );
}
