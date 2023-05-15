import * as React from "react";
import {
  Link,
  generatePath,
  useLocation,
  useRouteMatch,
} from "react-router-dom";
import { IconQrCode } from "common/components/Icons";
import routes from "common/routes";

export const CardRoadControlButton = ({ siret, form }) => {
  const location = useLocation();

  if (!useDisplayRoadControlButton(form)) {
    return null;
  }
  return (
    <Link
      to={{
        pathname: generatePath(routes.dashboard.roadControl, {
          siret,

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

  if (!useDisplayRoadControlButton(form)) {
    return null;
  }

  return (
    <Link
      to={{
        pathname: generatePath(routes.dashboard.roadControl, {
          siret,

          id: form.id,
        }),
        state: { background: location },
      }}
    >
      <IconQrCode color="blueLight" size="24px" />
      <span className="tw-m-1 tw-leading-tight tw-text-center">
        Contrôle
        <br />
        routier
      </span>
    </Link>
  );
};

export const useDisplayRoadControlButton = bsd => {
  const statusKey = {
    Form: "status",
    Bsdasri: "bsdasriStatus",
    Bsff: "bsffStatus",
    Bsvhu: "bsvhuStatus",
    Bsda: "bsdaStatus",
  }[bsd.__typename];
  const isCollectedTab = !!useRouteMatch(routes.dashboard.transport.collected);
  return ["SENT", "RESENT"].includes(bsd[statusKey]) && isCollectedTab;
};
