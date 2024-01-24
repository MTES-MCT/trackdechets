import React from "react";
import { formatDate } from "../../../../../common/datetime";

const TraderAndBrokerDetail = ({ detail }) => {
  if (!detail?.company?.name) return null;

  return (
    <>
      <div>
        {detail.company?.name} ({detail.company?.siret}) -{" "}
        {detail.company?.address}
      </div>
      <div>
        Récepissé: {detail.receipt} - Département: {detail.department} - Date
        limite de validité:{" "}
        {detail.validityLimit ? formatDate(detail.validityLimit) : ""}
      </div>
    </>
  );
};
export default TraderAndBrokerDetail;
