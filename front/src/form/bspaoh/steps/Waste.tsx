import React, { useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext } from "react-hook-form";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { PaohPackagings } from "../components/Packagings";
import { ZodBspaoh } from "../schema";
import { SealedFieldsContext } from "../context";

export function Waste() {
  const { register, watch, setValue, formState } = useFormContext<ZodBspaoh>(); // retrieve all hook methods
  const wasteType = watch("waste.type");
  const emitter = watch("emitter") ?? {};

  const quantity = watch("emitter.emission.detail.quantity") ?? 0;
  const isEstimate = watch("emitter.emission.detail.weight.isEstimate");
  const sealedFields = useContext(SealedFieldsContext);
  const { errors } = formState;

  return (
    <div>
      <RadioButtons
        legend="Type"
        disabled={sealedFields.includes("waste.type")}
        className="fr-col-sm-5"
        options={[
          {
            label: "18 01 02 - PAOH",
            nativeInputProps: {
              ...register("waste.type"),
              value: "PAOH"
            }
          },
          {
            label: "18 01 02 - Foetus",
            nativeInputProps: {
              ...register("waste.type"),
              value: "FOETUS"
            }
          }
        ]}
      />

      <Input
        label="Code ADR (optionnel)"
        disabled={sealedFields.includes("waste.adr")}
        nativeInputProps={{
          ...register("waste.adr")
        }}
      />

      <PaohPackagings
        paohType={wasteType}
        disabled={sealedFields.includes("waste.packagings")}
      />

      <h3 className="fr-h3">Quantité Émise</h3>

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
            label="Poids total en kg (optionnel)"
            disabled={sealedFields.includes(
              "emitter.emission.detail.weight.value"
            )}
            state={errors?.emitter?.emission?.detail?.weight?.value && "error"}
            stateRelatedMessage={
              (errors?.emitter?.emission?.detail?.weight?.value
                ?.message as string) ?? ""
            }
            nativeInputProps={{
              inputMode: "decimal",
              step: "0.1",
              type: "number",
              ...register("emitter.emission.detail.weight.value")
            }}
          />

          <p className="fr-info-text fr-mt-5v">
            Soit {(emitter.emission.detail.weight.value || 0) / 1000} t
          </p>
        </div>

        <div className="fr-col-12 fr-col-md-6">
          <RadioButtons
            legend="Cette pesée est (optionnel)"
            disabled={sealedFields.includes(
              "emitter.emission.detail.weight.isEstimate"
            )}
            orientation="horizontal"
            state={
              errors?.emitter?.emission?.detail?.weight?.isEstimate && "error"
            }
            stateRelatedMessage={
              (errors?.emitter?.emission?.detail?.weight?.isEstimate
                ?.message as string) ?? ""
            }
            options={[
              {
                label: "réelle",
                nativeInputProps: {
                  onChange: () =>
                    setValue(
                      "emitter.emission.detail.weight.isEstimate",
                      false
                    ),

                  checked: isEstimate === false
                }
              },
              {
                label: "estimée",
                nativeInputProps: {
                  onChange: () =>
                    setValue("emitter.emission.detail.weight.isEstimate", true),
                  checked: isEstimate === true
                }
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
