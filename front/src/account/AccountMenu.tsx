import gql from "graphql-tag";
import React from "react";
import SideMenu from "../common/SideMenu";
import { NavLink } from "react-router-dom";
import { match } from "react-router";

type Props = {
  me: {
    name: string;
  };
  match: match;
};

export default function AccountMenu({ me, match }: Props) {
  return (
    <SideMenu>
      <p>{me.name}</p>
      <NavLink to={`${match.url}/info`}>Informations générales</NavLink>
      <NavLink to={`${match.url}/integration`}>Intégration API</NavLink>
    </SideMenu>
  );
}

AccountMenu.fragments = {
  me: gql`
    fragment AccountMenuFragment on User {
      name
    }
  `
};
