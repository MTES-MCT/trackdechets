import React, { useContext } from "react";
import { useFormContext } from "react-hook-form";
import { BsffType } from "@td/codegen-ui";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import { SealedFieldsContext } from "../../context";

export default function BsffTypeRadioGroup() {
  const { register } = useFormContext();
  const sealedFields = useContext(SealedFieldsContext);
  return (
    <WasteRadioGroup
      title="Type de bordereau"
      legend="J'édite un BSFF pour :"
      disabled={sealedFields.includes("type")}
      options={[
        [
          "Un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides) lors d'opérations sur les équipements en contenant de ses clients",
          BsffType.CollectePetitesQuantites
        ],
        [
          "Un détenteur de contenant(s) de déchets de fluides à tracer (sans fiche d'intervention)",
          BsffType.TracerFluide
        ],
        ["Le regroupement", BsffType.Groupement],
        ["Le reconditionnement", BsffType.Reconditionnement],
        ["La réexpédition", BsffType.Reexpedition]
      ].map(([label, value]) => ({
        label,
        nativeInputProps: { ...register("type"), value }
      }))}
    />
  );
}
