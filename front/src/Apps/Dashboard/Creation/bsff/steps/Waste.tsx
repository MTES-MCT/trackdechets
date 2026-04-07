import React, { useContext, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { BsffPackaging, BsffType } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import {
  bsffPackagingTypes,
  emptyBsffPackaging
} from "../../../../Forms/Components/PackagingList/helpers";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { BSFF_WASTES } from "@td/constants";
import Select from "@codegouvfr/react-dsfr/Select";
import Input from "@codegouvfr/react-dsfr/Input";
import EstimatedQuantityTooltip from "../../../../../common/components/EstimatedQuantityTooltip";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";
import RhfBsffPackagingList from "../components/RhfBsffPackagingList";
import Alert from "@codegouvfr/react-dsfr/Alert";
import BsffSelectableWasteTableWrapper from "../components/BsffSelectableWasteTableWrapper";
import MyBsffCompanySelector from "../components/MyBsffComapnySelector";

const WasteBsff = () => {
  const methods = useFormContext();
  const { register, setValue, watch, formState } = methods;
  const sealedFields = useContext(SealedFieldsContext);
  const id = watch("id", null);
  const bsffType = watch("type");
  const packagings = watch("packagings");
  const weight = watch("weight", {});

  // Calcul du poids total
  const totalWeightNumber = packagings.reduce(
    (acc: number, packaging: BsffPackaging) =>
      acc + (Number(packaging.weight) || 0),
    0
  );
  const totalWeight = totalWeightNumber === 0 ? "" : totalWeightNumber;

  // Mise à jour du formulaire
  useEffect(() => {
    setValue("weight.value", totalWeight);
  }, [totalWeight, setValue]);

  const wasteCodeDisabled = [
    BsffType.Groupement,
    BsffType.Reconditionnement,
    BsffType.Reexpedition
  ].includes(bsffType);
  const heading =
    bsffType === BsffType.Groupement
      ? "Installation de tri, transit, regroupement ou traitement"
      : bsffType === BsffType.Reconditionnement ||
        bsffType === BsffType.Reexpedition
      ? "Installation de tri, transit, regroupement"
      : "";
  const fieldIsHidden =
    bsffType === BsffType.Groupement || bsffType === BsffType.Reexpedition;

  const instruction =
    bsffType === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un groupement. Les contenants à regrouper doivent avoir le même code déchet."
      : bsffType === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un reconditionnement."
      : bsffType === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'une réexpédition. Les contenants à réexpédier doivent faire partie du même bordereau initial et avoir le même code déchet."
      : "";

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
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
              label:
                "Un détenteur de contenant(s) de déchets de fluides à tracer (sans fiche d'intervention)",
              nativeInputProps: {
                ...register("type"),
                value: BsffType.TracerFluide
              }
            },
            {
              label: "Le regroupement",
              nativeInputProps: {
                ...register("type"),
                value: BsffType.Groupement
              }
            },
            {
              label: "Le reconditionnement",
              nativeInputProps: {
                ...register("type"),
                value: BsffType.Reconditionnement
              }
            },
            {
              label: "La réexpédition",
              nativeInputProps: {
                ...register("type"),
                value: BsffType.Reexpedition
              }
            }
          ]}
        />
        <h4 className="form__section-heading">{heading}</h4>

        {instruction && (
          <>
            <Alert
              description={instruction}
              severity="info"
              small
              className="fr-mb-2w"
            />
            <BsffSelectableWasteTableWrapper type={bsffType} bsffId={id} />
          </>
        )}

        <h4 className="fr-h4 fr-mt-4w">Déchet</h4>
        <Select
          className="fr-col-md-8 fr-mt-2w"
          label="Code déchet"
          nativeSelectProps={{
            ...register("waste.code")
          }}
          state={formState.errors.waste?.["code"] ? "error" : "default"}
          stateRelatedMessage={formState.errors.waste?.["code"]?.message}
          disabled={sealedFields.includes("waste.code") || wasteCodeDisabled}
        >
          <option value="">Sélectionnez une valeur</option>

          {BSFF_WASTES.map(item => (
            <option value={item.code} key={item.code}>
              {item.code} - {item.description}
            </option>
          ))}
        </Select>
        <Input
          className="fr-col-md-8"
          label="Dénomination usuelle du déchet"
          disabled={sealedFields.includes("waste.description")}
          nativeInputProps={{
            ...register("waste.description")
          }}
          state={formState.errors.waste?.["description"] ? "error" : "default"}
          stateRelatedMessage={formState.errors.waste?.["description"]?.message}
        />
        <Input
          className="fr-col-md-8 fr-mt-4w"
          label="Mentions au titre des règlements RID, ADNR, IMDG"
          disabled={sealedFields.includes(`waste.adr`)}
          nativeInputProps={{
            ...register("waste.adr")
          }}
          state={formState.errors.waste?.["adr"] && "error"}
          stateRelatedMessage={
            (formState.errors.waste?.["adr"]?.message as string) ?? ""
          }
        />
        <h4 className="fr-h4 fr-mt-4w">Contenants</h4>
        {!fieldIsHidden && (
          <RhfBsffPackagingList
            disabled={sealedFields.includes(`packagings`)}
            fieldName="packagings"
            packagingTypes={bsffPackagingTypes}
          />
        )}
        <h4 className="fr-h4 fr-mt-4w">Quantité totale</h4>
        <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
          <div className="fr-col-md-3">
            <NonScrollableInput
              label="Poids total en kilo"
              disabled={sealedFields.includes("weight.value")}
              nativeInputProps={{
                inputMode: "decimal",
                step: "0.000001",
                type: "number",
                ...register("weight.value")
              }}
              state={formState.errors?.weight?.["value"] && "error"}
              stateRelatedMessage={
                (formState.errors?.weight?.["value"]?.message as string) ?? ""
              }
            />

            <p className="fr-info-text fr-mt-5v">
              Soit {(weight.value || 0) / 1000} tonne
            </p>
          </div>

          <div className="fr-col-md-6">
            <RadioButtons
              legend="Cette quantité est"
              disabled={sealedFields.includes("weight.isEstimate")}
              orientation="horizontal"
              state={formState.errors?.weight?.["isEstimate"] && "error"}
              stateRelatedMessage={
                (formState.errors?.weight?.["isEstimate"]?.message as string) ??
                ""
              }
              options={[
                {
                  label: "Réelle",
                  nativeInputProps: {
                    onChange: () => setValue("weight.isEstimate", false),

                    checked: weight.isEstimate === false
                  }
                },
                {
                  label: (
                    <span>
                      Estimée <EstimatedQuantityTooltip />
                    </span>
                  ),
                  nativeInputProps: {
                    onChange: () => setValue("weight.isEstimate", true),
                    checked: weight.isEstimate === true
                  }
                }
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default WasteBsff;
