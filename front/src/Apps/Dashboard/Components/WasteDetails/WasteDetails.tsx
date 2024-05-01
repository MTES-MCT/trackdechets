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
  return (
    <div className="waste-details">
      <div>{displayIconWaste()}</div>
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
              <IconWeight /> <span>{weight}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default WasteDetails;
