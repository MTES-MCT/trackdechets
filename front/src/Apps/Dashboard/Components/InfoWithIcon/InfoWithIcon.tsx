import React from "react";
import { InfoIconCode, InfoWithIconProps } from "./infoWithIconTypes";
import { getLabelValue } from "./infoWithIconUtils";
import "./infoWithIcon.scss";

function InfoWithIcon({
  labelCode,
  date,
  editableInfos,
  hasEditableInfos,
  onClick,
  isDisabled,
}: InfoWithIconProps) {
  const labelValue = getLabelValue(labelCode);
  return !hasEditableInfos ? (
    <p className={`label-icon label-icon__${labelCode}`}>
      {labelCode !== InfoIconCode.LastModificationDate
        ? labelValue
        : `${labelValue} ${date}`}
    </p>
  ) : (
    <button
      className="label-icon-editable"
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={labelValue}
    >
      <p className={`label-icon label-icon__${labelCode}`}>
        {labelCode === InfoIconCode.CustomInfo
          ? editableInfos?.customInfo
          : editableInfos?.transporterNumberPlate}
      </p>
    </button>
  );
}

export default InfoWithIcon;
