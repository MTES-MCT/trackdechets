import React from "react";
import { generatePath, Link } from "react-router-dom";
import { Menu, MenuList, MenuButton, MenuLink } from "@reach/menu-button";
import routes from "common/routes";
import styles from "./BSDActions.module.scss";
import {
  IconBSFF,
  IconBSDa,
  IconBSVhu,
  IconBSDD,
  IconBSDasri,
} from "../../../common/components/Icons";

type Props = { siret: string };

const links = [
  {
    title: "Bordereau de suivi DD",
    route: routes.dashboard.bsdds.create,
    icon: <IconBSDD width="24px" height="24px" />,
  },
  {
    title: "Bordereau de suivi DASRI",
    route: routes.dashboard.bsdasris.create,
    icon: <IconBSDasri width="24px" height="24px" />,
  },

  {
    title: "Bordereau de suivi VHU",
    route: routes.dashboard.bsvhus.create,
    icon: <IconBSVhu width="24px" height="24px" />,
  },
  {
    title: "Bordereau de suivi FF",
    route: routes.dashboard.bsffs.create,
    icon: <IconBSFF padding-left="6px" width="24px" height="24px" />,
  },
  {
    title: "Bordereau de suivi amiante",
    route: routes.dashboard.bsdas.create,
    icon: <IconBSDa width="24px" height="24px" />,
  },
];

export function BSDDropdown({ siret }: Props) {
  return (
    <Menu>
      <MenuButton className="btn btn--primary">
        Créer un bordereau <span aria-hidden>▾</span>
      </MenuButton>
      <MenuList className="fr-raw-link fr-raw-list">
        {links.map(link => (
          <MenuLink
            className={styles.BSDDropdown}
            as={Link}
            to={generatePath(link.route, { siret })}
            key={link.title}
          >
            {link.icon}
            {link.title}
          </MenuLink>
        ))}
      </MenuList>
    </Menu>
  );
}
