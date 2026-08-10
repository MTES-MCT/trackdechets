import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../context";
import BsffTypeRadioGroup from "../components/BsffTypeRadioGroup";
import RhfBsffDetenteurCompany from "../../../../Forms/Components/DetenteurForm/RhfBsffDetenteurCompany";
import RhfPickupSiteBlock from "../../../../Forms/Components/PickupSiteBlock/RhfPickupSiteBlock";

export default function BordereauBsff() {
  const { siret } = useParams<{ siret: string }>();

  const sealed = useContext(SealedFieldsContext);
  const disabled = sealed.includes("emitter.company.siret");
  const pickupSiteDisabled = sealed.some(
    field =>
      field === "emitter.pickupSite" || field.startsWith("emitter.pickupSite.")
  );
  return (
    <div className="fr-col-md-10">
      <BsffTypeRadioGroup />
      <RhfBsffDetenteurCompany orgId={siret} disabled={disabled} />
      <RhfPickupSiteBlock disabled={pickupSiteDisabled} />
    </div>
  );
}
