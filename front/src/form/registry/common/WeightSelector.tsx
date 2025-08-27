import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
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
        <div className="fr-col-md-4">
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
        <div className="fr-col-md-4">
          <Controller
            control={methods.control}
            name={"weightIsEstimate"}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <RadioButtons
                disabled={disabled}
                legend="Type de poids"
                orientation="horizontal"
                state={errors?.weightIsEstimate && "error"}
                stateRelatedMessage={
                  (errors?.weightIsEstimate?.message as string) ?? ""
                }
                ref={ref}
                options={[
                  {
                    label: "Estimé",
                    nativeInputProps: {
                      checked: value === true,
                      onBlur: onBlur,
                      onChange: () => onChange(true)
                    }
                  },

                  {
                    label: "Réel",
                    nativeInputProps: {
                      checked: value === false,
                      onBlur: onBlur,
                      onChange: () => onChange(false)
                    }
                  }
                ]}
              />
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-4">
          <NonScrollableInput
            label="Volume en M3 (optionnel)"
            nativeInputProps={{
              type: "number",
              step: "any",
              ...methods.register("volume")
            }}
            disabled={disabled}
            state={errors?.volume && "error"}
            stateRelatedMessage={formatError(errors?.volume)}
          />
        </div>
      </div>
    </div>
  );
}
