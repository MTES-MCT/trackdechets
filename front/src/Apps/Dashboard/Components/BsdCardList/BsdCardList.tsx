import React, { useCallback } from "react";
import { generatePath, useHistory, useLocation } from "react-router-dom";
import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import { validateBsd } from "../../dashboardServices";
import { Bsd } from "../../../../generated/graphql/types";

import "./bsdCardList.scss";
import {
  getOverviewPath,
  getRevisionPath,
  getUpdatePath,
} from "../../dashboardUtils";

function BsdCardList({
  siret,
  bsds,
  bsdCurrentTab,
}: BsdCardListProps): JSX.Element {
  const history = useHistory();
  const location = useLocation();

  const redirectToPath = useCallback(
    (path, id) => {
      if (path) {
        history.push({
          pathname: generatePath(path, {
            siret,
            id: id,
          }),
          state: { background: location },
        });
      }
    },
    [history, location, siret]
  );

  const onBsdValidation = useCallback((bsd: Bsd) => {
    validateBsd(bsd);
  }, []);
  const onBsdDelete = useCallback((bsd: Bsd) => {
    // to implement
  }, []);
  const onBsdDuplication = useCallback((bsd: Bsd) => {
    // to implement
  }, []);
  const onBsdUpdate = useCallback(
    (bsd: Bsd) => {
      const path = getUpdatePath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );
  const onBsdPdfGenerate = useCallback((bsd: Bsd) => {
    // to implement
  }, []);
  const onBsdOverview = useCallback(
    (bsd: Bsd) => {
      const path = getOverviewPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );
  const onBsdRevision = useCallback(
    (bsd: Bsd) => {
      const path = getRevisionPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  return (
    <ul className="bsd-card-list">
      {bsds?.map(bsd => {
        const { node } = bsd;
        return (
          <li className="bsd-card-list__item" key={node.id}>
            <BsdCard
              bsd={node}
              currentSiret={siret}
              bsdCurrentTab={bsdCurrentTab}
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

export default React.memo(BsdCardList);
