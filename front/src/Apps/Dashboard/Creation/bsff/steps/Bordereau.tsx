import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { BsffType } from "@td/codegen-ui";
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
  const isOperateur = watch("type") === BsffType.CollectePetitesQuantites;
  return (
    <div className="fr-col-md-10">
      <BsffTypeRadioGroup />
      <RhfBsffDetenteurCompany orgId={siret} disabled={disabled} />
      <RhfPickupSiteBlock disabled={pickupSiteDisabled} />
      {isOperateur && (
        <div className="fr-mt-4w">
          <h4 className="form__section-heading">
            Connexion à l'outil Fluides Frigorigènes
          </h4>
          <ToggleSwitch
            label="Je veux récupérer mes informations depuis Fluides Frigorigènes"
            inputTitle="Connexion à l'outil Fluides Frigorigènes"
            checked={!!watch("fluidesFrigorigenesEnabled")}
            onChange={value =>
              setValue("fluidesFrigorigenesEnabled", value, {
                shouldDirty: true
              })
            }
          />
        </div>
      )}
    </div>
  );
}
