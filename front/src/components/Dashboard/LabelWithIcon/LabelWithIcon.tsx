import React from "react";
import { LabelIconCode, LabelWithIconProps } from "./labelWithIconTypes";
import { getLabelValue } from "./labelWithIconUtils";
import "./labelWithIcon.scss";

function LabelWithIcon({ labelCode, date }: LabelWithIconProps): JSX.Element {
  const labelValue = getLabelValue(labelCode);
  return (
    <p className={`label-icon label-icon__${labelCode}`}>
      {labelCode !== LabelIconCode.LastModificationDate
        ? labelValue
        : `${labelValue} ${date}`}
    </p>
  );
}

export default LabelWithIcon;
