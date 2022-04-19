import React from "react";
import { generatePath, Link } from "react-router-dom";
import { Menu, MenuList, MenuButton, MenuLink } from "@reach/menu-button";
import routes from "common/routes";

type Props = { siret: string };

const links = [
  { title: "Bordereau de suivi DD", route: routes.dashboard.bsdds.create },
  {
    title: "Bordereau de suivi DASRI",
    route: routes.dashboard.bsdasris.create,
  },

  { title: "Bordereau de suivi VHU", route: routes.dashboard.bsvhus.create },
  { title: "Bordereau de suivi FF", route: routes.dashboard.bsffs.create },
  { title: "Bordereau de suivi amiante", route: routes.dashboard.bsdas.create },
];

export function NewBSDDropdown({ siret }: Props) {
  return (
    <Menu>
      <MenuButton className="btn btn--primary">
        Créer un bordereau <span aria-hidden>▾</span>
      </MenuButton>
      <MenuList>
        {links.map(link => (
          <MenuLink
            as={Link}
            to={generatePath(link.route, { siret })}
            key={link.title}
          >
            {link.title}
          </MenuLink>
        ))}
      </MenuList>
    </Menu>
  );
}
