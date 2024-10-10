import React from "react";
import {
  IconBSFFMedium as IconBSFF,
  IconBSDaThin as IconBSDa,
  IconBSVhuThin as IconBSVhu,
  IconBSDDThin as IconBSDD,
  IconBSDasriThin as IconBSDasri,
  IconBSPaohThin as IconBSPaoh,
  IconWeight
} from "../../../common/Components/Icons/Icons";
import { WasteDetailsProps } from "./wasteTypes";
import { BsdType } from "@td/codegen-ui";
import "./wasteDetails.scss";

function WasteDetails({
  wasteType,
  code,
  name,
  weight
}: WasteDetailsProps): JSX.Element {
  const displayIconWaste = () => {
    switch (wasteType) {
      case BsdType.Bsdd:
        return <IconBSDD />;
      case BsdType.Bsda:
        return <IconBSDa />;
      case BsdType.Bsvhu:
        return <IconBSVhu />;
      case BsdType.Bsdasri:
        return <IconBSDasri />;
      case BsdType.Bsff:
        return <IconBSFF />;
      case BsdType.Bspaoh:
        return <IconBSPaoh />;
      default:
        break;
    }
  };
  const displayIconWasteAlternative = () => {
    switch (wasteType) {
      case BsdType.Bsdd:
        return "Bordereau de Suivi de Déchets Dangereux ou Non Dangereux";
      case BsdType.Bsda:
        return "Bordereau de Suivi de Déchets d'Amiante";
      case BsdType.Bsvhu:
        return "Bordereau de Suivi de Véhicules Hors d'Usage";
      case BsdType.Bsdasri:
        return "Bordereau de Suivi de Déchets d'Activités de Soins à Risque Infectieux";
      case BsdType.Bsff:
        return "Bordereau de Suivi de Déchets de Fluides Frigorigènes";
      case BsdType.Bspaoh:
        return "Bordereau de Suivi de Pièces Anatomiques d'Origine Humaine";
      default:
        break;
    }
  };
  return (
    <div className="waste-details">
      <div>
        {displayIconWaste()}
        <span className="fr-sr-only">{displayIconWasteAlternative()}</span>
      </div>
      <div className="waste-details__infos">
        <p className="waste-details__infos__code">{code}</p>
        <p className="waste-details__infos__name">{name}</p>
        {weight && (
          <>
            {(!name || !code) && <br />}
            {!name && !code && (
              <span
                style={{ width: "100%", display: "block", marginTop: "18px" }}
              />
            )}
            <p className="waste-details__infos__weight">
              <IconWeight />
              <span className="fr-sr-only">Poids</span> <span>{weight}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default WasteDetails;
