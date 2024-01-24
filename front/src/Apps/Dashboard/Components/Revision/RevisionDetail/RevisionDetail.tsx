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
  return (
    <div className="revision-list__detail">
      {dataNewValue && (
        <div>
          <p className="revision-list__detail__title">{dataName}</p>
          <p>
            {ANCIENNE_VALEUR}&nbsp;: {formatValue(dataOldValue)}
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
