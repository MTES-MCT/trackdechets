import React from "react";

import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";

import "./bsdCardList.scss";

function BsdCardList({ bsds }: BsdCardListProps): JSX.Element {
  return (
    <ul className="bsd-card-list">
      {bsds.map(bsd => {
        const { node } = bsd;
        return (
          <li key={node.id}>
            <BsdCard bsd={node} />
          </li>
        );
      })}
    </ul>
  );
}

export default BsdCardList;
