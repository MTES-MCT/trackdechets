import React from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext } from "react-hook-form";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { PaohPackagings } from "../components/Packagings";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

export function Waste() {
  const { register, watch } = useFormContext(); // retrieve all hook methods
  const wasteType = watch("waste.type");
  const emitter = watch("emitter") ?? {};
  const quantity = watch("emitter.emission.waste.detail.quantity") ?? 0;

  return (
    <div>
      <RadioButtons
        legend="Type"
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
        
        nativeInputProps={{
          ...register("waste.adr")
        }}
      ></Input>

      <PaohPackagings paohType={wasteType} />
      <h3 className="fr-h3">Quantité Émise</h3>

      <div className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="En nombre"
            disabled
            nativeInputProps={{
              inputMode: "numeric",
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
            nativeInputProps={{
              ...register("emitter.emission.detail.weight.value"),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          />
          <Badge severity="info">
            Soit {(emitter.emission.detail.weight.value || 0) / 1000} t
          </Badge>
        </div>

        <div className="fr-col-12 fr-col-md-6">
          <RadioButtons
            legend="Cette pesée est (optionnel)"
            orientation="horizontal"
            options={[
              {
                label: "réelle",
                nativeInputProps: {
                  ...register("emitter.emission.detail.weight.isEstimate", {
                    setValueAs: _ => false
                  }),
                  defaultChecked:
                    emitter?.emission?.detail?.weight?.isEstimate === false,
                  value: false
                }
              },
              {
                label: "estimée",
                nativeInputProps: {
                  ...register("emitter.emission.detail.weight.isEstimate", {
                    setValueAs: _ => true
                  }),
                  defaultChecked:
                    emitter?.emission?.detail?.weight?.isEstimate === true,
                  value: true
                }
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
