import React, { useContext, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { BsffPackaging, BsffType } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import { BSFF_WASTES } from "@td/constants";
import { useParams } from "react-router-dom";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import {
  bsffPackagingTypes,
  emptyBsffPackaging
} from "../../../../Forms/Components/PackagingList/helpers";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";
import MyCompanySelector from "../../../../common/Components/CompanySelector/MyCompanySelector";
import RhfBsffPackagingList from "../../../../Forms/Components/PackagingList/bsff/RhfBsffPackagingList";
import SelectableWasteTableWrapper from "../../bsda/components/SelectableWasteTableWrapper";
import EstimatedQuantityTooltip from "../../../../../common/components/EstimatedQuantityTooltip";
import RhfPackagingList from "../../../../Forms/Components/PackagingList/RhfPackagingList";

const WasteBsff = () => {
  const methods = useFormContext();
  const { register, setValue, watch, formState } = methods;
  const sealedFields = useContext(SealedFieldsContext);

  // Watch des champs nécessaires
  const id = watch("id", null);
  const waste = watch("waste", {});
  const bsffType = watch("type");
  const packagings = watch("packagings", []);
  const weight = watch("weight", {});
  const previousPackagings = watch("previousPackagings", []);

  const [hasPreviousPackagingsChanged, setHasPreviousPackagingsChanged] =
    React.useState(false);

  // Pré-remplissage des packagings et du code waste
  useEffect(() => {
    // Reset si pas Groupement / Reexpedition
    if (![BsffType.Groupement, BsffType.Reexpedition].includes(bsffType)) {
      setValue("packagings", [emptyBsffPackaging]);
    }

    // Pré-remplissage packagings pour Groupement/Reexpedition
    if ([BsffType.Groupement, BsffType.Reexpedition].includes(bsffType)) {
      if (!id || hasPreviousPackagingsChanged) {
        setValue(
          "packagings",
          previousPackagings.map(p => ({
            ...p,
            weight: p.acceptation?.weight ?? p.weight
          }))
        );
      }

      // Pré-remplissage du waste.code
      if (previousPackagings.length && !waste?.code) {
        setValue(
          "waste.code",
          previousPackagings[0]?.acceptation?.wasteCode ?? ""
        );
      }
      if (!previousPackagings.length && waste?.code) {
        setValue("waste.code", "");
      }
    }
  }, [
    bsffType,
    id,
    previousPackagings,
    waste?.code,
    hasPreviousPackagingsChanged,
    setValue
  ]);

  // Calcul du poids total
  const totalWeightNumber = packagings.reduce(
    (acc: number, packaging: BsffPackaging) =>
      acc + (Number(packaging.weight) || 0),
    0
  );
  const totalWeight = totalWeightNumber === 0 ? "" : totalWeightNumber;

  // Calcul de la quantité totale
  const quantityLength: number = packagings.reduce(
    (acc: number, packaging: BsffPackaging) =>
      acc + (Number(packaging.quantity) || 0),
    0
  );

  // Mise à jour du formulaire
  useEffect(() => {
    setValue("weight.value", totalWeight);
    setValue("quantity.value", quantityLength);
  }, [totalWeight, quantityLength, setValue]);

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
  const fieldIsDisabled =
    sealedFields.includes("packagings") ||
    [BsffType.Reexpedition, BsffType.Groupement].includes(bsffType);
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
        {(bsffType === BsffType.Reconditionnement ||
          bsffType === BsffType.Reexpedition ||
          bsffType === BsffType.Groupement) && (
          <MyCompanySelector
            fieldName="emitter.company"
            siretEditable={!id}
            onSelect={company => {
              if (
                company.orgId?.length &&
                previousPackagings?.length &&
                window.confirm(
                  "L'établissement sélectionné n'est pas compatible avec les bordereaux initiaux sélectionnés. Nous allons donc les dissocier."
                )
              ) {
                setValue("previousPackagings", []);
                setValue("packagings", []);
              }
            }}
          />
        )}

        {bsffType === BsffType.Groupement && (
          <>
            <Alert
              description="Sélectionnez des BSFF ayant le même code déchet et le même
                                exutoire"
              severity="info"
              small
              className="fr-mb-2w"
            />

            <SelectableWasteTableWrapper type={bsffType} bsdaId={id} />
          </>
        )}

        {bsffType === BsffType.Reexpedition && (
          <>
            <SelectableWasteTableWrapper type={bsffType} bsdaId={id} />

            <Alert
              description="Vous effectuez une réexpédition. Les informations sur le déchet ont été automatiquement reportées et ne sont pas modifiables."
              severity="info"
              small
              className="fr-mt-2w"
            />
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
          label="Mention au titre des règlements RID, ADNR, IMDG"
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

        {!fieldIsDisabled && (
          <>
            <RhfPackagingList
              disabled={sealedFields.includes("packagings")}
              fieldName="packagings"
              packagingTypes={bsffPackagingTypes}
              type="BSFF"
            />

            {formState?.errors?.packagings && (
              <p className="fr-text--sm fr-error-text fr-mb-4v">
                {formState.errors.packagings.message as string}
              </p>
            )}
          </>
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
