import React, { useContext } from "react";
import { useFormContext } from "react-hook-form";
import { BsffType } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import Tooltip from "../../../../common/Components/Tooltip/Tooltip";

const WasteBsff = () => {
  const methods = useFormContext();
  const { register } = methods;

  const sealedFields = useContext(SealedFieldsContext);

  return (
    <div className="fr-col">
      <WasteRadioGroup
        title="Type de bordereau"
        legend="J'édite un BSFF pour :"
        disabled={sealedFields.includes("type")}
        options={[
          {
            label:
              "Un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides) lors d'opérations sur les équipements en contenant de ses clients",
            nativeInputProps: {
              ...register("type"),
              value: BsffType.CollectePetitesQuantites
            }
          },
          {
            label: (
              <span>
                Un détenteur de contenant(s) de déchets de fluides à tracer
                (sans fiche d'intervention)"
                <Tooltip
                  className="fr-ml-1w"
                  title="Exemple : Centre VHU (fluides retirés des VHU), installation qui trace un contenant après rupture de traçabilité"
                />
              </span>
            ),
            nativeInputProps: {
              ...register("type"),
              value: BsffType.TracerFluide
            }
          },
          {
            label: "Une installation dans le cadre d'un regroupement",
            nativeInputProps: {
              ...register("type"),
              value: BsffType.Groupement
            }
          },
          {
            label: "Une installation dans le cadre d'un reconditionnement",
            nativeInputProps: {
              ...register("type"),
              value: BsffType.Reconditionnement
            }
          },
          {
            label: "Une installation dans le cadre d'une réexpédition",
            nativeInputProps: {
              ...register("type"),
              value: BsffType.Reexpedition
            }
          }
        ]}
      />
    </div>
  );
};

export default WasteBsff;
