import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { formatError } from "../builder/error";
import NonScrollableInput from "../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";

type Props = {
  methods: UseFormReturn<any>;
  disabled?: boolean;
};

export function WeightSelector({ methods, disabled }: Props) {
  const weightValue = methods.watch("weightValue", 0);
  const { errors } = methods.formState;

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <NonScrollableInput
            label="Poids en tonnes"
            state={errors?.weightValue ? "error" : "info"}
            stateRelatedMessage={
              errors?.weightValue
                ? formatError(errors.weightValue)
                : `Soit ${new Intl.NumberFormat().format(
                    (weightValue ?? 0) * 1000
                  )} kilos`
            }
            nativeInputProps={{
              type: "number",
              step: "any",
              ...methods.register("weightValue")
            }}
            disabled={disabled}
          />
        </div>
        <div className="fr-col-4">
          <RadioButtons
            legend="Valeur"
            name="radio"
            disabled={disabled}
            options={[
              {
                label: "Estimée",
                nativeInputProps: {
                  value: "true",
                  checked: true,
                  ...methods.register("weightIsEstimate")
                }
              },
              {
                label: "Réelle",
                nativeInputProps: {
                  value: "false",
                  ...methods.register("weightIsEstimate")
                }
              }
            ]}
            orientation="horizontal"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <NonScrollableInput
            label="Volume en M3 (optionnel)"
            nativeInputProps={{
              type: "number",
              step: "any",
              ...methods.register("volume")
            }}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
