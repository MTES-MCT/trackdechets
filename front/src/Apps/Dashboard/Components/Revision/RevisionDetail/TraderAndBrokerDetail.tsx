import React from "react";
import { formatDate } from "../../../../../common/datetime";

const TraderAndBrokerDetail = ({ detail }) => {
  if (!detail?.company?.name) return null;

  const number = detail.receipt ?? detail?.recepisse?.number;
  const department = detail.department ?? detail?.recepisse?.department;
  const validityLimit =
    detail.validityLimit ?? detail?.recepisse?.validityLimit;

  return (
    <>
      <div>
        {detail.company?.name} ({detail.company?.siret}) -{" "}
        {detail.company?.address}
      </div>
      <div>
        Récepissé : {number} - Département : {department} - Date limite de
        validité : {validityLimit ? formatDate(validityLimit) : ""}
      </div>
    </>
  );
};
export default TraderAndBrokerDetail;
