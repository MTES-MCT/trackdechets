import React from "react";
import { InfoIconCode, InfoWithIconProps } from "./infoWithIconTypes";
import { getLabelValue } from "./infoWithIconUtils";
import "./infoWithIcon.scss";

function InfoWithIcon({ labelCode, date }: InfoWithIconProps) {
  const labelValue = getLabelValue(labelCode);
  return (
    <p className={`label-icon label-icon__${labelCode}`}>
      {labelCode !== InfoIconCode.LastModificationDate
        ? labelValue
        : `${labelValue} ${date}`}
    </p>
  );
}

export default InfoWithIcon;
