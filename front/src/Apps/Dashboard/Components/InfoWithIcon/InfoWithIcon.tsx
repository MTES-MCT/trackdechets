import React, { useCallback } from "react";
import { InfoIconCode, InfoWithIconProps } from "./infoWithIconTypes";
import { getLabelValue } from "./infoWithIconUtils";
import "./infoWithIcon.scss";

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
  return !hasEditableInfos ? (
    <p className={`label-icon label-icon__${labelCode}`}>
      <span className="fr-sr-only">{displayAlternativeText()}</span>
      {!info ? labelValue : `${labelValue} ${info}`}
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
        <span className="fr-sr-only">
          Modifier le champ libre et l'immatriculation
        </span>
        {labelCode === InfoIconCode.CustomInfo
          ? customInfo
          : formatTranporterPlates(editableInfos?.transporterNumberPlate)}
      </p>
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
