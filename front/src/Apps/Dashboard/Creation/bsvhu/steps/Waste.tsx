import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React, { useEffect, useContext } from "react";
import { useFormContext } from "react-hook-form";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { ZodBsvhu } from "../schema";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { setFieldError, TabError } from "../../utils";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";
import { RhfTagsInputWrapper } from "../../../../Forms/Components/TagsInput/TagsInputWrapper";

const WasteBsvhu = ({
  errors,
  createdBeforeV20241201 = false
}: {
  errors: TabError[];
  createdBeforeV20241201: boolean;
}) => {
  const { register, watch, setValue, formState, setError } =
    useFormContext<ZodBsvhu>(); // retrieve all hook methods

  const weight = watch("weight.value");
  const quantity = watch("quantity") ?? 0;
  const isEstimate = watch("weight.isEstimate");
  const identificationNumbers = watch("identification.numbers");
  const packaging = watch("packaging");
  const containsElectricOrHybridVehicles = watch(
    "containsElectricOrHybridVehicles"
  );

  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    setValue("quantity", identificationNumbers?.length);
  }, [setValue, identificationNumbers]);

  useEffect(() => {
    if (packaging === "LOT") {
      setValue("identification.type", null);
    }
  }, [setValue, packaging]);

  useEffect(() => {
    if (errors?.length) {
      setFieldError(
        errors,
        "weight.value",
        formState.errors?.weight?.value,
        setError
      );
      setFieldError(
        errors,
        "identification.numbers",
        formState.errors?.identification?.numbers?.length,
        setError
      );
      setFieldError(
        errors,
        "identification.type",
        formState.errors?.identification?.type,
        setError
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const identificationTypeOptions = [
    {
      label:
        "Identification par N° d'ordre tels qu'ils figurent dans le registre de police",
      nativeInputProps: {
        ...register("identification.type"),
        value: "NUMERO_ORDRE_REGISTRE_POLICE"
      }
    },
    {
      label: "Identification par numéro d'immatriculation",
      nativeInputProps: {
        ...register("identification.type"),
        value: "NUMERO_IMMATRICULATION"
      }
    },
    {
      label: "Identification par numéro de fiche VHU DROMCOM",
      nativeInputProps: {
        ...register("identification.type"),
        value: "NUMERO_FICHE_DROMCOM"
      }
    }
  ];
  // deprecated, kept for bsvhu created before release
  if (createdBeforeV20241201) {
    identificationTypeOptions.push({
      label: "Identification par N° d'ordre des lots sortants",
      nativeInputProps: {
        ...register("identification.type"),
        value: "NUMERO_ORDRE_LOTS_SORTANTS"
      }
    });
  }

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-12 fr-mb-4w">
        <Input
          label="Numéro libre"
          disabled={sealedFields.includes("customId")}
          nativeInputProps={{ ...register("customId") }}
        />
      </div>
      <WasteRadioGroup
        title="Déchet"
        disabled={sealedFields.includes("wasteCode")}
        options={[
          {
            label:
              "16 01 06 - véhicules hors d'usage ne contenant ni liquides ni autres composants dangereux",
            nativeInputProps: {
              ...register("wasteCode"),
              value: "16 01 06"
            }
          },
          {
            label:
              "16 01 04* - véhicules hors d'usage non dépollués par un centre agréé",
            nativeInputProps: {
              ...register("wasteCode"),
              value: "16 01 04*"
            }
          }
        ]}
      />

      <div>
        <p className="fr-mb-2w">
          Comprend des véhicules électriques ou hybrides
        </p>
        <RadioButtons
          disabled={sealedFields.includes("containsElectricOrHybridVehicles")}
          orientation="horizontal"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                onClick: () => {
                  if (containsElectricOrHybridVehicles === true) {
                    setValue("containsElectricOrHybridVehicles", null);
                  } else {
                    setValue("containsElectricOrHybridVehicles", true);
                  }
                },
                checked: containsElectricOrHybridVehicles === true
              }
            },
            {
              label: "Non",
              nativeInputProps: {
                onClick: () => {
                  if (containsElectricOrHybridVehicles === false) {
                    setValue("containsElectricOrHybridVehicles", null);
                  } else {
                    setValue("containsElectricOrHybridVehicles", false);
                  }
                },
                checked: containsElectricOrHybridVehicles === false
              }
            }
          ]}
        />
      </div>

      <h4 className="fr-h4">Conditionnement</h4>

      <fieldset className="fr-fieldset">
        <div className="fr-fieldset__content">
          <div className="fr-radio-group">
            <input
              type="radio"
              id="fr-fieldset-radio-unite"
              value="UNITE"
              {...register("packaging")}
            />
            <label className="fr-label" htmlFor="fr-fieldset-radio-unite">
              En unités
            </label>
          </div>
        </div>
      </fieldset>
      {packaging === "UNITE" && (
        <RadioButtons
          disabled={sealedFields.includes("identification.type")}
          className="fr-col-sm-10 fr-pl-3w"
          options={identificationTypeOptions}
          state={formState.errors?.identification?.type && "error"}
          stateRelatedMessage={
            formState.errors?.identification?.type?.["message"]
          }
        />
      )}
      <fieldset className="fr-fieldset">
        <div className="fr-fieldset__content">
          <div className="fr-radio-group">
            <input
              type="radio"
              id="fr-fieldset-radio-lot"
              value="LOT"
              {...register("packaging")}
            />
            <label className="fr-label" htmlFor="fr-fieldset-radio-lot">
              En lots (identification par numéro de lot)
            </label>
          </div>
        </div>
      </fieldset>

      <div className="fr-col-md-12 fr-mt-4w fr-mb-4w">
        <RhfTagsInputWrapper
          disabled={sealedFields.includes("identification.numbers")}
          label="Détail des identifications"
          fieldName="identification.numbers"
        />
      </div>

      <h4 className="fr-h4">Quantité remise</h4>
      <div className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <NonScrollableInput
            label="En nombre"
            disabled
            nativeInputProps={{
              inputMode: "decimal",
              pattern: "[0-9]*",
              type: "number",
              value: quantity
            }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top  fr-mt-5v">
        <div className="fr-col-12 fr-col-md-6">
          <NonScrollableInput
            label="Poids total en tonnes"
            disabled={sealedFields.includes("weight.value")}
            state={formState.errors?.weight?.value && "error"}
            stateRelatedMessage={
              (formState.errors?.weight?.value?.message as string) ?? ""
            }
            nativeInputProps={{
              inputMode: "decimal",
              step: "0.1",
              type: "number",
              ...register("weight.value")
            }}
          />

          <p className="fr-info-text fr-mt-5v">
            Soit {(weight || 0) * 1000} kg
          </p>
        </div>

        <div className="fr-col-12 fr-col-md-6">
          <RadioButtons
            legend="Cette quantité est"
            disabled={sealedFields.includes("weight.isEstimate")}
            orientation="horizontal"
            state={formState.errors?.weight?.isEstimate && "error"}
            stateRelatedMessage={
              (formState.errors?.weight?.isEstimate?.message as string) ?? ""
            }
            options={[
              {
                label: "réelle",
                nativeInputProps: {
                  onChange: () => setValue("weight.isEstimate", false),

                  checked: isEstimate === false
                }
              },
              {
                label: "estimée",
                nativeInputProps: {
                  onChange: () => setValue("weight.isEstimate", true),
                  checked: isEstimate === true
                }
              }
            ]}
          />
        </div>
      </div>
    </>
  );
};

export default WasteBsvhu;
