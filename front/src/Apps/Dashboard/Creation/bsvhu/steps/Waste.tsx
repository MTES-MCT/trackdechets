import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import IdentificationNumber from "../../../../Forms/Components/IdentificationNumbers/IdentificationNumber";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { ZodBsvhu } from "../schema";

const WasteBsvhu = ({ isDisabled }) => {
  const { register, watch, setValue, formState } = useFormContext<ZodBsvhu>(); // retrieve all hook methods
  const { errors } = formState;

  const weight = watch("weight.value");
  const quantity = watch("quantity") ?? 0;
  const isEstimate = watch("weight.isEstimate");
  const identificationNumbersDefaultValue =
    formState.defaultValues?.identification?.numbers;
  const identificationNumbers = watch("identification.numbers");

  useEffect(() => {
    setValue("quantity", identificationNumbers?.length);
  }, [setValue, identificationNumbers]);

  return (
    <>
      {isDisabled && <DisabledParagraphStep />}

      <WasteRadioGroup
        title="Déchet"
        disabled={isDisabled}
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
      <h4 className="fr-h4">Conditionnement</h4>
      <RadioButtons
        disabled={isDisabled}
        className="fr-col-sm-10"
        options={[
          {
            label: "En unités",
            nativeInputProps: {
              ...register("packaging"),
              value: "UNITE"
            }
          },
          {
            label: "En lots",
            nativeInputProps: {
              ...register("packaging"),
              value: "LOT"
            }
          }
        ]}
      />
      <RadioButtons
        disabled={isDisabled}
        className="fr-col-sm-10"
        legend="Identification par N° d'ordre"
        options={[
          {
            label: "tels qu'ils figurent dans le registre de police",
            nativeInputProps: {
              ...register("identification.type"),
              value: "NUMERO_ORDRE_REGISTRE_POLICE"
            }
          },
          {
            label: "des lots sortants",
            nativeInputProps: {
              ...register("identification.type"),
              value: "NUMERO_ORDRE_LOTS_SORTANTS"
            }
          }
        ]}
      />

      <div className="fr-col-md-12 fr-mb-4w">
        <IdentificationNumber
          disabled={isDisabled}
          name="identification.numbers"
          defaultValue={identificationNumbersDefaultValue}
        />
        {formState.errors.identification?.numbers?.message && (
          <p className="fr-text fr-error-text">
            {formState.errors.identification?.numbers?.message}
          </p>
        )}
      </div>

      <h4 className="fr-h4">Quantité remise</h4>
      <div className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <Input
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
          <Input
            label="Poids total en tonnes"
            disabled={isDisabled}
            state={errors?.weight?.value && "error"}
            stateRelatedMessage={
              (errors?.weight?.value?.message as string) ?? ""
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
            disabled={isDisabled}
            orientation="horizontal"
            state={errors?.weight?.isEstimate && "error"}
            stateRelatedMessage={
              (errors?.weight?.isEstimate?.message as string) ?? ""
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
