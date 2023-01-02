import React from "react";

import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import { validateBsd } from "../../../services/dashboard/dashboardServices";
import { Bsd } from "../../../generated/graphql/types";

import "./bsdCardList.scss";
import { useParams } from "react-router-dom";

function BsdCardList({ bsds }: BsdCardListProps): JSX.Element {
  const { siret } = useParams<{ siret: string }>(); // TODO move to dashboard page later

  const onBsdValidation = (bsd: Bsd) => {
    // TODO
    validateBsd(bsd);
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
            />
          </li>
        );
      })}
    </ul>
  );
}

export default BsdCardList;
