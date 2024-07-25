import React from "react";
import { DataNameEnum, ReviewDetailInterface } from "../revisionMapper";
import TraderAndBrokerDetail from "./TraderAndBrokerDetail";
import { ANCIENNE_VALEUR, NOUVELLE_VALEUR } from "../wordingsRevision";

const RevisionDetail = ({
  dataName,
  dataOldValue,
  dataNewValue
}: ReviewDetailInterface) => {
  const formatValue = value =>
    dataName === DataNameEnum.BROKER || dataName === DataNameEnum.TRADER ? (
      <TraderAndBrokerDetail detail={value} />
    ) : (
      value?.toString()
    );

  const isNewValueRevisedByZero =
    typeof dataNewValue === "number" && dataNewValue === 0;
  return (
    <div className="revision-list__detail">
      {(dataNewValue || isNewValueRevisedByZero) && (
        <div>
          <p className="revision-list__detail__title">{dataName}</p>
          <p>
            {ANCIENNE_VALEUR}&nbsp;:{" "}
            {dataOldValue ? formatValue(dataOldValue) : ""}
          </p>
          <p>
            {NOUVELLE_VALEUR}&nbsp;: {formatValue(dataNewValue)}
          </p>
        </div>
      )}
    </div>
  );
};

export default RevisionDetail;
