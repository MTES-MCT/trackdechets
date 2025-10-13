import React, { useCallback } from "react";
import { InfoIconCode, InfoWithIconProps } from "./infoWithIconTypes";
import { getLabelValue } from "./infoWithIconUtils";
import "./infoWithIcon.scss";
import Tooltip from "../../../common/Components/Tooltip/Tooltip";

function InfoWithIcon({
  labelCode,
  info,
  editableInfos,
  hasEditableInfos,
  onClick,
  isDisabled
}: InfoWithIconProps) {
  const labelValue = getLabelValue(labelCode);

  const formatTranporterPlates = useCallback(
    (plates?: string | string[] | null): string => {
      if (Array.isArray(plates)) {
        return plates.join(", ");
      }

      return !!plates ? plates : "-";
    },
    []
  );

  const displayAlternativeText = () => {
    switch (labelCode) {
      case InfoIconCode.EcoOrganism:
        return "Éco-organisme visé sur le bordereau";
      case InfoIconCode.PickupSite:
        return "Nom de l'adresse de chantier";
      case InfoIconCode.CustomInfo:
        return "Champs libres ajoutés sur le bordereau";
      case InfoIconCode.TransporterNumberPlate:
        return "Immatriculation du transporteur";
      default:
        return "";
    }
  };

  const customInfo = editableInfos?.customInfo || "-";
  const title: string = !hasEditableInfos
    ? !info
      ? labelValue
      : `${labelValue} ${info}`
    : labelCode === InfoIconCode.CustomInfo
    ? (customInfo as string)
    : formatTranporterPlates(editableInfos?.transporterNumberPlate);

  return !hasEditableInfos ? (
    <Tooltip title={title}>
      <p className={`label-icon label-icon__${labelCode}`}>
        <span className="fr-sr-only">{displayAlternativeText()}</span>

        <span className={`label-icon__text`}>{title}</span>
      </p>
    </Tooltip>
  ) : (
    <button
      className="label-icon-editable"
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={labelValue}
    >
      <Tooltip title={title}>
        <p className={`label-icon label-icon__${labelCode}`}>
          <span className="fr-sr-only">
            Modifier le champ libre et l'immatriculation
          </span>
          <span className={`label-icon__text`}>{title}</span>
        </p>
      </Tooltip>
      {labelCode === InfoIconCode.TransporterNumberPlate && !isDisabled && (
        <>
          <span className="fr-sr-only">
            Modifier le champ libre et l'immatriculation
          </span>
          <span className="edition-pencil-icon" />
        </>
      )}
    </button>
  );
}

export default InfoWithIcon;
