import React from "react";
import SideMenu from "../common/SideMenu";
import { NavLink, match } from "react-router-dom";

export default function AccountMenu() {
  return (
    <SideMenu>
      <NavLink to="/account">Paramètres du compte</NavLink>
    </SideMenu>
  );
}
