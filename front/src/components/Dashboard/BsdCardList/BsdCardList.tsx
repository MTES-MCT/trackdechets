import React from "react";

import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import { validateBsd } from "../../../services/dashboard/dashboardServices";
import { Bsd } from "../../../generated/graphql/types";

import "./bsdCardList.scss";

function BsdCardList({ siret, bsds }: BsdCardListProps): JSX.Element {
  const onBsdValidation = (bsd: Bsd) => {
    // TODO dashboardservice method
    validateBsd(bsd);
  };
  const onBsdDelete = (bsd: Bsd) => {
    // TODO dashboardservice method
  };
  const onBsdDuplication = (bsd: Bsd) => {
    // TODO dashboardservice method
  };
  const onBsdUpdate = (bsd: Bsd) => {
    // TODO dashboardservice method
  };
  const onBsdPdfGenerate = (bsd: Bsd) => {
    // TODO dashboardservice method
  };
  const onBsdOverview = (bsd: Bsd) => {
    // TODO dashboardservice method
  };
  const onBsdRevision = (bsd: Bsd) => {
    // TODO dashboardservice method
  };

  return (
    <ul className="bsd-card-list">
      {bsds.map(bsd => {
        const { node } = bsd;
        return (
          <li key={node.id}>
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
