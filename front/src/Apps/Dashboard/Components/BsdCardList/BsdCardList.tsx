import React from "react";
import { generatePath, useHistory, useLocation } from "react-router-dom";
import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import { validateBsd } from "../../dashboardServices";
import { Bsd, BsdType } from "../../../../generated/graphql/types";
import routes from "../../../../common/routes";

import "./bsdCardList.scss";

function BsdCardList({ siret, bsds }: BsdCardListProps): JSX.Element {
  const history = useHistory();
  const location = useLocation();

  const getOverviewPath = bsd => {
    switch (bsd.type) {
      case BsdType.Bsdd:
        return routes.dashboardv2.bsdds.view;
      case BsdType.Bsda:
        return routes.dashboardv2.bsdas.view;
      case BsdType.Bsdasri:
        return routes.dashboardv2.bsdasris.view;
      case BsdType.Bsff:
        return routes.dashboardv2.bsffs.view;
      case BsdType.Bsvhu:
        return routes.dashboardv2.bsvhus.view;

      default:
        break;
    }
  };

  const getUpdatePath = bsd => {
    switch (bsd.type) {
      case BsdType.Bsdd:
        return routes.dashboardv2.bsdds.edit;
      case BsdType.Bsda:
        return routes.dashboardv2.bsdas.edit;
      case BsdType.Bsdasri:
        return routes.dashboardv2.bsdasris.edit;
      case BsdType.Bsff:
        return routes.dashboardv2.bsffs.edit;
      case BsdType.Bsvhu:
        return routes.dashboardv2.bsvhus.edit;

      default:
        break;
    }
  };

  const getRevisionPath = bsd => {
    switch (bsd.type) {
      case BsdType.Bsdd:
        return routes.dashboardv2.bsdds.review;
      case BsdType.Bsda:
        return routes.dashboardv2.bsdas.review;

      default:
        break;
    }
  };

  const redirectToPath = (path, id) => {
    if (path) {
      history.push({
        pathname: generatePath(path, {
          siret,
          id: id,
        }),
        state: { background: location },
      });
    }
  };

  const onBsdValidation = (bsd: Bsd) => {
    validateBsd(bsd);
  };
  const onBsdDelete = (bsd: Bsd) => {
    // TODO
  };
  const onBsdDuplication = (bsd: Bsd) => {
    // TODO
  };
  const onBsdUpdate = (bsd: Bsd) => {
    const path = getUpdatePath(bsd);
    redirectToPath(path, bsd.id);
  };
  const onBsdPdfGenerate = (bsd: Bsd) => {
    // TODO
  };
  const onBsdOverview = (bsd: Bsd) => {
    const path = getOverviewPath(bsd);
    redirectToPath(path, bsd.id);
  };
  const onBsdRevision = (bsd: Bsd) => {
    const path = getRevisionPath(bsd);
    redirectToPath(path, bsd.id);
  };

  return (
    <ul className="bsd-card-list">
      {bsds.map(bsd => {
        const { node } = bsd;
        return (
          <li className="bsd-card-list__item" key={node.id}>
            <BsdCard
              bsd={node}
              currentSiret={siret}
              onValidate={onBsdValidation}
              onDelete={onBsdDelete}
              onDuplicate={onBsdDuplication}
              onUpdate={onBsdUpdate}
              onPdf={onBsdPdfGenerate}
              onOverview={onBsdOverview}
              onRevision={onBsdRevision}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default BsdCardList;
