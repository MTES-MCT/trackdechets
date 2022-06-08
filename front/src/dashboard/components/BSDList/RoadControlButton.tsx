import * as React from "react";
import { Link, generatePath, useLocation } from "react-router-dom";
import { IconQrCode } from "common/components/Icons";
import routes from "common/routes";
import { MenuLink } from "@reach/menu-button";
import { BsdType } from "generated/graphql/types";
import { BsdTypename } from "dashboard/constants";

export const CardRoadControlButton = ({ siret, form }) => {
  const location = useLocation();
  if (!displayRoadControlButton(form)) {
    return null;
  }
  return (
    <Link
      to={{
        pathname: generatePath(routes.dashboard.roadControl, {
          siret,
          bsdType: getRoadControlBsdType(form.__typename),
          id: form.id,
        }),
        state: { background: location },
      }}
      className="btn btn--outline-primary"
    >
      <IconQrCode size="32px" style={{ marginRight: "1rem" }} />
      Contrôle routier
    </Link>
  );
};

export const TableRoadControlButton = ({ siret, form }) => {
  const location = useLocation();
  if (!displayRoadControlButton(form)) {
    return null;
  }
  return (
    <MenuLink
      as={Link}
      to={{
        pathname: generatePath(routes.dashboard.roadControl, {
          siret,
          bsdType: getRoadControlBsdType(form.__typename),
          id: form.id,
        }),
        state: { background: location },
      }}
    >
      <IconQrCode color="blueLight" size="24px" />
      Contrôle
      <br />
      routier
    </MenuLink>
  );
};

const getRoadControlBsdType = (bsdTypename: BsdTypename): BsdType =>
  ({
    Form: BsdType.Bsdd,
    Bsdasri: BsdType.Bsdasri,
    Bsff: BsdType.Bsff,
    Bsvhu: BsdType.Bsvhu,
    Bsda: BsdType.Bsda,
  }[bsdTypename]);

const displayRoadControlButton = bsd => {
  const statusKey = {
    Form: "status",
    Bsdasri: "bsdasriStatus",
    Bsff: "bsffStatus",
    Bsvhu: "bsvhuStatus",
    Bsda: "bsdaStatus",
  }[bsd.__typename];

  return ["SENT", "RESENT"].includes(bsd[statusKey]);
};
