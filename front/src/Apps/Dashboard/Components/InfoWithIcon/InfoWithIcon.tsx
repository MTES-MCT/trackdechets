import React from "react";
import { InfoIconCode, InfoWithIconProps } from "./infoWithIconTypes";
import { getLabelValue } from "./infoWithIconUtils";
import "./infoWithIcon.scss";

const formatTranporterPlates = (plates?: string | string[] | null): string => {
  if (Array.isArray(plates)) {
    return plates.join(", ");
  }

  return !!plates ? plates : "";
};

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
          : formatTranporterPlates(editableInfos?.transporterNumberPlate)}
      </p>
    </button>
  );
}

export default React.memo(InfoWithIcon);
