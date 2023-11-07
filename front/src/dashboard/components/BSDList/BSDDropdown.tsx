import React from "react";
import { generatePath } from "react-router-dom";
import routes from "../../../Apps/routes";
import styles from "./BSDActions.module.scss";
import {
  IconBSFF,
  IconBSDa,
  IconBSVhu,
  IconBSDD,
  IconBSDasri
} from "../../../Apps/common/Components/Icons/Icons";
import BsdCreateDropdown from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";

type Props = { siret: string };

export function BSDDropdown({ siret }: Props) {
  const links = [
    {
      title: "Bordereau de suivi DD",
      route: generatePath(routes.dashboard.bsdds.create, { siret }),
      icon: <IconBSDD width="24px" height="24px" />
    },
    {
      title: "Bordereau de suivi DASRI",
      route: generatePath(routes.dashboard.bsdasris.create, { siret }),
      icon: <IconBSDasri width="24px" height="24px" />
    },

    {
      title: "Bordereau de suivi VHU",
      route: generatePath(routes.dashboard.bsvhus.create, { siret }),
      icon: <IconBSVhu width="24px" height="24px" />
    },
    {
      title: "Bordereau de suivi FF",
      route: generatePath(routes.dashboard.bsffs.create, { siret }),
      icon: <IconBSFF padding-left="6px" width="24px" height="24px" />
    },
    {
      title: "Bordereau de suivi amiante",
      route: generatePath(routes.dashboard.bsdas.create, { siret }),
      icon: <IconBSDa width="24px" height="24px" />
    }
  ];

  return (
    <div className={styles.BSDDropdown}>
      <BsdCreateDropdown links={links} menuTitle="Créer un bordereau" />
    </div>
  );
}
