import React from "react";
import { RenderPackagingFormProps } from "./BsffPackagingList";
import { useFormContext, useController } from "react-hook-form";
import { BsffPackagingType, Packagings } from "@td/codegen-ui";
import BsffPackagingForm from "./BsffPackagingForm";
import Decimal from "decimal.js";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec React Hook Form
 */
function RhfBsffPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  packagingTypes,
  idx,
  disabled = false
}: RenderPackagingFormProps) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const { control, register, getFieldState, formState, setValue, resetField } =
    useFormContext();

  const { error: errorVolume, isTouched: isTouchedVolume } = getFieldState(
    fieldPath("volume")
  );

  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );

  const { error: errorWeight, isTouched: isTouchedWeight } = getFieldState(
    fieldPath("weight")
  );
  const { error: errorOther, isTouched: isTouchedOther } = getFieldState(
    fieldPath("other")
  );

  const { error: errorNumero, isTouched: isTouchedNumero } = getFieldState(
    fieldPath("numero")
  );

  const errors = {
    type: errorType?.message,
    volume: errorVolume?.message,
    weight: errorWeight?.message,
    numero: errorNumero?.message,
    other: errorOther?.message
  };

  // Affiche les erreurs uniquement une première
  // tentative d'envoi du formulaire
  const hasBeenSubmitted = formState.submitCount > 0;

  const touched = {
    type: isTouchedType && hasBeenSubmitted,
    volume: isTouchedVolume && hasBeenSubmitted,
    weight: isTouchedWeight && hasBeenSubmitted,
    numero: isTouchedNumero && hasBeenSubmitted,
    other: isTouchedOther && hasBeenSubmitted
  };

  const packagingType = packaging.type;
  const weight = packaging.weight;
  const other = packaging.other;
  const numero = packaging.numero;
  const volume = packaging.volume;

  return (
    <BsffPackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      packagingTypes={packagingTypes}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: {
          value: packagingType,
          ...register(fieldPath("type"), {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (
                event.target.value === Packagings.Autre ||
                event.target.value === BsffPackagingType.Autre
              ) {
                setValue(fieldPath("other"), "", {
                  shouldTouch: true,
                  shouldDirty: true
                });
              } else {
                resetField(fieldPath("other"));
                setValue(fieldPath("other"), null);
              }
            }
          })
        },
        volume: {
          value: volume ?? "",
          ...register(fieldPath("volume"))
        },
        weight: {
          value: weight ?? "",
          ...register(fieldPath("weight"))
        },
        other: {
          value: other ?? "",
          ...register(fieldPath("other"))
        },
        numero: {
          value: numero ?? "",
          ...register(fieldPath("numero"))
        }
      }}
    />
  );
}

export default RhfBsffPackagingForm;
