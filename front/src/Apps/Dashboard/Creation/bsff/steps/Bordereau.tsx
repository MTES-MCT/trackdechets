import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { SealedFieldsContext } from "../../context";
import BsffTypeRadioGroup from "../components/BsffTypeRadioGroup";
import RhfBsffDetenteurCompany from "../../../../Forms/Components/DetenteurForm/RhfBsffDetenteurCompany";
import RhfPickupSiteBlock from "../../../../Forms/Components/PickupSiteBlock/RhfPickupSiteBlock";

export default function BordereauBsff() {
  const { siret } = useParams<{ siret: string }>();
  const { watch, setValue } = useFormContext();
  const sealed = useContext(SealedFieldsContext);
  const disabled = sealed.includes("emitter.company.siret");
  return (
    <div className="fr-col-md-10">
      <BsffTypeRadioGroup />
      <RhfBsffDetenteurCompany orgId={siret} disabled={disabled} />
      <ToggleSwitch
        className="fr-mt-3w"
        label="Le détenteur de déchet n'est pas le détenteur d'équipement"
        inputTitle="Détenteur d'équipement différent"
        checked={!!watch("equipmentHolderDifferent")}
        disabled={disabled}
        onChange={value =>
          setValue("equipmentHolderDifferent", value, { shouldDirty: true })
        }
      />
      <RhfPickupSiteBlock disabled={sealed.includes("emitter.pickupSite")} />
    </div>
  );
}
